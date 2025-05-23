import React, { useState, useContext } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FocusDashboard.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const mockFocusData = {
    '2025-05-02': 70,
    '2025-05-03': 85,
};

function FocusDashboard() {
    const { user } = useContext(AuthContext);
    const [value, setValue] = useState(new Date());
    const navigate = useNavigate();

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
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

    const handleStartStudy = async () => {
        try {
            const res = await fetch("https://start-focus-server.onrender.com/start-focus", {
                method: "POST"
            });
            const data = await res.json();
            alert(data.message || "서버 응답 없음");

            // 팝업 열기 (측정 페이지)
            window.open(
                "https://joljak-frontend.vercel.app/test-webcam",
                "focusWindow",
                "width=800,height=600,left=200,top=100"
            );

            // navigate('/study'); // 기존 페이지 이동은 생략하거나 유지 가능
        } catch (err) {
            console.error("서버 요청 실패:", err);
            alert("서버 요청 중 오류 발생!");
        }
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
