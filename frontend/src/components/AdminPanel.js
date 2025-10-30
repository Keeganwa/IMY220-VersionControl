import React, { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'types') {
      fetchProjectTypes();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectTypes = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getProjectTypes();
      if (response.success) {
        setProjectTypes(response.types);
      }
    } catch (error) {
      console.error('Error fetching project types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This will also delete all their projects and data.`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleToggleAdmin = async (userId, username, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges for "${username}"?`)) {
      return;
    }

    try {
      const user = users.find(u => u._id === userId);
      await adminAPI.updateUser(userId, {
        username: user.username,
        email: user.email,
        occupation: user.occupation,
        isAdmin: !currentStatus
      });
      alert('User updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + error.message);
    }
  };

  const handleAddProjectType = async (e) => {
    e.preventDefault();
    
    if (!newType.trim()) {
      return;
    }

    try {
      const response = await adminAPI.addProjectType(newType);
      if (response.success) {
        setNewType('');
        fetchProjectTypes();
        alert('Project type added successfully');
      }
    } catch (error) {
      console.error('Error adding project type:', error);
      alert('Failed to add project type: ' + error.message);
    }
  };

  return (
    <div style={{
      backgroundColor: '#252525',
      padding: '30px',
      borderRadius: '12px',
      border: '1px solid #333'
    }}>
      <h2 style={{color: '#d4ff00', marginBottom: '30px', fontSize: '28px'}}>
        Admin Panel
      </h2>




      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '30px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? '#d4ff00' : '#888',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '10px 20px',
            borderBottom: activeTab === 'users' ? '3px solid #d4ff00' : 'none'
          }}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab('types')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'types' ? '#d4ff00' : '#888',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '10px 20px',
            borderBottom: activeTab === 'types' ? '3px solid #d4ff00' : 'none'
          }}
        >
          Project Types
        </button>
      </div>

      {isLoading ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
          Loading...
        </div>
      ) : (
        <>
          
          







          {activeTab === 'users' && (
            <div>
              <h3 style={{color: '#e0e0e0', marginBottom: '20px'}}>
                All Users ({users.length})
              </h3>
              
              {users.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                  No users found
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '15px'
                }}>
                  {users.map(user => (
                    <div key={user._id} style={{
                      backgroundColor: '#2a2a2a',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '8px'
                        }}>
                          <strong style={{color: '#5b9bff', fontSize: '16px'}}>
                            {user.username}
                          </strong>
                          {user.isAdmin && (
                            <span style={{
                              backgroundColor: '#d4ff00',
                              color: '#1a1a1a',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div style={{color: '#888', fontSize: '14px'}}>
                          {user.email} • {user.occupation}
                        </div>
                        <div style={{color: '#666', fontSize: '12px', marginTop: '5px'}}>
                          Joined: {new Date(user.createdAt).toLocaleDateString()} • 
                          Friends: {user.friends?.length || 0} • 
                          Projects: {(user.ownedProjects?.length || 0) + (user.sharedProjects?.length || 0)}
                        </div>
                      </div>
                      
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button
                          onClick={() => handleToggleAdmin(user._id, user.username, user.isAdmin)}
                          className="btn btn-secondary"
                          style={{padding: '8px 16px', fontSize: '13px'}}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          className="btn btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            backgroundColor: '#ff6b6b',
                            borderColor: '#ff6b6b'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          





          {activeTab === 'types' && (
            <div>
              <h3 style={{color: '#e0e0e0', marginBottom: '20px'}}>
                Project Types
              </h3>

              <form onSubmit={handleAddProjectType} style={{marginBottom: '30px'}}>
                <div style={{display: 'flex', gap: '10px'}}>
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Enter new project type"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      backgroundColor: '#1f1f1f',
                      border: '2px solid #333',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary"
                  >
                    Add Type
                  </button>
                </div>
              </form>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px'
              }}>
                {projectTypes.map((type, index) => (
                  <div key={index} style={{
                    backgroundColor: '#2a2a2a',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    textAlign: 'center',
                    color: '#e0e0e0'
                  }}>
                    {type}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel;