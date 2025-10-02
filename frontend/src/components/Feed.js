import React, { useState } from 'react';
import ProjectPreview from './ProjectPreview';

function Feed() {
  const [activeTab, setActiveTab] = useState('local');

  // Dummy data for projects
  const localProjects = [
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
      name: 'Mobile Game Engine',
      creator: 'Keeganwa',
      lastUpdate: '07/08/25 - 14:59',
      description: 'Cross-platform game engine built with Unity and C#.',
      tags: ['Unity', 'C#', 'GameDev'],
      contributors: 5,
      fileCount: 128
    },
    {
      id: 3,
      name: 'Data Analytics Dashboard',
      creator: 'TomCur',
      lastUpdate: '06/08/25 - 22:55',
      description: 'Real-time analytics dashboard with interactive charts and data visualization.',
      tags: ['Python', 'D3.js', 'PostgreSQL'],
      contributors: 2,
      fileCount: 34
    }
  ];

  const globalProjects = [
    {
      id: 4,
      name: 'Machine Learning Library',
      creator: 'User1',
      lastUpdate: '07/08/25 - 14:59',
      description: 'Open-source machine learning library for image classification tasks.',
      tags: ['Python', 'TensorFlow', 'AI'],
      contributors: 12,
      fileCount: 89
    },
    {
      id: 5,
      name: 'Cloud Storage API',
      creator: 'Username',
      lastUpdate: '05/08/25 - 08:59',
      description: 'RESTful API for cloud storage management with AWS integration.',
      tags: ['Node.js', 'AWS', 'API'],
      contributors: 7,
      fileCount: 56
    },
    {
      id: 6,
      name: 'Social Media App',
      creator: 'Qwerty12',
      lastUpdate: '04/08/25 - 00:00',
      description: 'Mobile-first social networking application with real-time messaging.',
      tags: ['React Native', 'Firebase', 'Mobile'],
      contributors: 8,
      fileCount: 94
    }
  ];

  const projects = activeTab === 'local' ? localProjects : globalProjects;

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2 style={{color: '#d4ff00', fontSize: '28px'}}>Activity Feed</h2>
        <div className="feed-tabs">
          <button 
            className={`feed-tab ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            Local Activity
          </button>
          <button 
            className={`feed-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Global Activity
          </button>
        </div>
      </div>
      
      <div style={{display: 'grid', gap: '20px'}}>
        {projects.map(project => (
          <ProjectPreview key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default Feed;