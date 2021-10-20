const twilioWebhookMiddleware = require("../../middlewares/twilio-webhook");
const conversationsCallbackHandler = require("./twilio-conversations");
const routingCallbackHandler = require("./routing");
const outgoingConversationCallbackHandler = require("./outgoing-conversation");
const crmCallbackHandler = require("./crm");
const templatesCallbackHandler = require("./templates");
const greetingMessageCallbackHandler = require("./greeting-message");
const barcsLookupCallbackHandler = require("./barcs-lookup");
const sendFlexOutboundCallbackHandler = require("./send-flex-outbound");
const deleteConversationCallbackHandler = require("./delete-conversation");

const twilioFrontlineWebhookMiddleware = twilioWebhookMiddleware.twilioFrontlineWebhookMiddleware;
const twilioFlexWebhookMiddleware = twilioWebhookMiddleware.twilioFlexWebhookMiddleware;

module.exports = (router) => {
  router.post(
    "/callbacks/conversations",
    twilioFrontlineWebhookMiddleware,
    conversationsCallbackHandler
  );
  router.post("/callbacks/routing", twilioFrontlineWebhookMiddleware, routingCallbackHandler);
  router.post(
    "/callbacks/outgoing-conversation",
    twilioFrontlineWebhookMiddleware,
    outgoingConversationCallbackHandler
  );
  router.post("/callbacks/crm", twilioFrontlineWebhookMiddleware, crmCallbackHandler);
  router.post("/callbacks/templates", twilioFrontlineWebhookMiddleware, templatesCallbackHandler);
  router.post(
    "/callbacks/greeting-message",
    twilioFrontlineWebhookMiddleware,
    greetingMessageCallbackHandler
  );
  router.post(
    "/callbacks/barcs-lookup",
    twilioFrontlineWebhookMiddleware,
    barcsLookupCallbackHandler
  );
  router.post("/callbacks/send-flex-outbound", sendFlexOutboundCallbackHandler);
  router.post(
    "/callbacks/delete-conversation",
    twilioFrontlineWebhookMiddleware,
    deleteConversationCallbackHandler
  );
};
