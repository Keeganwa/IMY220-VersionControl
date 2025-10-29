import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AdminPanel from '../components/AdminPanel';
import { authAPI, apiUtils } from '../services/api';

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!apiUtils.isAuthenticated()) {
        navigate('/');
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        if (response.success && response.user.isAdmin) {
          setIsAdmin(true);
        } else {
          alert('Access denied. Admin privileges required.');
          navigate('/home');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (isLoading) {
    return (
      <div>
        <Header />
        <main className="page-container">
          <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
            Checking permissions...
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Manage users, projects, and system settings</p>
        </div>
        <AdminPanel />
      </main>
    </div>
  );
}

export default AdminPage;