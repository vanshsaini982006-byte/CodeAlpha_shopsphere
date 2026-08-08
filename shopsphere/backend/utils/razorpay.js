const Razorpay = require('razorpay');
const crypto = require('crypto');

// Single shared Razorpay instance, configured from environment variables.
// Keys are read lazily inside functions (not at module load) so that a
// missing .env doesn't crash the whole server at require-time.
const getInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured in .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

/**
 * Creates a Razorpay order. Amount must be passed in the smallest currency
 * unit (paise for INR), so multiply rupee amounts by 100 before calling.
 */
const createRazorpayOrder = async (amountInRupees, receiptId) => {
  const instance = getInstance();
  const options = {
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
    receipt: receiptId
  };
  return instance.orders.create(options);
};

/**
 * Verifies the signature Razorpay sends back after checkout completes,
 * to confirm the payment wasn't tampered with client-side.
 */
const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return generatedSignature === razorpay_signature;
};

module.exports = { createRazorpayOrder, verifyRazorpaySignature };
