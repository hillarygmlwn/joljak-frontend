import React, { useState, useContext } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FocusDashboard.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';  // ← 수정

const mockFocusData = {
  '2025-05-02': 70,
  '2025-05-03': 85,
};

function FocusDashboard() {
  // const [value, setValue] = useState(new Date());
  // const navigate = useNavigate();
  // const { user } = useContext(AuthContext);
  const { user } = useContext(AuthContext);           // ← 여기가 변경된 부분
  const [value, setValue] = useState(new Date());
  const navigate = useNavigate();


  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based month
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDate(date);
      const score = mockFocusData[dateStr];
      if (score !== undefined && score > 0) {
        return <div className="focus-score">{score}점</div>;
      }
    }
    return null;
  };

  const handleDateClick = (date) => {
    const dateStr = formatDate(date);
    navigate(`/focus/${dateStr}`);
  };

  return (
    <div className="dashboard-layout">
      <div className="left-panel">
        <h2>{user?.username || '사용자'}님</h2>
        <div className="focus-info-box">
          <p><strong>최근 집중 정보</strong></p>
          <p>점수: 85점</p>
          <p>시간: 2시간 30분</p>
          <p>날짜: 2025-05-02</p>
          <p>장소: 도서관</p>
        </div>
        <button
          className="study-btn"
          onClick={async () => {
            try {
              const res = await fetch("https://start-focus-server.onrender.com/start-focus", {
                method: "POST"
              });
              const data = await res.json();
              alert(data.message || "서버 응답 없음");
              navigate('/study'); // ✅ 요청 후 페이지 이동
            } catch (err) {
              console.error("서버 요청 실패:", err);
              alert("서버 요청 중 오류 발생!");
            }
          }}
        >
          공부 시작
        </button>
      </div>
      <div className="right-panel">
        <h3>📅 집중 캘린더</h3>
        <Calendar
          onChange={(date) => {
            setValue(date);
            handleDateClick(date);
          }}
          value={value}
          tileContent={tileContent}
          calendarType="gregory" // ✅ 일요일 시작 (미국식)
        />
      </div>
    </div>
  );
}

export default FocusDashboard;
