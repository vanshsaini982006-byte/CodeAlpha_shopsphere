const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get admin dashboard summary stats + revenue chart data
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, revenueAgg, lowStock, recentOrders, statusBreakdown] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Product.find({ stock: { $lte: 5 } }).select('name stock images').limit(10),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }])
    ]);

  // Revenue for the last 7 days, grouped by day - powers the dashboard revenue chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0] ? +revenueAgg[0].total.toFixed(2) : 0
    },
    lowStock,
    recentOrders,
    statusBreakdown,
    dailyRevenue
  });
});

module.exports = { getDashboardStats };
