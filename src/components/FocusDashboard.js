import React, { useState, useContext, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FocusDashboard.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function FocusDashboard() {
  const { user } = useContext(AuthContext);
  const [value, setValue] = useState(new Date());
  const [focusData, setFocusData] = useState({});
  const [todaySummary, setTodaySummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // 전체 달력 요약 정보
        const resAll = await axios.get('https://learningas.shop/focus/all-summary/', {
          headers: {
            Authorization: `Token ${token}`
          }
        });
        const summaryData = {};
        resAll.data.forEach(item => {
          summaryData[item.date] = item.focus_score;
        });
        setFocusData(summaryData);

        // 오늘 날짜 요약 정보
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const resToday = await axios.get(`https://learningas.shop/focus/summary/?date=${dateStr}`, {
          headers: {
            Authorization: `Token ${token}`
          }
        });
        setTodaySummary(resToday.data);
      } catch (err) {
        console.error("집중 점수 요약 불러오기 실패", err);
      }
    };
    fetchData();
  }, []);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDate(date);
      const score = focusData[dateStr];
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

  const handleStartStudy = async () => {
    navigate('/study');
  };

  return (
    <div className="dashboard-layout">
      <div className="left-panel">
        <h2>{user?.username || '사용자'}님</h2>
        <div className="focus-info-box">
          <p><strong>최근 집중 정보</strong></p>
          {todaySummary ? (
            <>
              <p>점수: {todaySummary.focus_score}점</p>
              <p>시간: {Math.floor(todaySummary.study_time_min)}분</p>
              <p>날짜: {todaySummary.date}</p>
              <p>눈 깜빡임: {todaySummary.blink_count}</p>
            </>
          ) : (
            <p>불러오는 중...</p>
          )}
        </div>
        <button className="study-btn" onClick={handleStartStudy}>
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
          calendarType="gregory"
        />
      </div>
    </div>
  );
}

export default FocusDashboard;
