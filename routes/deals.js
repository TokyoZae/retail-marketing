const express = require('express');
const Deal = require('../models/Deal');
const Store = require('../models/Store');
const Analytics = require('../models/Analytics');
const Redemption = require('../models/Redemption');
const Subscription = require('../models/Subscription');
const { authenticate, authorize, verifyStoreOwnership } = require('../middleware/auth');
const { validateDealCreation, validateObjectId } = require('../middleware/validation');
const QRCode = require('qrcode');

const router = express.Router();

// @route   GET /api/deals
// @desc    Get all deals with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      store,
      type,
      status = 'active',
      search,
      lat,
      lng,
      radius = 10,
      sort = 'ending',
      featured
    } = req.query;
    
    // Build query
    let query = {};
    
    // Status filter
    if (status === 'active') {
      query['visibility.isActive'] = true;
      query['visibility.isApproved'] = true;
      query['schedule.startDate'] = { $lte: new Date() };
      query['schedule.endDate'] = { $gte: new Date() };
    } else if (status === 'upcoming') {
      query['schedule.startDate'] = { $gt: new Date() };
    } else if (status === 'expired') {
      query['schedule.endDate'] = { $lt: new Date() };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Store filter
    if (store) {
      query.store = store;
    }
    
    // Type filter
    if (type) {
      query.type = type;
    }
    
    // Featured filter
    if (featured === 'true') {
      query['visibility.isFeatured'] = true;
    }
    
    // Search filter
    if (search) {
      query.$text = { $search: search };
    }
    
    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { 'analytics.views': -1 };
        break;
      case 'discount':
        sortOption = { 'discount.percentage': -1 };
        break;
      case 'ending':
      default:
        sortOption = { 'schedule.endDate': 1 };
    }
    
    // Execute query
    const deals = await Deal.find(query)
      .populate('store', 'name address coordinates images.logo rating')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count
    const total = await Deal.countDocuments(query);
    
    res.json({
      deals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDeals: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ message: 'Server error fetching deals' });
  }
});

// @route   GET /api/deals/:id
// @desc    Get deal by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('store', 'name address contact hours images.logo');
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Log view analytics
    await Analytics.create({
      entityType: 'deal',
      entityId: deal._id,
      eventType: 'view',
      userId: req.user ? req.user._id : null,
      metadata: {
        dealId: deal._id,
        storeId: deal.store
      }
    });
    
    // Increment view count
    deal.analytics.views += 1;
    await deal.save();
    
    res.json({ deal });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ message: 'Server error fetching deal' });
  }
});

// @route   POST /api/deals
// @desc    Create new deal
// @access  Private (Store Owners, Admins)
router.post('/', authenticate, authorize('store_owner', 'admin'), validateDealCreation, async (req, res) => {
  try {
    const { store: storeId } = req.body;
    
    // Verify store ownership
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create deals for this store' });
    }
    
    // Check subscription limits
    const subscription = await Subscription.findOne({ store: storeId, status: 'active' });
    if (!subscription) {
      return res.status(403).json({ message: 'No active subscription for this store' });
    }
    
    if (!subscription.canCreateDeal()) {
      return res.status(403).json({ message: 'Deal limit reached for current subscription plan' });
    }
    
    // Create deal
    const deal = new Deal({
      ...req.body,
      store: storeId
    });
    
    await deal.save();
    
    // Update store analytics
    store.analytics.totalDeals += 1;
    await store.save();
    
    // Update subscription usage
    await subscription.incrementUsage('deal');
    
    res.status(201).json({
      message: 'Deal created successfully',
      deal
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ message: 'Server error creating deal' });
  }
});

// @route   PUT /api/deals/:id
// @desc    Update deal
// @access  Private (Store Owner, Admin)
router.put('/:id', authenticate, verifyStoreOwnership, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Verify deal belongs to store
    if (deal.store.toString() !== req.store._id.toString()) {
      return res.status(403).json({ message: 'Deal does not belong to this store' });
    }
    
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'title', 'description', 'category', 'type', 'discount', 'pricing',
      'images', 'schedule', 'inventory', 'restrictions', 'tags', 'terms'
    ];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }
    
    updates.forEach(update => deal[update] = req.body[update]);
    await deal.save();
    
    res.json({
      message: 'Deal updated successfully',
      deal
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ message: 'Server error updating deal' });
  }
});

// @route   DELETE /api/deals/:id
// @desc    Delete deal (soft delete)
// @access  Private (Store Owner, Admin)
router.delete('/:id', authenticate, verifyStoreOwnership, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Verify deal belongs to store
    if (deal.store.toString() !== req.store._id.toString()) {
      return res.status(403).json({ message: 'Deal does not belong to this store' });
    }
    
    deal.visibility.isActive = false;
    await deal.save();
    
    // Update subscription usage
    const subscription = await Subscription.findOne({ store: deal.store, status: 'active' });
    if (subscription) {
      await subscription.decrementUsage('deal');
    }
    
    res.json({ message: 'Deal deactivated successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ message: 'Server error deactivating deal' });
  }
});

// @route   POST /api/deals/:id/click
// @desc    Track deal click
// @access  Public
router.post('/:id/click', validateObjectId, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Log click analytics
    await Analytics.create({
      entityType: 'deal',
      entityId: deal._id,
      eventType: 'click',
      userId: req.user ? req.user._id : null,
      metadata: {
        dealId: deal._id,
        storeId: deal.store
      }
    });
    
    // Increment click count
    deal.analytics.clicks += 1;
    await deal.save();
    
    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ message: 'Server error tracking click' });
  }
});

// @route   POST /api/deals/:id/save
// @desc    Save deal for later
// @access  Private
router.post('/:id/save', authenticate, validateObjectId, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Add to user's saved deals
    const user = req.user;
    if (!user.savedDeals.includes(deal._id)) {
      user.savedDeals.push(deal._id);
      await user.save();
      
      // Increment save count
      deal.analytics.saves += 1;
      await deal.save();
    }
    
    res.json({ message: 'Deal saved successfully' });
  } catch (error) {
    console.error('Save deal error:', error);
    res.status(500).json({ message: 'Server error saving deal' });
  }
});

// @route   DELETE /api/deals/:id/save
// @desc    Remove saved deal
// @access  Private
router.delete('/:id/save', authenticate, validateObjectId, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Remove from user's saved deals
    const user = req.user;
    user.savedDeals = user.savedDeals.filter(dealId => dealId.toString() !== deal._id.toString());
    await user.save();
    
    res.json({ message: 'Deal removed from saved' });
  } catch (error) {
    console.error('Remove saved deal error:', error);
    res.status(500).json({ message: 'Server error removing saved deal' });
  }
});

// @route   POST /api/deals/:id/share
// @desc    Share deal
// @access  Public
router.post('/:id/share', validateObjectId, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Log share analytics
    await Analytics.create({
      entityType: 'deal',
      entityId: deal._id,
      eventType: 'share',
      userId: req.user ? req.user._id : null,
      metadata: {
        dealId: deal._id,
        storeId: deal.store
      }
    });
    
    // Increment share count
    deal.analytics.shares += 1;
    await deal.save();
    
    res.json({ message: 'Deal shared successfully' });
  } catch (error) {
    console.error('Share deal error:', error);
    res.status(500).json({ message: 'Server error sharing deal' });
  }
});

// @route   GET /api/deals/:id/qrcode
// @desc    Generate QR code for deal
// @access  Private (Store Owner, Admin)
router.get('/:id/qrcode', authenticate, verifyStoreOwnership, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Verify deal belongs to store
    if (deal.store.toString() !== req.store._id.toString()) {
      return res.status(403).json({ message: 'Deal does not belong to this store' });
    }
    
    // Generate QR code
    const qrData = `${process.env.FRONTEND_URL}/redeem/${deal.qrCode.data}`;
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({
      qrCode: qrCodeImage,
      data: deal.qrCode.data
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Server error generating QR code' });
  }
});

// @route   GET /api/deals/featured
// @desc    Get featured deals
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const deals = await Deal.find({
      'visibility.isFeatured': true,
      'visibility.isActive': true,
      'visibility.isApproved': true,
      'schedule.startDate': { $lte: new Date() },
      'schedule.endDate': { $gte: new Date() }
    })
    .populate('store', 'name address.coordinates images.logo')
    .sort({ 'schedule.endDate': 1 })
    .limit(parseInt(limit));
    
    res.json({ deals });
  } catch (error) {
    console.error('Get featured deals error:', error);
    res.status(500).json({ message: 'Server error fetching featured deals' });
  }
});

// @route   GET /api/deals/popular
// @desc    Get popular deals
// @access  Public
router.get('/popular/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const deals = await Deal.find({
      'visibility.isActive': true,
      'visibility.isApproved': true,
      'schedule.startDate': { $lte: new Date() },
      'schedule.endDate': { $gte: new Date() }
    })
    .populate('store', 'name address.coordinates images.logo')
    .sort({ 'analytics.views': -1 })
    .limit(parseInt(limit));
    
    res.json({ deals });
  } catch (error) {
    console.error('Get popular deals error:', error);
    res.status(500).json({ message: 'Server error fetching popular deals' });
  }
});

// @route   GET /api/deals/categories
// @desc    Get deal categories with counts
// @access  Public
router.get('/categories/counts', async (req, res) => {
  try {
    const categories = await Deal.aggregate([
      {
        $match: {
          'visibility.isActive': true,
          'visibility.isApproved': true,
          'schedule.startDate': { $lte: new Date() },
          'schedule.endDate': { $gte: new Date() }
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
      }
    ]);
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

module.exports = router;