require("dotenv").config();

const _ = (varName, defaults) => process.env[varName] || defaults || null;

const port = _("PORT", 5000);

module.exports = {
  port: port,
  twilio: {
    frontline_account_sid: _("TWILIO_FRONTLINE_ACCOUNT_SID"),
    frontline_auth_token: _("TWILIO_FRONTLINE_AUTH_TOKEN"),
    flex_account_sid: _("TWILIO_FLEX_ACCOUNT_SID"),
    flex_auth_token: _("TWILIO_FLEX_AUTH_TOKEN"),
    flex_proxy_service_sid: _("TWILIO_FLEX_PROXY_SERVICE_SID"),
    send_flex_outbound_url: _("OUTBOUND_FLEX_SMS_URL"),
    sms_number: _("TWILIO_SMS_NUMBER"),
    whatsapp_number: _("TWILIO_WHATSAPP_NUMBER"),
    greeting_flow_sid: _("GREETING_STUDIO_FLOW_SID"),
  },
};
