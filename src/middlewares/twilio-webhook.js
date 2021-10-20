const twilio = require("twilio");
const config = require("../config");

const twilioFrontlineWebhookMiddleware = twilio.webhook(config.twilio.frontline_auth_token);
const twilioFlexWebhookMiddleware = twilio.webhook(config.twilio.flex_auth_token);

module.exports = { twilioFrontlineWebhookMiddleware, twilioFlexWebhookMiddleware };
