import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { projectAPI, activityAPI, apiUtils, userAPI } from '../services/api';
import DiscussionBoard from '../components/DiscussionBoard';
import UserLink from '../components/UserLink';
import EditProject from '../components/EditProject';

function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showRelinquishModal, setShowRelinquishModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedNewOwner, setSelectedNewOwner] = useState('');
  const [project, setProject] = useState(null);
  const [projectActivities, setProjectActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [checkinData, setCheckinData] = useState({
    message: '',
    files: [],
    version: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState('');

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    if (!apiUtils.isAuthenticated()) {
      navigate('/');
      return;
    }

    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const projectResponse = await projectAPI.getProjectById(id);
        if (projectResponse.success) {
          setProject(projectResponse.project);
        }

        const activitiesResponse = await activityAPI.getProjectActivities(id, 20);
        if (activitiesResponse.success) {
          setProjectActivities(activitiesResponse.activities);
        }

      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(error.message || 'Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [id, navigate]);

  const canUserEdit = () => {
    if (!project || !currentUserId) return false;
    if (!project.creator) return false;

    const creatorId = typeof project.creator === 'object' ? project.creator._id : project.creator;

    return creatorId === currentUserId ||
      project.collaborators?.some(collab => {
        const collabId = typeof collab === 'object' ? collab._id : collab;
        return collabId === currentUserId;
      });
  };

  const isProjectOwner = () => {
    if (!project || !currentUserId) return false;
    if (!project.creator) return false;

    const creatorId = typeof project.creator === 'object' ? project.creator._id : project.creator;
    return creatorId === currentUserId;
  };

  const isCheckedOutByCurrentUser = () => {
    if (!project || !currentUserId) return false;
    if (!project.checkedOutBy) return false;

    const checkedOutById = typeof project.checkedOutBy === 'object'
      ? project.checkedOutBy._id
      : project.checkedOutBy;

    return checkedOutById === currentUserId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }) + ' - ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/home?search=${encodeURIComponent(tag)}`);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed 50MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }

    setSelectedFiles(files);
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('You must type "DELETE" exactly to confirm.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await projectAPI.deleteProject(id);
      if (response.success) {
        alert('Project deleted successfully!');
        navigate('/home');
      }
    } catch (error) {
      alert('Failed to delete project: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) {
      alert('Please select a new owner');
      return;
    }

    const confirmTransfer = window.confirm(
      'Are you sure you want to transfer ownership of this project? You will become a collaborator instead.'
    );

    if (!confirmTransfer) {
      return;
    }

    try {
      const response = await projectAPI.transferOwnership(id, selectedNewOwner);

      if (response.success) {
        alert('Ownership transferred successfully!');
        setShowTransferModal(false);
        setSelectedNewOwner('');

        const projectResponse = await projectAPI.getProjectById(id);
        if (projectResponse.success) {
          setProject(projectResponse.project);
        }

        const activitiesResponse = await activityAPI.getProjectActivities(id, 20);
        if (activitiesResponse.success) {
          setProjectActivities(activitiesResponse.activities);
        }
      }
    } catch (error) {
      console.error('Transfer ownership error:', error);
      alert('Failed to transfer ownership: ' + error.message);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      await projectAPI.checkoutProject(id);

      const projectResponse = await projectAPI.getProjectById(id);
      if (projectResponse.success) {
        setProject(projectResponse.project);
      }

      alert('Project checked out successfully! You can now download files, edit them, and check them back in.');

      handleDownloadAllFiles();

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to checkout project: ' + error.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();

    if (!checkinData.message.trim()) {
      alert('Please enter a check-in message');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('message', checkinData.message);

      if (checkinData.version) {
        formData.append('version', checkinData.version);
      }

      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const projectResponse = await projectAPI.getProjectById(id);
        if (projectResponse.success) {
          setProject(projectResponse.project);
        }

        const activitiesResponse = await activityAPI.getProjectActivities(id, 20);
        if (activitiesResponse.success) {
          setProjectActivities(activitiesResponse.activities);
        }

        setShowCheckinForm(false);
        setCheckinData({ message: '', files: [], version: '' });
        setSelectedFiles([]);

        if (selectedFiles.length > 0) {
          alert('Project checked in successfully! All files have been replaced with your uploaded files.');
        } else {
          alert('Project checked in successfully! No files were changed.');
        }
      } else {
        throw new Error(data.message);
      }

    } catch (error) {
      console.error('Checkin error:', error);
      alert('Failed to checkin project: ' + error.message);
    }
  };

  const handleDownloadAllFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const downloadUrl = `http://localhost:5000/api/projects/${id}/download-all`;

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download files');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}_files.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('All files downloaded successfully');
    } catch (error) {
      console.error('Download all files error:', error);
      alert('Failed to download all files: ' + error.message);
    }
  };

  const handleRelinquishOwnership = async () => {
    try {
      const response = await projectAPI.relinquishOwnership(id);

      if (response.success) {
        alert('You have left the project. Ownership has been transferred to the first collaborator.');
        navigate('/home');
      }
    } catch (error) {
      console.error('Relinquish ownership error:', error);
      alert('Failed to leave project: ' + error.message);
    }
  };

  const handleDownloadFile = async (fileName) => {
    try {
      const downloadUrl = `http://localhost:5000/api/projects/${id}/files/${encodeURIComponent(fileName)}`;

      const token = localStorage.getItem('token');
      if (token) {
        fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => response.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          })
          .catch(error => {
            console.error('Download error:', error);
            alert('Failed to download file');
          });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file: ' + error.message);
    }
  };

 
  const fetchAvailableUsers = async () => {
    try {
      const currentUserProfile = await userAPI.getUserById(currentUserId);
      
      if (currentUserProfile.success && currentUserProfile.user.friends) {
        const availableFriends = currentUserProfile.user.friends.filter(friend => 
          !project.collaborators.some(collab => 
            (typeof collab === 'object' ? collab._id : collab) === friend._id
          )
        );
        
        setAvailableUsers(availableFriends);
      } else {
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setAvailableUsers([]);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedCollaborator) {
      alert('Please select a friend to add');
      return;
    }

    try {
      const response = await projectAPI.addCollaborator(project._id, selectedCollaborator);
      
      if (response.success) {
        alert('Friend added as collaborator successfully!');
        setShowAddCollaboratorModal(false);
        setSelectedCollaborator('');
        
        const projectResponse = await projectAPI.getProjectById(id);
        if (projectResponse.success) {
          setProject(projectResponse.project);
        }

        const activitiesResponse = await activityAPI.getProjectActivities(id, 20);
        if (activitiesResponse.success) {
          setProjectActivities(activitiesResponse.activities);
        }
      }
    } catch (error) {
      console.error('Add collaborator error:', error);
      alert('Failed to add collaborator: ' + error.message);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const response = await projectAPI.removeCollaborator(project._id, collaboratorId);
      
      if (response.success) {
        alert('Collaborator removed successfully!');
        
        const projectResponse = await projectAPI.getProjectById(id);
        if (projectResponse.success) {
          setProject(projectResponse.project);
        }
      }
    } catch (error) {
      console.error('Remove collaborator error:', error);
      alert('Failed to remove collaborator: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <main className="page-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#b0b0b0' }}>
            Loading project...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <main className="page-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
            <p>Error: {error}</p>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Header />
        <main className="page-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
            Project not found
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="project-container">
          <div className="project-main">
            <div className="project-info-card">
              <div className="project-header-info">
                <h1>{project.name}</h1>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {canUserEdit() && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowEditForm(true)}
                    >
                      Edit Project
                    </button>
                  )}

                  {isProjectOwner() && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          fetchAvailableUsers();
                          setShowAddCollaboratorModal(true);
                        }}
                        style={{
                          backgroundColor: '#51cf66',
                          borderColor: '#51cf66'
                        }}
                      >
                        Add Collaborator
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => setShowDeleteModal(true)}
                        style={{
                          backgroundColor: '#ff4444',
                          borderColor: '#ff4444'
                        }}
                      >
                        Delete Project
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => setShowRelinquishModal(true)}
                        style={{
                          backgroundColor: '#ff9800',
                          borderColor: '#ff9800'
                        }}
                      >
                        Leave Project
                      </button>

                      {project.collaborators && project.collaborators.length > 0 && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowTransferModal(true)}
                          style={{
                            backgroundColor: '#ffa94d',
                            borderColor: '#ffa94d'
                          }}
                        >
                          Transfer Ownership
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {project.image && (
                <div style={{
                  width: '100%',
                  maxWidth: '400px',
                  marginTop: '20px',
                  marginBottom: '20px'
                }}>
                  <img
                    src={`http://localhost:5000${project.image}`}
                    alt={project.name}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '2px solid #333',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      if (e.target.style.transform === 'scale(1.5)') {
                        e.target.style.transform = 'scale(1)';
                      } else {
                        e.target.style.transform = 'scale(1.5)';
                      }
                      e.target.style.transition = 'transform 0.3s';
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="project-meta">
                <span>Created by: <UserLink user={project.creator} style={{ fontWeight: 'bold' }} /></span>
              </div>

              {project.collaborators && project.collaborators.length > 0 && (
                <div className="project-meta">
                  <span>Collaborators: </span>
                  {project.collaborators.map((collab, index) => (
                    <span key={collab._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <UserLink user={collab} style={{ fontWeight: 'bold' }} />
                      {isProjectOwner() && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '0 5px',
                            lineHeight: '1'
                          }}
                          title="Remove collaborator"
                        >
                          x
                        </button>
                      )}
                      {index < project.collaborators.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: '#d4ff00', marginBottom: '10px' }}>Description</h3>
                <p style={{ color: '#b0b0b0', lineHeight: '1.6' }}>{project.description}</p>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#d4ff00', marginBottom: '10px' }}>Tags</h3>
                  <div className="project-tags">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="tag"
                        onClick={() => handleTagClick(tag)}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.backgroundColor = 'rgba(212, 255, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.backgroundColor = 'rgba(212, 255, 0, 0.1)';
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="project-meta">
                <span>Created: {formatDate(project.createdAt)}</span>
                <span>•</span>
                <span>Last Modified: {formatDate(project.updatedAt)}</span>
                <span>•</span>
                <span>Version: {project.version || '1.0.0'}</span>
                <span>•</span>
                <span style={{ color: project.isPublic ? '#51cf66' : '#888' }}>
                  {project.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              {canUserEdit() && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                  {project.checkedOutBy ? (
                    <div>
                      <p style={{ color: '#ffa94d', marginBottom: '10px' }}>
                        Project checked out by: <UserLink user={project.checkedOutBy} style={{ fontWeight: 'bold', color: '#ffa94d' }} />
                      </p>
                      {isCheckedOutByCurrentUser() && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowCheckinForm(true)}
                        >
                          Check In Changes
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? 'Checking Out...' : 'Check Out for Editing'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {showEditForm && (
              <EditProject
                project={project}
                onClose={() => setShowEditForm(false)}
                onSave={async (updatedProject) => {
                  setProject(updatedProject);
                  setShowEditForm(false);

                  try {
                    const projectResponse = await projectAPI.getProjectById(id);
                    if (projectResponse.success) {
                      setProject(projectResponse.project);
                    }
                  } catch (error) {
                    console.error('Error refreshing project:', error);
                  }
                }}
              />
            )}

            {showCheckinForm && (
              <div className="project-info-card">
                <h3 style={{ color: '#d4ff00', marginBottom: '20px' }}>Check In Changes</h3>

                <form onSubmit={handleCheckinSubmit}>
                  <div className="form-group">
                    <label htmlFor="checkinMessage">Check-in Message *</label>
                    <textarea
                      id="checkinMessage"
                      value={checkinData.message}
                      onChange={(e) => setCheckinData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      placeholder="Describe the changes you made..."
                      required
                      style={{ minHeight: '100px' }}
                    />
                    <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                      Briefly describe what you changed or updated
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newVersion">New Version</label>
                    <input
                      type="text"
                      id="newVersion"
                      value={checkinData.version || project.version}
                      onChange={(e) => setCheckinData(prev => ({
                        ...prev,
                        version: e.target.value
                      }))}
                      placeholder="1.0.1"
                    />
                    <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                      Current version: {project.version} • Format: Major.Minor.Patch (e.g., 1.0.1)
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkinFiles">Upload Updated Project Files (Optional)</label>
                    <input
                      type="file"
                      id="checkinFiles"
                      multiple
                      onChange={handleFileChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#1f1f1f',
                        border: '2px solid #333',
                        borderRadius: '8px',
                        color: '#e0e0e0',
                        fontSize: '14px'
                      }}
                    />
                    {selectedFiles.length > 0 ? (
                      <div style={{ marginTop: '10px' }}>
                        <small style={{ color: '#d4ff00', display: 'block', marginBottom: '5px' }}>
                          ✓ {selectedFiles.length} file(s) selected - These will REPLACE all current files:
                        </small>
                        <ul style={{ color: '#b0b0b0', fontSize: '13px', marginTop: '5px', paddingLeft: '20px' }}>
                          {selectedFiles.map((file, index) => (
                            <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '10px',
                        padding: '12px',
                        backgroundColor: '#1f1f1f',
                        borderRadius: '6px',
                        borderLeft: '3px solid #ffa94d'
                      }}>
                        <small style={{ color: '#b0b0b0', fontSize: '12px', display: 'block' }}>
                          <strong style={{ color: '#ffa94d' }}>No files selected:</strong> Project files will remain unchanged.
                          Only version and message will be updated.
                        </small>
                      </div>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="error-message" style={{ marginBottom: '15px' }}>
                      {errors.submit}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Checking In...' : 'Check In Project'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowCheckinForm(false);
                        setSelectedFiles([]);
                        setCheckinData({ message: '', files: [], version: '' });
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="project-info-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#d4ff00' }}>Files ({project.files?.length || 0})</h3>

                {project.files && project.files.length > 0 && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleDownloadAllFiles}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Download All Files as ZIP
                  </button>
                )}
              </div>

              <div className="files-list">
                {project.files && project.files.length > 0 ? (
                  project.files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div>
                        <div style={{ color: '#e0e0e0', fontWeight: '500' }}>{file.name}</div>
                        <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                          {file.size} • Uploaded by <UserLink user={file.uploadedBy} style={{ fontSize: '12px' }} /> • {formatDate(file.uploadedAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 15px', fontSize: '12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file.name);
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    No files uploaded yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="activity-feed">
            <h3>Project Activity</h3>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
              Recent check-ins and project changes
            </p>
            {projectActivities.length === 0 ? (
              <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>
                No activity yet
              </div>
            ) : (
              projectActivities.map((activity, index) => (
                <div key={activity._id || index} className="activity-item">
                  <UserLink user={activity.user} className="activity-user" />
                  {' '}
                  <span className={`activity-action ${activity.action}`}>
                    {activity.action.replace('_', ' ')}
                  </span>
                  {' '}
                  {activity.fileName && <strong>{activity.fileName}</strong>}
                  {activity.message && (
                    <div style={{ fontSize: '13px', color: '#b0b0b0', marginTop: '5px', fontStyle: 'italic' }}>
                      "{activity.message}"
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              ))
            )}
          </aside>
        </div>

        <div style={{ marginTop: '30px' }}>
          <DiscussionBoard projectId={id} />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              borderRadius: '12px',
              border: '2px solid #ff4444',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ color: '#ff4444', marginBottom: '20px' }}>
                 Delete Project
              </h2>

              <p style={{ color: '#b0b0b0', marginBottom: '20px', lineHeight: '1.6' }}>
                You are about to permanently delete <strong style={{ color: '#d4ff00' }}>"{project.name}"</strong>.
              </p>

              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #ff4444'
              }}>
                <p style={{ color: '#ff6b6b', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  This will permanently delete:
                </p>
                <ul style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '10px', paddingLeft: '20px' }}>
                  <li>All project files</li>
                  <li>All project activity history</li>
                  <li>All discussions</li>
                  <li>The project itself</li>
                </ul>
                <p style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '10px', marginBottom: 0 }}>
                  This action CANNOT be undone!
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="deleteConfirm">
                  Type <strong style={{ color: '#ff4444' }}>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#1f1f1f',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmText !== 'DELETE' || isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: deleteConfirmText === 'DELETE' ? '#ff4444' : '#666',
                    borderColor: deleteConfirmText === 'DELETE' ? '#ff4444' : '#666',
                    cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isLoading ? 'Deleting...' : 'Delete Forever'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      
        {showTransferModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              borderRadius: '12px',
              border: '2px solid #333',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ color: '#d4ff00', marginBottom: '20px' }}>
                Transfer Project Ownership
              </h2>

              <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>
                Select a collaborator to become the new owner of this project. You will become a collaborator.
              </p>

              <div className="form-group">
                <label htmlFor="newOwner">Select New Owner</label>
                <select
                  id="newOwner"
                  value={selectedNewOwner}
                  onChange={(e) => setSelectedNewOwner(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#1f1f1f',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select a collaborator --</option>
                  {project.collaborators && project.collaborators.map((collab) => (
                    <option key={collab._id} value={collab._id}>
                      {collab.username}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleTransferOwnership}
                  disabled={!selectedNewOwner}
                  style={{ flex: 1 }}
                >
                  Transfer Ownership
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedNewOwner('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

     
        {showRelinquishModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              borderRadius: '12px',
              border: '2px solid #ff9800',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ color: '#ff9800', marginBottom: '20px' }}>
                Leave Project
              </h2>

              <p style={{ color: '#b0b0b0', marginBottom: '20px', lineHeight: '1.6' }}>
                You are about to leave <strong style={{ color: '#d4ff00' }}>"{project.name}"</strong>
                and give up ownership.
              </p>

              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #ff9800'
              }}>
                <p style={{ color: '#ffb74d', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                  What will happen:
                </p>
                <ul style={{ color: '#ffb74d', fontSize: '14px', paddingLeft: '20px', marginBottom: '10px' }}>
                  <li>Ownership will be transferred to: <strong>{project.collaborators[0]?.username}</strong></li>
                  <li>You will be removed from the project completely</li>
                  <li>You will lose all access to this project</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic', marginBottom: '20px' }}>
                If you want to stay as a collaborator, use "Transfer Ownership" instead.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleRelinquishOwnership}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: '#ff9800',
                    borderColor: '#ff9800'
                  }}
                >
                  {isLoading ? 'Leaving...' : 'Leave Project'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowRelinquishModal(false)}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

       
        {showAddCollaboratorModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              borderRadius: '12px',
              border: '2px solid #51cf66',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ color: '#51cf66', marginBottom: '20px' }}>
                Add Friend as Collaborator
              </h2>

              <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>
                Select a friend to add as a collaborator to this project.
              </p>

              <div className="form-group">
                <label htmlFor="collaborator">Select Friend</label>
                <select
                  id="collaborator"
                  value={selectedCollaborator}
                  onChange={(e) => setSelectedCollaborator(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#1f1f1f',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select a friend --</option>
                  {availableUsers.map((friend) => (
                    <option key={friend._id} value={friend._id}>
                      {friend.username} ({friend.email})
                    </option>
                  ))}
                </select>
              </div>

              {availableUsers.length === 0 && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '6px',
                  borderLeft: '3px solid #ffa94d'
                }}>
                  <p style={{ color: '#ffa94d', fontSize: '14px', margin: 0 }}>
                    <strong>No friends available to add.</strong>
                  </p>
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '5px', marginBottom: 0 }}>
                    All your friends are already collaborators, or you have no friends yet. 
                    Add friends first to collaborate with them!
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleAddCollaborator}
                  disabled={!selectedCollaborator}
                  style={{ 
                    flex: 1,
                    backgroundColor: selectedCollaborator ? '#51cf66' : '#666',
                    borderColor: selectedCollaborator ? '#51cf66' : '#666',
                    cursor: selectedCollaborator ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Collaborator
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowAddCollaboratorModal(false);
                    setSelectedCollaborator('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectPage;