const express = require('express');
const router  = express.Router();
const {
  getServices, createService, updateService, deleteService, toggleService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getServices)
  .post(createService);

router.route('/:id')
  .put(updateService)
  .delete(deleteService);

router.patch('/:id/toggle', toggleService);

module.exports = router;
