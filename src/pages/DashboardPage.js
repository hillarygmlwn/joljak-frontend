// pages/DashboardPage.js
import React from 'react';
import FocusDashboard from '../components/FocusDashboard';

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div>
      <HomeButton />
      <FocusDashboard />
    </div>
  );
}

export default DashboardPage;
