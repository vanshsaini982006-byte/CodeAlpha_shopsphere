/**
 * Thin wrapper around fetch() that:
 *  - Prefixes API_BASE_URL
 *  - Attaches the JWT (from localStorage) as a Bearer token
 *  - Parses JSON and throws a normal Error with the server's message on failure
 */
async function apiRequest(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const token = localStorage.getItem('ss_token');
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkError) {
    throw new Error('Could not reach the server. Please check the backend is running and try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    // If token is invalid/expired, clear local session so the UI reflects logged-out state
    if (response.status === 401) {
      localStorage.removeItem('ss_token');
      localStorage.removeItem('ss_user');
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiRequest(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => apiRequest(path, { ...opts, method: 'DELETE' })
};
