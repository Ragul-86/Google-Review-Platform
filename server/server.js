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
const contactRoutes           = require('./routes/contact');
const rewardRoutes            = require('./routes/rewards');
const { expireOverdueRewards } = require('./utils/rewardExpiry');

// Connect DB then auto-seed superadmin if none exists
connectDB().then(async () => {
  try {
    const User = require('./models/User');
    const count = await User.countDocuments({ role: 'superadmin' });
    if (count === 0) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@platform.com',
        password: 'Admin@1234',
        role: 'superadmin',
        isActive: true,
      });
      console.log('✅ Super admin auto-created → admin@platform.com / Admin@1234');
    }
  } catch (e) {
    console.error('Auto-seed error (non-fatal):', e.message);
  }

  // Reward validity: sweep any scratch-card rewards whose 30-day
  // window already passed while the server was offline, then keep
  // sweeping automatically once a day for as long as the process
  // runs. Each transaction-list/detail request also runs a lazy,
  // per-client sweep (see rewardController.js) so the dashboard is
  // never more than one request stale even between daily sweeps.
  try {
    await expireOverdueRewards();
  } catch (e) {
    console.error('Reward expiry sweep error (non-fatal):', e.message);
  }
  setInterval(() => {
    expireOverdueRewards().catch((e) => console.error('Reward expiry sweep error (non-fatal):', e.message));
  }, 24 * 60 * 60 * 1000);
});

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — CLIENT_URL supports comma-separated list for multiple origins
const allowedOrigins = [
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
    : ['http://localhost:5173']),
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return cb(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin)       // allow all *.vercel.app previews
    ) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
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
app.use('/api/contact',            contactRoutes);
app.use('/api/rewards',            rewardRoutes);

// Public: Track customer review journey (called from review page — no auth needed)
app.patch('/api/public/customer/:id/track', require('express-async-handler')(async (req, res) => {
  const { status } = req.body;
  const VALID    = ['opened', 'google_submitted', 'feedback_submitted'];
  const TERMINAL = ['google_submitted', 'feedback_submitted'];

  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const Customer = require('./models/Customer');
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.json({ success: true }); // silent — don't expose existence

  // Only advance; never regress
  if (!TERMINAL.includes(customer.reviewStatus)) {
    const now = new Date();
    if (status === 'opened' && customer.reviewStatus === 'pending') {
      customer.reviewStatus   = 'opened';
      customer.reviewOpenedAt = now;
    } else if (TERMINAL.includes(status)) {
      customer.reviewStatus      = status;
      customer.reviewSubmittedAt = now;
    }
    await customer.save();
  }

  res.json({ success: true });
}));

// Public: Get client by slug (for review page — includes categories + active services)
app.get('/api/public/client/:slug', require('express-async-handler')(async (req, res) => {
  const Client   = require('./models/Client');
  const Category = require('./models/Category');
  const Service  = require('./models/Service');
  const { hasActiveRewardProgram } = require('./controllers/rewardClaimController');
  const client = await Client.findOne({ slug: req.params.slug, status: 'active' })
    .select('businessName businessLogo googleReviewLink address slug businessCategory');
  if (!client) { res.status(404); return res.json({ success: false, message: 'Business not found' }); }
  const categories = await Category.find({ clientId: client._id, isEnabled: true }).sort({ sortOrder: 1 });
  const services   = await Service.find({ clientId: client._id, status: 'active' }).sort({ name: 1 });
  const rewardsEnabled = await hasActiveRewardProgram(client._id);
  res.json({ success: true, data: { client: { ...client.toObject(), rewardsEnabled }, categories, services } });
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
