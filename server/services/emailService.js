const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send generic email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@platform.com',
      to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
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
      <p style="color: #6b7280; font-size: 12px;">Google Review Platform</p>
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
      <h2 style="color: #2563eb;">Welcome to Google Review Platform!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created. Here are your login credentials:</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
      </div>
      <p>Please change your password after first login.</p>
      <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Login Now</a>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Google Review Platform</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Welcome — Your Google Review Platform Account',
    html,
    text: `Welcome ${name}! Email: ${email}, Password: ${tempPassword}`,
  });
};

module.exports = { sendEmail, sendFeedbackNotification, sendWelcomeEmail };
