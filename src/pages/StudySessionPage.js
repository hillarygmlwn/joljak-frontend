import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudySessionPage = () => {
  const navigate = useNavigate();
  const [isResting, setIsResting] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [focusScores, setFocusScores] = useState([]);
  const [startDate] = useState(new Date());

  // 10초마다 집중도 측정 및 저장
  useEffect(() => {
    const interval = setInterval(() => {
      const score = Math.floor(Math.random() * 100); // 🔁 실제 측정값으로 대체
      setFocusScores((prev) => [...prev, score]);

      axios.post('https://learningas.shop/focus/data/', {
        score,
        timestamp: new Date().toISOString(),
      });

      if (isResting) setRestTime((prev) => prev + 10);
      else setStudyTime((prev) => prev + 10);
    }, 10000);

    return () => clearInterval(interval);
  }, [isResting]);

  const handleRestToggle = () => {
    setIsResting((prev) => !prev);
  };

  const handleEndSession = () => {
    const averageFocus = focusScores.length
      ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      : 0;

    const dateStr = startDate.toISOString().slice(0, 10);

    axios.post('https://learningas.shop/focus/summary/', {
      date: dateStr,
      study_time_sec: studyTime,
      rest_time_sec: restTime,
      average_focus_score: averageFocus,
    }).then(() => {
      navigate(`/focus/detail/${dateStr}`);
    }).catch((err) => {
      console.error("세션 종료 실패", err);
    });
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}분 ${sec}초`;
  };

  return (
    <div className="study-session" style={{ padding: '40px', textAlign: 'center' }}>
      <h1>📚 집중 세션 진행 중</h1>
      <p>🕒 공부 시간: {formatTime(studyTime)}</p>
      <p>😌 휴식 시간: {formatTime(restTime)}</p>

      <button className="rest-btn" onClick={handleRestToggle}>
        {isResting ? '공부 재개' : '휴식 시작'}
      </button>
      <br />
      <button className="end-btn" onClick={handleEndSession}>
        공부 끝내기
      </button>
    </div>
  );
};

export default StudySessionPage;
