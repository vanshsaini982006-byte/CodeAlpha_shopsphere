const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone });

  // Create empty cart and wishlist for the new user so downstream
  // cart/wishlist routes never have to handle "doesn't exist yet"
  await Cart.create({ user: user._id, items: [] });
  await Wishlist.create({ user: user._id, products: [] });

  const token = generateToken(res, user._id);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject()
  });
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated');
  }

  const token = generateToken(res, user._id);

  res.json({
    success: true,
    token,
    user: user.toSafeObject()
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone ?? user.phone;
  if (req.body.avatar) user.avatar = req.body.avatar;

  // Email changes require re-checking uniqueness
  if (req.body.email && req.body.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: req.body.email.toLowerCase() });
    if (exists) {
      res.status(400);
      throw new Error('That email is already in use');
    }
    user.email = req.body.email.toLowerCase();
  }

  if (req.body.password) {
    if (req.body.password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    user.password = req.body.password; // pre-save hook will hash it
  }

  const updated = await user.save();
  res.json({ success: true, user: updated.toSafeObject() });
});

// @desc    Add or update a shipping/billing address
// @route   POST /api/auth/address
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { label, street, city, state, postalCode, country, isDefault } = req.body;

  if (!street || !city || !state || !postalCode) {
    res.status(400);
    throw new Error('Street, city, state and postal code are required');
  }

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({
    label,
    street,
    city,
    state,
    postalCode,
    country: country || 'India',
    isDefault: isDefault || user.addresses.length === 0
  });

  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

// @desc    Delete an address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress
};
