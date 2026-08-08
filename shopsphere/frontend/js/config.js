// Central place to point the frontend at the backend API.
// Change this if your backend runs on a different port/host in production.
const API_BASE_URL = (() => {
  const { hostname, protocol } = window.location;
  // If the frontend is opened via file:// or a static host, default to localhost:5000
  if (hostname === '' || protocol === 'file:') return 'https://shopsphere-backend-j75c.onrender.com/api';
  // If served from the same origin as the API (production single-service deploy)
  if (window.__API_BASE__) return window.__API_BASE__;
  return `${protocol}//${hostname}:5000/api`;
})();
