const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    category:    { type: String, trim: true, maxlength: 80,  default: '' },
    status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Service', serviceSchema);
