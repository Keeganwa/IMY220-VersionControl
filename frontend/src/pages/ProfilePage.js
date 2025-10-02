import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProjectPreview from '../components/ProjectPreview';
import CreateProject from '../components/CreateProject';
import EditProfile from '../components/EditProfile';
import { userAPI, activityAPI, projectAPI, apiUtils } from '../services/api';

function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = id === currentUserId;

  // _____________________________________________________________
  // MARKS: Real User Profile Data Fetching
  // Fetches user profile, projects, and activities from backend
  // Handles both own profile and other user profiles
  // _____________________________________________________________
  useEffect(() => {
    if (!apiUtils.isAuthenticated()) {
      navigate('/');
      return;
    }

    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user profile
        const userResponse = await userAPI.getUserById(id);
        if (userResponse.success) {
          setProfile(userResponse.user);
        }

        // Fetch user activities
        const activitiesResponse = await activityAPI.getUserActivities(id, 10);
        if (activitiesResponse.success) {
          setUserActivities(activitiesResponse.activities);
        }

        // Extract projects from profile data
        if (userResponse.success && userResponse.user) {
          const allProjects = [
            ...(userResponse.user.ownedProjects || []),
            ...(userResponse.user.sharedProjects || [])
          ];
          setUserProjects(allProjects);
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.message || 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [id, navigate]);

  const handleCreateProject = async (projectData) => {
    console.log('Project created:', projectData);
    setShowCreateProject(false);
    
    // Refresh profile data to include new project
    try {
      const userResponse = await userAPI.getUserById(id);
      if (userResponse.success) {
        setProfile(userResponse.user);
        const allProjects = [
          ...(userResponse.user.ownedProjects || []),
          ...(userResponse.user.sharedProjects || [])
        ];
        setUserProjects(allProjects);
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await userAPI.sendFriendRequest(id);
      alert('Friend request sent succesfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request: ' + error.message);
    }
  };

  const handleUnfriend = async () => {
    if (window.confirm('Are you sure you want to unfriend this user?')) {
      try {
        await userAPI.unfriend(id);
        alert('User unfriended succesfully');
        // Refresh profile data
        window.location.reload();
      } catch (error) {
        console.error('Error unfriending user:', error);
        alert('Failed to unfriend user: ' + error.message);
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectAPI.deleteProject(projectId);
        alert('Project deleted succesfully');
        // Refresh profile data
        window.location.reload();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project: ' + error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <main className="page-container">
          <div style={{textAlign: 'center', padding: '40px', color: '#b0b0b0'}}>
            Loading profile...
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

  if (!profile) {
    return (
      <div>
        <Header />
        <main className="page-container">
          <div style={{textAlign: 'center', padding: '40px', color: '#ff6b6b'}}>
            User not found
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="profile-container">
          <aside className="profile-sidebar">
            <div className="profile-avatar">
              <svg viewBox="0 0 24 24" fill="#666">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            
            <div className="profile-info">
              <h2>{profile.username}</h2>
              
              <div className="profile-details">
                <h3>Details</h3>
                <div className="profile-detail-item">
                  <strong>Date Of Birth:</strong>
                  <span>{formatDate(profile.dateOfBirth)}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>Occupation:</strong>
                  <span>{profile.occupation}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>Friends:</strong>
                  <span>
                    {profile.friends?.length > 0 
                      ? `${profile.friends.length} friends` 
                      : 'No friends yet'
                    }
                  </span>
                </div>
                <div className="profile-detail-item">
                  <strong>Member Since:</strong>
                  <span>{formatDate(profile.createdAt)}</span>
                </div>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                    <button className="btn btn-primary">
                      View Friends ({profile.friends?.length || 0})
                    </button>
                    <button className="btn btn-primary">
                      Recycling Bin
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setShowCreateProject(!showCreateProject)}
                    >
                      Create New Project
                    </button>
                  </>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleSendFriendRequest}
                    >
                      Send Friend Request
                    </button>
                    {profile.friends?.some(friend => friend._id === currentUserId) && (
                      <button 
                        className="btn btn-primary"
                        onClick={handleUnfriend}
                        style={{backgroundColor: '#ff6b6b'}}
                      >
                        Unfriend
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="profile-main">
            {isEditing && isOwnProfile && (
              <EditProfile 
                user={profile}
                onClose={() => setIsEditing(false)}
                onSave={(updatedUser) => {
                  setProfile(updatedUser);
                  setIsEditing(false);
                }}
              />
            )}

            {showCreateProject && isOwnProfile && (
              <CreateProject 
                onClose={() => setShowCreateProject(false)}
                onSubmit={handleCreateProject}
              />
            )}

            {!showCreateProject && !isEditing && (
              <>
                <div style={{marginBottom: '30px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 style={{color: '#d4ff00', fontSize: '28px'}}>
                      {isOwnProfile ? 'Your Projects' : `${profile.username}'s Projects`}
                    </h2>
                    {isOwnProfile && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowCreateProject(true)}
                      >
                        Create New Project
                      </button>
                    )}
                  </div>
                  
                  <div style={{display: 'grid', gap: '20px'}}>
                    {userProjects.length === 0 ? (
                      <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                        {isOwnProfile ? 'You haven\'t created any projects yet.' : 'This user has no public projects.'}
                      </div>
                    ) : (
                      userProjects.map(project => (
                        <div key={project._id} style={{position: 'relative'}}>
                          <ProjectPreview project={project} />
                          {isOwnProfile && project.creator === currentUserId && (
                            <button 
                              className="btn btn-primary"
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                backgroundColor: '#ff6b6b'
                              }}
                              onClick={() => handleDeleteProject(project._id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="activity-feed">
                  <h3>Recent Activity</h3>
                  {userActivities.length === 0 ? (
                    <div style={{color: '#888', padding: '20px', textAlign: 'center'}}>
                      No recent activity
                    </div>
                  ) : (
                    userActivities.map((activity, index) => (
                      <div key={activity._id || index} className="activity-item">
                        <span className="activity-user">{activity.user?.username}</span>
                        {' '}
                        <span className={`activity-action ${activity.action}`}>
                          {activity.action.replace('_', ' ')}
                        </span>
                        {' '}
                        {activity.fileName && <strong>{activity.fileName}</strong>}
                        {activity.project && (
                          <span> in project <strong>{activity.project.name}</strong></span>
                        )}
                        <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;