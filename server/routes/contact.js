const express    = require('express');
const router     = express.Router();
const { submitContact, getMessages, updateStatus } = require('../controllers/contactController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

/* Public — no auth required */
router.post('/', submitContact);

/* Super admin only */
router.get('/',       protect, superAdmin, getMessages);
router.patch('/:id',  protect, superAdmin, updateStatus);

module.exports = router;
