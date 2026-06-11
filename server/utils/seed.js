/**
 * Seed script — creates a Super Admin user.
 * Run: node utils/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function seed() {
  await connectDB();

  const email = 'admin@platform.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists:', email);
    process.exit(0);
  }

  // Pass plain text — the User model's pre-save hook will hash it
  await User.create({
    name: 'Super Admin',
    email,
    password: 'Admin@1234',
    role: 'superadmin',
    isActive: true,
  });

  console.log('✅ Super admin created');
  console.log('   Email:', email);
  console.log('   Password: Admin@1234');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
