const { v4: uuidv4 } = require("uuid");
const twilio = require("../../providers/twilio");
const flexTwilioClient = twilio.flexTwilioClient;
const config = require("../../config");

const sendFlexOutboundCallbackHandler = async function (req, res) {
  console.log("send-flex-outbound::req.body", req.body);
  const { fromNumber, toName, toNumber, messageBody } = req.body;

  /**
   * Validate mandatory fields are supplied
   */
  const verifyEventProps = () => {
    const result = {
      success: false,
      errors: [],
    };

    if (!fromNumber) result.errors.push("Missing 'fromNumber' in request body");
    else if (!toName) result.errors.push("Missing 'toName' in request body");
    else if (!toNumber) result.errors.push("Missing 'toNumber' in request body");
    else if (!messageBody) result.errors.push("Missing 'messageBody' in request body");
    else result.success = true;

    return result;
  };

  /**
   * Looks for the sms Flex Flow matching the supplied fromNumber.
   * NOTE: It only looks for the *studio* integration type (as there can be multiple Flex Flows
   * per number)
   */
  const getFlexFlowForNumber = async () => {
    let flexFlow;
    console.debug(`Looking for Flex Flow for fromNumber '${fromNumber}'`);
    try {
      const flexFlows = await flexTwilioClient.flexApi.flexFlow.list();
      console.log(flexFlows);

      flexFlow = flexFlows.find(
        (flow) => flow.integrationType === "studio" && flow.contactIdentity === fromNumber
      );
    } catch (error) {
      console.error(`Error finding Flex Flow!`, error);
      throw error;
    }

    console.debug(`Flow Flow is:\n ${JSON.stringify(flexFlow)}'`);
    return flexFlow;
  };

  /**
   * Creates the SMS Chat Channel - using the Flex API
   */
  const createSMSChatChannel = async (flexFlowSid, identity) => {
    let channel;
    console.debug(
      `Creating SMS Chat Channel to '${toNumber}' using Flex Flow SID '${flexFlowSid}' and identity '${identity}'`
    );

    try {
      channel = await flexTwilioClient.flexApi.channel.create({
        target: toNumber,
        identity: identity,
        chatUserFriendlyName: toName,
        chatFriendlyName: `SMS${toNumber}`,
        flexFlowSid: flexFlowSid,
        taskAttributes: { caller_type: "customer" },
      });
    } catch (error) {
      console.error(`Error creating SMS Chat Channel!`, error);
      throw error;
    }

    console.debug(`SMS Chat Channel is:\n ${JSON.stringify(channel)}'`);
    return channel;
  };

  /**
   * Creates the Flex Proxy Service session to be used for the SMS conversation. Reuses existing one if there
   * is one
   */
  const createProxySession = async (chatChannelSid) => {
    let proxySession;

    // Look for existing session first
    try {
      const proxySessions = await flexTwilioClient.proxy
        .services(config.twilio.flex_proxy_service_sid)
        .sessions.list();

      proxySession = proxySessions.find((session) => session.uniqueName.startsWith(chatChannelSid));

      if (proxySession) {
        console.debug(
          `Found EXISTING Flex Proxy Session between Chat Channel SID '${chatChannelSid}' and toNumber '${toNumber}'`
        );
        return proxySession;
      }
    } catch (error) {
      console.error(`Error looping through existing Flex Proxy Sessions!`, error);
      throw error;
    }

    console.debug(
      `Creating Flex Proxy Session between Chat Channel SID '${chatChannelSid}' and toNumber '${toNumber}'`
    );

    const participants = [
      {
        Identifier: toNumber,
        ProxyIdentifier: fromNumber,
        FriendlyName: toName,
      },
      {
        Identifier: chatChannelSid,
        ProxyIdentifier: fromNumber,
        FriendlyName: toName,
      },
    ];

    try {
      proxySession = await flexTwilioClient.proxy
        .services(config.twilio.flex_proxy_service_sid)
        .sessions.create({
          uniqueName: chatChannelSid,
          participants: JSON.stringify(participants),
          mode: "message-only",
        });
    } catch (error) {
      console.error(`Error creating Flex Proxy Session!`, error);
      throw error;
    }

    console.debug(`Proxy Session is:\n ${JSON.stringify(proxySession)}'`);
    return proxySession;
  };

  /**
   * Send the message, using the Chat Channel. Proxy Session will be listening to this channel's events
   * and will send the outbound SMS.
   */
  const sendMessageViaChatChannel = async (chatChannelSid) => {
    let chatMessage;
    console.debug(
      `Sending the message '${messageBody}' from fromNumber '${fromNumber}' to toNumber '${toNumber}' using Chat Channel SID '${proxySessionSid}'`
    );

    try {
      chatMessage = await flexTwilioClient.chat
        .services(chatServiceSid)
        .channels(chatChannelSid)
        .messages.create({ body: messageBody }); // From defaults to "system"
    } catch (error) {
      console.error(`Error sending message via Chat Channel!`, error);
      throw error;
    }

    console.debug(`Chat Message is:\n ${JSON.stringify(chatMessage)}'`);
    return chatMessage;
  };

  // *******************************
  // ORCHESTRATION LOGIC BEGINS HERE
  // *******************************

  const eventCheck = verifyEventProps(req.body);
  if (!eventCheck.success) {
    console.log("Event property check failed.", eventCheck.errors);
    res.status(400);
    res.send({ status: 400, errors: eventCheck.errors });

    return;
  }

  let flexFlow;
  try {
    flexFlow = await getFlexFlowForNumber();
  } catch (error) {
    console.error("send-flex-outbound::Error", err);
    res.status(400);
    res.send(err);
    return;
  }
  if (!flexFlow) {
    res.status(500);
    res.send({ message: "Unable to find matching Flex Flow" });
    return;
  }

  const chatServiceSid = flexFlow.chatServiceSid;
  const flexFlowSid = flexFlow.sid;
  console.log("send-flex-outbound::Matching Flex Flow Chat Service SID:", chatServiceSid);
  console.log("send-flex-outbound::Matching Flex Flow SID:", flexFlowSid);

  const identity = uuidv4();

  let chatChannel;
  try {
    chatChannel = await createSMSChatChannel(flexFlowSid, identity);
  } catch (error) {
    res.status(error && error.status);
    res.send(error);
    return;
  }
  if (!chatChannel) {
    res.status(500);
    res.send({ message: "Failed to create Chat Channel" });
    return;
  }
  if (!chatChannel.sid) {
    res.status(chatChannel.status);
    res.send(chatChannel);
    return;
  }
  const chatChannelSid = chatChannel.sid;
  console.log(`send-flex-outbound::Chat channel SID is '${chatChannelSid}'`);
  const responseBody = { chatChannel: { identity }, proxySession: {}, chatMessage: {} };
  Object.keys(chatChannel).forEach((key) => {
    // Excluding private properties from the response object
    if (!key.startsWith("_")) {
      responseBody.chatChannel[key] = chatChannel[key];
    }
  });

  let proxySession;
  try {
    proxySession = await createProxySession(chatChannelSid);
  } catch (error) {
    res.status(error && error.status);
    res.send(error);
    return;
  }
  if (!proxySession) {
    res.status(500);
    res.send({ message: "Failed to create Proxy Session" });
    return;
  }
  if (!proxySession.sid) {
    res.status(proxySession.status);
    res.send(proxySession);
    return;
  }
  const proxySessionSid = proxySession.sid;
  console.log(`send-flex-outbound::Proxy Session SID is '${proxySessionSid}'`);

  Object.keys(proxySession).forEach((key) => {
    // Excluding private properties from the response object
    if (!key.startsWith("_")) {
      responseBody.proxySession[key] = proxySession[key];
    }
  });

  let chatMessage;
  try {
    chatMessage = await sendMessageViaChatChannel(chatChannelSid);
  } catch (error) {
    res.status(error && error.status);
    res.send(error);
    return;
  }
  if (!chatMessage) {
    res.status(500);
    res.send({ message: "Failed to create Chat Message" });
    return;
  }
  if (!chatMessage.sid) {
    res.status(chatMessage.status);
    res.send(chatMessage);
    return;
  }

  Object.keys(chatMessage).forEach((key) => {
    // Excluding private properties from the response object
    if (!key.startsWith("_")) {
      responseBody.chatMessage[key] = chatMessage[key];
    }
  });

  res.send(responseBody);
  return;
};

module.exports = sendFlexOutboundCallbackHandler;
