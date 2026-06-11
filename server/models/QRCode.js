const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    token: { type: String, required: true, unique: true },
    source: {
      type: String,
      enum: ['reception', 'billing', 'website', 'packaging', 'custom'],
      default: 'custom',
    },
    destinationUrl: { type: String, trim: true, maxlength: 500 },
    qrImage: { type: String, default: null }, // base64 data URL or file path
    scanCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

qrCodeSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model('QRCode', qrCodeSchema);
