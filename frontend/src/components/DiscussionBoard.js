import React, { useState, useEffect } from 'react';
import { discussionAPI } from '../services/api';

function DiscussionBoard({ projectId }) {
  const [discussions, setDiscussions] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    fetchDiscussions();
  }, [projectId]);

  const fetchDiscussions = async () => {
    setIsLoading(true);
    try {
      const response = await discussionAPI.getProjectDiscussions(projectId);
      if (response.success) {
        setDiscussions(response.discussions);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setError('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }

    try {
      const response = await discussionAPI.createDiscussion({
        project: projectId,
        message: newMessage,
        parentComment: replyTo
      });

      if (response.success) {
        setNewMessage('');
        setReplyTo(null);
        fetchDiscussions();
      }
    } catch (error) {
      console.error('Error posting discussion:', error);
      alert('Failed to post message');
    }
  };

  const handleDelete = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await discussionAPI.deleteDiscussion(discussionId);
      fetchDiscussions();
    } catch (error) {
      console.error('Error deleting discussion:', error);
      alert('Failed to delete comment');
    }
  };

  if (isLoading) {
    return <div style={{padding: '20px', textAlign: 'center', color: '#888'}}>Loading discussions...</div>;
  }

  return (
    <div className="discussion-board">
      <h3 style={{color: '#d4ff00', marginBottom: '20px'}}>Discussion Board</h3>

      {/* New Message Form */}
      <form onSubmit={handleSubmit} style={{marginBottom: '30px'}}>
        {replyTo && (
          <div style={{
            padding: '10px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{color: '#888', fontSize: '14px'}}>Replying to comment...</span>
            <button 
              type="button"
              onClick={() => setReplyTo(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        )}
        
        <div className="form-group">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a comment..."
            style={{minHeight: '80px'}}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-secondary">
          {replyTo ? 'Post Reply' : 'Post Comment'}
        </button>
      </form>

      {/* Discussion List */}
      {discussions.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
          No discussions yet. Be the first to comment!
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {discussions
            .filter(d => !d.parentComment)
            .map(discussion => (
              <div key={discussion._id} style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div>
                    <strong style={{color: '#5b9bff'}}>{discussion.user?.username}</strong>
                    <span style={{color: '#666', fontSize: '12px', marginLeft: '10px'}}>
                      {new Date(discussion.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {discussion.user?._id === currentUserId && (
                    <button
                      onClick={() => handleDelete(discussion._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <p style={{color: '#e0e0e0', lineHeight: '1.6', marginBottom: '10px'}}>
                  {discussion.message}
                </p>
                
                <button
                  onClick={() => setReplyTo(discussion._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#d4ff00',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Reply
                </button>

                {/* Replies */}
                {discussions
                  .filter(d => d.parentComment?._id === discussion._id || d.parentComment === discussion._id)
                  .map(reply => (
                    <div key={reply._id} style={{
                      marginTop: '15px',
                      marginLeft: '30px',
                      padding: '12px',
                      backgroundColor: '#1f1f1f',
                      borderRadius: '8px',
                      borderLeft: '3px solid #d4ff00'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <strong style={{color: '#5b9bff', fontSize: '14px'}}>
                            {reply.user?.username}
                          </strong>
                          <span style={{color: '#666', fontSize: '11px', marginLeft: '8px'}}>
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        {reply.user?._id === currentUserId && (
                          <button
                            onClick={() => handleDelete(reply._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff6b6b',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      
                      <p style={{color: '#b0b0b0', fontSize: '14px', lineHeight: '1.5'}}>
                        {reply.message}
                      </p>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default DiscussionBoard;