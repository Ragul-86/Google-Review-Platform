const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name:         { type: String, required: true, trim: true, maxlength: 150 },
    phone:        { type: String, required: true, trim: true, maxlength: 30 },
    email:        { type: String, trim: true, lowercase: true, maxlength: 255, default: '' },

    // Service fields (new primary fields)
    serviceName:  { type: String, trim: true, maxlength: 300, default: '' },
    serviceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },

    // Legacy field — kept for backward compatibility; maps to serviceName on read
    purposeOfVisit: { type: String, trim: true, maxlength: 300, default: '' },

    visitDate:    { type: Date, default: Date.now },
    staffName:    { type: String, trim: true, maxlength: 100, default: '' },
    notes:        { type: String, trim: true, maxlength: 1000, default: '' },

    whatsappStatus: {
      type: String,
      enum: ['pending', 'sent', 'clicked', 'reviewed'],
      default: 'pending',
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'submitted'],
      default: 'pending',
    },

    whatsappSentAt:    { type: Date },
    reviewClickedAt:   { type: Date },
    reviewSubmittedAt: { type: Date },
  },
  { timestamps: true },
);

// Virtual: resolve serviceName from either new field or legacy purposeOfVisit
customerSchema.virtual('resolvedService').get(function () {
  return this.serviceName || this.purposeOfVisit || '';
});

module.exports = mongoose.model('Customer', customerSchema);
