async function loadWishlist() {
  if (!Auth.requireAuth()) return;
  try {
    const { wishlist } = await api.get('/wishlist');
    renderWishlist(wishlist);
  } catch (err) {
    document.getElementById('wishlistContent').innerHTML = `<p>${apiErrorMessage(err)}</p>`;
  }
}

function renderWishlist(wishlist) {
  const container = document.getElementById('wishlistContent');
  if (!wishlist.products || wishlist.products.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="icon-circle-lg"><i class="fas fa-heart"></i></div>
      <h3>Your wishlist is empty</h3>
      <p>Save products you love and find them here anytime.</p>
      <a href="products.html" class="btn btn-primary">Explore Products</a>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="product-grid">${wishlist.products
    .map((p) => {
      const finalPrice = +(p.price - (p.price * p.discount) / 100).toFixed(2);
      return `<div class="product-card">
        <a href="product-detail.html?id=${p.slug}" class="product-card-media">
          <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" loading="lazy" />
        </a>
        <button class="btn-icon wishlist-toggle active" data-remove-wish="${p._id}" aria-label="Remove from wishlist"><i class="fas fa-heart"></i></button>
        <a href="product-detail.html?id=${p.slug}" class="product-card-body">
          <span class="product-card-brand">${escapeHtml(p.brand)}</span>
          <span class="product-card-name">${escapeHtml(p.name)}</span>
          <div class="product-card-price"><span class="price-current">${formatPrice(finalPrice)}</span></div>
        </a>
        <div class="product-card-actions">
          <button class="btn btn-primary btn-sm btn-block" data-move-cart="${p._id}" ${p.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> Move to Cart
          </button>
        </div>
      </div>`;
    })
    .join('')}</div>`;

  document.querySelectorAll('[data-remove-wish]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        await api.delete(`/wishlist/${btn.dataset.removeWish}`);
        showToast('Removed from wishlist', 'info');
        refreshBadgeCounts();
        loadWishlist();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
  document.querySelectorAll('[data-move-cart]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        await api.post(`/wishlist/${btn.dataset.moveCart}/move-to-cart`, {});
        showToast('Moved to cart', 'success');
        refreshBadgeCounts();
        loadWishlist();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('wishlist');
  renderFooter();
  loadWishlist();
});
