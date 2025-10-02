import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';

function ProjectPage() {
  const { id } = useParams();
  const [currentPath, setCurrentPath] = useState('root/dev/frontend');

  // Dummy project data
  const project = {
    id: id,
    name: 'Project1',
    creator: 'Keeganwa',
    sharedWith: ['Username1', 'TomCur', 'SteveCode'],
    description: 'A collaborative web development project for building a modern application.',
    createdDate: '01/08/25',
    lastModified: '08/08/25'
  };

  // Dummy files data
  const files = [
    { name: 'index.html', size: '15 KB', lastModified: '08/08/25 - 10:30' },
    { name: 'styles.css', size: '8 KB', lastModified: '08/08/25 - 09:15' },
    { name: 'app.js', size: '22 KB', lastModified: '07/08/25 - 16:45' },
    { name: 'package.json', size: '2 KB', lastModified: '05/08/25 - 11:20' },
    { name: 'README.md', size: '5 KB', lastModified: '03/08/25 - 14:00' }
  ];

  // Dummy activity data
  const activities = [
    { user: 'Username1', action: 'uploaded', file: 'index.html', time: '08/08/25 - 10:30' },
    { user: 'TomCur', action: 'edited', file: 'styles.css', time: '08/08/25 - 09:15' },
    { user: 'Keeganwa', action: 'deleted', file: 'old-file.js', time: '07/08/25 - 16:45' },
    { user: 'SteveCode', action: 'downloaded', file: 'app.js', time: '07/08/25 - 14:20' },
    { user: 'Username1', action: 'uploaded', file: 'package.json', time: '05/08/25 - 11:20' }
  ];

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="project-container">
          <div className="project-main">
            <div className="project-info-card">
              <div className="project-header-info">
                <h1>{project.name}</h1>
                <button className="btn btn-secondary">Edit Project</button>
              </div>
              
              <div className="project-meta">
                <span>Created by: <strong style={{color: '#5b9bff'}}>{project.creator}</strong></span>
              </div>

              <div className="project-meta">
                <span>Shared With: </span>
                {project.sharedWith.map((user, index) => (
                  <span key={index}>
                    <strong style={{color: '#5b9bff'}}>{user}</strong>
                    {index < project.sharedWith.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>

              <div style={{marginTop: '20px', marginBottom: '20px'}}>
                <h3 style={{color: '#d4ff00', marginBottom: '10px'}}>Description</h3>
                <p style={{color: '#b0b0b0', lineHeight: '1.6'}}>{project.description}</p>
              </div>

              <div className="project-meta">
                <span>Created: {project.createdDate}</span>
                <span>•</span>
                <span>Last Modified: {project.lastModified}</span>
              </div>
            </div>

            <div className="project-info-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h3 style={{color: '#d4ff00'}}>Files</h3>
                <div style={{color: '#b0b0b0', fontSize: '14px'}}>
                  Directory: <strong style={{color: '#d4ff00'}}>{currentPath}</strong>
                </div>
              </div>
              
              <div className="files-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div>
                      <div style={{color: '#e0e0e0', fontWeight: '500'}}>{file.name}</div>
                      <div style={{color: '#888', fontSize: '12px', marginTop: '4px'}}>
                        {file.size} • {file.lastModified}
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
                ))}
              </div>
            </div>
          </div>

          <aside className="activity-feed">
            <h3>Messages</h3>
            <p style={{color: '#888', fontSize: '14px', marginBottom: '20px'}}>
              Check-in/Check-out activity
            </p>
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-user">{activity.user}</span>
                {' '}
                <span className={`activity-action ${activity.action}`}>
                  {activity.action}
                </span>
                {' '}
                <strong>{activity.file}</strong>
                <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                  {activity.time}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default ProjectPage;