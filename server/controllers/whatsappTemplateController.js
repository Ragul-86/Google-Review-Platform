const asyncHandler = require('express-async-handler');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');

function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

function assertOwner(tpl, req) {
  if (
    req.user.role !== 'superadmin' &&
    String(tpl.clientId) !== String(req.user.clientId)
  ) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
}

// Default content for seeding
const DEFAULT_TEMPLATE_CONTENT =
`Hi {{CustomerName}}, 👋

Thank you for choosing *{{BusinessName}}*!
We hope you had a wonderful experience with {{PurposeOfVisit}}.

We'd love to hear your feedback — it only takes 30 seconds! 🌟
👉 {{ReviewLink}}

Your review means the world to us and helps others discover {{BusinessName}}.

Thank you for your support! 🙏

Warm regards,
*{{BusinessName}}*`;

/* ── Seed default template (called from clientController) ─────── */
const seedDefaultTemplate = async (clientId) => {
  const exists = await WhatsAppTemplate.findOne({ clientId });
  if (!exists) {
    await WhatsAppTemplate.create({
      clientId,
      name: 'Review Request',
      type: 'review_request',
      content: DEFAULT_TEMPLATE_CONTENT,
      isDefault: true,
    });
  }
};

/* ── GET /api/whatsapp-templates ──────────────────────────────── */
const getTemplates = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  // Auto-seed if client has no templates
  await seedDefaultTemplate(clientId);

  const templates = await WhatsAppTemplate.find({ clientId }).sort({ isDefault: -1, createdAt: 1 });
  res.json({ success: true, data: templates });
});

/* ── POST /api/whatsapp-templates ─────────────────────────────── */
const createTemplate = asyncHandler(async (req, res) => {
  const { name, type, content, isDefault } = req.body;
  if (!name || !content) { res.status(400); throw new Error('name and content are required'); }

  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  // If setting as default, unset all others first
  if (isDefault) {
    await WhatsAppTemplate.updateMany({ clientId }, { isDefault: false });
  }

  const template = await WhatsAppTemplate.create({
    clientId, name,
    type: type || 'custom',
    content,
    isDefault: !!isDefault,
  });

  res.status(201).json({ success: true, data: template });
});

/* ── PUT /api/whatsapp-templates/:id ──────────────────────────── */
const updateTemplate = asyncHandler(async (req, res) => {
  const tpl = await WhatsAppTemplate.findById(req.params.id);
  if (!tpl) { res.status(404); throw new Error('Template not found'); }
  assertOwner(tpl, req);

  const { name, type, content, isDefault } = req.body;
  if (name !== undefined)    tpl.name    = name;
  if (type !== undefined)    tpl.type    = type;
  if (content !== undefined) tpl.content = content;

  if (isDefault && !tpl.isDefault) {
    await WhatsAppTemplate.updateMany({ clientId: tpl.clientId, _id: { $ne: tpl._id } }, { isDefault: false });
    tpl.isDefault = true;
  }

  await tpl.save();
  res.json({ success: true, data: tpl });
});

/* ── DELETE /api/whatsapp-templates/:id ───────────────────────── */
const deleteTemplate = asyncHandler(async (req, res) => {
  const tpl = await WhatsAppTemplate.findById(req.params.id);
  if (!tpl) { res.status(404); throw new Error('Template not found'); }
  assertOwner(tpl, req);

  const wasDefault = tpl.isDefault;
  await tpl.deleteOne();

  // If deleted template was default, promote the first remaining one
  if (wasDefault) {
    const first = await WhatsAppTemplate.findOne({ clientId: tpl.clientId }).sort({ createdAt: 1 });
    if (first) { first.isDefault = true; await first.save(); }
  }

  res.json({ success: true, message: 'Template deleted' });
});

/* ── PATCH /api/whatsapp-templates/:id/set-default ────────────── */
const setDefault = asyncHandler(async (req, res) => {
  const tpl = await WhatsAppTemplate.findById(req.params.id);
  if (!tpl) { res.status(404); throw new Error('Template not found'); }
  assertOwner(tpl, req);

  await WhatsAppTemplate.updateMany({ clientId: tpl.clientId }, { isDefault: false });
  tpl.isDefault = true;
  await tpl.save();

  res.json({ success: true, data: tpl });
});

/* ── POST /api/whatsapp-templates/ai-generate ─────────────────── */
const generateAITemplate = asyncHandler(async (req, res) => {
  const {
    businessType  = 'Service Business',
    services      = '',
    templateGoal  = 'Ask for a Google review',
    tone          = 'Friendly and warm',
  } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Return a decent fallback template without OpenAI
    const content =
`Hi {{CustomerName}}, 👋

Thank you for choosing *{{BusinessName}}* for ${services || 'your recent visit'}!

We hope you had a wonderful experience. ${templateGoal.toLowerCase().includes('review') ? 'Your feedback on Google helps us grow and helps others find us — it only takes 30 seconds! 🌟' : 'We\'d love to hear how we did!'}

👉 {{ReviewLink}}

Thank you for your support! 🙏

Warm regards,
*{{BusinessName}}*`;

    return res.json({ success: true, content });
  }

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Write a WhatsApp message template for a ${businessType} business.

Details:
- Services offered: ${services || 'various services'}
- Message goal: ${templateGoal}
- Tone: ${tone}

Requirements:
- Use ONLY these exact variable placeholders where appropriate:
  {{CustomerName}}, {{BusinessName}}, {{ReviewLink}}, {{PurposeOfVisit}}, {{VisitDate}}
- Keep it concise (max 150 words)
- Use WhatsApp-style formatting: *bold* for emphasis
- Include 1-2 relevant emojis naturally
- End with business name sign-off
- Output ONLY the message content, no extra commentary`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 350,
    });

    const content = (completion.choices[0].message.content || '').trim();
    res.json({ success: true, content });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ success: false, message: 'AI generation failed. Please try again.' });
  }
});

module.exports = {
  getTemplates, createTemplate, updateTemplate, deleteTemplate, setDefault,
  seedDefaultTemplate, generateAITemplate,
};
