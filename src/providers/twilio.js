const config = require("../config");
const twilioClient = require("twilio")(
  config.twilio.frontline_account_sid,
  config.twilio.frontline_auth_token
);
const flexTwilioClient = require("twilio")(
  config.twilio.flex_account_sid,
  config.twilio.flex_auth_token
);

module.exports = {
  frontlineTwilioClient: twilioClient,
  flexTwilioClient: flexTwilioClient,
};
