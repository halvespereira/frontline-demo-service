const twilio = require("../../providers/twilio");
const frontlineTwilioClient = twilio.frontlineTwilioClient;

const deleteConversationCallbackHandler = async function (req, res) {
  try {
    console.log("delete-conversation::req::body", req.body);

    const conversationSid = req.body.conversationSid || "";
    console.log("delete-conversation::conversationSid", conversationSid);

    await frontlineTwilioClient.conversations.conversations(conversationSid).remove();
    console.log("delete-conversation::Conversation deleted.");
    // const { fromNumber, toName, toNumber, messageBody } = req.body;

    res.status(200);
    res.send("Success");

    return;
    //-----------------------------
  } catch (err) {
    console.log("delete-conversation::Error", err);
    res.send(err);
    res.status(500);
    return;
  }
};

module.exports = deleteConversationCallbackHandler;
