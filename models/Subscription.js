const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['starter', 'professional', 'enterprise']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended', 'cancelled', 'pending'],
    default: 'pending'
  },
  billing: {
    cycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    nextBillingDate: Date,
    lastBillingDate: Date,
    failedPayments: {
      type: Number,
      default: 0
    }
  },
  payment: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripePaymentMethodId: String,
    cardLast4: String,
    cardBrand: String
  },
  features: {
    maxDeals: {
      type: Number,
      default: 5
    },
    maxImages: {
      type: Number,
      default: 10
    },
    analyticsAccess: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    dealsCreated: {
      type: Number,
      default: 0
    },
    dealsActive: {
      type: Number,
      default: 0
    },
    imagesUploaded: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  history: [{
    action: {
      type: String,
      enum: ['created', 'activated', 'cancelled', 'suspended', 'renewed', 'upgraded', 'downgraded']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Static methods
subscriptionSchema.statics.getActiveSubscriptions = function() {
  return this.find({ status: 'active' });
};

subscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  
  return this.find({
    status: 'active',
    'billing.nextBillingDate': { $lte: expirationDate }
  });
};

subscriptionSchema.methods.canCreateDeal = function() {
  return this.status === 'active' && this.usage.dealsActive < this.features.maxDeals;
};

subscriptionSchema.methods.incrementUsage = function(type, amount = 1) {
  if (type === 'deal') {
    this.usage.dealsCreated += amount;
    this.usage.dealsActive += amount;
  } else if (type === 'image') {
    this.usage.imagesUploaded += amount;
  }
  
  this.usage.lastUpdated = new Date();
  return this.save();
};

subscriptionSchema.methods.decrementUsage = function(type, amount = 1) {
  if (type === 'deal') {
    this.usage.dealsActive = Math.max(0, this.usage.dealsActive - amount);
  }
  
  this.usage.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);