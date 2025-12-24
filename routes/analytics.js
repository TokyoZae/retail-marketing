const express = require('express');
const Analytics = require('../models/Analytics');
const Deal = require('../models/Deal');
const Store = require('../models/Store');
const User = require('../models/User');
const Redemption = require('../models/Redemption');
const Subscription = require('../models/Subscription');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/analytics/event
// @desc    Track analytics event
// @access  Public
router.post('/event', async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      eventType,
      userId,
      sessionId,
      location,
      device,
      browser,
      referrer,
      utm,
      metadata
    } = req.body;
    
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress;
    
    // Create analytics record
    const analytics = await Analytics.create({
      entityType,
      entityId,
      eventType,
      userId: userId || null,
      sessionId: sessionId || req.sessionID,
      location: {
        ip,
        ...location
      },
      device,
      browser,
      referrer,
      utm,
      metadata
    });
    
    res.status(201).json({
      message: 'Event tracked successfully',
      analytics: {
        id: analytics._id,
        timestamp: analytics.timestamp
      }
    });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ message: 'Server error tracking event' });
  }
});

// @route   GET /api/analytics/store/:storeId
// @desc    Get store analytics
// @access  Private (Store Owner, Admin)
router.get('/store/:storeId', authenticate, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const storeId = req.params.storeId;
    
    // Verify user has access to this store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view analytics for this store' });
    }
    
    // Get store analytics
    const analytics = await Analytics.getStoreAnalytics(storeId, period);
    
    // Get deal performance
    const dealPerformance = await Deal.find({ store: storeId })
      .select('title analytics views clicks saves redemptions schedule.endDate')
      .sort({ 'analytics.views': -1 })
      .limit(10);
    
    // Get recent activity
    const recentActivity = await Analytics.find({
      $or: [
        { entityType: 'store', entityId: storeId },
        { 'metadata.storeId': storeId }
      ]
    })
    .populate('userId', 'firstName lastName')
    .sort({ timestamp: -1 })
    .limit(50);
    
    res.json({
      analytics,
      dealPerformance,
      recentActivity,
      period
    });
  } catch (error) {
    console.error('Get store analytics error:', error);
    res.status(500).json({ message: 'Server error fetching store analytics' });
  }
});

// @route   GET /api/analytics/deal/:dealId
// @desc    Get deal analytics
// @access  Private (Store Owner, Admin)
router.get('/deal/:dealId', authenticate, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const dealId = req.params.dealId;
    
    // Get deal and verify ownership
    const deal = await Deal.findById(dealId).populate('store');
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    if (deal.store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view analytics for this deal' });
    }
    
    // Get deal analytics
    const analytics = await Analytics.getDealAnalytics(dealId, period);
    
    // Get conversion funnel
    const totalViews = deal.analytics.views;
    const totalClicks = deal.analytics.clicks;
    const totalSaves = deal.analytics.saves;
    const totalRedemptions = deal.analytics.redemptions;
    
    const conversionFunnel = {
      views: totalViews,
      clicks: totalClicks,
      saves: totalSaves,
      redemptions: totalRedemptions,
      ctr: totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(2) : 0,
      saveRate: totalViews > 0 ? (totalSaves / totalViews * 100).toFixed(2) : 0,
      conversionRate: totalViews > 0 ? (totalRedemptions / totalViews * 100).toFixed(2) : 0
    };
    
    // Get hourly activity for the last 24 hours
    const hourlyActivity = await Analytics.aggregate([
      {
        $match: {
          $or: [
            { entityType: 'deal', entityId: deal._id },
            { 'metadata.dealId': deal._id }
          ],
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);
    
    res.json({
      analytics,
      conversionFunnel,
      hourlyActivity,
      period
    });
  } catch (error) {
    console.error('Get deal analytics error:', error);
    res.status(500).json({ message: 'Server error fetching deal analytics' });
  }
});

// @route   GET /api/analytics/popular-deals
// @desc    Get popular deals analytics
// @access  Public
router.get('/popular-deals', async (req, res) => {
  try {
    const { period = '7d', limit = 10 } = req.query;
    
    const popularDeals = await Analytics.getPopularDeals(period, parseInt(limit));
    
    res.json({ popularDeals, period });
  } catch (error) {
    console.error('Get popular deals error:', error);
    res.status(500).json({ message: 'Server error fetching popular deals' });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get analytics trends
// @access  Private (Admin)
router.get('/trends', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { period = '30d', metric = 'views' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    let groupBy = {};
    if (period <= '7d') {
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
    } else if (period <= '30d') {
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
    } else {
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      };
    }
    
    const trends = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    res.json({ trends, period, metric });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ message: 'Server error fetching trends' });
  }
});

// @route   GET /api/analytics/summary
// @desc    Get platform summary analytics
// @access  Private (Admin)
router.get('/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const [
      totalUsers,
      totalStores,
      totalDeals,
      totalRedemptions,
      activeDeals,
      newUsers,
      topCategories
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Total stores
      Store.countDocuments({ 'settings.isActive': true }),
      
      // Total deals
      Deal.countDocuments(),
      
      // Total redemptions
      Redemption.countDocuments({ status: 'used' }),
      
      // Active deals
      Deal.countDocuments({
        'visibility.isActive': true,
        'visibility.isApproved': true,
        'schedule.startDate': { $lte: new Date() },
        'schedule.endDate': { $gte: new Date() }
      }),
      
      // New users in period
      User.countDocuments({ createdAt: { $gte: startDate } }),
      
      // Top categories
      Deal.aggregate([
        {
          $match: {
            'visibility.isActive': true,
            'visibility.isApproved': true
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        }
      ])
    ]);
    
    res.json({
      summary: {
        totalUsers,
        totalStores,
        totalDeals,
        totalRedemptions,
        activeDeals,
        newUsers,
        topCategories
      },
      period
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
});

module.exports = router;