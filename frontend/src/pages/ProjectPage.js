import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { projectAPI, activityAPI, apiUtils } from '../services/api';
import DiscussionBoard from '../components/DiscussionBoard';
import UserLink from '../components/UserLink';

function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');
  const [project, setProject] = useState(null);
  const [projectActivities, setProjectActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [checkinData, setCheckinData] = useState({
    message: '',
    files: [],
    version: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

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

  const isProjectOwner = () => {
    return project?.creator?._id === currentUserId;
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      await projectAPI.checkoutProject(id);

      const projectResponse = await projectAPI.getProjectById(id);
      if (projectResponse.success) {
        setProject(projectResponse.project);
      }

      alert('Project checked out successfully! You can now download all files, edit them locally, and check them back in.');
      
      // Automatically trigger download all files
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

    if (selectedFiles.length === 0) {
      alert('Please upload at least one file to check in');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('message', checkinData.message);

      if (checkinData.version) {
        formData.append('version', checkinData.version);
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

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
        alert('Project checked in successfully! All files have been replaced with your uploaded files.');
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

  const canUserEdit = () => {
    if (!project || !currentUserId) return false;
    return project.creator._id === currentUserId ||
      project.collaborators.some(collab => collab._id === currentUserId);
  };

  const isCheckedOutByCurrentUser = () => {
    return project?.checkedOutBy?._id === currentUserId;
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
                <div style={{ display: 'flex', gap: '10px' }}>
                  {canUserEdit() && (
                    <button className="btn btn-secondary">Edit Project</button>
                  )}
                  {isProjectOwner() && project.collaborators && project.collaborators.length > 0 && (
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
                    <span key={collab._id}>
                      <UserLink user={collab} style={{ fontWeight: 'bold' }} />
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

            {showCheckinForm && (
              <div className="project-info-card">
                <h3 style={{ color: '#d4ff00', marginBottom: '20px' }}>Check In Changes</h3>
                <div style={{ 
                  backgroundColor: '#1f1f1f', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  borderLeft: '4px solid #d4ff00'
                }}>
                  <p style={{ color: '#b0b0b0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    <strong style={{ color: '#d4ff00' }}>Important:</strong> When you check in, ALL current project files will be REPLACED with the files you upload. 
                    Make sure you upload your complete edited project.
                  </p>
                </div>
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
                  </div>

                  <div className="form-group">
                    <label htmlFor="newVersion">New Version *</label>
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
                      Current version: {project.version} • Format: Major.Minor.Patch
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkinFiles">Upload Project Files (Required - Will replace all current files) *</label>
                    <input
                      type="file"
                      id="checkinFiles"
                      multiple
                      required
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
                    {selectedFiles.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <small style={{ color: '#888' }}>
                          {selectedFiles.length} file(s) selected (these will replace all current project files):
                        </small>
                        <ul style={{ color: '#b0b0b0', fontSize: '13px', marginTop: '5px', paddingLeft: '20px' }}>
                          {selectedFiles.map((file, index) => (
                            <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-secondary">
                      Check In Project
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowCheckinForm(false);
                        setSelectedFiles([]);
                      }}
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
      </main>
    </div>
  );
}

export default ProjectPage;