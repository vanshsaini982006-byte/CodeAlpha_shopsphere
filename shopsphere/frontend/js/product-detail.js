let currentProduct = null;
let selectedStars = 0;

function getProductIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

async function loadProduct() {
  const id = getProductIdFromUrl();
  if (!id) {
    window.location.href = 'products.html';
    return;
  }

  try {
    const { product } = await api.get(`/products/${encodeURIComponent(id)}`, { auth: false });
    currentProduct = product;
    renderProductDetail(product);
    loadRelated(product._id);
  } catch (err) {
    document.getElementById('productDetailContent').innerHTML = `<div class="empty-state"><div class="icon-circle-lg"><i class="fas fa-triangle-exclamation"></i></div><h3>Product not found</h3><p>${apiErrorMessage(err)}</p><a href="products.html" class="btn btn-primary">Back to Shop</a></div>`;
  }
}

function renderProductDetail(p) {
  const tpl = document.getElementById('detailTemplate').content.cloneNode(true);
  document.getElementById('productDetailContent').innerHTML = '';
  document.getElementById('productDetailContent').appendChild(tpl);

  document.title = `${p.name} — ShopSphere`;
  document.getElementById('breadcrumbCurrent').textContent = p.name;

  document.getElementById('mainImage').src = p.images[0];
  document.getElementById('mainImage').alt = p.name;
  document.getElementById('galleryThumbs').innerHTML = p.images
    .map((img, i) => `<img src="${img}" class="${i === 0 ? 'active' : ''}" data-idx="${i}" alt="${escapeHtml(p.name)} view ${i + 1}" />`)
    .join('');
  document.querySelectorAll('#galleryThumbs img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.getElementById('mainImage').src = p.images[thumb.dataset.idx];
      document.querySelectorAll('#galleryThumbs img').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  document.getElementById('pdBrand').textContent = p.brand;
  document.getElementById('pdTitle').textContent = p.name;
  document.getElementById('pdStars').innerHTML = starHtml(p.rating);
  document.getElementById('pdRatingText').textContent = `${p.rating.toFixed(1)} (${p.numReviews} reviews)`;

  const finalPrice = +(p.price - (p.price * p.discount) / 100).toFixed(2);
  document.getElementById('pdPriceCurrent').textContent = formatPrice(finalPrice);
  if (p.discount > 0) {
    document.getElementById('pdPriceOriginal').textContent = formatPrice(p.price);
    document.getElementById('pdDiscountPct').textContent = `${p.discount}% off`;
  }

  const stockEl = document.getElementById('pdStockStatus');
  if (p.stock === 0) { stockEl.textContent = 'Out of stock'; stockEl.className = 'stock-status out'; }
  else if (p.stock <= 5) { stockEl.textContent = `Only ${p.stock} left in stock`; stockEl.className = 'stock-status low'; }
  else { stockEl.textContent = 'In stock'; stockEl.className = 'stock-status in'; }

  document.getElementById('pdDescription').textContent = p.description;
  document.getElementById('pdFeatures').innerHTML = (p.features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('');

  const specs = p.specifications || {};
  const specEntries = specs instanceof Map ? [...specs.entries()] : Object.entries(specs);
  document.getElementById('specTable').innerHTML = specEntries.length
    ? specEntries.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')
    : '<tr><td colspan="2" style="color:var(--text-muted)">No specifications listed for this product.</td></tr>';

  renderReviews(p);

  // Quantity selector
  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyMinus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    qtyInput.value = Math.min(p.stock || 1, Number(qtyInput.value) + 1);
  });

  const addBtn = document.getElementById('addToCartBtn');
  const buyBtn = document.getElementById('buyNowBtn');
  if (p.stock === 0) { addBtn.disabled = true; buyBtn.disabled = true; }

  addBtn.addEventListener('click', async () => {
    if (!Auth.isLoggedIn()) return (window.location.href = 'login.html');
    try {
      await api.post('/cart', { productId: p._id, quantity: Number(qtyInput.value) });
      showToast('Added to cart', 'success');
      refreshBadgeCounts();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });

  buyBtn.addEventListener('click', async () => {
    if (!Auth.isLoggedIn()) return (window.location.href = 'login.html');
    try {
      await api.post('/cart', { productId: p._id, quantity: Number(qtyInput.value) });
      window.location.href = 'checkout.html';
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });

  const wishBtn = document.getElementById('pdWishlistBtn');
  wishBtn.dataset.id = p._id;
  checkWishlistStatus(p._id, wishBtn);
  wishBtn.addEventListener('click', async () => {
    if (!Auth.isLoggedIn()) return (window.location.href = 'login.html');
    const isActive = wishBtn.classList.contains('active');
    try {
      if (isActive) {
        await api.delete(`/wishlist/${p._id}`);
        wishBtn.classList.remove('active');
        wishBtn.querySelector('i').className = 'far fa-heart';
        showToast('Removed from wishlist', 'info');
      } else {
        await api.post('/wishlist', { productId: p._id });
        wishBtn.classList.add('active');
        wishBtn.querySelector('i').className = 'fas fa-heart';
        showToast('Added to wishlist', 'success');
      }
      refreshBadgeCounts();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Review form
  if (Auth.isLoggedIn()) {
    const alreadyReviewed = (p.reviews || []).some((r) => r.user && (r.user._id || r.user) === Auth.getUser()._id);
    if (!alreadyReviewed) document.getElementById('writeReviewBox').style.display = 'block';
  }
  document.querySelectorAll('#starPicker i').forEach((star) => {
    star.addEventListener('click', () => {
      selectedStars = Number(star.dataset.star);
      document.querySelectorAll('#starPicker i').forEach((s) => {
        s.className = Number(s.dataset.star) <= selectedStars ? 'fas fa-star' : 'far fa-star';
      });
    });
  });
  document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
    const comment = document.getElementById('reviewComment').value.trim();
    if (!selectedStars || !comment) {
      showToast('Please select a rating and write a comment', 'error');
      return;
    }
    try {
      await api.post(`/products/${p._id}/reviews`, { rating: selectedStars, comment });
      showToast('Review submitted', 'success');
      loadProduct();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });
}

function renderReviews(p) {
  document.getElementById('reviewCount').textContent = p.numReviews;
  const list = document.getElementById('reviewsList');
  if (!p.reviews || p.reviews.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:20px 0;">No reviews yet. Be the first to review this product!</p>`;
    return;
  }
  list.innerHTML = [...p.reviews]
    .reverse()
    .map(
      (r) => `<div class="review-item">
        <div class="review-header">
          <span class="reviewer-name">${escapeHtml(r.name)}</span>
          <span class="review-date">${timeAgo(r.createdAt)}</span>
        </div>
        <span class="stars">${starHtml(r.rating)}</span>
        <p style="margin-top:8px;color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(r.comment)}</p>
      </div>`
    )
    .join('');
}

async function checkWishlistStatus(productId, btn) {
  if (!Auth.isLoggedIn()) return;
  try {
    const res = await api.get('/wishlist');
    if (res.wishlist.products.some((p) => p._id === productId)) {
      btn.classList.add('active');
      btn.querySelector('i').className = 'fas fa-heart';
    }
  } catch {
    /* silent */
  }
}

async function loadRelated(productId) {
  try {
    const res = await api.get(`/products/${productId}/related`, { auth: false });
    renderProductGrid('relatedGrid', res.products);
    await markWishlistedCards(document.getElementById('relatedGrid'));
  } catch {
    /* silent */
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('products');
  renderFooter();
  loadProduct();
});
