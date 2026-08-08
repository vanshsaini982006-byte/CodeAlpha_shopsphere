/**
 * Renders a single product card. Used on home, products listing, related
 * products, and search result grids so the markup stays consistent.
 */
function productCardHtml(p) {
  const finalPrice = +(p.price - (p.price * p.discount) / 100).toFixed(2);
  const stockClass = p.stock === 0 ? 'out' : p.stock <= 5 ? 'low' : 'in';
  const stockText = p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock';

  let badge = '';
  if (p.discount > 0) badge += `<span class="badge badge-accent">${p.discount}% OFF</span>`;
  else if (p.isNewArrival) badge += `<span class="badge badge-success">NEW</span>`;
  else if (p.isBestSeller) badge += `<span class="badge badge-muted">BESTSELLER</span>`;

  return `
  <div class="product-card" data-id="${p._id}">
    <a href="product-detail.html?id=${p.slug}" class="product-card-media">
      <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" loading="lazy" />
      <div class="product-badges">${badge}</div>
    </a>
    <button class="btn-icon wishlist-toggle" data-wishlist-btn data-id="${p._id}" aria-label="Add to wishlist">
      <i class="far fa-heart"></i>
    </button>
    <a href="product-detail.html?id=${p.slug}" class="product-card-body">
      <span class="product-card-brand">${escapeHtml(p.brand)}</span>
      <span class="product-card-name">${escapeHtml(p.name)}</span>
      <div class="product-card-rating">
        <span class="stars">${starHtml(p.rating)}</span>
        <span>(${p.numReviews})</span>
      </div>
      <div class="product-card-price">
        <span class="price-current">${formatPrice(finalPrice)}</span>
        ${p.discount > 0 ? `<span class="price-original">${formatPrice(p.price)}</span>` : ''}
      </div>
      <span class="stock-status ${stockClass}">${stockText}</span>
    </a>
    <div class="product-card-actions">
      <button class="btn btn-primary btn-sm btn-block" data-add-cart-btn data-id="${p._id}" ${p.stock === 0 ? 'disabled' : ''}>
        <i class="fas fa-cart-plus"></i> Add to Cart
      </button>
    </div>
  </div>`;
}

function renderProductGrid(containerId, products) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (products.length === 0) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon-circle-lg"><i class="fas fa-box-open"></i></div><h3>No products found</h3><p>Try adjusting your filters or search terms.</p></div>`;
    return;
  }
  el.innerHTML = products.map(productCardHtml).join('');
  bindProductCardEvents(el);
}

function renderSkeletonGrid(containerId, count = 8) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count })
    .map(() => `<div class="skeleton skeleton-card"></div>`)
    .join('');
}

// Wires up "Add to Cart" and wishlist-heart buttons within a container
function bindProductCardEvents(container) {
  container.querySelectorAll('[data-add-cart-btn]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
      }
      const id = btn.dataset.id;
      btn.disabled = true;
      try {
        await api.post('/cart', { productId: id, quantity: 1 });
        showToast('Added to cart', 'success');
        refreshBadgeCounts();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
      }
      const id = btn.dataset.id;
      const icon = btn.querySelector('i');
      const isActive = btn.classList.contains('active');
      try {
        if (isActive) {
          await api.delete(`/wishlist/${id}`);
          btn.classList.remove('active');
          icon.className = 'far fa-heart';
          showToast('Removed from wishlist', 'info');
        } else {
          await api.post('/wishlist', { productId: id });
          btn.classList.add('active');
          icon.className = 'fas fa-heart';
          showToast('Added to wishlist', 'success');
        }
        refreshBadgeCounts();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    });
  });
}

// Marks wishlist-heart buttons active for products already in the wishlist
async function markWishlistedCards(container) {
  if (!Auth.isLoggedIn()) return;
  try {
    const res = await api.get('/wishlist');
    const ids = new Set(res.wishlist.products.map((p) => p._id));
    container.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
      if (ids.has(btn.dataset.id)) {
        btn.classList.add('active');
        btn.querySelector('i').className = 'fas fa-heart';
      }
    });
  } catch {
    /* silent */
  }
}
