let adminUsersPage = 1;
let adminUsersSearch = '';

async function loadAdminUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = `<tr><td colspan="7"><div class="spinner" style="margin:20px auto;"></div></td></tr>`;
  try {
    const params = new URLSearchParams({ page: adminUsersPage, limit: 15 });
    if (adminUsersSearch) params.set('search', adminUsersSearch);
    const res = await api.get(`/users?${params.toString()}`);
    renderAdminUsersTable(res.users);
    renderAdminUsersPagination(res.page, res.pages);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${apiErrorMessage(err)}</td></tr>`;
  }
}

function renderAdminUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  const currentUserId = Auth.getUser()._id;
  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">No users found.</td></tr>`;
    return;
  }
  tbody.innerHTML = users
    .map(
      (u) => `<tr>
        <td style="font-weight:600;">${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone || '—')}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-accent' : 'badge-muted'}">${u.role}</span></td>
        <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-accent'}">${u.isActive ? 'Active' : 'Disabled'}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td>
          ${u._id === currentUserId
            ? '<span style="font-size:0.78rem;color:var(--text-muted)">You</span>'
            : `<button class="btn-icon" style="width:32px;height:32px;" data-toggle-active="${u._id}" data-current="${u.isActive}" title="${u.isActive ? 'Disable' : 'Enable'}">
                <i class="fas ${u.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
              </button>
              ${u.role !== 'admin' ? `<button class="btn-icon" style="width:32px;height:32px;" data-delete-user="${u._id}" title="Delete"><i class="fas fa-trash" style="color:var(--color-danger);"></i></button>` : ''}`
          }
        </td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-toggle-active]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.current !== 'true';
      try {
        await api.put(`/users/${btn.dataset.toggleActive}`, { isActive: newStatus });
        showToast(`User ${newStatus ? 'enabled' : 'disabled'}`, 'success');
        loadAdminUsers();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
  tbody.querySelectorAll('[data-delete-user]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this user account? This cannot be undone.')) return;
      try {
        await api.delete(`/users/${btn.dataset.deleteUser}`);
        showToast('User deleted', 'success');
        loadAdminUsers();
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
}

function renderAdminUsersPagination(page, pages) {
  const row = document.getElementById('adminUsersPagination');
  if (pages <= 1) { row.innerHTML = ''; return; }
  let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  html += `<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`;
  row.innerHTML = html;
  row.querySelectorAll('[data-page]').forEach((btn) =>
    btn.addEventListener('click', () => { adminUsersPage = Number(btn.dataset.page); loadAdminUsers(); })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  renderAdminLayout('users');
  loadAdminUsers();

  let debounce;
  document.getElementById('userSearchInput').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      adminUsersSearch = e.target.value.trim();
      adminUsersPage = 1;
      loadAdminUsers();
    }, 350);
  });
});
