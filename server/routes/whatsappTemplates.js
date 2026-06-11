const express = require('express');
const router  = express.Router();
const {
  getTemplates, createTemplate, updateTemplate, deleteTemplate, setDefault, generateAITemplate,
} = require('../controllers/whatsappTemplateController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// AI generate route — must be before /:id to avoid ID clash
router.post('/ai-generate', generateAITemplate);

router.route('/')
  .get(getTemplates)
  .post(createTemplate);

router.route('/:id')
  .put(updateTemplate)
  .delete(deleteTemplate);

router.patch('/:id/set-default', setDefault);

module.exports = router;
