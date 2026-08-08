const state = {
  keyword: '', category: [], brand: [], minPrice: '', maxPrice: '',
  minRating: '', inStock: false, sort: 'newest', page: 1
};
let filterMeta = { categories: [], brands: [] };

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.keyword = params.get('keyword') || '';
  state.category = params.get('category') ? params.get('category').split(',') : [];
  state.brand = params.get('brand') ? params.get('brand').split(',') : [];
  state.minPrice = params.get('minPrice') || '';
  state.maxPrice = params.get('maxPrice') || '';
  state.minRating = params.get('minRating') || '';
  state.inStock = params.get('inStock') === 'true';
  state.sort = params.get('sort') || 'newest';
  state.page = Number(params.get('page')) || 1;
}

function writeStateToUrl() {
  const params = new URLSearchParams();
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.category.length) params.set('category', state.category.join(','));
  if (state.brand.length) params.set('brand', state.brand.join(','));
  if (state.minPrice) params.set('minPrice', state.minPrice);
  if (state.maxPrice) params.set('maxPrice', state.maxPrice);
  if (state.minRating) params.set('minRating', state.minRating);
  if (state.inStock) params.set('inStock', 'true');
  if (state.sort !== 'newest') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', state.page);
  history.replaceState(null, '', `products.html?${params.toString()}`);
}

async function loadFilterMeta() {
  const res = await api.get('/products/filters/meta', { auth: false });
  filterMeta = res;
  document.getElementById('categoryFilters').innerHTML = res.categories
    .map(
      (c) => `<label class="filter-option"><input type="checkbox" value="${escapeHtml(c)}" ${state.category.includes(c) ? 'checked' : ''} data-filter="category" /> ${escapeHtml(c)}</label>`
    )
    .join('');
  document.getElementById('brandFilters').innerHTML = res.brands
    .map(
      (b) => `<label class="filter-option"><input type="checkbox" value="${escapeHtml(b)}" ${state.brand.includes(b) ? 'checked' : ''} data-filter="brand" /> ${escapeHtml(b)}</label>`
    )
    .join('');

  document.querySelectorAll('[data-filter="category"]').forEach((el) =>
    el.addEventListener('change', () => {
      state.category = [...document.querySelectorAll('[data-filter="category"]:checked')].map((i) => i.value);
      state.page = 1;
      loadProducts();
    })
  );
  document.querySelectorAll('[data-filter="brand"]').forEach((el) =>
    el.addEventListener('change', () => {
      state.brand = [...document.querySelectorAll('[data-filter="brand"]:checked')].map((i) => i.value);
      state.page = 1;
      loadProducts();
    })
  );
}

function renderActiveFilters() {
  const row = document.getElementById('activeFiltersRow');
  const chips = [];
  state.category.forEach((c) => chips.push({ label: c, clear: () => (state.category = state.category.filter((x) => x !== c)) }));
  state.brand.forEach((b) => chips.push({ label: b, clear: () => (state.brand = state.brand.filter((x) => x !== b)) }));
  if (state.minPrice || state.maxPrice) chips.push({ label: `₹${state.minPrice || 0} - ₹${state.maxPrice || '∞'}`, clear: () => { state.minPrice = ''; state.maxPrice = ''; } });
  if (state.minRating) chips.push({ label: `${state.minRating}★ & up`, clear: () => (state.minRating = '') });
  if (state.inStock) chips.push({ label: 'In stock', clear: () => (state.inStock = false) });
  if (state.keyword) chips.push({ label: `"${state.keyword}"`, clear: () => (state.keyword = '') });

  row.innerHTML = chips
    .map((c, i) => `<span class="filter-chip" data-chip-idx="${i}">${escapeHtml(c.label)} <i class="fas fa-xmark" style="cursor:pointer"></i></span>`)
    .join('');
  row.querySelectorAll('.filter-chip').forEach((chip, i) => {
    chip.querySelector('i').addEventListener('click', () => {
      chips[i].clear();
      state.page = 1;
      syncFilterInputs();
      loadProducts();
    });
  });
}

function syncFilterInputs() {
  document.querySelectorAll('[data-filter="category"]').forEach((el) => (el.checked = state.category.includes(el.value)));
  document.querySelectorAll('[data-filter="brand"]').forEach((el) => (el.checked = state.brand.includes(el.value)));
  document.getElementById('minPriceInput').value = state.minPrice;
  document.getElementById('maxPriceInput').value = state.maxPrice;
  document.getElementById('inStockFilter').checked = state.inStock;
  document.getElementById('sortSelect').value = state.sort;
  document.querySelectorAll('[name="rating"]').forEach((el) => (el.checked = el.value === state.minRating));
}

function renderPagination(page, pages) {
  const row = document.getElementById('paginationRow');
  if (pages <= 1) { row.innerHTML = ''; return; }
  let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - page) === 2) {
      html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
    }
  }
  html += `<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`;
  row.innerHTML = html;
  row.querySelectorAll('[data-page]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.page = Number(btn.dataset.page);
      loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
}

async function loadProducts() {
  writeStateToUrl();
  renderActiveFilters();
  renderSkeletonGrid('productsGrid', 8);
  document.getElementById('resultsCount').textContent = 'Loading...';

  const params = new URLSearchParams();
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.category.length) params.set('category', state.category.join(','));
  if (state.brand.length) params.set('brand', state.brand.join(','));
  if (state.minPrice) params.set('minPrice', state.minPrice);
  if (state.maxPrice) params.set('maxPrice', state.maxPrice);
  if (state.minRating) params.set('minRating', state.minRating);
  if (state.inStock) params.set('inStock', 'true');
  params.set('sort', state.sort);
  params.set('page', state.page);
  params.set('limit', 12);

  try {
    const res = await api.get(`/products?${params.toString()}`, { auth: false });
    renderProductGrid('productsGrid', res.products);
    await markWishlistedCards(document.getElementById('productsGrid'));
    document.getElementById('resultsCount').textContent = `${res.total} product${res.total !== 1 ? 's' : ''} found`;
    document.getElementById('breadcrumbCurrent').textContent = state.category.length === 1 ? state.category[0] : 'All Products';
    renderPagination(res.page, res.pages);
  } catch (err) {
    showToast(apiErrorMessage(err), 'error');
    document.getElementById('resultsCount').textContent = 'Error loading products';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('products');
  renderFooter();
  readStateFromUrl();

  await loadFilterMeta();
  syncFilterInputs();

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    loadProducts();
  });
  document.getElementById('applyPriceBtn').addEventListener('click', () => {
    state.minPrice = document.getElementById('minPriceInput').value;
    state.maxPrice = document.getElementById('maxPriceInput').value;
    state.page = 1;
    loadProducts();
  });
  document.getElementById('inStockFilter').addEventListener('change', (e) => {
    state.inStock = e.target.checked;
    state.page = 1;
    loadProducts();
  });
  document.querySelectorAll('[name="rating"]').forEach((el) =>
    el.addEventListener('change', () => {
      state.minRating = el.value;
      state.page = 1;
      loadProducts();
    })
  );
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    Object.assign(state, { keyword: '', category: [], brand: [], minPrice: '', maxPrice: '', minRating: '', inStock: false, sort: 'newest', page: 1 });
    syncFilterInputs();
    loadProducts();
  });

  const mobileBtn = document.getElementById('mobileFilterBtn');
  const panel = document.getElementById('filtersPanel');
  if (window.innerWidth <= 1024) {
    mobileBtn.style.display = 'inline-flex';
    mobileBtn.addEventListener('click', () => panel.classList.toggle('show'));
  }

  loadProducts();
});
