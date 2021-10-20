const config = require("../../config");
const twilio = require("../../providers/twilio");
const frontlineTwilioClient = twilio.frontlineTwilioClient;

const greetingMessageCallbackHandler = async (req, res) => {
  console.log("greeting-message::req::body", req.body);
  const conversationSid = req.body.ConversationSid;
  console.log(`The Conversation Sid is ${conversationSid}`);

  if (req && req.body && req.body.ClientIdentity) {
    console.log("OUTBOUND MESSAGE, STUDIO FLOW NOT CALLED!");
    res.send("Success");
    res.status(200);
    return;
  } else {
    try {
      console.log("INBOUND MESSAGE, STUDIO FLOW CALLED!");
      const conversationServices = await frontlineTwilioClient.conversations.services.list();
      console.log("Conversation Services", conversationServices);

      const frontlineConversationService = conversationServices.find(
        (service) => service.friendlyName === "Frontline Service"
      );
      console.log("greeting-message::frontlineService", frontlineConversationService);

      const webhook = await frontlineTwilioClient.conversations
        .services(frontlineConversationService.sid)
        .conversations(conversationSid)
        .webhooks.create({
          "configuration.flowSid": config.twilio.greeting_flow_sid,
          "configuration.replayAfter": 0,
          "configuration.filters": ["onMessageAdded"],
          target: "studio",
        });

      console.log("webhook SID", webhook.sid);
      res.send("Success");
      res.status(200);
      return;
    } catch (err) {
      console.log("greeting-message::Error", err);
      res.status(500);
      return;
    }
  }
};

module.exports = greetingMessageCallbackHandler;
