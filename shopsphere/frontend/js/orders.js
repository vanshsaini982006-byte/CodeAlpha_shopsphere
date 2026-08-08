async function loadOrders() {
  if (!Auth.requireAuth()) return;
  try {
    const { orders } = await api.get('/orders');
    renderOrders(orders);
  } catch (err) {
    document.getElementById('ordersContent').innerHTML = `<p>${apiErrorMessage(err)}</p>`;
  }
}

function renderOrders(orders) {
  const container = document.getElementById('ordersContent');
  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="icon-circle-lg"><i class="fas fa-box"></i></div>
      <h3>No orders yet</h3>
      <p>When you place an order, it'll show up here.</p>
      <a href="products.html" class="btn btn-primary">Start Shopping</a>
    </div>`;
    return;
  }

  container.innerHTML = orders
    .map(
      (o) => `<div class="card order-card">
        <div class="order-card-header">
          <div>
            <strong>${o.orderNumber}</strong>
            <div style="font-size:0.78rem;color:var(--text-muted)">Placed ${timeAgo(o.createdAt)}</div>
          </div>
          <span class="status-badge status-${o.orderStatus}">${o.orderStatus}</span>
        </div>
        ${o.items
          .slice(0, 2)
          .map(
            (item) => `<div class="order-item-row">
              <img src="${item.image}" alt="${escapeHtml(item.name)}" />
              <div style="flex:1;">
                <div style="font-size:0.88rem;font-weight:600;">${escapeHtml(item.name)}</div>
                <div style="font-size:0.78rem;color:var(--text-muted)">Qty: ${item.quantity}</div>
              </div>
              <div style="font-size:0.88rem;font-weight:600;">${formatPrice(item.price * item.quantity)}</div>
            </div>`
          )
          .join('')}
        ${o.items.length > 2 ? `<div style="font-size:0.8rem;color:var(--text-muted);padding:6px 0;">+ ${o.items.length - 2} more item(s)</div>` : ''}
        <div class="flex justify-between items-center mt-2" style="padding-top:14px;border-top:1px solid var(--border-color);">
          <span style="font-weight:700;">${formatPrice(o.totalPrice)}</span>
          <a href="order-detail.html?id=${o._id}" class="btn btn-outline btn-sm">View Details <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>`
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('orders');
  renderFooter();
  loadOrders();
});
