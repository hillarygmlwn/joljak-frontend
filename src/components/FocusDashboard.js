import React, { useState, useContext, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FocusDashboard.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function FocusDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [value, setValue] = useState(new Date());
  const [focusData, setFocusData] = useState({});
  const [todaySummary, setTodaySummary] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // 로그아웃 핸들러
  const handleLogout = () => {
    // 1) 로컬스토리지 토큰 제거
    localStorage.removeItem('token');
    // 2) AuthContext의 logout 함수 호출 (필요하다면)
    if (logout) logout();  
    // 3) 로그인 페이지로 이동
    navigate('/login');
  };

  useEffect(() => {

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // 1) 전체 요약 리스트 가져오기
        const resAll = await axios.get(
          'https://learningas.shop/focus/all-summary/',
          { headers: { Authorization: `Token ${token}` } }
        );
        // 달력용 데이터 세팅
        const focusMap = {};
        resAll.data.forEach(item => {
          focusMap[item.date] = item.focus_score;
        });
        setFocusData(focusMap);

        // 2) 키(날짜)만 뽑아서 최신 순 정렬 → 첫 번째(최신) 날짜 선택
        const dates = Object.keys(focusMap);
        if (dates.length === 0) {
          setTodaySummary(null);
          return;
        }
        // 문자열 비교로도 ISO 형식 YYYY-MM-DD 정렬이 가능
        const latestDate = dates.sort((a, b) => b.localeCompare(a))[0];

        // 3) 최신 날짜로 요약 조회
        const resLatest = await axios.get(
          `https://learningas.shop/focus/summary/?date=${latestDate}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        // 응답에 date 필드가 없으면 latestDate를 직접 붙여줍니다
        setTodaySummary({ ...resLatest.data, date: latestDate });

        
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

  const handleStartStudy = () => {
    navigate('/study-place');
  };

  return (
    <div className="dashboard-wrapper">
      <button className="hamburger-btn" onClick={toggleSidebar}>☰</button>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="profile-section">
          <img src={require('../assets/user_profile.png')} alt="User" className="profile-pic" />
          <p>{user?.username || '사용자'}</p>
        </div>
        <div className="menu">유저설정</div>
        <div className="menu">캘린더</div>
        <div className="menu">예비1</div>
        {/* 로그아웃 메뉴에 onClick 연결 */}
        <div className="menu logout" onClick={handleLogout}>
        로그아웃
        </div>
      </div>

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
    </div>
  );
}

export default FocusDashboard;
