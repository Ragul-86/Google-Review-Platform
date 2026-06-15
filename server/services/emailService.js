const { Resend } = require('resend');

const getResend = () => new Resend(process.env.RESEND_API_KEY);

/**
 * Send generic email via Resend
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GETMORE <onboarding@resend.dev>',
      to,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Notify client admin of new negative feedback
 */
const sendFeedbackNotification = async ({ clientEmail, clientName, feedbackData }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">New Customer Feedback Received</h2>
      <p>Hi ${clientName},</p>
      <p>A customer left private feedback that requires your attention:</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 16px 0;">
        <p><strong>Customer:</strong> ${feedbackData.customerName}</p>
        <p><strong>Rating:</strong> ${'⭐'.repeat(feedbackData.rating)} (${feedbackData.rating}/5)</p>
        <p><strong>Phone:</strong> ${feedbackData.phone || 'Not provided'}</p>
        <p><strong>Email:</strong> ${feedbackData.email || 'Not provided'}</p>
        <p><strong>Feedback:</strong></p>
        <p style="color: #374151;">${feedbackData.feedback}</p>
      </div>
      <p>Please log in to your dashboard to respond.</p>
      <p style="color: #6b7280; font-size: 12px;">GETMORE — Powered by DMAX</p>
    </div>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `⚠️ New Customer Feedback — ${feedbackData.rating} Star Rating`,
    html,
    text: `New feedback from ${feedbackData.customerName}: ${feedbackData.feedback}`,
  });
};

/**
 * Send welcome email to new client
 */
const sendWelcomeEmail = async ({ to, name, email, tempPassword, loginUrl }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FBBF24;">Welcome to GETMORE!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created. Here are your login credentials:</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
      </div>
      <p>Please change your password after first login.</p>
      <a href="${loginUrl}" style="display: inline-block; background: #FBBF24; color: #111; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Login Now</a>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">GETMORE — Powered by DMAX</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Welcome — Your GETMORE Account',
    html,
    text: `Welcome ${name}! Email: ${email}, Password: ${tempPassword}`,
  });
};

module.exports = { sendEmail, sendFeedbackNotification, sendWelcomeEmail };
