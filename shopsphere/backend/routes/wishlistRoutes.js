const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, moveToCart } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getWishlist).post(addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.post('/:productId/move-to-cart', moveToCart);

module.exports = router;
