
// _____________________________________________________________
// MARKS: Frontend API Service Layer
// Centralized API calls to backend endpoints
// Handles authentication, projects, users, and activites
// _____________________________________________________________

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const makeRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// _____________________________________________________________
// MARKS: Authentication API Calls
// Login, signup, and user profile managment
// _____________________________________________________________

export const authAPI = {
  // User registration
  signup: async (userData) => {
    return await makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // User login
  signin: async (credentials) => {
    return await makeRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  // Get current user profile
  getCurrentUser: async () => {
    return await makeRequest('/auth/me');
  }
};

// _____________________________________________________________
// MARKS: User Management API Calls
// User profiles, friend requests, and user search
// _____________________________________________________________

export const userAPI = {
  // Get all users with optional search
  getUsers: async (searchTerm = '') => {
    const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    return await makeRequest(`/users${query}`);
  },

  // Get specific user profile
  getUserById: async (userId) => {
    return await makeRequest(`/users/${userId}`);
  },

  // Update current user profile
  updateProfile: async (profileData) => {
    return await makeRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Send friend request
  sendFriendRequest: async (userId) => {
    return await makeRequest(`/users/${userId}/friend-request`, {
      method: 'POST'
    });
  },

  // Accept friend request
  acceptFriendRequest: async (userId) => {
    return await makeRequest(`/users/accept-friend/${userId}`, {
      method: 'POST'
    });
  },

  // Unfriend user
  unfriend: async (userId) => {
    return await makeRequest(`/users/unfriend/${userId}`, {
      method: 'DELETE'
    });
  }
};

// _____________________________________________________________
// MARKS: Project Management API Calls
// Project CRUD operations, checkout/checkin, and colaboration
// _____________________________________________________________

export const projectAPI = {
  // Get projects with optional feed type and search
  getProjects: async (feed = 'global', searchTerm = '') => {
    const params = new URLSearchParams({
      feed,
      ...(searchTerm && { search: searchTerm })
    });
    return await makeRequest(`/projects?${params}`);
  },

  // Get specific project
  getProjectById: async (projectId) => {
    return await makeRequest(`/projects/${projectId}`);
  },

  // Create new project
  createProject: async (projectData) => {
    return await makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    return await makeRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  },

  // Delete project
  deleteProject: async (projectId) => {
    return await makeRequest(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  },

  // Checkout project for editing
  checkoutProject: async (projectId) => {
    return await makeRequest(`/projects/${projectId}/checkout`, {
      method: 'POST'
    });
  },

  // Checkin project with changes
  checkinProject: async (projectId, checkinData) => {
    return await makeRequest(`/projects/${projectId}/checkin`, {
      method: 'POST',
      body: JSON.stringify(checkinData)
    });
  }
};

// _____________________________________________________________
// MARKS: Activity Feed API Calls
// Retrieve activity feeds for diferent contexts
// _____________________________________________________________

export const activityAPI = {
  // Get activity feed (local or global)
  getActivities: async (feed = 'global', limit = 50) => {
    const params = new URLSearchParams({ feed, limit: limit.toString() });
    return await makeRequest(`/activities?${params}`);
  },

  // Get activities for specific project
  getProjectActivities: async (projectId, limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    return await makeRequest(`/activities/project/${projectId}?${params}`);
  },

  // Get activities for specific user
  getUserActivities: async (userId, limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    return await makeRequest(`/activities/user/${userId}?${params}`);
  }
};

// _____________________________________________________________
// MARKS: Utility Functions
// Helper functions for token managment and API status
// _____________________________________________________________

export const apiUtils = {
  // Check if user is logged in
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  },

  // Check API health
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, message: 'API unavailable' };
    }
  }
};