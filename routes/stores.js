const express = require('express');
const Store = require('../models/Store');
const Deal = require('../models/Deal');
const { authenticate, authorize, verifyStoreOwnership } = require('../middleware/auth');
const { validateStoreCreation, validateStoreUpdate, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/stores
// @desc    Get all stores with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      city,
      search,
      lat,
      lng,
      radius = 10,
      sort = 'rating'
    } = req.query;
    
    // Build query
    let query = { 'settings.isActive': true, 'settings.isVerified': true };
    
    if (category) {
      query.category = category;
    }
    
    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Geospatial query
    if (lat && lng) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1609.34 // Convert miles to meters
        }
      };
    }
    
    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': -1 };
        break;
      case 'popular':
        sortOption = { 'analytics.totalViews': -1 };
        break;
      default:
        sortOption = { 'rating.average': -1 };
    }
    
    // Execute query
    const stores = await Store.find(query)
      .populate('owner', 'firstName lastName email')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count
    const total = await Store.countDocuments(query);
    
    res.json({
      stores,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStores: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Server error fetching stores' });
  }
});

// @route   GET /api/stores/:id
// @desc    Get store by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('owner', 'firstName lastName')
      .populate({
        path: 'analytics',
        options: { limit: 10, sort: { timestamp: -1 } }
      });
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    // Get active deals for this store
    const activeDeals = await Deal.find({
      store: store._id,
      'visibility.isActive': true,
      'visibility.isApproved': true,
      'schedule.startDate': { $lte: new Date() },
      'schedule.endDate': { $gte: new Date() }
    }).sort({ 'schedule.endDate': 1 });
    
    res.json({
      store,
      activeDeals: activeDeals.length,
      deals: activeDeals
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: 'Server error fetching store' });
  }
});

// @route   POST /api/stores
// @desc    Create new store
// @access  Private (Store Owners, Admins)
router.post('/', authenticate, authorize('store_owner', 'admin'), validateStoreCreation, async (req, res) => {
  try {
    const storeData = {
      ...req.body,
      owner: req.user._id
    };
    
    const store = new Store(storeData);
    await store.save();
    
    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Create store error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Store with this information already exists' });
    }
    res.status(500).json({ message: 'Server error creating store' });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update store
// @access  Private (Store Owner, Admin)
router.put('/:id', authenticate, verifyStoreOwnership, validateStoreUpdate, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'name', 'description', 'category', 'contact', 'address', 
      'hours', 'features', 'images'
    ];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }
    
    updates.forEach(update => req.store[update] = req.body[update]);
    await req.store.save();
    
    res.json({
      message: 'Store updated successfully',
      store: req.store
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: 'Server error updating store' });
  }
});

// @route   DELETE /api/stores/:id
// @desc    Delete store (soft delete)
// @access  Private (Store Owner, Admin)
router.delete('/:id', authenticate, verifyStoreOwnership, async (req, res) => {
  try {
    req.store.settings.isActive = false;
    await req.store.save();
    
    // Also deactivate all deals for this store
    await Deal.updateMany(
      { store: req.store._id },
      { 'visibility.isActive': false }
    );
    
    res.json({ message: 'Store deactivated successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ message: 'Server error deactivating store' });
  }
});

// @route   GET /api/stores/:id/deals
// @desc    Get all deals for a specific store
// @access  Public
router.get('/:id/deals', validateObjectId, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;
    
    let query = { store: req.params.id };
    
    if (status === 'active') {
      query['visibility.isActive'] = true;
      query['visibility.isApproved'] = true;
      query['schedule.startDate'] = { $lte: new Date() };
      query['schedule.endDate'] = { $gte: new Date() };
    }
    
    const deals = await Deal.find(query)
      .sort({ 'schedule.endDate': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Deal.countDocuments(query);
    
    res.json({
      deals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDeals: total
      }
    });
  } catch (error) {
    console.error('Get store deals error:', error);
    res.status(500).json({ message: 'Server error fetching store deals' });
  }
});

// @route   GET /api/stores/nearby
// @desc    Get stores near a location
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, limit = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const stores = await Store.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1609.34 // Convert miles to meters
        }
      },
      'settings.isActive': true,
      'settings.isVerified': true
    })
    .limit(parseInt(limit))
    .populate('owner', 'firstName lastName');
    
    res.json({ stores });
  } catch (error) {
    console.error('Get nearby stores error:', error);
    res.status(500).json({ message: 'Server error fetching nearby stores' });
  }
});

// @route   GET /api/stores/categories
// @desc    Get store categories with counts
// @access  Public
router.get('/categories/counts', async (req, res) => {
  try {
    const categories = await Store.aggregate([
      {
        $match: {
          'settings.isActive': true,
          'settings.isVerified': true
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