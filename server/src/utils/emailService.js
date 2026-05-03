/* src/utils/emailService.js */
import 'dotenv/config';
import nodemailer from 'nodemailer';

/* ============================================================
   Email Service
   Future use: forgot-password
   ============================================================ */

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function getEmailHtml(content) {
  return `
    <div style="background-color: #f4f7f6; padding: 40px 0; font-family: Arial, sans-serif; direction: ltr;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e4e8;">
        <tr>
          <td style="padding: 30px 40px; border-bottom: 1px solid #f0f0f0;">
            <h2 style="margin: 0; color: #007bff; font-size: 24px;">
              BuildLocker
            </h2>
          </td>
        </tr>

        <tr>
          <td style="padding: 40px;">
            <div style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              ${content}
            </div>

            <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eeeeee; color: #777; font-size: 14px;">
              Best regards,<br>
              <strong>BuildLocker Team</strong>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f9f9f9; font-size: 12px; color: #999;">
            ${new Date().getFullYear()} BuildLocker System<br>
            This email was sent automatically. Please do not reply.
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials missing. Skipping email send.');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"BuildLocker System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: getEmailHtml(html),
    });

    console.log(`Email sent to ${to}. ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Email error to ${to}:`, error.message);
    return false;
  }
}

export async function sendPasswordResetEmail(email, fullName, tempPassword) {
  const content = `
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>We received a request to reset your BuildLocker password.</p>
    <p>Your temporary password is:</p>

    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 24px; font-family: monospace; font-weight: bold; background: #eef6fc; color: #007bff; padding: 15px 30px; border-radius: 8px; border: 1px dashed #007bff; display: inline-block; letter-spacing: 2px;">
        ${tempPassword}
      </span>
    </div>

    <p>Please log in and change this password immediately.</p>
    <p style="font-size: 14px; color: #888;">If you did not request this change, contact the system manager.</p>
  `;

  return await sendEmail({
    to: email,
    subject: 'Password Reset - BuildLocker',
    html: content,
  });
}

/*
Future option:
Contact confirmation email.

export async function sendContactConfirmation(email, name) {
  const content = `
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for contacting BuildLocker.</p>
    <p>We received your message and will get back to you soon.</p>
  `;

  return await sendEmail({
    to: email,
    subject: 'We received your message - BuildLocker',
    html: content,
  });
}
*/
