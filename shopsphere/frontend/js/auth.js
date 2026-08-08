const Auth = {
  getUser() {
    const raw = localStorage.getItem('ss_user');
    return raw ? JSON.parse(raw) : null;
  },
  getToken() {
    return localStorage.getItem('ss_token');
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  isAdmin() {
    const user = this.getUser();
    return !!user && user.role === 'admin';
  },
  saveSession(token, user) {
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
  },
  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      /* ignore network errors on logout */
    }
    this.clearSession();
    window.location.href = 'index.html';
  },
  // Redirects to login if not authenticated; returns true if the page should continue rendering
  requireAuth() {
    if (!this.isLoggedIn()) {
      const next = encodeURIComponent(window.location.pathname.split('/').pop());
      window.location.href = `login.html?next=${next}`;
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
};
