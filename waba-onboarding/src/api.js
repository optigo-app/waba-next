// API service for backend communication

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7002';

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// Set auth token in localStorage
function setAuthToken(token) {
  localStorage.setItem('auth_token', token);
}

// Remove auth token
function removeAuthToken() {
  localStorage.removeItem('auth_token');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authAPI = {
  register: async (email, password, name) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  logout: () => {
    removeAuthToken();
  },

  getCurrentUser: async () => {
    return await apiRequest('/api/auth/me');
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  }
};

// Accounts API
export const accountsAPI = {
  getAll: async () => {
    return await apiRequest('/api/accounts');
  },

  create: async (name, phoneId, wabaId, token) => {
    return await apiRequest('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name, phoneId, wabaId, token })
    });
  },

  update: async (id, updates) => {
    return await apiRequest(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  delete: async (id) => {
    return await apiRequest(`/api/accounts/${id}`, {
      method: 'DELETE'
    });
  }
};

// WhatsApp API
// export const whatsappAPI = {
//   exchangeToken: async (code) => {
//     return await apiRequest('/api/exchange-token', {
//       method: 'POST',
//       body: JSON.stringify({ code })
//     });
//   }
// };


// WhatsApp API
export const whatsappAPI = {
  exchangeToken: async (code, phoneId, wabaId) => {  // ✅ Add params
    return await apiRequest('/api/exchange-token', {
      method: 'POST',
      body: JSON.stringify({ code, phoneId, wabaId })  // ✅ Send all
    });
  }
};