const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFilterMeta,
  getSearchSuggestions,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// IMPORTANT: specific sub-routes must be declared before the generic '/:id' route
router.get('/filters/meta', getFilterMeta);
router.get('/search/suggest', getSearchSuggestions);

router.route('/').get(getProducts).post(protect, admin, createProduct);

router.get('/:id/related', getRelatedProducts);
router.post('/:id/reviews', protect, addProductReview);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
