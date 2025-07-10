import React, { useState, useContext, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FocusDashboard.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function FocusDashboard() {
  const { user, token } = useContext(AuthContext);    // token도 AuthContext에서 꺼내오거나,
  // const token = localStorage.getItem('token');     // 이렇게 로컬스토리지에서 불러와도 됩니다.
  
  const [value, setValue] = useState(new Date());
  const [focusData, setFocusData] = useState({});
  const [recentSummary, setRecentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) 전체 요약 리스트
        const resAll = await axios.get(
          'https://learningas.shop/focus/all-summary/',
          { headers: { Authorization: `Token ${token}` } }
        );
        // 달력용 focusData 세팅
        const summaryMap = {};
        resAll.data.forEach(item => {
          summaryMap[item.date] = item.focus_score;
        });
        setFocusData(summaryMap);

        // 2) 가장 최신 날짜 추출
        if (resAll.data.length > 0) {
          const latestDate = resAll.data
            .map(o => o.date)
            .sort((a, b) => (a < b ? 1 : -1))[0];

          // 3) 최신 날짜 요약 조회
          const resToday = await axios.get(
            `https://learningas.shop/focus/summary/?date=${latestDate}`,
            { headers: { Authorization: `Token ${token}` } }
          );
          setRecentSummary({ ...resToday.data, date: latestDate });
        }
      } catch (err) {
        console.error('집중 점수 요약 불러오기 실패', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) return <p>불러오는 중...</p>;

  // 달력 Tile에 점수 표시
  const formatDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const score = focusData[formatDate(date)];
      return score > 0 ? <div className="focus-score">{score}점</div> : null;
    }
    return null;
  };

  const handleDateClick = date => {
    navigate(`/focus/${formatDate(date)}`);
  };

  const handleStartStudy = () => {
    navigate('/study-place');
  };

  return (
    <div className="dashboard-wrapper">
      <button className="hamburger-btn" onClick={toggleSidebar}>☰</button>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* ...사이드바 내용... */}
      </div>

      <div className="dashboard-layout">
        <div className="left-panel">
          <h2>{user?.username || '사용자'}님</h2>
          <div className="focus-info-box">
            <p><strong>최근 집중 정보</strong></p>
            {recentSummary ? (
              <>
                <p>점수: {recentSummary.focus_score}점</p>
                <p>시간: {Math.floor(recentSummary.study_time_min)}분</p>
                <p>날짜: {recentSummary.date}</p>
              </>
            ) : (
              <p>데이터가 없습니다.</p>
            )}
          </div>
          <button className="study-btn" onClick={handleStartStudy}>
            공부 시작
          </button>
        </div>

        <div className="right-panel">
          <h3>📅 집중 캘린더</h3>
          <Calendar
            onChange={date => {
              setValue(date);
              handleDateClick(date);
            }}
            value={value}
            tileContent={tileContent}
            calendarType="gregory"
          />
        </div>
      </div>
    </div>
  );
}

export default FocusDashboard;
