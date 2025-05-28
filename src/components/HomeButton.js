// components/HomeButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/dashboard')}
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        padding: '6px 12px',
        fontSize: '14px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      홈
    </button>
  );
};

export default HomeButton;
