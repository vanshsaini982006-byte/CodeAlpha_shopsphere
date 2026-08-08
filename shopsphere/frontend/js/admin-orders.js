let adminOrdersPage = 1;
let adminOrdersStatus = '';
const STATUS_OPTIONS = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

async function loadAdminOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="7"><div class="spinner" style="margin:20px auto;"></div></td></tr>`;
  try {
    const params = new URLSearchParams({ page: adminOrdersPage, limit: 15 });
    if (adminOrdersStatus) params.set('status', adminOrdersStatus);
    const res = await api.get(`/orders/admin/all?${params.toString()}`);
    renderAdminOrdersTable(res.orders);
    renderAdminOrdersPagination(res.page, res.pages);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${apiErrorMessage(err)}</td></tr>`;
  }
}

function renderAdminOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">No orders found.</td></tr>`;
    return;
  }
  tbody.innerHTML = orders
    .map(
      (o) => `<tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>${escapeHtml(o.user?.name || 'Unknown')}<br/><span style="font-size:0.76rem;color:var(--text-muted)">${escapeHtml(o.user?.email || '')}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
        <td>${formatPrice(o.totalPrice)}</td>
        <td><span style="text-transform:capitalize;font-size:0.82rem;">${o.paymentMethod === 'razorpay' ? 'Online' : 'COD'}</span><br/><span class="badge ${o.paymentStatus === 'paid' ? 'badge-success' : 'badge-muted'}" style="margin-top:4px;">${o.paymentStatus}</span></td>
        <td>
          <select data-order-status="${o._id}" ${o.orderStatus === 'cancelled' ? 'disabled' : ''} style="padding:6px 10px;border-radius:6px;border:1.5px solid var(--border-color);background:var(--color-card);color:var(--text-primary);font-size:0.82rem;">
            ${STATUS_OPTIONS.map((s) => `<option value="${s}" ${o.orderStatus === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </td>
        <td><a href="../order-detail.html?id=${o._id}" class="btn-icon" style="width:32px;height:32px;" title="View"><i class="fas fa-eye"></i></a></td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-order-status]').forEach((select) =>
    select.addEventListener('change', async () => {
      try {
        await api.put(`/orders/${select.dataset.orderStatus}/status`, { orderStatus: select.value });
        showToast('Order status updated', 'success');
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
        loadAdminOrders();
      }
    })
  );
}

function renderAdminOrdersPagination(page, pages) {
  const row = document.getElementById('adminOrdersPagination');
  if (pages <= 1) { row.innerHTML = ''; return; }
  let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  html += `<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`;
  row.innerHTML = html;
  row.querySelectorAll('[data-page]').forEach((btn) =>
    btn.addEventListener('click', () => { adminOrdersPage = Number(btn.dataset.page); loadAdminOrders(); })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  renderAdminLayout('orders');
  loadAdminOrders();

  document.getElementById('statusFilterSelect').addEventListener('change', (e) => {
    adminOrdersStatus = e.target.value;
    adminOrdersPage = 1;
    loadAdminOrders();
  });
});
