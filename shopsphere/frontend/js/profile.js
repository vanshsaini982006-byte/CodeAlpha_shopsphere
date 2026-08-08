async function loadProfile() {
  if (!Auth.requireAuth()) return;
  try {
    const { user } = await api.get('/auth/profile');
    document.getElementById('pName').value = user.name;
    document.getElementById('pEmail').value = user.email;
    document.getElementById('pPhone').value = user.phone || '';
    renderAddresses(user.addresses || []);
  } catch (err) {
    showToast(apiErrorMessage(err), 'error');
  }
}

function renderAddresses(addresses) {
  const box = document.getElementById('addressList');
  if (addresses.length === 0) {
    box.innerHTML = `<p style="color:var(--text-muted);font-size:0.88rem;">No saved addresses yet.</p>`;
    return;
  }
  box.innerHTML = addresses
    .map(
      (a) => `<div class="address-option ${a.isDefault ? 'selected' : ''}">
        <div class="flex justify-between items-center">
          <strong>${escapeHtml(a.label || 'Address')}</strong>
          <div class="flex gap-2">
            ${a.isDefault ? '<span class="badge badge-success">Default</span>' : ''}
            <button class="btn-ghost btn-sm" data-del-addr="${a._id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${escapeHtml(a.street)}, ${escapeHtml(a.city)}, ${escapeHtml(a.state)} - ${escapeHtml(a.postalCode)}, ${escapeHtml(a.country)}</p>
      </div>`
    )
    .join('');

  box.querySelectorAll('[data-del-addr]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        const res = await api.delete(`/auth/address/${btn.dataset.delAddr}`);
        renderAddresses(res.addresses);
        showToast('Address removed', 'info');
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
    })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('profile');
  renderFooter();
  loadProfile();

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    try {
      const res = await api.put('/auth/profile', {
        name: document.getElementById('pName').value.trim(),
        email: document.getElementById('pEmail').value.trim(),
        phone: document.getElementById('pPhone').value.trim()
      });
      const user = Auth.getUser();
      Auth.saveSession(Auth.getToken(), { ...user, ...res.user });
      showToast('Profile updated', 'success');
      renderNavbar('profile');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('newPassword').value;
    if (!pw) return;
    if (pw.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await api.put('/auth/profile', { password: pw });
      showToast('Password updated', 'success');
      document.getElementById('newPassword').value = '';
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });

  document.getElementById('addAddrBtn').addEventListener('click', () => {
    document.getElementById('addrForm').style.display = 'block';
  });

  document.getElementById('saveAddrBtn').addEventListener('click', async () => {
    const payload = {
      street: document.getElementById('fStreet').value.trim(),
      city: document.getElementById('fCity').value.trim(),
      state: document.getElementById('fState').value.trim(),
      postalCode: document.getElementById('fPostal').value.trim(),
      country: document.getElementById('fCountry').value.trim() || 'India',
      isDefault: document.getElementById('fDefault').checked
    };
    if (!payload.street || !payload.city || !payload.state || !payload.postalCode) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    try {
      const res = await api.post('/auth/address', payload);
      renderAddresses(res.addresses);
      document.getElementById('addrForm').style.display = 'none';
      ['fStreet', 'fCity', 'fState', 'fPostal'].forEach((id) => (document.getElementById(id).value = ''));
      showToast('Address added', 'success');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  });
});
