const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, bulkCreateCategories,
  updateCategory, deleteCategory, reorderCategories, suggestCategories,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect);

router.get('/', getCategories);
router.post('/', createCategory);
router.post('/suggest', adminOnly, suggestCategories);
router.post('/bulk', adminOnly, bulkCreateCategories);
router.patch('/reorder', reorderCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
