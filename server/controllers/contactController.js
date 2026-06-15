const ContactMessage = require('../models/ContactMessage');
const { sendEmail }  = require('../services/emailService');

/* ── POST /api/contact ─────────────────────────────────────────────
   Public — no auth required
   Saves to DB, sends email notification, returns WhatsApp link
───────────────────────────────────────────────────────────────────── */
exports.submitContact = async (req, res) => {
  try {
    const { name, business, email, phone, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    /* 1 ── Save to MongoDB */
    const doc = await ContactMessage.create({ name, business, email, phone, message });

    /* 2 ── Respond immediately — don't block on emails */
    const waNumber = process.env.CONTACT_WHATSAPP_NUMBER || '';
    const waText   = encodeURIComponent(`New demo request from ${name}${business ? ` (${business})` : ''}. Email: ${email}. Phone: ${phone || 'N/A'}. Message: ${message || 'N/A'}`);
    const waLink   = waNumber ? `https://wa.me/${waNumber.replace(/\D/g,'')}?text=${waText}` : null;

    res.status(201).json({
      message: 'Message received! We will contact you within 24 hours.',
      id: doc._id,
      whatsappLink: waLink,
    });

    /* 3 ── Fire-and-forget: email notification to admin */
    const adminEmail = process.env.CONTACT_NOTIFY_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `📩 New Demo Request — ${name}${business ? ` (${business})` : ''}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:#FBBF24;padding:24px 28px;">
              <h2 style="margin:0;color:#111;font-size:20px;">New Demo Request — GETMORE</h2>
            </div>
            <div style="padding:28px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#aaa;width:130px;">Name</td><td style="padding:8px 0;color:#fff;font-weight:700;">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#aaa;">Business</td><td style="padding:8px 0;color:#fff;">${business || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#aaa;">Email</td><td style="padding:8px 0;color:#FBBF24;"><a href="mailto:${email}" style="color:#FBBF24;">${email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#aaa;">Phone</td><td style="padding:8px 0;color:#fff;">${phone || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#aaa;vertical-align:top;">Message</td><td style="padding:8px 0;color:#fff;">${message || '—'}</td></tr>
              </table>
              ${phone ? `
              <div style="margin-top:24px;">
                <a href="https://wa.me/${phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(name)}%2C%20thank%20you%20for%20your%20interest%20in%20GETMORE!%20We%20are%20excited%20to%20schedule%20your%20demo."
                   style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">
                  💬 Reply on WhatsApp
                </a>
              </div>` : ''}
              <div style="margin-top:16px;">
                <a href="mailto:${email}?subject=Re: Your GETMORE Demo Request"
                   style="display:inline-block;background:#FBBF24;color:#111;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">
                  ✉️ Reply by Email
                </a>
              </div>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #222;font-size:12px;color:#555;">
              Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST &nbsp;|&nbsp; ID: ${doc._id}
            </div>
          </div>
        `,
      }).catch((e) => console.error('Admin email failed:', e.message));
    }

    /* 4 ── Fire-and-forget: auto-reply to sender */
    sendEmail({
      to: email,
      subject: 'Thank you for contacting GETMORE! 🎉',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:#FBBF24;padding:24px 28px;">
            <h2 style="margin:0;color:#111;font-size:20px;">Thank you, ${name}!</h2>
          </div>
          <div style="padding:28px;">
            <p style="color:#ccc;line-height:1.7;">We have received your demo request and our team will get back to you within <strong style="color:#FBBF24;">24 hours</strong>.</p>
            <p style="color:#ccc;line-height:1.7;">In the meantime, feel free to explore how GETMORE helps businesses collect more Google reviews and grow their reputation.</p>
            <div style="margin-top:28px;padding:20px;background:#1a1a1a;border-radius:10px;border-left:4px solid #FBBF24;">
              <p style="margin:0 0 4px;color:#FBBF24;font-weight:700;font-size:13px;">YOUR REQUEST DETAILS</p>
              <p style="margin:4px 0;color:#aaa;font-size:13px;">Business: ${business || '—'}</p>
              <p style="margin:4px 0;color:#aaa;font-size:13px;">Phone: ${phone || '—'}</p>
              <p style="margin:4px 0;color:#aaa;font-size:13px;">Message: ${message || '—'}</p>
            </div>
          </div>
          <div style="padding:16px 28px;border-top:1px solid #222;font-size:12px;color:#555;text-align:center;">
            © GETMORE — Powered By DMAX
          </div>
        </div>
      `,
    }).catch((e) => console.error('Auto-reply email failed:', e.message));

    /* response already sent above — emails fire in background */
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
};

/* ── GET /api/contact  (Super Admin only) ──────────────────────────
   List all contact messages
───────────────────────────────────────────────────────────────────── */
exports.getMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ── PATCH /api/contact/:id ────────────────────────────────────────
   Update status (new → read → replied)
───────────────────────────────────────────────────────────────────── */
exports.updateStatus = async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: 'Not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
