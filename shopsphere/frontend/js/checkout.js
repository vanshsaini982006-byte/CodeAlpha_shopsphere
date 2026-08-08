let cartSummary = null;
let userAddresses = [];
let selectedAddressId = null;
let selectedPaymentMethod = 'razorpay';

async function initCheckout() {
  if (!Auth.requireAuth()) return;

  try {
    const [cartRes, profileRes] = await Promise.all([api.get('/cart'), api.get('/auth/profile')]);
    cartSummary = cartRes.cart;
    userAddresses = profileRes.user.addresses || [];

    if (!cartSummary.items || cartSummary.items.length === 0) {
      document.getElementById('checkoutContent').innerHTML = `<div class="empty-state">
        <div class="icon-circle-lg"><i class="fas fa-cart-shopping"></i></div>
        <h3>Your cart is empty</h3>
        <p>Add items to your cart before checking out.</p>
        <a href="products.html" class="btn btn-primary">Browse Products</a>
      </div>`;
      return;
    }

    renderCheckout();
  } catch (err) {
    document.getElementById('checkoutContent').innerHTML = `<p>${apiErrorMessage(err)}</p>`;
  }
}

function renderCheckout() {
  const tpl = document.getElementById('checkoutTemplate').content.cloneNode(true);
  const content = document.getElementById('checkoutContent');
  content.innerHTML = '';
  content.appendChild(tpl);

  renderSavedAddresses();
  renderOrderSummary();

  document.getElementById('addAddressBtn').addEventListener('click', () => {
    document.getElementById('newAddressForm').style.display = 'block';
  });

  document.getElementById('saveAddressBtn').addEventListener('click', async () => {
    const payload = {
      label: 'Address',
      street: document.getElementById('addrStreet').value.trim(),
      city: document.getElementById('addrCity').value.trim(),
      state: document.getElementById('addrState').value.trim(),
      postalCode: document.getElementById('addrPostal').value.trim(),
      country: document.getElementById('addrCountry').value.trim() || 'India'
    };
    const fullName = document.getElementById('addrFullName').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();
    if (!fullName || !phone || !payload.street || !payload.city || !payload.state || !payload.postalCode) {
      showToast('Please fill in all address fields', 'error');
      return;
    }
    try {
      const res = await api.post('/auth/address', payload);
      userAddresses = res.addresses;
      // Stash name/phone alongside for order snapshot since User.address doesn't store per-address name
      const newAddr = userAddresses[userAddresses.length - 1];
      newAddr._fullName = fullName;
      newAddr._phone = phone;
      selectedAddressId = newAddr._id;
      document.getElementById('newAddressForm').style.display = 'none';
      renderSavedAddresses();
      showToast('Address saved', 'success');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });

  document.getElementById('toStep2Btn').addEventListener('click', () => goToStep(2));
  document.getElementById('backToStep1Btn').addEventListener('click', () => goToStep(1));

  document.querySelectorAll('.payment-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      selectedPaymentMethod = opt.dataset.method;
    });
  });

  document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

function renderSavedAddresses() {
  const box = document.getElementById('savedAddresses');
  if (userAddresses.length === 0) {
    box.innerHTML = `<p style="color:var(--text-muted);font-size:0.88rem;">No saved addresses yet. Add one below.</p>`;
    return;
  }
  if (!selectedAddressId) selectedAddressId = userAddresses.find((a) => a.isDefault)?._id || userAddresses[0]._id;

  box.innerHTML = userAddresses
    .map(
      (a) => `<div class="address-option ${a._id === selectedAddressId ? 'selected' : ''}" data-addr-id="${a._id}">
        <strong>${escapeHtml(a._fullName || Auth.getUser().name)}</strong> ${a.isDefault ? '<span class="badge badge-success">Default</span>' : ''}
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${escapeHtml(a.street)}, ${escapeHtml(a.city)}, ${escapeHtml(a.state)} - ${escapeHtml(a.postalCode)}, ${escapeHtml(a.country)}</p>
      </div>`
    )
    .join('');

  box.querySelectorAll('[data-addr-id]').forEach((el) =>
    el.addEventListener('click', () => {
      selectedAddressId = el.dataset.addrId;
      box.querySelectorAll('.address-option').forEach((o) => o.classList.remove('selected'));
      el.classList.add('selected');
      document.getElementById('toStep2Btn').disabled = false;
    })
  );

  document.getElementById('toStep2Btn').disabled = !selectedAddressId;
}

function renderOrderSummary() {
  document.getElementById('checkoutItemsList').innerHTML = cartSummary.items
    .map((item) => {
      const p = item.product;
      const finalPrice = +(p.price - (p.price * p.discount) / 100).toFixed(2);
      return `<div class="order-item-row">
        <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" />
        <div style="flex:1;">
          <div style="font-size:0.88rem;font-weight:600;">${escapeHtml(p.name)}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Qty: ${item.quantity}</div>
        </div>
        <div style="font-size:0.88rem;font-weight:600;">${formatPrice(finalPrice * item.quantity)}</div>
      </div>`;
    })
    .join('');

  document.getElementById('sumSubtotal').textContent = formatPrice(cartSummary.subtotal);
  if (cartSummary.discountAmount > 0) {
    document.getElementById('sumDiscountRow').style.display = 'flex';
    document.getElementById('sumDiscount').textContent = `−${formatPrice(cartSummary.discountAmount)}`;
  }
  document.getElementById('sumShipping').textContent = cartSummary.shipping === 0 ? 'FREE' : formatPrice(cartSummary.shipping);
  document.getElementById('sumTax').textContent = formatPrice(cartSummary.tax);
  document.getElementById('sumTotal').textContent = formatPrice(cartSummary.total);
}

function goToStep(step) {
  document.getElementById('addressStep').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('paymentStep').style.display = step === 2 ? 'block' : 'none';
  ['step1Tab', 'step2Tab', 'step3Tab'].forEach((id, idx) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (idx + 1 === step) el.classList.add('active');
    else if (idx + 1 < step) el.classList.add('done');
  });
}

function buildAddressPayload() {
  const addr = userAddresses.find((a) => a._id === selectedAddressId);
  return {
    fullName: addr._fullName || Auth.getUser().name,
    phone: addr._phone || Auth.getUser().phone || 'N/A',
    street: addr.street,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country
  };
}

async function placeOrder() {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const shippingAddress = buildAddressPayload();
  const billingAddress = shippingAddress; // same address used for both, kept simple for this flow

  try {
    if (selectedPaymentMethod === 'cod') {
      const { order } = await api.post('/orders', { shippingAddress, billingAddress, paymentMethod: 'cod' });
      showConfirmation(order);
      return;
    }

    // Razorpay flow
    const payRes = await api.post('/orders/create-payment', {});
    const options = {
      key: payRes.keyId,
      amount: payRes.amount,
      currency: payRes.currency,
      name: 'ShopSphere',
      description: 'Order Payment',
      order_id: payRes.razorpayOrderId,
      handler: async function (response) {
        try {
          const { order } = await api.post('/orders', {
            shippingAddress,
            billingAddress,
            paymentMethod: 'razorpay',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          showConfirmation(order);
        } catch (err) {
          showToast(apiErrorMessage(err), 'error');
          btn.disabled = false;
          btn.textContent = 'Place Order';
        }
      },
      modal: {
        ondismiss: function () {
          btn.disabled = false;
          btn.textContent = 'Place Order';
        }
      },
      prefill: {
        name: Auth.getUser().name,
        email: Auth.getUser().email
      },
      theme: { color: '#2563EB' }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    showToast(apiErrorMessage(err), 'error');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

function showConfirmation(order) {
  document.getElementById('addressStep').style.display = 'none';
  document.getElementById('paymentStep').style.display = 'none';
  document.getElementById('confirmStep').style.display = 'block';
  document.getElementById('confirmOrderNumber').textContent = order.orderNumber;
  goToStep(3);
  refreshBadgeCounts();
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('checkout');
  renderFooter();
  initCheckout();
});
