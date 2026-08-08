async function loadCart() {
  if (!Auth.requireAuth()) return;
  try {
    const { cart } = await api.get('/cart');
    renderCart(cart);
  } catch (err) {
    document.getElementById('cartContent').innerHTML = `<p>${apiErrorMessage(err)}</p>`;
  }
}

function renderCart(cart) {
  const container = document.getElementById('cartContent');

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="icon-circle-lg"><i class="fas fa-cart-shopping"></i></div>
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added anything yet.</p>
      <a href="products.html" class="btn btn-primary">Continue Shopping</a>
    </div>`;
    return;
  }

  const itemsHtml = cart.items
    .map((item) => {
      const p = item.product;
      const finalPrice = +(p.price - (p.price * p.discount) / 100).toFixed(2);
      return `<div class="cart-item" data-item-id="${item._id}">
        <a href="product-detail.html?id=${p.slug}"><img src="${p.images[0]}" alt="${escapeHtml(p.name)}" /></a>
        <div>
          <div class="cart-item-brand">${escapeHtml(p.brand)}</div>
          <a href="product-detail.html?id=${p.slug}" class="cart-item-name">${escapeHtml(p.name)}</a>
          <div class="cart-item-controls">
            <div class="qty-selector">
              <button type="button" data-decrement="${item._id}">−</button>
              <input type="text" value="${item.quantity}" readonly />
              <button type="button" data-increment="${item._id}">+</button>
            </div>
            <button class="btn-ghost btn-sm" data-remove="${item._id}"><i class="fas fa-trash"></i> Remove</button>
          </div>
        </div>
        <div class="cart-item-price">
          <div class="price-current">${formatPrice(finalPrice * item.quantity)}</div>
          ${p.discount > 0 ? `<div class="price-original">${formatPrice(p.price * item.quantity)}</div>` : ''}
        </div>
      </div>`;
    })
    .join('');

  container.innerHTML = `
    <div class="cart-layout">
      <div class="card">
        <div class="flex justify-between items-center mb-2">
          <span style="color:var(--text-secondary);font-size:0.9rem;">${cart.items.length} item(s)</span>
          <a href="products.html" class="btn-ghost btn-sm">← Continue shopping</a>
        </div>
        ${itemsHtml}
      </div>
      <div class="card">
        <h3 class="mb-2">Order Summary</h3>
        <div class="coupon-row">
          <input type="text" id="couponInput" placeholder="Coupon code" value="${cart.couponCode || ''}" ${cart.couponCode ? 'disabled' : ''} />
          ${cart.couponCode
            ? `<button class="btn btn-outline btn-sm" id="removeCouponBtn">Remove</button>`
            : `<button class="btn btn-outline btn-sm" id="applyCouponBtn">Apply</button>`}
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:-10px;margin-bottom:14px;">Try WELCOME10, SAVE20 or FLAT15</p>
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(cart.subtotal)}</span></div>
        ${cart.discountAmount > 0 ? `<div class="summary-row"><span>Discount (${cart.couponCode})</span><span style="color:var(--color-success)">−${formatPrice(cart.discountAmount)}</span></div>` : ''}
        <div class="summary-row"><span>Shipping</span><span>${cart.shipping === 0 ? 'FREE' : formatPrice(cart.shipping)}</span></div>
        <div class="summary-row"><span>Tax (GST 5%)</span><span>${formatPrice(cart.tax)}</span></div>
        <div class="summary-row total"><span>Grand Total</span><span>${formatPrice(cart.total)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block mt-2">Proceed to Checkout <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
  `;

  bindCartEvents();
}

function bindCartEvents() {
  document.querySelectorAll('[data-increment]').forEach((btn) =>
    btn.addEventListener('click', () => updateQty(btn.dataset.increment, 1))
  );
  document.querySelectorAll('[data-decrement]').forEach((btn) =>
    btn.addEventListener('click', () => updateQty(btn.dataset.decrement, -1))
  );
  document.querySelectorAll('[data-remove]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        const { cart } = await api.delete(`/cart/${btn.dataset.remove}`);
        renderCart(cart);
        refreshBadgeCounts();
        showToast('Item removed', 'info');
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
  document.getElementById('applyCouponBtn')?.addEventListener('click', async () => {
    const code = document.getElementById('couponInput').value.trim();
    if (!code) return;
    try {
      const { cart } = await api.post('/cart/coupon', { code });
      renderCart(cart);
      showToast('Coupon applied!', 'success');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });
  document.getElementById('removeCouponBtn')?.addEventListener('click', async () => {
    try {
      const { cart } = await api.delete('/cart/coupon');
      renderCart(cart);
      showToast('Coupon removed', 'info');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });
}

async function updateQty(itemId, delta) {
  const row = document.querySelector(`[data-item-id="${itemId}"]`);
  const input = row.querySelector('.qty-selector input');
  const newQty = Number(input.value) + delta;
  if (newQty < 1) return;
  try {
    const { cart } = await api.put(`/cart/${itemId}`, { quantity: newQty });
    renderCart(cart);
    refreshBadgeCounts();
  } catch (err) {
    showToast(apiErrorMessage(err), 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('cart');
  renderFooter();
  loadCart();
});
