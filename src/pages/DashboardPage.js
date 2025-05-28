// pages/DashboardPage.js
import React from 'react';
import FocusDashboard from '../components/FocusDashboard';
import { useNavigate } from 'react-router-dom';
import HomeButton from '../components/HomeButton';  // 경로 확인 필요


function DashboardPage() {
  const navigate = useNavigate();

  const handleStudyStart = () => {
    navigate('/study-place'); // 원하는 경로로 이동
  };

  return (
    <div>
      <HomeButton />
      <FocusDashboard />
    </div>
  );
}

export default DashboardPage;
