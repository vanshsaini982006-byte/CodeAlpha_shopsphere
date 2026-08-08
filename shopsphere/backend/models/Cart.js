const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
  },
  { _id: true, timestamps: true }
);

// One cart document per user, holding an array of items.
// This keeps cart reads/writes to a single document instead of N rows.
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema],
    couponCode: { type: String, default: null },
    couponDiscountPercent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
