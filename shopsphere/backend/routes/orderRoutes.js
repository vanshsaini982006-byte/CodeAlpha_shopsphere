const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

// Admin routes (declared before '/:id' to avoid route collision)
router.get('/admin/all', admin, getAllOrders);
router.put('/:id/status', admin, updateOrderStatus);

router.post('/create-payment', createPaymentOrder);
router.route('/').get(getMyOrders).post(placeOrder);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
