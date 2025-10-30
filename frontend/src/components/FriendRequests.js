import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

function FriendRequests({ onClose, onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getUserById(currentUserId);
      if (response.success && response.user.friendRequests) {
        setRequests(response.user.friendRequests);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await userAPI.acceptFriendRequest(userId);
      alert('Friend request accepted!');
      fetchFriendRequests();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request: ' + error.message);
    }
  };

  const handleReject = async (userId) => {
    try {
     
      await userAPI.unfriend(userId);
      alert('Friend request rejected');
      fetchFriendRequests();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request: ' + error.message);
    }
  };

  return (
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
        backgroundColor: '#252525',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #333',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{color: '#d4ff00', fontSize: '24px', margin: 0}}>
            Friend Requests ({requests.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px'
            }}
          >
            x
          </button>
        </div>

        {isLoading ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
            No pending friend requests
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {requests.map(request => (
              <div
                key={request._id}
                style={{
                  padding: '15px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d4ff00, #b8e000)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg viewBox="0 0 24 24" fill="#1a1a1a" style={{width: '25px', height: '25px'}}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{color: '#e0e0e0', fontWeight: '600', fontSize: '16px'}}>
                      {request.username}
                    </div>
                    <div style={{color: '#888', fontSize: '14px', marginTop: '2px'}}>
                      {request.occupation || 'No occupation listed'}
                    </div>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={() => handleAccept(request._id)}
                    className="btn btn-secondary"
                    style={{padding: '8px 16px', fontSize: '13px'}}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      backgroundColor: '#ff6b6b',
                      borderColor: '#ff6b6b'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendRequests;