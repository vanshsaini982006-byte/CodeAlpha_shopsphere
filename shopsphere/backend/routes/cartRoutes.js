const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // every cart route requires authentication

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/coupon').post(applyCoupon).delete(removeCoupon);
router.route('/:itemId').put(updateCartItem).delete(removeCartItem);

module.exports = router;
