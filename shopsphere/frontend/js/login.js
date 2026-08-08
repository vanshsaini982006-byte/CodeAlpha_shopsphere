document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('login');
  if (Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      document.getElementById('emailError').classList.add('show');
      document.getElementById('email').classList.add('error');
      valid = false;
    } else {
      document.getElementById('emailError').classList.remove('show');
      document.getElementById('email').classList.remove('error');
    }
    if (!password) {
      document.getElementById('passwordError').classList.add('show');
      document.getElementById('password').classList.add('error');
      valid = false;
    } else {
      document.getElementById('passwordError').classList.remove('show');
      document.getElementById('password').classList.remove('error');
    }
    if (!valid) return;

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    try {
      const res = await api.post('/auth/login', { email, password }, { auth: false });
      Auth.saveSession(res.token, res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next && next !== 'login.html' ? next : (res.user.role === 'admin' ? 'admin/dashboard.html' : 'index.html');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
});
