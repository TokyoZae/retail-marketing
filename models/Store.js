const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['clothing', 'electronics', 'beauty', 'convenience', 'shoes', 'grocery', 'accessories', 'books', 'home', 'sports', 'other']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    website: String,
    social: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'USA'
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  hours: {
    mon: { type: String, default: 'Closed' },
    tue: { type: String, default: 'Closed' },
    wed: { type: String, default: 'Closed' },
    thu: { type: String, default: 'Closed' },
    fri: { type: String, default: 'Closed' },
    sat: { type: String, default: 'Closed' },
    sun: { type: String, default: 'Closed' }
  },
  images: {
    logo: String,
    cover: String,
    gallery: [String]
  },
  features: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeSubscriptionId: String
  },
  settings: {
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    autoApproveDeals: {
      type: Boolean,
      default: false
    },
    notificationPreferences: {
      newDeal: { type: Boolean, default: true },
      lowEngagement: { type: Boolean, default: true },
      subscriptionRenewal: { type: Boolean, default: true }
    }
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    totalDeals: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Virtual for current status
storeSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  
  const todayHours = this.hours[currentDay];
  if (todayHours === 'Closed') return 'closed';
  
  const [openTime, closeTime] = todayHours.split('-');
  const [openHour] = openTime.replace(/AM|PM/, '').split(':').map(Number);
  const [closeHour] = closeTime.replace(/AM|PM/, '').split(':').map(Number);
  
  const openAmPm = openTime.includes('AM') ? 'AM' : 'PM';
  const closeAmPm = closeTime.includes('AM') ? 'AM' : 'PM';
  
  let open24 = openHour + (openAmPm === 'PM' && openHour !== 12 ? 12 : 0);
  let close24 = closeHour + (closeAmPm === 'PM' && closeHour !== 12 ? 12 : 0);
  
  if (currentHour >= open24 && currentHour < close24) {
    return 'open';
  }
  
  return 'closed';
});

// Index for geospatial queries
storeSchema.index({ coordinates: '2dsphere' });

// Index for text search
storeSchema.index({
  name: 'text',
  description: 'text',
  'address.city': 'text'
});

module.exports = mongoose.model('Store', storeSchema);