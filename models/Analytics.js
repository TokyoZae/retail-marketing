const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['store', 'deal', 'user']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'view',
      'click',
      'save',
      'share',
      'redemption',
      'signup',
      'login',
      'purchase',
      'review',
      'subscription_change'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    ip: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    city: String,
    state: String,
    country: String
  },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  },
  browser: String,
  referrer: String,
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },
  metadata: {
    dealId: mongoose.Schema.Types.ObjectId,
    storeId: mongoose.Schema.Types.ObjectId,
    category: String,
    action: String,
    value: Number,
    customData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
analyticsSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ 'location.coordinates': '2dsphere' });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });

// Static methods for analytics
analyticsSchema.statics.getStoreAnalytics = function(storeId, period = '7d') {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));
  
  return this.aggregate([
    {
      $match: {
        entityType: 'store',
        entityId: storeId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    }
  ]);
};

analyticsSchema.statics.getDealAnalytics = function(dealId, period = '7d') {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));
  
  return this.aggregate([
    {
      $match: {
        $or: [
          { entityType: 'deal', entityId: dealId },
          { 'metadata.dealId': dealId }
        ],
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    }
  ]);
};

analyticsSchema.statics.getPopularDeals = function(period = '7d', limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));
  
  return this.aggregate([
    {
      $match: {
        eventType: { $in: ['view', 'click', 'redemption'] },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.dealId',
        views: {
          $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] }
        },
        clicks: {
          $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
        },
        redemptions: {
          $sum: { $cond: [{ $eq: ['$eventType', 'redemption'] }, 1, 0] }
        },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $lookup: {
        from: 'deals',
        localField: '_id',
        foreignField: '_id',
        as: 'deal'
      }
    },
    {
      $unwind: '$deal'
    },
    {
      $project: {
        deal: 1,
        views: 1,
        clicks: 1,
        redemptions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        ctr: { $divide: ['$clicks', { $max: ['$views', 1] }] }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('Analytics', analyticsSchema);