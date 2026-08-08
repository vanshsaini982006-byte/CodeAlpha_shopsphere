const asyncHandler = require('../middleware/asyncHandler');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }
  res.json({ success: true, wishlist });
});

// @desc    Add a product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  if (!wishlist.products.some((p) => p.toString() === productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate('products');
  res.status(201).json({ success: true, wishlist });
});

// @desc    Remove a product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
  await wishlist.save();
  await wishlist.populate('products');
  res.json({ success: true, wishlist });
});

// @desc    Move a wishlist item into the cart (and remove it from wishlist)
// @route   POST /api/wishlist/:productId/move-to-cart
// @access  Private
const moveToCart = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < 1) {
    res.status(400);
    throw new Error('This product is out of stock');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existing = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({ product: req.params.productId, quantity: 1 });
  }
  await cart.save();

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
    await wishlist.save();
  }

  res.json({ success: true, message: 'Moved to cart' });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
