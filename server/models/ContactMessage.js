const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  business: { type: String, trim: true, default: '' },
  email:    { type: String, required: true, trim: true, lowercase: true },
  phone:    { type: String, trim: true, default: '' },
  message:  { type: String, trim: true, default: '' },
  status:   { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
