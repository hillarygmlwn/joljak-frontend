import React, { useEffect, useState } from 'react';
import './StudySessionPage.css';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import BlinkZoneoutDetector from '../components/BlinkZoneoutDetector';


ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function StudySessionPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [startTime] = useState(Date.now());
  const [studyTime, setStudyTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [focusData, setFocusData] = useState([]);
  const navigate = useNavigate();

  const handleStartPython = async () => {
    if (isRunning) {
      console.log('⚠️ 이미 실행 중입니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('webcam');
      if (video) {
        video.srcObject = stream;
        video.play();
      }
      console.log('✅ 웹캠 실행됨');
      setIsRunning(true);
    } catch (err) {
      console.error('❌ 웹캠 접근 실패:', err);
      alert('웹캠 권한이 필요합니다.');
    }
  };


  // ✅ Flask 서버에 Python 종료 요청
  const handleStopPython = async () => {
    try {
      const res = await fetch('http://localhost:5000/stop', { method: 'POST' });
      if (res.ok) {
        console.log('✅ Python 종료됨');
        setIsRunning(false);
      } else {
        console.warn('⚠️ 종료 실패 또는 이미 종료됨');
      }
    } catch (err) {
      console.error('❌ Python 종료 요청 실패:', err);
    }
  };

  const handleEnd = async () => {
    try {
      await fetch('https://learningas.shop/stop-capture/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      alert('측정 종료됨');
    } catch (err) {
      console.error('측정 종료 실패', err);
      alert('서버 요청 실패');
    }
    navigate('/dashboard');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isResting) {
        setRestTime((prev) => prev + 1);
      } else {
        setStudyTime((prev) => {
          const newTime = prev + 1;
          if (newTime % 600 === 0) {
            const focusScore = Math.floor(Math.random() * 50) + 50;
            setFocusData((prevData) => [
              ...prevData,
              {
                time: newTime,
                score: isResting ? 0 : focusScore,
                isRest: isResting,
              },
            ]);
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting]);

  const toggleRest = () => {
    setIsResting((prev) => !prev);
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const chartData = {
    labels: focusData.map((d) => formatTime(d.time)),
    datasets: [
      {
        label: '공부 집중도',
        data: focusData.map((d) => d.isRest ? null : d.score),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: '휴식 시간',
        data: focusData.map((d) => d.isRest ? 10 : null),
        backgroundColor: 'rgba(160, 160, 160, 0.5)',
      },
    ],
  };

  return (
    <div className="study-session">
      <h1>{isResting ? '휴식 중입니다.' : '공부 중입니다.'}</h1>
      <p>공부 시작 시간: {new Date(startTime).toLocaleTimeString()}</p>
      <p>누적 공부 시간: {formatTime(studyTime)}</p>
      <p>누적 휴식 시간: {formatTime(restTime)}</p>
      {/* 👇 여기에 추가 */}
      <BlinkZoneoutDetector />


      <button className="rest-btn" onClick={toggleRest}>
        {isResting ? '휴식 끝' : '휴식 시작'}
      </button>

      <button
        style={{ backgroundColor: 'red', color: 'white' }}
        onClick={handleStartPython}
      >
        공부 시작
      </button>

      <button onClick={handleStopPython}>공부 끝</button>

      <div style={{ marginTop: '40px' }}>
        <h2>📊 집중도 변화</h2>
        <Bar data={chartData} />
      </div>
      <video
        id="webcam"
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
        style={{ border: '1px solid gray', marginTop: '20px' }}
      />

      <BlinkZoneoutDetector />

    </div>
  );
}

export default StudySessionPage;
