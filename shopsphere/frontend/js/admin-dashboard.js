async function loadDashboard() {
  try {
    const { stats, lowStock, recentOrders, dailyRevenue } = await api.get('/dashboard');
    renderDashboard(stats, lowStock, recentOrders, dailyRevenue);
  } catch (err) {
    document.getElementById('dashboardContent').innerHTML = `<p>${apiErrorMessage(err)}</p>`;
  }
}

function renderDashboard(stats, lowStock, recentOrders, dailyRevenue) {
  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  document.getElementById('dashboardContent').innerHTML = `
    <div class="stat-grid">
      <div class="card stat-card">
        <div class="stat-icon" style="background:var(--color-primary);"><i class="fas fa-indian-rupee-sign"></i></div>
        <div><div class="stat-value">${formatPrice(stats.totalRevenue)}</div><div class="stat-label">Total Revenue</div></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon" style="background:var(--color-accent);"><i class="fas fa-receipt"></i></div>
        <div><div class="stat-value">${stats.totalOrders}</div><div class="stat-label">Total Orders</div></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon" style="background:var(--color-success);"><i class="fas fa-box"></i></div>
        <div><div class="stat-value">${stats.totalProducts}</div><div class="stat-label">Total Products</div></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon" style="background:var(--color-secondary);"><i class="fas fa-users"></i></div>
        <div><div class="stat-value">${stats.totalUsers}</div><div class="stat-label">Total Customers</div></div>
      </div>
    </div>

    <div class="card mb-3">
      <h3 class="mb-2">Revenue — Last 7 Days</h3>
      ${dailyRevenue.length === 0
        ? `<p style="color:var(--text-muted);padding:20px 0;">No revenue recorded in the last 7 days yet.</p>`
        : `<div class="chart-bars">
            ${dailyRevenue
              .map(
                (d) => `<div class="chart-bar-wrap">
                  <div class="chart-bar" style="height:${Math.max(4, (d.revenue / maxRevenue) * 100)}%;" title="${formatPrice(d.revenue)}"></div>
                  <span class="chart-bar-label">${new Date(d._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>`
              )
              .join('')}
          </div>`}
    </div>

    <div class="form-row" style="align-items:flex-start;">
      <div class="card">
        <h3 class="mb-2">Recent Orders</h3>
        ${recentOrders.length === 0
          ? `<p style="color:var(--text-muted);">No orders yet.</p>`
          : recentOrders
              .map(
                (o) => `<div class="flex justify-between items-center" style="padding:10px 0;border-bottom:1px solid var(--border-color);">
                  <div>
                    <div style="font-weight:600;font-size:0.88rem;">${o.orderNumber}</div>
                    <div style="font-size:0.76rem;color:var(--text-muted)">${escapeHtml(o.user?.name || 'Unknown')}</div>
                  </div>
                  <span class="status-badge status-${o.orderStatus}">${o.orderStatus}</span>
                </div>`
              )
              .join('')}
      </div>
      <div class="card">
        <h3 class="mb-2">Low Stock Alerts</h3>
        ${lowStock.length === 0
          ? `<p style="color:var(--text-muted);">All products are well stocked.</p>`
          : lowStock
              .map(
                (p) => `<div class="flex justify-between items-center" style="padding:10px 0;border-bottom:1px solid var(--border-color);">
                  <div class="flex items-center gap-2"><img src="${p.images[0]}" class="table-img" alt="" /><span style="font-size:0.85rem;">${escapeHtml(p.name)}</span></div>
                  <span class="badge ${p.stock === 0 ? 'badge-accent' : 'badge-muted'}">${p.stock} left</span>
                </div>`
              )
              .join('')}
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  renderAdminLayout('dashboard');
  loadDashboard();
});
