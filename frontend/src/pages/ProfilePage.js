import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import ProjectPreview from '../components/ProjectPreview';
import CreateProject from '../components/CreateProject';

function ProfilePage() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Dummy profile data
  const profile = {
    username: 'Username',
    dateOfBirth: '2003-02-04',
    occupation: 'Software Developer',
    friends: [],
    lastUpdate: 'Deleted temp.txt'
  };

  // Dummy projects data
  const userProjects = [
    {
      id: 1,
      name: 'E-Commerce Website',
      creator: 'Username',
      lastUpdate: '08/08/25 - 00:00',
      description: 'A full-stack e-commerce platform with React frontend and Node.js backend.',
      tags: ['React', 'Node.js', 'MongoDB'],
      contributors: 3,
      fileCount: 47
    },
    {
      id: 2,
      name: 'Portfolio Website',
      creator: 'Username',
      lastUpdate: '05/08/25 - 14:20',
      description: 'Personal portfolio showcasing projects and skills.',
      tags: ['HTML', 'CSS', 'JavaScript'],
      contributors: 1,
      fileCount: 12
    }
  ];

  const handleCreateProject = (projectData) => {
    console.log('Creating project:', projectData);
    setShowCreateProject(false);
    // Will be implemented with backend in future deliverables
  };

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
                  <span>{profile.dateOfBirth}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>Occupation:</strong>
                  <span>{profile.occupation}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>Friends:</strong>
                  <span>{profile.friends.length > 0 ? profile.friends.join(', ') : 'Friends Not Found'}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>Last Update:</strong>
                  <span style={{color: '#ff6b6b'}}>{profile.lastUpdate}</span>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                  Edit Profile
                </button>
                <button className="btn btn-primary">
                  View Friends
                </button>
                <button className="btn btn-primary">
                  Recycling Bin
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCreateProject(!showCreateProject)}>
                  Your Projects
                </button>
              </div>
            </div>
          </aside>

          <div className="profile-main">
            {showCreateProject && (
              <CreateProject 
                onClose={() => setShowCreateProject(false)}
                onSubmit={handleCreateProject}
              />
            )}

            {!showCreateProject && (
              <>
                <div style={{marginBottom: '30px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 style={{color: '#d4ff00', fontSize: '28px'}}>Your Projects</h2>
                    <button className="btn btn-secondary" onClick={() => setShowCreateProject(true)}>
                      Create New Project
                    </button>
                  </div>
                  <div style={{display: 'grid', gap: '20px'}}>
                    {userProjects.map(project => (
                      <ProjectPreview key={project.id} project={project} />
                    ))}
                  </div>
                </div>

                <div className="activity-feed">
                  <h3>Recent Activity</h3>
                  <div className="activity-item">
                    <span className="activity-user">Username</span> uploaded <strong>file.txt</strong> - 08/08/25 - 00:00
                  </div>
                  <div className="activity-item">
                    <span className="activity-user">TomCur</span> downloaded <strong>ReadMe.txt</strong> - 08/08/25 - 00:32
                  </div>
                  <div className="activity-item">
                    <span className="activity-user">Username</span> <span className="activity-action">Downloaded</span> <strong>Index.js</strong> - 08/08/25 - 05:12
                  </div>
                  <div className="activity-item">
                    <span className="activity-user">Username</span> <span className="activity-action">Uploaded</span> <strong>Tests.py</strong> - 07/08/25 - 14:59
                  </div>
                  <div className="activity-item">
                    <span className="activity-user">Qwerty12</span> <span className="activity-action delete">deleted</span> 2 files - 07/08/25 - 00:00
                  </div>
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