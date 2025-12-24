const express = require('express');
const User = require('../models/User');
const Deal = require('../models/Deal');
const Store = require('../models/Store');
const Redemption = require('../models/Redemption');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedDeals', 'title images.main pricing salePrice schedule.endDate')
      .populate('favoriteStores', 'name category images.logo rating');
    
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, preferences, location } = req.body;
    const user = req.user;
    
    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (location) user.location = { ...user.location, ...location };
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   GET /api/users/saved-deals
// @desc    Get user's saved deals
// @access  Private
router.get('/saved-deals', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedDeals',
        populate: {
          path: 'store',
          select: 'name address.coordinates images.logo'
        }
      });
    
    const activeDeals = user.savedDeals.filter(deal => {
      const now = new Date();
      return deal.visibility.isActive && 
             deal.visibility.isApproved && 
             deal.schedule.startDate <= now && 
             deal.schedule.endDate >= now;
    });
    
    res.json({ deals: activeDeals });
  } catch (error) {
    console.error('Get saved deals error:', error);
    res.status(500).json({ message: 'Server error fetching saved deals' });
  }
});

// @route   GET /api/users/redemptions
// @desc    Get user's deal redemptions
// @access  Private
router.get('/redemptions', authenticate, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    let query = { customer: req.user._id };
    
    if (status === 'active') {
      query.status = 'active';
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'used') {
      query.status = 'used';
    } else if (status === 'expired') {
      query.expiresAt = { $lt: new Date() };
    }
    
    const redemptions = await Redemption.find(query)
      .populate('deal', 'title images.main pricing store')
      .populate('store', 'name address.coordinates')
      .sort({ createdAt: -1 });
    
    res.json({ redemptions });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ message: 'Server error fetching redemptions' });
  }
});

// @route   POST /api/users/favorite-stores
// @desc    Add store to favorites
// @access  Private
router.post('/favorite-stores/:storeId', authenticate, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    const user = req.user;
    if (!user.favoriteStores.includes(storeId)) {
      user.favoriteStores.push(storeId);
      await user.save();
    }
    
    res.json({ message: 'Store added to favorites' });
  } catch (error) {
    console.error('Add favorite store error:', error);
    res.status(500).json({ message: 'Server error adding favorite store' });
  }
});

// @route   DELETE /api/users/favorite-stores/:storeId
// @desc    Remove store from favorites
// @access  Private
router.delete('/favorite-stores/:storeId', authenticate, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const user = req.user;
    user.favoriteStores = user.favoriteStores.filter(id => id.toString() !== storeId);
    await user.save();
    
    res.json({ message: 'Store removed from favorites' });
  } catch (error) {
    console.error('Remove favorite store error:', error);
    res.status(500).json({ message: 'Server error removing favorite store' });
  }
});

// @route   GET /api/users/recommendations
// @desc    Get personalized deal recommendations
// @access  Private
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const preferences = user.preferences.categories || [];
    
    let query = {
      'visibility.isActive': true,
      'visibility.isApproved': true,
      'schedule.startDate': { $lte: new Date() },
      'schedule.endDate': { $gte: new Date() }
    };
    
    // If user has preferences, filter by them
    if (preferences.length > 0) {
      query.category = { $in: preferences };
    }
    
    // Get user's favorite stores
    const favoriteStores = user.favoriteStores || [];
    if (favoriteStores.length > 0) {
      query.store = { $in: favoriteStores };
    }
    
    const deals = await Deal.find(query)
      .populate('store', 'name address.coordinates images.logo')
      .sort({ 'analytics.views': -1 })
      .limit(10);
    
    res.json({ deals });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error fetching recommendations' });
  }
});

// @route   GET /api/users/analytics
// @desc    Get user analytics (savings, deals used, etc.)
// @access  Private
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Get redemption stats
    const redemptionStats = await Redemption.aggregate([
      { $match: { customer: user._id, status: 'used' } },
      {
        $group: {
          _id: null,
          totalRedemptions: { $sum: 1 },
          totalSavings: { $sum: '$metadata.savings' },
          averageSavings: { $avg: '$metadata.savings' }
        }
      }
    ]);
    
    // Get favorite categories
    const favoriteCategories = await Deal.aggregate([
      { $match: { _id: { $in: user.savedDeals } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const stats = redemptionStats[0] || {
      totalRedemptions: 0,
      totalSavings: 0,
      averageSavings: 0
    };
    
    res.json({
      totalSavings: stats.totalSavings,
      totalRedemptions: stats.totalRedemptions,
      averageSavings: stats.averageSavings,
      savedDealsCount: user.savedDeals.length,
      favoriteStoresCount: user.favoriteStores.length,
      favoriteCategories: favoriteCategories
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error fetching user analytics' });
  }
});

// @route   POST /api/users/location
// @desc    Update user location
// @access  Private
router.post('/location', authenticate, async (req, res) => {
  try {
    const { coordinates, address } = req.body;
    const user = req.user;
    
    if (coordinates) {
      user.location.coordinates = coordinates;
    }
    
    if (address) {
      user.location.address = address;
    }
    
    await user.save();
    
    res.json({
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

// @route   POST /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.post('/preferences', authenticate, async (req, res) => {
  try {
    const { categories, notifications } = req.body;
    const user = req.user;
    
    if (categories) {
      user.preferences.categories = categories;
    }
    
    if (notifications) {
      user.preferences.notifications = { ...user.preferences.notifications, ...notifications };
    }
    
    await user.save();
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

module.exports = router;