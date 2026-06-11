require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');
const feedbackRoutes = require('./routes/feedback');
const qrcodeRoutes = require('./routes/qrcodes');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes   = require('./routes/reports');
const customerRoutes          = require('./routes/customers');
const whatsappTemplateRoutes  = require('./routes/whatsappTemplates');
const serviceRoutes           = require('./routes/services');

// Connect DB
connectDB();

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth endpoints stricter limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, try again later.' },
});
app.use('/api/auth/login', authLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Google Review Platform API is running 🚀', env: process.env.NODE_ENV });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/qrcodes', qrcodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/customers',          customerRoutes);
app.use('/api/whatsapp-templates', whatsappTemplateRoutes);
app.use('/api/services',           serviceRoutes);

// Public: Get client by slug (for review page — includes categories + active services)
app.get('/api/public/client/:slug', require('express-async-handler')(async (req, res) => {
  const Client   = require('./models/Client');
  const Category = require('./models/Category');
  const Service  = require('./models/Service');
  const client = await Client.findOne({ slug: req.params.slug, status: 'active' })
    .select('businessName businessLogo googleReviewLink address slug businessCategory');
  if (!client) { res.status(404); return res.json({ success: false, message: 'Business not found' }); }
  const categories = await Category.find({ clientId: client._id, isEnabled: true }).sort({ sortOrder: 1 });
  const services   = await Service.find({ clientId: client._id, status: 'active' }).sort({ name: 1 });
  res.json({ success: true, data: { client, categories, services } });
}));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the existing process or set a different PORT in .env`);
    process.exit(1);
  } else {
    throw err;
  }
});
