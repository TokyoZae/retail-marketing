const express = require('express');
const User = require('../models/User');
const Store = require('../models/Store');
const Deal = require('../models/Deal');
const Subscription = require('../models/Subscription');
const Review = require('../models/Review');
const Analytics = require('../models/Analytics');
const Redemption = require('../models/Redemption');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStores,
      totalDeals,
      pendingStores,
      pendingDeals,
      activeSubscriptions,
      recentUsers,
      recentStores,
      recentReviews
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Total stores
      Store.countDocuments(),
      
      // Total deals
      Deal.countDocuments(),
      
      // Pending stores
      Store.countDocuments({ 'settings.isVerified': false }),
      
      // Pending deals
      Deal.countDocuments({ 'visibility.isApproved': false }),
      
      // Active subscriptions
      Subscription.countDocuments({ status: 'active' }),
      
      // Recent users
      User.find()
        .select('firstName lastName email role createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Recent stores
      Store.find()
        .populate('owner', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Recent reviews
      Review.find()
        .populate('customer', 'firstName lastName')
        .populate('store', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);
    
    res.json({
      stats: {
        totalUsers,
        totalStores,
        totalDeals,
        pendingStores,
        pendingDeals,
        activeSubscriptions
      },
      recent: {
        users: recentUsers,
        stores: recentStores,
        reviews: recentReviews
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, sort = 'newest' } = req.query;
    
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name':
        sortOption = { firstName: 1, lastName: 1 };
        break;
      case 'lastActive':
        sortOption = { updatedAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { role, isActive, preferences } = req.body;
    
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    await user.save();
    
    res.json({
      message: 'User updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// @route   GET /api/admin/stores/pending
// @desc    Get pending stores for approval
// @access  Private (Admin)
router.get('/stores/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const stores = await Store.find({ 'settings.isVerified': false })
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Store.countDocuments({ 'settings.isVerified': false });
    
    res.json({
      stores,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStores: total
      }
    });
  } catch (error) {
    console.error('Get pending stores error:', error);
    res.status(500).json({ message: 'Server error fetching pending stores' });
  }
});

// @route   PUT /api/admin/stores/:id/verify
// @desc    Verify store
// @access  Private (Admin)
router.put('/stores/:id/verify', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    store.settings.isVerified = true;
    await store.save();
    
    res.json({
      message: 'Store verified successfully',
      store
    });
  } catch (error) {
    console.error('Verify store error:', error);
    res.status(500).json({ message: 'Server error verifying store' });
  }
});

// @route   GET /api/admin/deals/pending
// @desc    Get pending deals for approval
// @access  Private (Admin)
router.get('/deals/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const deals = await Deal.find({ 'visibility.isApproved': false })
      .populate('store', 'name owner')
      .populate('store.owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Deal.countDocuments({ 'visibility.isApproved': false });
    
    res.json({
      deals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDeals: total
      }
    });
  } catch (error) {
    console.error('Get pending deals error:', error);
    res.status(500).json({ message: 'Server error fetching pending deals' });
  }
});

// @route   PUT /api/admin/deals/:id/approve
// @desc    Approve deal
// @access  Private (Admin)
router.put('/deals/:id/approve', async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    deal.visibility.isApproved = true;
    deal.visibility.approvedBy = req.user._id;
    deal.visibility.approvedAt = new Date();
    await deal.save();
    
    res.json({
      message: 'Deal approved successfully',
      deal
    });
  } catch (error) {
    console.error('Approve deal error:', error);
    res.status(500).json({ message: 'Server error approving deal' });
  }
});

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions
// @access  Private (Admin)
router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const subscriptions = await Subscription.find(query)
      .populate('store', 'name owner')
      .populate('store.owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Subscription.countDocuments(query);
    
    res.json({
      subscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSubscriptions: total
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error fetching subscriptions' });
  }
});

// @route   GET /api/admin/reviews/pending
// @desc    Get pending reviews for moderation
// @access  Private (Admin)
router.get('/reviews/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const reviews = await Review.find({ 'moderation.status': 'pending' })
      .populate('customer', 'firstName lastName')
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Review.countDocuments({ 'moderation.status': 'pending' });
    
    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ message: 'Server error fetching pending reviews' });
  }
});

// @route   PUT /api/admin/reviews/:id/moderate
// @desc    Moderate review
// @access  Private (Admin)
router.put('/reviews/:id/moderate', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.moderation.status = status;
    review.moderation.moderatedBy = req.user._id;
    review.moderation.moderatedAt = new Date();
    review.moderation.reason = reason;
    
    await review.save();
    
    res.json({
      message: `Review ${status} successfully`,
      review
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ message: 'Server error moderating review' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const [
      userGrowth,
      storeGrowth,
      dealActivity,
      revenueStats
    ] = await Promise.all([
      // User growth
      User.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Store growth
      Store.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Deal activity
      Deal.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Revenue stats (placeholder - would integrate with payment system)
      Subscription.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 },
            revenue: { $sum: '$billing.amount' }
          }
        }
      ])
    ]);
    
    res.json({
      userGrowth,
      storeGrowth,
      dealActivity,
      revenueStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;