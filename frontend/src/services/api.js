const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const makeRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = token ? {
    'Authorization': `Bearer ${token}`
  } : {};

  // Don't add Content-Type for FormData (browser sets it automatically with boundary)
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    headers: {
      ...defaultHeaders,
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
// Authentication 
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
// User Management 
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
  },

  // Delete own profile
  deleteOwnProfile: async () => {
    return await makeRequest('/users/profile', {
      method: 'DELETE'
    });
  }
};

// _____________________________________________________________
// Project Management
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

  // Create new project (with FormData for file upload)
  createProject: async (projectData) => {
    const isFormData = projectData instanceof FormData;
    
    return await makeRequest('/projects', {
      method: 'POST',
      body: isFormData ? projectData : JSON.stringify(projectData)
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
  },

  // Add collaborator to project
  addCollaborator: async (projectId, userId) => {
    return await makeRequest(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Remove collaborator from project
  removeCollaborator: async (projectId, userId) => {
    return await makeRequest(`/projects/${projectId}/collaborators/${userId}`, {
      method: 'DELETE'
    });
  },

  // Download file
  downloadFile: async (projectId, fileName) => {
    return await makeRequest(`/projects/${projectId}/files/${encodeURIComponent(fileName)}`);
  },
  
  
  transferOwnership: async (projectId, newOwnerId) => {
    return await makeRequest(`/projects/${projectId}/transfer-ownership`, {
      method: 'PUT',
      body: JSON.stringify({ newOwnerId })
    });
  }
};

// _____________________________________________________________
// Activity Feed
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
,
  searchActivities: async (query) => {
    const params = new URLSearchParams({ query });
    return await makeRequest(`/activities/search?${params}`);
  }
};

// _____________________________________________________________
// Discussion Board
// _____________________________________________________________

export const discussionAPI = {
  // Get discussions for a project
  getProjectDiscussions: async (projectId) => {
    return await makeRequest(`/discussions/project/${projectId}`);
  },

  // Create new discussion/comment
  createDiscussion: async (discussionData) => {
    return await makeRequest('/discussions', {
      method: 'POST',
      body: JSON.stringify(discussionData)
    });
  },

  // Update discussion
  updateDiscussion: async (discussionId, message) => {
    return await makeRequest(`/discussions/${discussionId}`, {
      method: 'PUT',
      body: JSON.stringify({ message })
    });
  },

  // Delete discussion
  deleteDiscussion: async (discussionId) => {
    return await makeRequest(`/discussions/${discussionId}`, {
      method: 'DELETE'
    });
  }
};

// _____________________________________________________________
// Admin Management
// _____________________________________________________________

export const adminAPI = {
  // Get all users
  getAllUsers: async () => {
    return await makeRequest('/admin/users');
  },

  // Delete user
  deleteUser: async (userId) => {
    return await makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Update user
  updateUser: async (userId, userData) => {
    return await makeRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Delete project
  deleteProject: async (projectId) => {
    return await makeRequest(`/admin/projects/${projectId}`, {
      method: 'DELETE'
    });
  },

  // Delete activity
  deleteActivity: async (activityId) => {
    return await makeRequest(`/admin/activities/${activityId}`, {
      method: 'DELETE'
    });
  },

  // Get project types
  getProjectTypes: async () => {
    return await makeRequest('/admin/project-types');
  },

  // Add project type
  addProjectType: async (typeName) => {
    return await makeRequest('/admin/project-types', {
      method: 'POST',
      body: JSON.stringify({ typeName })
    });
  }
};

// _____________________________________________________________
// Helper Functions
// _____________________________________________________________

export const apiUtils = {
  // Check if user is logged in
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Get current user ID
  getCurrentUserId: () => {
    return localStorage.getItem('userId');
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/';
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