const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: String,
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active'
  },
  usage: {
    usedAt: Date,
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: {
      ip: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  validation: {
    validatedAt: Date,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['qr', 'code', 'manual']
    }
  },
  metadata: {
    originalPrice: Number,
    discountAmount: Number,
    finalPrice: Number,
    savings: Number,
    customerFeedback: String,
    staffNotes: String
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to set expirationedemptionSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiration to deal end date
    this.populate('deal', 'schedule.endDate', (err, redemption) => {
      if (!err && redemption.deal) {
        this.expiresAt = redemption.deal.schedule.endDate;
      } else {
        // Default to 30 days from creation
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      next();
    });
  } else {
    next();
  }
});

// Method to use redemption
redemptionSchema.methods.use = function(userId, location = {}) {
  if (this.status !== 'active') {
    throw new Error('Redemption is not active');
  }
  
  if (new Date() > this.expiresAt) {
    this.status = 'expired';
    throw new Error('Redemption has expired');
  }
  
  this.status = 'used';
  this.usage.usedAt = new Date();
  this.usage.usedBy = userId;
  this.usage.location = location;
  
  return this.save();
};

// Static methods
redemptionSchema.statics.getActiveRedemptions = function(customerId) {
  return this.find({
    customer: customerId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('deal store');
};

redemptionSchema.statics.getStoreRedemptions = function(storeId, period = '7d') {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));
  
  return this.find({
    store: storeId,
    createdAt: { $gte: startDate }
  }).populate('deal customer');
};

redemptionSchema.statics.validateRedemption = function(code, storeId) {
  return this.findOne({
    code: code,
    store: storeId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('deal customer');
};

// Indexes for performance
redemptionSchema.index({ code: 1 }, { unique: true });
redemptionSchema.index({ customer: 1, status: 1, expiresAt: 1 });
redemptionSchema.index({ store: 1, status: 1, createdAt: -1 });
redemptionSchema.index({ deal: 1, status: 1 });
redemptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Redemption', redemptionSchema);