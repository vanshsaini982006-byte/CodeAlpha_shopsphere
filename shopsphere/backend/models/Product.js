const mongoose = require('mongoose');
const slugify = require('slugify');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 150
    },
    slug: {
      type: String,
      unique: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 3000
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one product image is required'
      }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number, // percentage, e.g. 20 = 20% off
      default: 0,
      min: 0,
      max: 90
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sku: {
      type: String,
      unique: true,
      sparse: true
    },
    features: {
      type: [String],
      default: []
    },
    specifications: {
      type: Map,
      of: String,
      default: {}
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    salesCount: {
      type: Number,
      default: 0 // incremented whenever an order is placed - powers "Popularity" sort
    }
  },
  { timestamps: true }
);

// Virtual: final price after discount
productSchema.virtual('finalPrice').get(function () {
  return +(this.price - (this.price * this.discount) / 100).toFixed(2);
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Auto-generate a unique slug from the name before saving
productSchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  let baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  // Ensure uniqueness by appending a counter if needed
  while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  this.slug = slug;
  next();
});

// Recalculate rating average whenever reviews array changes
productSchema.methods.recalculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating = +(total / this.reviews.length).toFixed(1);
  this.numReviews = this.reviews.length;
};

// Text index to support real-time search across name, brand, category, description
productSchema.index({ name: 'text', brand: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
