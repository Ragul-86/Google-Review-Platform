const mongoose = require('mongoose');

const whatsAppTemplateSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    type: {
      type: String,
      enum: ['review_request', 'follow_up', 'thank_you', 'custom'],
      default: 'review_request',
    },
    content:   { type: String, required: true, maxlength: 2000 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Only one default per client
whatsAppTemplateSchema.index({ clientId: 1, isDefault: 1 });

module.exports = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);
