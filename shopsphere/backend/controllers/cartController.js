const asyncHandler = require('../middleware/asyncHandler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Coupon codes are kept simple and hardcoded for demo purposes.
// In a real system these would live in their own DB collection with
// expiry dates, usage limits, min order values, etc.
const COUPONS = {
  WELCOME10: 10,
  SAVE20: 20,
  FLAT15: 15
};

const SHIPPING_FLAT_RATE = 49;
const FREE_SHIPPING_THRESHOLD = 999;
const TAX_RATE = 0.05; // 5% GST-style flat tax for demo purposes

// Recomputes subtotal, shipping, tax and grand total for a populated cart
const buildCartSummary = (cart) => {
  const items = cart.items.filter((i) => i.product); // guard against deleted products
  const subtotal = items.reduce((sum, i) => {
    const price = i.product.price - (i.product.price * i.product.discount) / 100;
    return sum + price * i.quantity;
  }, 0);

  const discountAmount = +((subtotal * (cart.couponDiscountPercent || 0)) / 100).toFixed(2);
  const afterDiscount = subtotal - discountAmount;
  const shipping = afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const tax = +(afterDiscount * TAX_RATE).toFixed(2);
  const total = +(afterDiscount + shipping + tax).toFixed(2);

  return {
    items,
    subtotal: +subtotal.toFixed(2),
    couponCode: cart.couponCode,
    discountAmount,
    shipping,
    tax,
    total
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  res.json({ success: true, cart: buildCartSummary(cart) });
});

// @desc    Add a product to cart (or increment quantity if already present)
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product.stock} units of ${product.name} left in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((i) => i.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(201).json({ success: true, cart: buildCartSummary(cart) });
});

// @desc    Update quantity of a cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  const product = await Product.findById(item.product);
  if (product && product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product.stock} units left in stock`);
  }

  item.quantity = Number(quantity);
  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, cart: buildCartSummary(cart) });
});

// @desc    Remove an item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, cart: buildCartSummary(cart) });
});

// @desc    Apply a coupon code to the cart
// @route   POST /api/cart/coupon
// @access  Private
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const normalized = (code || '').trim().toUpperCase();

  if (!COUPONS[normalized]) {
    res.status(400);
    throw new Error('Invalid or expired coupon code');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  cart.couponCode = normalized;
  cart.couponDiscountPercent = COUPONS[normalized];
  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, cart: buildCartSummary(cart) });
});

// @desc    Remove the applied coupon
// @route   DELETE /api/cart/coupon
// @access  Private
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  cart.couponCode = null;
  cart.couponDiscountPercent = 0;
  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, cart: buildCartSummary(cart) });
});

// @desc    Clear the entire cart (used after successful checkout)
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.couponCode = null;
    cart.couponDiscountPercent = 0;
    await cart.save();
  }
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
  clearCart,
  buildCartSummary,
  SHIPPING_FLAT_RATE,
  TAX_RATE
};
