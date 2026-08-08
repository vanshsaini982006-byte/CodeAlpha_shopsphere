const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);
// Run with: npm run seed          -> populates the database
//           npm run seed:destroy  -> wipes products/users/orders (keeps nothing)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');

const sampleProducts = [
  {
    name: 'Wireless Noise Cancelling Headphones',
    description:
      'Over-ear wireless headphones with active noise cancellation, 30-hour battery life, and plush memory-foam ear cushions for all-day comfort.',
    brand: 'SoundCore',
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'
    ],
    price: 4999,
    discount: 20,
    stock: 45,
    sku: 'ELEC-HP-001',
    features: ['Active Noise Cancellation', '30-hour battery', 'Bluetooth 5.3', 'Foldable design'],
    specifications: { Weight: '250g', Connectivity: 'Bluetooth 5.3', Warranty: '1 Year' },
    featured: true,
    isBestSeller: true
  },
  {
    name: 'Smart Fitness Watch',
    description:
      'Track heart rate, sleep, SpO2, and 100+ workout modes with this AMOLED smartwatch. 7-day battery life and full smartphone notifications.',
    brand: 'FitPro',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
    price: 2999,
    discount: 15,
    stock: 60,
    sku: 'ELEC-WT-002',
    features: ['AMOLED Display', 'SpO2 Monitor', '100+ Sports Modes', '7-day battery'],
    specifications: { 'Display': '1.4" AMOLED', 'Water Resistance': '5 ATM' },
    featured: true,
    isNewArrival: true
  },
  {
    name: "Men's Running Shoes",
    description:
      'Lightweight breathable mesh running shoes with responsive cushioning, designed for daily training and long-distance runs.',
    brand: 'StrideX',
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
    price: 1899,
    discount: 10,
    stock: 80,
    sku: 'FASH-SH-003',
    features: ['Breathable mesh upper', 'Responsive foam midsole', 'Durable rubber outsole'],
    specifications: { Material: 'Mesh + EVA', 'Sole': 'Rubber' },
    isBestSeller: true
  },
  {
    name: "Women's Cotton Kurti",
    description:
      'Comfortable everyday cotton kurti with traditional block print, perfect for casual and semi-formal occasions.',
    brand: 'IndiWeave',
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
    price: 799,
    discount: 5,
    stock: 120,
    sku: 'FASH-KR-004',
    features: ['100% Cotton', 'Block Print', 'Machine Washable'],
    specifications: { Fabric: 'Cotton', Fit: 'Regular' },
    isNewArrival: true
  },
  {
    name: 'Stainless Steel Cookware Set (5 Pcs)',
    description:
      'Induction-friendly 5-piece stainless steel cookware set including kadai, saucepan, and tawa with heat-resistant handles.',
    brand: 'HomeChef',
    category: 'Home & Kitchen',
    images: ['https://images.unsplash.com/photo-1588279102658-4230e1c4fb1e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHN0YWlubGVzcyUyMHN0ZWVsJTIwY29va3dhcmUlMjBzZXQlMjA1fGVufDB8fDB8fHww'],
    price: 3499,
    discount: 25,
    stock: 30,
    sku: 'HOME-CK-005',
    features: ['Induction Compatible', '5-piece set', 'Heat-resistant handles'],
    specifications: { Material: 'Stainless Steel', Pieces: '5' },
    featured: true
  },
  {
    name: 'LED Smart Bulb (Pack of 2)',
    description:
      'WiFi-enabled smart LED bulbs with 16 million colors, voice control support, and scheduling via companion app.',
    brand: 'GlowTech',
    category: 'Home & Kitchen',
    images: ['https://images.unsplash.com/photo-1550985616-10810253b84d?w=800'],
    price: 899,
    discount: 10,
    stock: 100,
    sku: 'HOME-LB-006',
    features: ['16M Colors', 'Voice Control', 'App Scheduling', 'WiFi Enabled'],
    specifications: { Wattage: '9W', Base: 'B22' },
    isNewArrival: true
  },
  {
    name: 'Yoga Mat with Carry Strap',
    description:
      'Extra-thick 6mm non-slip yoga mat made from eco-friendly TPE material, includes carry strap for easy transport.',
    brand: 'ZenFit',
    category: 'Sports & Fitness',
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800'],
    price: 649,
    discount: 0,
    stock: 90,
    sku: 'SPRT-YM-007',
    features: ['6mm Thickness', 'Non-slip surface', 'Eco-friendly TPE'],
    specifications: { Material: 'TPE', Size: '183 x 61 cm' }
  },
  {
    name: 'Adjustable Dumbbell Set (20kg)',
    description:
      'Space-saving adjustable dumbbell set with quick-lock weight plates, adjustable from 2.5kg to 20kg per hand.',
    brand: 'PowerFit',
    category: 'Sports & Fitness',
    images: ['https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800'],
    price: 5499,
    discount: 18,
    stock: 25,
    sku: 'SPRT-DB-008',
    features: ['Quick-lock system', '2.5kg-20kg adjustable', 'Space-saving design'],
    specifications: { 'Max Weight': '20kg per hand', Material: 'Cast Iron + Rubber' },
    isBestSeller: true,
    featured: true
  },
  {
    name: 'Bestselling Fiction Novel Bundle (3 Books)',
    description:
      'A curated bundle of 3 award-winning contemporary fiction novels, perfect for book lovers and gifting.',
    brand: 'PageTurner',
    category: 'Books',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'],
    price: 1299,
    discount: 12,
    stock: 55,
    sku: 'BOOK-FB-009',
    features: ['3-book bundle', 'Award-winning authors', 'Paperback edition'],
    specifications: { Format: 'Paperback', Language: 'English' }
  },
  {
    name: 'Ergonomic Office Chair',
    description:
      'High-back mesh office chair with lumbar support, adjustable armrests, and tilt-lock mechanism for all-day comfort.',
    brand: 'ComfortSeating',
    category: 'Furniture',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
    price: 7999,
    discount: 22,
    stock: 20,
    sku: 'FURN-CH-010',
    features: ['Lumbar Support', 'Adjustable Armrests', 'Tilt-lock Mechanism', 'Breathable Mesh'],
    specifications: { 'Max Weight': '120kg', Material: 'Mesh + Metal Frame' },
    featured: true,
    isNewArrival: true
  },
  {
    name: '65W USB-C Fast Charger',
    description:
      'GaN-based 65W USB-C charger with dual-port output, compatible with laptops, tablets, and smartphones.',
    brand: 'ChargeFast',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800'],
    price: 1499,
    discount: 8,
    stock: 70,
    sku: 'ELEC-CH-011',
    features: ['65W Output', 'GaN Technology', 'Dual USB-C Ports', 'Universal Compatibility'],
    specifications: { Output: '65W', Ports: '2x USB-C' },
    isBestSeller: true
  },
  {
    name: 'Leather Laptop Backpack',
    description:
      'Water-resistant vegan-leather backpack with padded 15.6" laptop compartment, USB charging port, and anti-theft zipper.',
    brand: 'UrbanCarry',
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
    price: 2199,
    discount: 15,
    stock: 40,
    sku: 'FASH-BP-012',
    features: ['Fits 15.6" Laptop', 'USB Charging Port', 'Water Resistant', 'Anti-theft Zippers'],
    specifications: { Material: 'Vegan Leather', Capacity: '25L' },
    isNewArrival: true
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Cart.deleteMany(),
      Wishlist.deleteMany(),
      Order.deleteMany()
    ]);
    console.log('Existing data cleared.');

    // Create admin user
    const admin = await User.create({
      name: 'ShopSphere Admin',
      email: process.env.ADMIN_EMAIL || 'admin@shopsphere.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      phone: '9999999999'
    });
    await Cart.create({ user: admin._id, items: [] });
    await Wishlist.create({ user: admin._id, products: [] });
    console.log(`Admin user created: ${admin.email}`);

    // Create a demo regular user
    const demoUser = await User.create({
      name: 'Demo Customer',
      email: 'demo@shopsphere.com',
      password: 'Demo@123456',
      role: 'user',
      phone: '9876543210'
    });
    await Cart.create({ user: demoUser._id, items: [] });
    await Wishlist.create({ user: demoUser._id, products: [] });
    console.log(`Demo user created: ${demoUser.email}`);

    // Insert products one at a time so the pre-save slug hook runs for each
    for (const productData of sampleProducts) {
      await Product.create(productData);
    }
    console.log(`${sampleProducts.length} products seeded.`);

    console.log('\n✅ Seed complete!\n');
    console.log('Admin login  -> email: ' + admin.email + ' | password: ' + (process.env.ADMIN_PASSWORD || 'Admin@123456'));
    console.log('Demo login   -> email: demo@shopsphere.com | password: Demo@123456');

    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Cart.deleteMany(),
      Wishlist.deleteMany(),
      Order.deleteMany()
    ]);
    console.log('All data destroyed.');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  seedDatabase();
}
