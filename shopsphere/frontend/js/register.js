document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('register');
  if (Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let valid = true;
    const setError = (id, condition) => {
      document.getElementById(id).classList.toggle('error', !condition);
      document.getElementById(id + 'Error').classList.toggle('show', !condition);
      if (!condition) valid = false;
    };

    setError('name', name.length >= 2);
    setError('email', /^\S+@\S+\.\S+$/.test(email));
    setError('password', password.length >= 6);
    setError('confirmPassword', password === confirmPassword && confirmPassword.length > 0);

    if (!valid) return;

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      const res = await api.post('/auth/register', { name, email, phone, password }, { auth: false });
      Auth.saveSession(res.token, res.user);
      showToast(`Welcome to ShopSphere, ${res.user.name}!`, 'success');
      window.location.href = 'index.html';
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
});
