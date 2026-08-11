/* ==========================================================================
   Shared UI helpers used across every page: toasts, navbar/footer injection,
   theme toggle, formatting helpers, and small DOM utilities.
   ========================================================================== */

// ---------- Formatting ----------
function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function starHtml(rating) {
  const full = Math.round(rating);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<i class="fa-star ${i <= full ? 'fas' : 'far'}"></i>`;
  }
  return html;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Toasts ----------
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 300ms ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---------- Theme (light/dark) ----------
function initTheme() {
  const saved = localStorage.getItem('ss_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ss_theme', next);
  const icon = document.querySelector('#themeToggleBtn i');
  if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ---------- Cart/Wishlist badge counts (cached in localStorage for instant paint) ----------
async function refreshBadgeCounts() {
  const cartBadge = document.getElementById('cartBadge');
  const wishBadge = document.getElementById('wishBadge');
  if (!Auth.isLoggedIn()) {
    if (cartBadge) cartBadge.style.display = 'none';
    if (wishBadge) wishBadge.style.display = 'none';
    return;
  }
  try {
    const [cartRes, wishRes] = await Promise.all([api.get('/cart'), api.get('/wishlist')]);
    const cartCount = cartRes.cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const wishCount = wishRes.wishlist.products.length;
    if (cartBadge) {
      cartBadge.textContent = cartCount;
      cartBadge.style.display = cartCount > 0 ? 'flex' : 'none';
    }
    if (wishBadge) {
      wishBadge.textContent = wishCount;
      wishBadge.style.display = wishCount > 0 ? 'flex' : 'none';
    }
  } catch {
    /* silent - badges just won't update */
  }
}

// ---------- Navbar ----------
function renderNavbar(activePage = '') {
  const root = document.getElementById('navbarRoot');
  if (!root) return;
  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();

  root.innerHTML = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="index.html" class="logo"><i class="fas fa-bag-shopping" style="color:var(--color-accent)"></i>Shop<span>Sphere</span></a>
        <div class="nav-links">
          <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
          <a href="products.html" class="${activePage === 'products' ? 'active' : ''}">Shop</a>
          <a href="wishlist.html" class="${activePage === 'wishlist' ? 'active' : ''}">Wishlist</a>
          <a href="orders.html" class="${activePage === 'orders' ? 'active' : ''}">Orders</a>
        </div>
        <div class="nav-search">
          <input type="text" id="navSearchInput" placeholder="Search for products, brands and more..." autocomplete="off" />
          <button id="navSearchBtn" aria-label="Search"><i class="fas fa-magnifying-glass"></i></button>
          <div class="search-suggestions" id="searchSuggestions"></div>
        </div>
        <div class="nav-actions">
          <button class="btn-icon" id="themeToggleBtn" aria-label="Toggle dark mode"><i class="fas fa-moon"></i></button>
          <a href="wishlist.html" class="btn-icon nav-badge-wrap" aria-label="Wishlist">
            <i class="far fa-heart"></i><span class="nav-badge" id="wishBadge" style="display:none">0</span>
          </a>
          <a href="cart.html" class="btn-icon nav-badge-wrap" aria-label="Cart">
            <i class="fas fa-cart-shopping"></i><span class="nav-badge" id="cartBadge" style="display:none">0</span>
          </a>
          ${
            loggedIn
              ? `<div class="user-dropdown">
                  <button class="btn-icon" id="userMenuBtn" aria-label="Account"><i class="fas fa-user"></i></button>
                  <div class="user-dropdown-menu" id="userMenu">
                    <div style="padding:10px 12px 12px;border-bottom:1px solid var(--border-color);margin-bottom:6px;">
                      <div style="font-weight:700;font-size:0.9rem;">${escapeHtml(user.name)}</div>
                      <div style="font-size:0.78rem;color:var(--text-muted)">${escapeHtml(user.email)}</div>
                    </div>
                    <a href="profile.html"><i class="fas fa-user-pen"></i> My Profile</a>
                    <a href="orders.html"><i class="fas fa-box"></i> My Orders</a>
                    ${user.role === 'admin' ? '<a href="admin/dashboard.html"><i class="fas fa-gauge"></i> Admin Dashboard</a>' : ''}
                    <button id="logoutBtn"><i class="fas fa-right-from-bracket"></i> Logout</button>
                  </div>
                </div>`
              : `<a href="login.html" class="btn btn-primary btn-sm">Login</a>`
          }
          <button class="btn-icon mobile-menu-btn" id="mobileMenuBtn" aria-label="Menu"><i class="fas fa-bars"></i></button>
        </div>
      </div>
    </nav>
    <div class="mobile-nav" id="mobileNav">
      <div class="mobile-nav-panel">
        <div class="flex justify-between items-center mb-2">
          <strong>Menu</strong>
          <button class="btn-icon" id="closeMobileNav"><i class="fas fa-xmark"></i></button>
        </div>
        <a href="index.html">Home</a>
        <a href="products.html">Shop</a>
        <a href="wishlist.html">Wishlist</a>
        <a href="cart.html">Cart</a>
        <a href="orders.html">Orders</a>
        ${loggedIn ? `<a href="profile.html">My Profile</a>${user.role === 'admin' ? '<a href="admin/dashboard.html">Admin Dashboard</a>' : ''}<button id="mobileLogoutBtn">Logout</button>` : `<a href="login.html">Login</a>`}
      </div>
    </div>
  `;

  initTheme();
  const themeBtn = document.getElementById('themeToggleBtn');
  if (document.documentElement.getAttribute('data-theme') === 'dark' && themeBtn) {
    themeBtn.querySelector('i').className = 'fas fa-sun';
  }
  themeBtn?.addEventListener('click', toggleTheme);

  document.getElementById('userMenuBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userMenu').classList.toggle('show');
  });
  document.addEventListener('click', () => document.getElementById('userMenu')?.classList.remove('show'));
  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => Auth.logout());

  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => document.getElementById('mobileNav').classList.add('show'));
  document.getElementById('closeMobileNav')?.addEventListener('click', () => document.getElementById('mobileNav').classList.remove('show'));
  document.getElementById('mobileNav')?.addEventListener('click', (e) => {
    if (e.target.id === 'mobileNav') e.target.classList.remove('show');
  });

  // Search
  const searchInput = document.getElementById('navSearchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');
  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      suggestionsBox.classList.remove('show');
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search/suggest?q=${encodeURIComponent(q)}`, { auth: false });
        if (res.suggestions.length === 0) {
          suggestionsBox.classList.remove('show');
          return;
        }
        suggestionsBox.innerHTML = res.suggestions
          .map(
            (p) => `<a class="search-suggestion-item" href="product-detail.html?id=${p.slug}">
              <img src="${p.images[0]}" alt="" />
              <span>${escapeHtml(p.name)}</span>
            </a>`
          )
          .join('');
        suggestionsBox.classList.add('show');
      } catch {
        suggestionsBox.classList.remove('show');
      }
    }, 250);
  });
  const doSearch = () => {
    const q = searchInput.value.trim();
    if (q) window.location.href = `products.html?keyword=${encodeURIComponent(q)}`;
  };
  document.getElementById('navSearchBtn')?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => e.key === 'Enter' && doSearch());
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) suggestionsBox?.classList.remove('show');
  });

  refreshBadgeCounts();
}

// ---------- Footer ----------
function renderFooter() {
  const root = document.getElementById('footerRoot');
  if (!root) return;
  root.innerHTML = `
    <div class="newsletter">
      <div class="container">
        <h2>Stay Updated</h2>
        <p>Subscribe for exclusive deals, new arrivals, and offers straight to your inbox.</p>
        <form class="newsletter-form" id="newsletterForm">
          <input type="email" placeholder="Enter your email" required />
          <button type="submit" class="btn btn-accent">Subscribe</button>
        </form>
      </div>
    </div>
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="index.html" class="logo" style="color:#fff;margin-bottom:14px;display:flex"><i class="fas fa-bag-shopping" style="color:var(--color-accent)"></i>Shop<span style="color:var(--color-accent)">Sphere</span></a>
            <p style="font-size:0.88rem;line-height:1.7;max-width:280px;">Your one-stop shop for electronics, fashion, home essentials and more — trusted by thousands across India.</p>
            <div class="footer-social mt-2">
              <!-- LinkedIn -->
<a href="https://www.linkedin.com/in/vansh-saini-029909380" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
  <i class="fab fa-linkedin-in"></i>
</a>

<!-- Instagram -->
<a href="vanshsaini4711" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
  <i class="fab fa-instagram"></i>
</a>

<!-- GitHub -->
<a href="https://github.com/vanshsaini982006-byte" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
  <i class="fab fa-github"></i>
</a>

<!-- Portfolio (fa-globe or fa-briefcase or fa-laptop-code) -->
<a href="https://vanshsaini982006-byte.github.io/Vansh-portfolio/" target="_blank" rel="noopener noreferrer" aria-label="Portfolio">
  <i class="fas fa-globe"></i>
</a>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="products.html">All Products</a></li>
              <li><a href="products.html?category=Electronics">Electronics</a></li>
              <li><a href="products.html?category=Fashion">Fashion</a></li>
              <li><a href="products.html?sort=newest">New Arrivals</a></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><a href="profile.html">My Profile</a></li>
              <li><a href="orders.html">Order History</a></li>
              <li><a href="wishlist.html">Wishlist</a></li>
              <li><a href="cart.html">Cart</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ShopSphere. All rights reserved.</span>
          <span>Designed & Built by Vansh Saini</span>
        </div>
      </div>
    </footer>
  `;
  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Thanks for subscribing!', 'success');
    e.target.reset();
  });
}

// ---------- Generic error display ----------
function apiErrorMessage(err) {
  return err && err.message ? err.message : 'Something went wrong. Please try again.';
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});
