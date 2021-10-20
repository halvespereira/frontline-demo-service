const { default: axios } = require("axios");
const twilio = require("../../providers/twilio");
const frontlineTwilioClient = twilio.frontlineTwilioClient;
const sendFlexOutboundCallbackHandler = require("./send-flex-outbound");
const config = require("../../config");

const barcsLookupCallbackHandler = async function (req, res) {
  const conversationSid = req.body.conversationSid || "";
  console.log("barcs-lookup::conversationSid", conversationSid);
  try {
    console.log("barcs-lookup::req::body", req.body);

    //LOOK UP BARCS HERE

    let customerFromBarcs;

    const workerIdentity = "henrique.pereira@terazo.com";
    console.log("barcs-lookup::workerIdentity", workerIdentity);

    //-----------------------
    // customerFromBarcs = {
    //   name: "Henrique Pereira",
    //   phoneNumber: "+16056902527",
    // };

    // ----------------------

    if (!customerFromBarcs) {
      console.log("barcs-lookup::New Customer");
      // send system intro message
      await frontlineTwilioClient.conversations.conversations(conversationSid).messages.create({
        body: `Thank you for replying. Your message has been received and someone will be with you shortly.`,
      });

      //SEND SMS TO FLEX ACCOUNT HERE and delete conversation

      await frontlineTwilioClient.conversations.conversations(conversationSid).remove();
      console.log("barcs-lookup::Conversation deleted.");
      // const { fromNumber, toName, toNumber, messageBody } = req.body;

      await axios({
        method: "post",
        url: config.twilio.send_flex_outbound_url,
        data: {
          fromNumber: "+12182748417",
          toName: "Poop 911 chat",
          toNumber: "+16056902527",
          messageBody: "This is poop 911 corporate. How can we help you today?",
        },
      });

      console.log("barcs-lookup::Customer sent to Flex!");

      res.send("success");
      res.status(200);

      return;
      //-----------------------------
    } else {
      console.log("conversationSid", conversationSid);
      const participants = await frontlineTwilioClient.conversations
        .conversations(conversationSid)
        .participants.list();
      console.log("barcs-lookup::participants", participants);

      const projectedAddress = participants[0].messagingBinding.proxy_address;
      console.log("barcs-lookup::projectedAddress", projectedAddress);

      const webhooks = await frontlineTwilioClient.conversations
        .conversations(conversationSid)
        .webhooks.list();
      console.log("barcs-lookup::webhooks", webhooks);

      for (let i = 0; i < webhooks.length; i++) {
        await webhooks[i].remove();
      }

      console.log("barcs-lookup::Webhooks removed!");

      // send system intro message
      await frontlineTwilioClient.conversations.conversations(conversationSid).messages.create({
        body: `Hi ${
          customerFromBarcs.name ? customerFromBarcs.name : ""
        }. Thank you for replying. Your message has been received and someone will be with you shortly.`,
      });

      //add franchisee to conversation via Frontline
      await frontlineTwilioClient.conversations.conversations(conversationSid).participants.create({
        identity: workerIdentity,
      });

      console.log("Frontline added to conversation!");

      console.log(`worker ${workerIdentity} added to conversation!`);

      res.send("success");
      res.status(200);

      return;
    }
  } catch (err) {
    await frontlineTwilioClient.conversations.conversations(conversationSid).messages.create({
      body: `We are sorry. An error has occurred when trying to process your request. Please try us again later.`,
    });
    console.log("barcs-lookup::Error", err);
    res.send(err);
    res.status(500);
    return;
  }
};

module.exports = barcsLookupCallbackHandler;
