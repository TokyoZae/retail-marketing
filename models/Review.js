const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  images: [String],
  verified: {
    type: Boolean,
    default: false
  },
  verificationData: {
    purchaseDate: Date,
    receiptNumber: String,
    staffMember: String
  },
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reported: {
    isReported: {
      type: Boolean,
      default: false
    },
    reports: [{
      reason: String,
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    reason: String
  }
}, {
  timestamps: true
});

// Static methods
reviewSchema.statics.getStoreReviews = function(storeId, options = {}) {
  const { page = 1, limit = 10, sort = 'newest', rating } = options;
  
  const query = {
    store: storeId,
    'moderation.status': 'approved'
  };
  
  if (rating) {
    query.rating = rating;
  }
  
  let sortOption = {};
  switch (sort) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'highest':
      sortOption = { rating: -1 };
      break;
    case 'lowest':
      sortOption = { rating: 1 };
      break;
    case 'helpful':
      sortOption = { 'helpful.count': -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }
  
  return this.find(query)
    .populate('customer', 'firstName lastName')
    .populate('deal', 'title')
    .sort(sortOption)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

reviewSchema.statics.getStoreRating = function(storeId) {
  return this.aggregate([
    {
      $match: {
        store: storeId,
        'moderation.status': 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        rating5: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 5] }
            }
          }
        },
        rating4: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 4] }
            }
          }
        },
        rating3: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 3] }
            }
          }
        },
        rating2: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 2] }
            }
          }
        },
        rating1: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 1] }
            }
          }
        }
      }
    }
  ]);
};

// Indexes
reviewSchema.index({ store: 1, 'moderation.status': 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ store: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);