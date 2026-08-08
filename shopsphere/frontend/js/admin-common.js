/**
 * Renders the admin sidebar + topbar (paths are relative to /admin/*.html,
 * so links back into the main site are prefixed with '../').
 * Call renderAdminLayout('dashboard'|'products'|'orders'|'users') at the
 * top of every admin page, after confirming Auth.requireAdmin().
 */
function renderAdminLayout(activePage) {
  const sidebarRoot = document.getElementById('adminSidebarRoot');
  const topbarRoot = document.getElementById('adminTopbarRoot');
  const user = Auth.getUser();

  if (topbarRoot) {
    topbarRoot.innerHTML = `
      <nav class="navbar">
        <div class="container navbar-inner" style="max-width:100%;padding:0 24px;">
          <a href="../index.html" class="logo"><i class="fas fa-bag-shopping" style="color:var(--color-accent)"></i>Shop<span>Sphere</span> <span style="font-size:0.7rem;background:var(--color-primary-light);color:var(--color-primary);padding:2px 8px;border-radius:999px;margin-left:6px;">ADMIN</span></a>
          <div style="flex:1"></div>
          <div class="nav-actions">
            <button class="btn-icon" id="themeToggleBtn" aria-label="Toggle dark mode"><i class="fas fa-moon"></i></button>
            <a href="../index.html" class="btn btn-outline btn-sm"><i class="fas fa-arrow-left"></i> Back to Store</a>
            <div class="user-dropdown">
              <button class="btn-icon" id="userMenuBtn"><i class="fas fa-user"></i></button>
              <div class="user-dropdown-menu" id="userMenu">
                <div style="padding:10px 12px 12px;border-bottom:1px solid var(--border-color);margin-bottom:6px;">
                  <div style="font-weight:700;font-size:0.9rem;">${escapeHtml(user.name)}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">${escapeHtml(user.email)}</div>
                </div>
                <button id="logoutBtn"><i class="fas fa-right-from-bracket"></i> Logout</button>
              </div>
            </div>
            <button class="btn-icon mobile-menu-btn" id="adminSidebarToggle" style="display:none;"><i class="fas fa-bars"></i></button>
          </div>
        </div>
      </nav>
    `;
    initTheme();
    const themeBtn = document.getElementById('themeToggleBtn');
    if (document.documentElement.getAttribute('data-theme') === 'dark' && themeBtn) themeBtn.querySelector('i').className = 'fas fa-sun';
    themeBtn?.addEventListener('click', toggleTheme);
    document.getElementById('userMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('userMenu').classList.toggle('show'); });
    document.addEventListener('click', () => document.getElementById('userMenu')?.classList.remove('show'));
    document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
  }

  if (sidebarRoot) {
    const links = [
      { id: 'dashboard', icon: 'fa-gauge', label: 'Dashboard', href: 'dashboard.html' },
      { id: 'products', icon: 'fa-box', label: 'Products', href: 'products.html' },
      { id: 'orders', icon: 'fa-receipt', label: 'Orders', href: 'orders.html' },
      { id: 'users', icon: 'fa-users', label: 'Users', href: 'users.html' }
    ];
    sidebarRoot.innerHTML = `<div class="admin-sidebar" id="adminSidebar">
      ${links.map((l) => `<a href="${l.href}" class="${activePage === l.id ? 'active' : ''}"><i class="fas ${l.icon}"></i> ${l.label}</a>`).join('')}
    </div>`;
  }

  const toggle = document.getElementById('adminSidebarToggle');
  if (window.innerWidth <= 1024 && toggle) {
    toggle.style.display = 'flex';
    toggle.addEventListener('click', () => document.getElementById('adminSidebar').classList.toggle('show'));
  }
}
