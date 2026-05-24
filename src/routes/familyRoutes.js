const express = require('express');
const {
  createFamily,
  getFamilies,
  getFamilyById,
  updateFamily,
  deleteFamily,
  getDeletedFamilies,
  getStats,
  getFilterOptions,
  checkMobile,
} = require('../controllers/familyController');
const { protect, requirePermission, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', createFamily);
router.get('/check-mobile/:mobile', checkMobile);
router.get('/', protect, requirePermission('families:view'), getFamilies);
router.get('/stats', protect, requirePermission('dashboard:view'), getStats);
router.get('/filters', protect, requirePermission('families:view'), getFilterOptions);
router.get('/deleted', protect, requireAdmin, getDeletedFamilies);
router.get('/:id', protect, requirePermission('families:view'), getFamilyById);
router.put('/:id', protect, requirePermission('families:edit'), updateFamily);
router.delete('/:id', protect, requirePermission('families:delete'), deleteFamily);

module.exports = router;
