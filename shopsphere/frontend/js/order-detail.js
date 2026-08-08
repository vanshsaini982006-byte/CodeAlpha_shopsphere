const STATUS_STEPS = ['placed', 'processing', 'shipped', 'delivered'];

async function loadOrderDetail() {
  if (!Auth.requireAuth()) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    window.location.href = 'orders.html';
    return;
  }
  try {
    const { order } = await api.get(`/orders/${id}`);
    renderOrderDetail(order);
  } catch (err) {
    document.getElementById('orderDetailContent').innerHTML = `<div class="empty-state"><h3>Order not found</h3><p>${apiErrorMessage(err)}</p><a href="orders.html" class="btn btn-primary">Back to Orders</a></div>`;
  }
}

function renderOrderDetail(o) {
  const isCancelled = o.orderStatus === 'cancelled';
  const currentStepIdx = STATUS_STEPS.indexOf(o.orderStatus);

  const timelineHtml = isCancelled
    ? `<div class="card mt-2 mb-3" style="border-color:var(--color-danger);background:#FEF2F2;">
        <strong style="color:var(--color-danger);"><i class="fas fa-circle-xmark"></i> Order Cancelled</strong>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${escapeHtml(o.cancelReason || 'This order was cancelled.')}</p>
      </div>`
    : `<div class="timeline">
        ${STATUS_STEPS.map(
          (s, i) => `<div class="timeline-step ${i <= currentStepIdx ? 'done' : ''}">
            <div class="timeline-dot">${i <= currentStepIdx ? '<i class="fas fa-check"></i>' : i + 1}</div>
            <span>${s.charAt(0).toUpperCase() + s.slice(1)}</span>
          </div>`
        ).join('')}
      </div>`;

  const canCancel = ['placed', 'processing'].includes(o.orderStatus);

  document.getElementById('orderDetailContent').innerHTML = `
    <nav class="breadcrumb no-print"><a href="orders.html">My Orders</a> <i class="fas fa-chevron-right" style="font-size:10px"></i> <span>${o.orderNumber}</span></nav>

    <div class="card">
      <div class="flex justify-between items-center mb-2" style="flex-wrap:wrap;gap:10px;">
        <div>
          <h2 style="font-size:1.3rem;">${o.orderNumber}</h2>
          <span style="font-size:0.82rem;color:var(--text-muted)">Placed on ${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <span class="status-badge status-${o.orderStatus}">${o.orderStatus}</span>
      </div>

      ${timelineHtml}

      <h3 class="mb-2 mt-3">Items</h3>
      ${o.items
        .map(
          (item) => `<div class="order-item-row">
            <img src="${item.image}" alt="${escapeHtml(item.name)}" />
            <div style="flex:1;">
              <div style="font-size:0.9rem;font-weight:600;">${escapeHtml(item.name)}</div>
              <div style="font-size:0.78rem;color:var(--text-muted)">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
            </div>
            <div style="font-weight:600;">${formatPrice(item.price * item.quantity)}</div>
          </div>`
        )
        .join('')}

      <div class="mt-3" style="padding-top:16px;border-top:1px solid var(--border-color);">
        <div class="summary-row"><span>Items Total</span><span>${formatPrice(o.itemsPrice)}</span></div>
        ${o.discountAmount > 0 ? `<div class="summary-row"><span>Discount ${o.couponCode ? `(${o.couponCode})` : ''}</span><span>−${formatPrice(o.discountAmount)}</span></div>` : ''}
        <div class="summary-row"><span>Shipping</span><span>${o.shippingPrice === 0 ? 'FREE' : formatPrice(o.shippingPrice)}</span></div>
        <div class="summary-row"><span>Tax</span><span>${formatPrice(o.taxPrice)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(o.totalPrice)}</span></div>
      </div>

      <div class="form-row mt-3">
        <div>
          <h4 style="font-size:0.9rem;margin-bottom:8px;">Shipping Address</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">
            ${escapeHtml(o.shippingAddress.fullName)}<br/>
            ${escapeHtml(o.shippingAddress.street)}<br/>
            ${escapeHtml(o.shippingAddress.city)}, ${escapeHtml(o.shippingAddress.state)} - ${escapeHtml(o.shippingAddress.postalCode)}<br/>
            ${escapeHtml(o.shippingAddress.country)} | ${escapeHtml(o.shippingAddress.phone)}
          </p>
        </div>
        <div>
          <h4 style="font-size:0.9rem;margin-bottom:8px;">Payment</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary);">
            Method: ${o.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}<br/>
            Status: <strong style="text-transform:capitalize;">${o.paymentStatus}</strong>
          </p>
        </div>
      </div>

      <div class="flex gap-2 mt-3 no-print">
        <button class="btn btn-outline" onclick="window.print()"><i class="fas fa-file-invoice"></i> Print Invoice</button>
        ${canCancel ? `<button class="btn btn-danger" id="cancelOrderBtn"><i class="fas fa-ban"></i> Cancel Order</button>` : ''}
      </div>
    </div>
  `;

  document.getElementById('cancelOrderBtn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.put(`/orders/${o._id}/cancel`, { reason: 'Cancelled by customer' });
      showToast('Order cancelled', 'success');
      loadOrderDetail();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('orders');
  renderFooter();
  loadOrderDetail();
});
