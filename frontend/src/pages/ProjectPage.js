import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { projectAPI, activityAPI, apiUtils } from '../services/api';

function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectActivities, setProjectActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [checkinData, setCheckinData] = useState({
    message: '',
    files: []
  });

  const currentUserId = localStorage.getItem('userId');

  // _____________________________________________________________
  // MARKS: Real Project Data Fetching
  // Fetches project details and activities from backend
  // Handles project loading and error states
  // _____________________________________________________________
  useEffect(() => {
    if (!apiUtils.isAuthenticated()) {
      navigate('/');
      return;
    }

    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project details
        const projectResponse = await projectAPI.getProjectById(id);
        if (projectResponse.success) {
          setProject(projectResponse.project);
        }

        // Fetch project activities
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

  // _____________________________________________________________
  // Project Checkout/Checkin Functionality
  // _____________________________________________________________
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    try {
      await projectAPI.checkoutProject(id);
      
      // Refresh project data to show checkout status
      const projectResponse = await projectAPI.getProjectById(id);
      if (projectResponse.success) {
        setProject(projectResponse.project);
      }
      
      alert('Project checked out succesfully!');
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
      alert('Please enter a check-in mesage');
      return;
    }

    try {
      await projectAPI.checkinProject(id, checkinData);
      
      // Refresh project data
      const projectResponse = await projectAPI.getProjectById(id);
      if (projectResponse.success) {
        setProject(projectResponse.project);
      }
      
      // Refresh activities
      const activitiesResponse = await activityAPI.getProjectActivities(id, 20);
      if (activitiesResponse.success) {
        setProjectActivities(activitiesResponse.activities);
      }
      
      setShowCheckinForm(false);
      setCheckinData({ message: '', files: [] });
      alert('Project checked in succesfully!');
      
    } catch (error) {
      console.error('Checkin error:', error);
      alert('Failed to checkin project: ' + error.message);
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
          <div style={{textAlign: 'center', padding: '40px', color: '#b0b0b0'}}>
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
          <div style={{textAlign: 'center', padding: '40px', color: '#ff6b6b'}}>
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
          <div style={{textAlign: 'center', padding: '40px', color: '#ff6b6b'}}>
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
                {canUserEdit() && (
                  <button className="btn btn-secondary">Edit Project</button>
                )}
              </div>
              
              <div className="project-meta">
                <span>Created by: <strong style={{color: '#5b9bff'}}>{project.creator?.username}</strong></span>
              </div>

              {project.collaborators && project.collaborators.length > 0 && (
                <div className="project-meta">
                  <span>Colaborators: </span>
                  {project.collaborators.map((collab, index) => (
                    <span key={collab._id}>
                      <strong style={{color: '#5b9bff'}}>{collab.username}</strong>
                      {index < project.collaborators.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}

              <div style={{marginTop: '20px', marginBottom: '20px'}}>
                <h3 style={{color: '#d4ff00', marginBottom: '10px'}}>Description</h3>
                <p style={{color: '#b0b0b0', lineHeight: '1.6'}}>{project.description}</p>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div style={{marginBottom: '20px'}}>
                  <h3 style={{color: '#d4ff00', marginBottom: '10px'}}>Tags</h3>
                  <div className="project-tags">
                    {project.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="project-meta">
                <span>Created: {formatDate(project.createdAt)}</span>
                <span>•</span>
                <span>Last Modified: {formatDate(project.updatedAt)}</span>
                <span>•</span>
                <span style={{color: project.isPublic ? '#51cf66' : '#888'}}>
                  {project.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              {/* Checkout/Checkin Controls */}
              {canUserEdit() && (
                <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px'}}>
                  {project.checkedOutBy ? (
                    <div>
                      <p style={{color: '#ffa94d', marginBottom: '10px'}}>
                        Project checked out by: <strong>{project.checkedOutBy.username}</strong>
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

            {/* Checkin Form */}
            {showCheckinForm && (
              <div className="project-info-card">
                <h3 style={{color: '#d4ff00', marginBottom: '20px'}}>Check In Changes</h3>
                <form onSubmit={handleCheckinSubmit}>
                  <div className="form-group">
                    <label htmlFor="checkinMessage">Check-in Message</label>
                    <textarea
                      id="checkinMessage"
                      value={checkinData.message}
                      onChange={(e) => setCheckinData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      placeholder="Describe the changes you made..."
                      required
                      style={{minHeight: '100px'}}
                    />
                  </div>
                  
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button type="submit" className="btn btn-secondary">
                      Check In Project
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => setShowCheckinForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Files Section */}
            <div className="project-info-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h3 style={{color: '#d4ff00'}}>Files ({project.files?.length || 0})</h3>
              </div>
              
              <div className="files-list">
                {project.files && project.files.length > 0 ? (
                  project.files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div>
                        <div style={{color: '#e0e0e0', fontWeight: '500'}}>{file.name}</div>
                        <div style={{color: '#888', fontSize: '12px', marginTop: '4px'}}>
                          {file.size} • Uploaded by {file.uploadedBy?.username} • {formatDate(file.uploadedAt)}
                        </div>
                      </div>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button className="btn btn-secondary" style={{padding: '6px 15px', fontSize: '12px'}}>
                          Download
                        </button>
                        <button className="btn btn-primary" style={{padding: '6px 15px', fontSize: '12px'}}>
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                    No files uploaded yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="activity-feed">
            <h3>Project Activity</h3>
            <p style={{color: '#888', fontSize: '14px', marginBottom: '20px'}}>
              Recent check-ins and project changes
            </p>
            {projectActivities.length === 0 ? (
              <div style={{color: '#888', padding: '20px', textAlign: 'center'}}>
                No activity yet
              </div>
            ) : (
              projectActivities.map((activity, index) => (
                <div key={activity._id || index} className="activity-item">
                  <span className="activity-user">{activity.user?.username}</span>
                  {' '}
                  <span className={`activity-action ${activity.action}`}>
                    {activity.action.replace('_', ' ')}
                  </span>
                  {' '}
                  {activity.fileName && <strong>{activity.fileName}</strong>}
                  {activity.message && (
                    <div style={{fontSize: '13px', color: '#b0b0b0', marginTop: '5px', fontStyle: 'italic'}}>
                      "{activity.message}"
                    </div>
                  )}
                  <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              ))
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default ProjectPage;