// src/pages/StudySessionPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlinkZoneoutDetector from '../components/BlinkZoneoutDetector';
import HomeButton from '../components/HomeButton';
import './StudySessionPage.css';

function StudySessionPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [place, setPlace] = useState(localStorage.getItem('place') || '');
  const navigate = useNavigate();
  

  // 1초 단위 공부/휴식 시간 카운트
  useEffect(() => {
    const timer = setInterval(() => {
      if (isRunning) {
        if (isResting) setRestTime(prev => prev + 1);
        else setStudyTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, isResting]);



  const handleStart = async () => {
    if (isRunning || !place) return;
    try {
      const res = await fetch('https://learningas.shop/focus/study-sessions/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ place }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '시작 실패');
      localStorage.setItem('session_id', data.session);
      setIsRunning(true);

    } catch (err) {
      console.error('공부 시작 오류:', err);
      alert(err.message);
    }
  };

  const handleEnd = async () => {
    try {
      const res = await fetch('https://learningas.shop/focus/study-sessions/end/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      localStorage.removeItem('session_id');
      setIsRunning(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('공부 종료 오류:', err);
      alert(err.message);
    }
  };

  const toggleRest = () => setIsResting(prev => !prev);

  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };



  return (
    <div className="study-session-page">
      <HomeButton />
      <h1>
        {!isRunning ? '준비 상태'
          : isResting ? '휴식 중'
            : '공부 중'
        }
      </h1>
      <p>누적 공부 시간: {formatTime(studyTime)}</p>
      <p>누적 휴식 시간: {formatTime(restTime)}</p>
      <p>장소: {place || '선택 필요'}</p>

      {!isRunning
        ? <button onClick={handleStart} disabled={!place}>공부 시작</button>
        : (
          <>
            <button onClick={toggleRest}>
              {isResting ? '재개' : '휴식'}
            </button>
            <button onClick={handleEnd} style={{ marginLeft: 8 }}>공부 종료</button>
          </>
        )}

      <BlinkZoneoutDetector
        sessionId={localStorage.getItem('session_id')}
        isRunning={isRunning}
        isPaused={isResting}
      />

      <video id="webcam" autoPlay playsInline muted width="640" height="480" />
    </div>
  );
}

export default StudySessionPage;
