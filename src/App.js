// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudySessionPage from './pages/StudySessionPage';
import './App.css';
import FocusDetailPage from './pages/FocusDetailPage';
import axios from 'axios';
import BlinkZoneoutDetector from './components/BlinkZoneoutDetector';  // ✅ 경로 확인
// import TestWebcam from './pages/TestWebcam'; // ❌ 제거 가능

axios.defaults.baseURL = 'https://learningas.shop';
axios.defaults.headers.common['Authorization'] = `Token ${localStorage.getItem('token')}`;

// ✅ export 하지 않고 내부 컴포넌트로만 정의
function TestWebcamPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>📷 집중도 측정 시작 (팝업)</h2>
      <p>웹캠 접근 중입니다... 집중 상태를 분석하고 서버로 전송합니다.</p>
      <BlinkZoneoutDetector />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/study" element={<StudySessionPage />} />
        <Route path="/focus/:date" element={<FocusDetailPage />} />
        <Route path="/test-webcam" element={<TestWebcamPage />} />  {/* ✅ 여기도 이름 통일 */}
      </Routes>
    </Router>
  );
}

export default App;
