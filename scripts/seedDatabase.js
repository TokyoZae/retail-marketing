const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Store = require('../models/Store');
const Deal = require('../models/Deal');
const Subscription = require('../models/Subscription');

// Sample data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Customer',
    email: 'customer@example.com',
    password: 'Customer123',
    role: 'customer',
    phone: '+1234567890'
  },
  {
    firstName: 'Jane',
    lastName: 'Owner',
    email: 'owner@example.com',
    password: 'Owner123',
    role: 'store_owner',
    phone: '+1234567891'
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'Admin123',
    role: 'admin',
    phone: '+1234567892'
  }
];

const sampleStores = [
  {
    name: "Bella's Boutique",
    description: "Trendy women's fashion boutique offering the latest styles and personalized service.",
    category: "clothing",
    contact: {
      email: "info@bellasboutique.com",
      phone: "(555) 123-4567"
    },
    address: {
      street: "123 Fashion Ave",
      city: "Downtown",
      state: "NY",
      zipCode: "10001",
      coordinates: {
        lat: 40.7589,
        lng: -73.9851
      }
    },
    hours: {
      mon: "10AM-8PM",
      tue: "10AM-8PM",
      wed: "10AM-8PM",
      thu: "10AM-8PM",
      fri: "10AM-8PM",
      sat: "10AM-8PM",
      sun: "12PM-6PM"
    },
    features: ["Personal Styling", "Alterations", "Gift Wrapping", "Loyalty Program"],
    rating: {
      average: 4.8,
      count: 127
    }
  },
  {
    name: "TechHub Electronics",
    description: "Your local source for the latest gadgets, computers, and tech accessories.",
    category: "electronics",
    contact: {
      email: "support@techhub.com",
      phone: "(555) 234-5678"
    },
    address: {
      street: "456 Tech Street",
      city: "Midtown",
      state: "NY",
      zipCode: "10002",
      coordinates: {
        lat: 40.7614,
        lng: -73.9776
      }
    },
    hours: {
      mon: "9AM-9PM",
      tue: "9AM-9PM",
      wed: "9AM-9PM",
      thu: "9AM-9PM",
      fri: "9AM-9PM",
      sat: "9AM-9PM",
      sun: "11AM-7PM"
    },
    features: ["Tech Support", "Warranty Service", "Trade-ins", "Financing"],
    rating: {
      average: 4.6,
      count: 89
    }
  },
  {
    name: "Fresh Market Grocery",
    description: "Organic and locally-sourced groceries with a focus on fresh, healthy options.",
    category: "grocery",
    contact: {
      email: "hello@freshmarket.com",
      phone: "(555) 345-6789"
    },
    address: {
      street: "789 Market Blvd",
      city: "Westside",
      state: "NY",
      zipCode: "10003",
      coordinates: {
        lat: 40.7505,
        lng: -73.9934
      }
    },
    hours: {
      mon: "7AM-10PM",
      tue: "7AM-10PM",
      wed: "7AM-10PM",
      thu: "7AM-10PM",
      fri: "7AM-10PM",
      sat: "7AM-10PM",
      sun: "7AM-10PM"
    },
    features: ["Organic Products", "Local Sourcing", "Delivery", "Bulk Discounts"],
    rating: {
      average: 4.9,
      count: 203
    }
  },
  {
    name: "Glow Beauty Supply",
    description: "Premium beauty and cosmetics store featuring top brands and expert advice.",
    category: "beauty",
    contact: {
      email: "contact@glowbeauty.com",
      phone: "(555) 456-7890"
    },
    address: {
      street: "321 Beauty Lane",
      city: "Uptown",
      state: "NY",
      zipCode: "10004",
      coordinates: {
        lat: 40.7736,
        lng: -73.9566
      }
    },
    hours: {
      mon: "10AM-8PM",
      tue: "10AM-8PM",
      wed: "10AM-8PM",
      thu: "10AM-8PM",
      fri: "10AM-8PM",
      sat: "10AM-8PM",
      sun: "11AM-6PM"
    },
    features: ["Makeup Tutorials", "Skin Consultations", "Gift Sets", "Loyalty Points"],
    rating: {
      average: 4.7,
      count: 156
    }
  }
];

const sampleDeals = [
  {
    title: "Summer Dress Collection - 30% Off",
    description: "Stunning summer dresses perfect for any occasion. Limited time offer on our most popular styles.",
    category: "clothing",
    type: "percentage",
    discount: { percentage: 30 },
    pricing: {
      originalPrice: 70,
      salePrice: 49
    },
    schedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    images: {
      main: "resources/deal-fashion.jpg"
    },
    tags: ["summer", "dresses", "women", "sale"]
  },
  {
    title: "Wireless Headphones - Flash Sale",
    description: "Premium wireless headphones with noise cancellation. Limited quantity available.",
    category: "electronics",
    type: "fixed",
    discount: { fixedAmount: 50 },
    pricing: {
      originalPrice: 129,
      salePrice: 79
    },
    schedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    images: {
      main: "resources/deal-tech.jpg"
    },
    tags: ["headphones", "wireless", "audio", "flash-sale"]
  },
  {
    title: "Organic Produce - Buy One Get One",
    description: "Fresh organic fruits and vegetables. Support local farmers while saving money.",
    category: "grocery",
    type: "bogo",
    discount: { buyQuantity: 1, getQuantity: 1 },
    pricing: {
      originalPrice: 25,
      salePrice: 12.5
    },
    schedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    images: {
      main: "resources/deal-grocery.jpg"
    },
    tags: ["organic", "produce", "healthy", "bogo"]
  },
  {
    title: "Luxury Skincare Sets - 25% Off",
    description: "Premium skincare collections from top brands. Perfect for gifting or treating yourself.",
    category: "beauty",
    type: "percentage",
    discount: { percentage: 25 },
    pricing: {
      originalPrice: 119,
      salePrice: 89
    },
    schedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    },
    images: {
      main: "resources/deal-cosmetics.jpg"
    },
    tags: ["skincare", "luxury", "beauty", "gift"]
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localdeals', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Store.deleteMany({});
    await Deal.deleteMany({});
    await Subscription.deleteMany({});
    
    console.log('Existing data cleared');
    
    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.email}`);
    }
    
    // Create stores
    console.log('Creating stores...');
    const createdStores = [];
    for (let i = 0; i < sampleStores.length; i++) {
      const storeData = sampleStores[i];
      const store = new Store({
        ...storeData,
        owner: createdUsers[1]._id, // Jane Owner owns all stores
        'settings.isVerified': true,
        'settings.isActive': true
      });
      await store.save();
      createdStores.push(store);
      console.log(`Created store: ${store.name}`);
    }
    
    // Create subscriptions
    console.log('Creating subscriptions...');
    for (const store of createdStores) {
      const subscription = new Subscription({
        store: store._id,
        plan: 'professional',
        status: 'active',
        billing: {
          cycle: 'monthly',
          amount: 20,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        features: {
          maxDeals: 20,
          maxImages: 50,
          analyticsAccess: true,
          prioritySupport: true
        }
      });
      await subscription.save();
      console.log(`Created subscription for ${store.name}`);
    }
    
    // Create deals
    console.log('Creating deals...');
    for (let i = 0; i < sampleDeals.length && i < createdStores.length; i++) {
      const dealData = sampleDeals[i];
      const deal = new Deal({
        ...dealData,
        store: createdStores[i]._id,
        'visibility.isApproved': true,
        'visibility.isActive': true
      });
      await deal.save();
      console.log(`Created deal: ${deal.title}`);
    }
    
    console.log('Database seeded successfully!');
    console.log('\nSample Login Credentials:');
    console.log('Customer: customer@example.com / Customer123');
    console.log('Store Owner: owner@example.com / Owner123');
    console.log('Admin: admin@example.com / Admin123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run seed function
seedDatabase();