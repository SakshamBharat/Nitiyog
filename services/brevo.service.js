const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

async function sendOtpEmail({
  email,
  firstName,
  otp
}) {
  return brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: process.env.BREVO_SENDER_NAME,
      email: process.env.BREVO_SENDER_EMAIL
    },

    to: [
      {
        email,
        name: firstName || "Citizen"
      }
    ],

    subject: "Your NitiYog verification code",

    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="
        margin:0;
        padding:0;
        background:#f5f8fa;
        font-family:Arial,sans-serif;
      ">

        <div style="
          max-width:560px;
          margin:40px auto;
          background:#ffffff;
          border-radius:16px;
          padding:40px;
          border:1px solid #e1e8ed;
        ">

          <h2 style="color:#073b5c;">
            NitiYog — Saksham Bharat
          </h2>

          <p>
            Hello ${firstName || "Citizen"},
          </p>

          <p>
            Use the following verification code to verify
            your NitiYog account:
          </p>

          <div style="
            margin:30px 0;
            text-align:center;
            font-size:32px;
            letter-spacing:10px;
            font-weight:bold;
            color:#1267a5;
          ">
            ${otp}
          </div>

          <p>
            This code is valid for
            ${process.env.OTP_EXPIRY_MINUTES || 10}
            minutes.
          </p>

          <p style="color:#687986;font-size:13px;">
            If you did not create this account, you can
            safely ignore this email.
          </p>

          <hr>

          <p style="
            color:#9aa8af;
            font-size:12px;
          ">
            NitiYog · Saksham Bharat
          </p>

        </div>

      </body>
      </html>
    `
  });
}

module.exports = {
  sendOtpEmail
};