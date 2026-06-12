const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

/* ── Hardcoded suggestion templates (fallback + OpenAI) ──────── */
const SUGGESTION_MAP = {
  salon: {
    categories: ['Hair Cut', 'Hair Coloring', 'Bridal Makeup', 'Facial', 'Skin Treatment', 'Nail Art', 'Hair Spa'],
    services:   ['Haircut & Styling', 'Bridal Package', 'Facial Treatment', 'Hair Spa', 'Nail Art', 'Waxing', 'Threading'],
    topics:     ['Staff Behavior', 'Hygiene & Cleanliness', 'Pricing & Value', 'Waiting Time', 'Final Results', 'Ambience'],
  },
  hospital: {
    categories: ['Doctor Consultation', 'Treatment Quality', 'Nursing Care', 'Cleanliness', 'Staff Support', 'Emergency Response'],
    services:   ['OPD Consultation', 'Emergency Care', 'Lab Tests', 'Surgery', 'Physiotherapy', 'Radiology'],
    topics:     ['Doctor\'s Expertise', 'Staff Attitude', 'Hygiene', 'Wait Time', 'Medication', 'Billing Clarity'],
  },
  restaurant: {
    categories: ['Food Quality', 'Taste', 'Service', 'Ambience', 'Value For Money', 'Cleanliness', 'Menu Variety'],
    services:   ['Dine-In', 'Takeaway', 'Home Delivery', 'Catering', 'Private Dining', 'Buffet'],
    topics:     ['Food Temperature', 'Portion Size', 'Staff Attentiveness', 'Waiting Time', 'Hygiene', 'Billing'],
  },
  'digital marketing': {
    categories: ['SEO Results', 'Website Design', 'Lead Quality', 'Social Media Growth', 'Customer Support', 'Campaign ROI'],
    services:   ['SEO', 'Google Ads', 'Social Media Management', 'Website Development', 'Branding', 'Content Marketing'],
    topics:     ['Reporting Clarity', 'Response Time', 'Campaign Strategy', 'Results Delivery', 'Creativity', 'Pricing'],
  },
  gym: {
    categories: ['Training Quality', 'Equipment', 'Staff Support', 'Cleanliness', 'Ambience', 'Results', 'Timings'],
    services:   ['Personal Training', 'Group Classes', 'Zumba', 'Yoga', 'Cardio', 'Strength Training', 'Nutrition Advice'],
    topics:     ['Trainer Expertise', 'Equipment Maintenance', 'Hygiene', 'Crowd Levels', 'Motivation', 'Value'],
  },
  spa: {
    categories: ['Massage Quality', 'Relaxation', 'Staff Expertise', 'Ambience', 'Hygiene', 'Value', 'Treatments'],
    services:   ['Swedish Massage', 'Deep Tissue', 'Aromatherapy', 'Body Scrub', 'Facial', 'Hot Stone Massage', 'Couples Spa'],
    topics:     ['Therapist Skill', 'Atmosphere', 'Cleanliness', 'Product Quality', 'Booking Experience', 'Pricing'],
  },
  'real estate': {
    categories: ['Property Quality', 'Agent Expertise', 'Pricing Transparency', 'Documentation', 'After-Sale Support', 'Communication'],
    services:   ['Property Purchase', 'Rental', 'Property Management', 'Site Visit', 'Legal Assistance', 'Home Loan Support'],
    topics:     ['Agent Responsiveness', 'Property Condition', 'Price Negotiation', 'Paperwork', 'Transparency', 'Timeline'],
  },
  automobile: {
    categories: ['Service Quality', 'Technician Expertise', 'Pricing', 'Turnaround Time', 'Parts Quality', 'Customer Service'],
    services:   ['Periodic Maintenance', 'Repair Service', 'Accident Repair', 'Tyre Change', 'AC Service', 'Washing & Detailing'],
    topics:     ['Technician Skill', 'Diagnosis Accuracy', 'Pricing Transparency', 'Delivery Time', 'Parts Used', 'Follow-Up'],
  },
  education: {
    categories: ['Teaching Quality', 'Study Material', 'Faculty Support', 'Infrastructure', 'Results', 'Placement'],
    services:   ['Regular Classes', 'Crash Course', 'Online Classes', 'Doubt Sessions', 'Mock Tests', 'Placement Assistance'],
    topics:     ['Teacher Expertise', 'Concept Clarity', 'Interactive Sessions', 'Study Resources', 'Exam Preparation', 'Career Guidance'],
  },
  clinic: {
    categories: ['Doctor Expertise', 'Diagnosis Accuracy', 'Treatment Quality', 'Prescription Clarity', 'Staff Behaviour', 'Cleanliness'],
    services:   ['General Consultation', 'Follow-Up Visit', 'Minor Procedures', 'Vaccination', 'Health Check', 'Prescription Renewal'],
    topics:     ['Waiting Time', 'Doctor Availability', 'Explanation Clarity', 'Staff Attitude', 'Hygiene', 'Billing'],
  },
};

function matchTemplate(businessType) {
  const q = (businessType || '').toLowerCase();
  for (const [key, val] of Object.entries(SUGGESTION_MAP)) {
    if (q.includes(key)) return val;
  }
  return {
    categories: ['Service Quality', 'Staff Behaviour', 'Value for Money', 'Cleanliness', 'Professionalism'],
    services:   ['Primary Service', 'Consultation', 'Support', 'Follow-Up'],
    topics:     ['Overall Experience', 'Staff Attitude', 'Pricing', 'Facilities', 'Response Time'],
  };
}

// @desc    List categories (Super Admin: all global; Client: their own)
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'superadmin') {
    query = req.query.clientId ? { clientId: req.query.clientId } : { clientId: null };
  } else {
    query = { clientId: req.user.clientId };
  }

  const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: categories });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isEnabled } = req.body;
  if (!name) { res.status(400); throw new Error('Category name is required'); }

  const clientId = req.user.role === 'superadmin'
    ? (req.body.clientId || null)
    : req.user.clientId;

  const maxOrder = await Category.findOne({ clientId }).sort({ sortOrder: -1 }).select('sortOrder');
  const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;

  const category = await Category.create({
    name, description, clientId,
    isEnabled: isEnabled !== undefined ? isEnabled : true,
    isCustom: true, sortOrder,
  });
  res.status(201).json({ success: true, data: category });
});

// @desc    Bulk create categories (for accepting AI suggestions)
// @route   POST /api/categories/bulk
// @access  Super Admin
const bulkCreateCategories = asyncHandler(async (req, res) => {
  const { names, clientId } = req.body;
  if (!Array.isArray(names) || names.length === 0) {
    res.status(400); throw new Error('names array is required');
  }

  const resolvedClientId = clientId || null;
  const maxOrder = await Category.findOne({ clientId: resolvedClientId }).sort({ sortOrder: -1 }).select('sortOrder');
  let sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;

  const docs = names.map((name) => ({
    name: String(name).trim(),
    clientId: resolvedClientId,
    isEnabled: true,
    isCustom: true,
    sortOrder: sortOrder++,
  })).filter((d) => d.name);

  const created = await Category.insertMany(docs);
  res.status(201).json({ success: true, data: created, count: created.length });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) { res.status(404); throw new Error('Category not found'); }

  if (req.user.role !== 'superadmin' && String(cat.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  const { name, description, isEnabled, sortOrder } = req.body;
  if (name !== undefined) cat.name = name;
  if (description !== undefined) cat.description = description;
  if (isEnabled !== undefined) cat.isEnabled = isEnabled;
  if (sortOrder !== undefined) cat.sortOrder = sortOrder;

  const updated = await cat.save();
  res.json({ success: true, data: updated });
});

// @desc    Bulk reorder categories
// @route   PATCH /api/categories/reorder
// @access  Private
const reorderCategories = asyncHandler(async (req, res) => {
  // orderedIds: array of { id, sortOrder }
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) { res.status(400); throw new Error('orderedIds required'); }

  await Promise.all(
    orderedIds.map(({ id, sortOrder }) =>
      Category.updateOne({ _id: id }, { $set: { sortOrder } })
    )
  );
  res.json({ success: true });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) { res.status(404); throw new Error('Category not found'); }

  if (req.user.role !== 'superadmin' && String(cat.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  await cat.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

// @desc    AI-powered category suggestion
// @route   POST /api/categories/suggest
// @access  Super Admin
const suggestCategories = asyncHandler(async (req, res) => {
  const { businessType } = req.body;
  if (!businessType?.trim()) { res.status(400); throw new Error('businessType is required'); }

  // Try OpenAI if key is configured
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are helping build a customer review platform. Given a business type, suggest relevant review categories, services, and review topics.

Business Type: "${businessType.trim()}"

Return ONLY valid JSON (no extra text) in this exact format:
{
  "categories": ["item1", "item2", "item3", "item4", "item5", "item6"],
  "services": ["service1", "service2", "service3", "service4", "service5"],
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}

Categories = what customers commonly praise (e.g. "Hair Cut", "Food Quality").
Services = specific offerings of the business.
Topics = aspects customers review (e.g. "Staff Behaviour", "Waiting Time").
Keep each item 2-4 words, professional, relevant to this business type.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
      });

      const raw = completion.choices[0].message.content || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.categories)) {
          return res.json({ success: true, data: parsed, source: 'ai' });
        }
      }
    } catch (err) {
      console.error('OpenAI suggest error:', err.message);
    }
  }

  // Fallback to hardcoded templates
  const result = matchTemplate(businessType);
  res.json({ success: true, data: result, source: 'template' });
});

module.exports = {
  getCategories, createCategory, bulkCreateCategories,
  updateCategory, deleteCategory, reorderCategories, suggestCategories,
};
