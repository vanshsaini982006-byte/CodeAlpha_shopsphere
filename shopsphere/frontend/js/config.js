const API_BASE_URL = () => {
  // Agar aap apne computer par test kar rahe hain:
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Netlify / Live deployment ke liye direct Render Backend:
  return 'https://shopsphere-backend-j75c.onrender.com/api';
};