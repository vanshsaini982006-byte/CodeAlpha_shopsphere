let adminProductsPage = 1;
let adminProductsKeyword = '';

async function loadAdminProducts() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = `<tr><td colspan="6"><div class="spinner" style="margin:20px auto;"></div></td></tr>`;
  try {
    const params = new URLSearchParams({ page: adminProductsPage, limit: 10 });
    if (adminProductsKeyword) params.set('keyword', adminProductsKeyword);
    const res = await api.get(`/products?${params.toString()}`);
    renderAdminProductsTable(res.products);
    renderAdminPagination(res.page, res.pages);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${apiErrorMessage(err)}</td></tr>`;
  }
}

function renderAdminProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">No products found.</td></tr>`;
    return;
  }
  tbody.innerHTML = products
    .map(
      (p) => `<tr>
        <td><div class="flex items-center gap-2"><img src="${p.images[0]}" class="table-img" alt="" /><span style="font-weight:600;">${escapeHtml(p.name)}</span></div></td>
        <td>${escapeHtml(p.category)}</td>
        <td>${formatPrice(p.price)}${p.discount > 0 ? ` <span style="color:var(--color-success);font-size:0.78rem;">(-${p.discount}%)</span>` : ''}</td>
        <td><span class="badge ${p.stock === 0 ? 'badge-accent' : p.stock <= 5 ? 'badge-muted' : 'badge-success'}">${p.stock}</span></td>
        <td>${p.rating.toFixed(1)} <i class="fas fa-star" style="color:var(--color-accent);font-size:0.75rem;"></i></td>
        <td>
          <a href="product-form.html?id=${p._id}" class="btn-icon" style="width:32px;height:32px;" title="Edit"><i class="fas fa-pen"></i></a>
          <button class="btn-icon" style="width:32px;height:32px;" data-delete-id="${p._id}" title="Delete"><i class="fas fa-trash" style="color:var(--color-danger);"></i></button>
        </td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-delete-id]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this product? This cannot be undone.')) return;
      try {
        await api.delete(`/products/${btn.dataset.deleteId}`);
        showToast('Product deleted', 'success');
        loadAdminProducts();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
}

function renderAdminPagination(page, pages) {
  const row = document.getElementById('adminProductsPagination');
  if (pages <= 1) { row.innerHTML = ''; return; }
  let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  html += `<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`;
  row.innerHTML = html;
  row.querySelectorAll('[data-page]').forEach((btn) =>
    btn.addEventListener('click', () => { adminProductsPage = Number(btn.dataset.page); loadAdminProducts(); })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  renderAdminLayout('products');
  loadAdminProducts();

  let debounce;
  document.getElementById('productSearchInput').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      adminProductsKeyword = e.target.value.trim();
      adminProductsPage = 1;
      loadAdminProducts();
    }, 350);
  });
});
