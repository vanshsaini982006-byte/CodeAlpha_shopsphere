const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpay');
const { buildCartSummary } = require('./cartController');

// Generates a human-readable, sequential-looking order number, e.g. SS-20260806-4821
const generateOrderNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SS-${datePart}-${randomPart}`;
};

// @desc    Create a Razorpay order for the current cart (step 1 of checkout)
// @route   POST /api/orders/create-payment
// @access  Private
const createPaymentOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  const summary = buildCartSummary(cart);
  const razorpayOrder = await createRazorpayOrder(summary.total, `receipt_${Date.now()}`);

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    summary
  });
});

// @desc    Place an order after payment (or directly, for COD)
// @route   POST /api/orders
// @access  Private
const placeOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    billingAddress,
    paymentMethod,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  if (!shippingAddress || !billingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Shipping address, billing address and payment method are required');
  }
  if (!['razorpay', 'cod'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('Invalid payment method');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  // Verify payment signature for Razorpay orders before trusting the client
  let paymentStatus = 'pending';
  let paymentResult = {};
  if (paymentMethod === 'razorpay') {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Missing Razorpay payment details');
    }
    const isValid = verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) {
      res.status(400);
      throw new Error('Payment verification failed. Please contact support before retrying.');
    }
    paymentStatus = 'paid';
    paymentResult = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    };
  }

  // Re-validate stock at order time (it may have changed since cart was built)
  for (const item of cart.items) {
    if (!item.product || item.product.stock < item.quantity) {
      res.status(400);
      throw new Error(`${item.product ? item.product.name : 'A product'} no longer has enough stock`);
    }
  }

  const summary = buildCartSummary(cart);

  const orderItems = summary.items.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    image: i.product.images[0],
    price: +(i.product.price - (i.product.price * i.product.discount) / 100).toFixed(2),
    quantity: i.quantity
  }));

  const order = await Order.create({
    user: req.user._id,
    orderNumber: generateOrderNumber(),
    items: orderItems,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentResult,
    itemsPrice: summary.subtotal,
    shippingPrice: summary.shipping,
    taxPrice: summary.tax,
    discountAmount: summary.discountAmount,
    couponCode: summary.couponCode,
    totalPrice: summary.total,
    paymentStatus,
    orderStatus: 'placed',
    paidAt: paymentStatus === 'paid' ? new Date() : undefined
  });

  // Decrement stock and increment salesCount (for the "Popularity" sort)
  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity }
      })
    )
  );

  // Empty the cart now that the order is placed
  cart.items = [];
  cart.couponCode = null;
  cart.couponDiscountPercent = 0;
  await cart.save();

  res.status(201).json({ success: true, order });
});

// @desc    Get logged-in user's own orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @desc    Get a single order (owner or admin only)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json({ success: true, order });
});

// @desc    Cancel an order (only if not yet shipped)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }
  if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled once it is ${order.orderStatus}`);
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  await order.save();

  // Restock cancelled items
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, salesCount: -item.quantity } })
    )
  );

  res.json({ success: true, order });
});

// ==================== ADMIN ====================

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.orderStatus = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(query)
  ]);

  res.json({ success: true, orders, page: pageNum, pages: Math.ceil(total / limitNum), total });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = orderStatus;
  if (orderStatus === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') order.paymentStatus = 'paid';
  }
  await order.save();

  res.json({ success: true, order });
});

module.exports = {
  createPaymentOrder,
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
};
