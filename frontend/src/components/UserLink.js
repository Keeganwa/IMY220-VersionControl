import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserLink = ({ user, userId, username, className = '', style = {} }) => {
  const navigate = useNavigate();
  
 
  const id = user?._id || user?.id || userId;
  const name = user?.username || user?.name || username;

  if (!id || !name) {
    return <span style={{ color: '#888' }}>Unknown User</span>;
  }

  const handleClick = (e) => {
    e.stopPropagation(); 
    navigate(`/profile/${id}`);
  };

  return (
    <span
      onClick={handleClick}
      className={`user-link ${className}`}
      style={{
        color: '#5b9bff',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'color 0.2s',
        ...style
      }}
      onMouseEnter={(e) => {
        e.target.style.color = '#d4ff00';
        e.target.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.target.style.color = '#5b9bff';
        e.target.style.textDecoration = 'none';
      }}
    >
      {name}
    </span>
  );
};

export default UserLink;