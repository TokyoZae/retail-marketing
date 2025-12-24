const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['clothing', 'electronics', 'beauty', 'convenience', 'shoes', 'grocery', 'accessories', 'books', 'home', 'sports', 'other']
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'bogo', 'flash', 'clearance']
  },
  discount: {
    percentage: Number,
    fixedAmount: Number,
    buyQuantity: Number,
    getQuantity: Number
  },
  pricing: {
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  images: {
    main: {
      type: String,
      required: true
    },
    gallery: [String]
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    }
  },
  inventory: {
    totalQuantity: {
      type: Number,
      default: null
    },
    availableQuantity: {
      type: Number,
      default: null
    },
    soldQuantity: {
      type: Number,
      default: 0
    },
    unlimited: {
      type: Boolean,
      default: false
    }
  },
  restrictions: {
    minPurchase: {
      type: Number,
      default: 0
    },
    maxPerCustomer: {
      type: Number,
      default: null
    },
    customerType: {
      type: String,
      enum: ['all', 'new', 'returning'],
      default: 'all'
    },
    excludedCategories: [String]
  },
  visibility: {
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    redemptions: {
      type: Number,
      default: 0
    },
    estimatedRevenue: {
      type: Number,
      default: 0
    }
  },
  qrCode: {
    data: String,
    generatedAt: Date
  },
  tags: [String],
  terms: String
}, {
  timestamps: true
});

// Virtual for current status
dealSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (now < this.schedule.startDate) return 'upcoming';
  if (now > this.schedule.endDate) return 'expired';
  if (!this.visibility.isActive) return 'inactive';
  if (!this.visibility.isApproved) return 'pending';
  
  return 'active';
});

// Virtual for time remaining
dealSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const endTime = this.schedule.endDate;
  
  if (now >= endTime) return null;
  
  const diff = endTime - now;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000)
  };
});

// Virtual for discount percentage
dealSchema.virtual('discountPercentage').get(function() {
  if (this.pricing.originalPrice <= 0) return 0;
  return Math.round(((this.pricing.originalPrice - this.pricing.salePrice) / this.pricing.originalPrice) * 100);
});

// Pre-save middleware
dealSchema.pre('save', function(next) {
  // Generate QR code data if not exists
  if (!this.qrCode.data) {
    this.qrCode.data = `deal:${this._id}:${Date.now()}`;
    this.qrCode.generatedAt = new Date();
  }
  
  // Update pricing based on discount type
  if (this.type === 'percentage' && this.discount.percentage) {
    this.pricing.salePrice = this.pricing.originalPrice * (1 - this.discount.percentage / 100);
  }
  
  next();
});

// Indexes for performance
dealSchema.index({ store: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 });
dealSchema.index({ category: 1, 'visibility.isActive': 1, 'schedule.endDate': 1 });
dealSchema.index({ 'visibility.isFeatured': 1, 'visibility.isActive': 1 });
dealSchema.index({ tags: 1 });

module.exports = mongoose.model('Deal', dealSchema);