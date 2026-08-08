const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');

// @desc    Get all products with search, filters, sorting, pagination
// @route   GET /api/products
// @access  Public
// Query params supported:
//   keyword, category, brand, minPrice, maxPrice, minRating,
//   inStock (true/false), sort (price_asc|price_desc|newest|popularity|rating),
//   page, limit
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    sort,
    page = 1,
    limit = 12
  } = req.query;

  const query = {};

  if (keyword) {
    query.$text = { $search: keyword };
  }
  if (category) {
    query.category = { $in: category.split(',') };
  }
  if (brand) {
    query.brand = { $in: brand.split(',') };
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (minRating) {
    query.rating = { $gte: Number(minRating) };
  }
  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  let sortOption = { createdAt: -1 }; // default: newest
  switch (sort) {
    case 'price_asc':
      sortOption = { price: 1 };
      break;
    case 'price_desc':
      sortOption = { price: -1 };
      break;
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'popularity':
      sortOption = { salesCount: -1 };
      break;
    case 'rating':
      sortOption = { rating: -1 };
      break;
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    products,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total
  });
});

// @desc    Get distinct categories and brands (for filter sidebar)
// @route   GET /api/products/filters/meta
// @access  Public
const getFilterMeta = asyncHandler(async (req, res) => {
  const [categories, brands, priceStats] = await Promise.all([
    Product.distinct('category'),
    Product.distinct('brand'),
    Product.aggregate([
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ])
  ]);

  res.json({
    success: true,
    categories,
    brands,
    priceRange: priceStats[0] ? { min: priceStats[0].min, max: priceStats[0].max } : { min: 0, max: 0 }
  });
});

// @desc    Get search suggestions (lightweight, name-only) for autocomplete
// @route   GET /api/products/search/suggest?q=term
// @access  Public
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, suggestions: [] });
  }
  const suggestions = await Product.find({ name: { $regex: q, $options: 'i' } })
    .select('name slug images price')
    .limit(6);
  res.json({ success: true, suggestions });
});

// @desc    Get single product by id or slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const product = isObjectId
    ? await Product.findById(req.params.id).populate('reviews.user', 'name avatar')
    : await Product.findOne({ slug: req.params.id }).populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ success: true, product });
});

// @desc    Get products related to a given product (same category)
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id }
  }).limit(8);
  res.json({ success: true, products: related });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    brand,
    category,
    images,
    price,
    discount,
    stock,
    sku,
    features,
    specifications,
    featured,
    isNewArrival,
    isBestSeller
  } = req.body;

  if (!name || !description || !brand || !category || !price) {
    res.status(400);
    throw new Error('Name, description, brand, category and price are required');
  }
  if (!images || images.length === 0) {
    res.status(400);
    throw new Error('At least one product image URL is required');
  }

  const product = await Product.create({
    name,
    description,
    brand,
    category,
    images,
    price,
    discount: discount || 0,
    stock: stock || 0,
    sku,
    features: features || [],
    specifications: specifications || {},
    featured: !!featured,
    isNewArrival: !!isNewArrival,
    isBestSeller: !!isBestSeller
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const editableFields = [
    'name', 'description', 'brand', 'category', 'images', 'price', 'discount',
    'stock', 'sku', 'features', 'specifications', 'featured', 'isNewArrival', 'isBestSeller'
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  const updated = await product.save();
  res.json({ success: true, product: updated });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required');
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find((r) => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  });

  product.recalculateRating();
  await product.save();

  res.status(201).json({ success: true, message: 'Review added', reviews: product.reviews });
});

module.exports = {
  getProducts,
  getFilterMeta,
  getSearchSuggestions,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview
};
