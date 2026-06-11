const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 255, default: '' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, required: true, trim: true, maxlength: 2000 },
    categoryLabel: { type: String, trim: true, maxlength: 120, default: '' }, // service/category selected on review page
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ clientId: 1, createdAt: -1 });
feedbackSchema.index({ clientId: 1, status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
