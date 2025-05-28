import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlinkZoneoutDetector from '../components/BlinkZoneoutDetector';
import './StudySessionPage.css';
import { Bar } from 'react-chartjs-2';
import HomeButton from '../components/HomeButton';  // 경로 확인 필요
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function StudySessionPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [startTime] = useState(Date.now());
  const [studyTime, setStudyTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [focusData, setFocusData] = useState([]);
  const [place, setPlace] = useState('');
  const navigate = useNavigate();

  const sendEventToBackend = async (eventType) => {
  const session_id = localStorage.getItem("session_id");
  if (!session_id) return;

  const payload = {
    session_id,
    event_type: eventType,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch('https://learningas.shop/focus/event/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('이벤트 전송 실패:', await res.text());
    } else {
      console.log(`✅ 이벤트 전송 완료: ${eventType}`);
    }
  } catch (err) {
    console.error('❌ 이벤트 전송 중 오류:', err);
  }
};


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

      const token = localStorage.getItem('token');
      const res = await fetch('https://learningas.shop/focus/study-sessions/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ place })
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn('공부 시작 백엔드 실패:', data);
        alert(data?.error || '서버 오류');
      } else {
        console.log('📦 공부 시작 정보 전송됨:', data);
        localStorage.setItem("session_id", data.session_id); // ✅ 세션 ID 저장
      }
    } catch (err) {
      console.error('❌ 웹캠 또는 서버 요청 실패:', err);
    }
  };

  const handleStopWebcam = () => {
    const video = document.getElementById('webcam');
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      console.log('📷 웹캠 꺼짐');
      alert('웹캠이 꺼졌습니다.');
    } else {
      alert('웹캠이 이미 꺼져있거나 연결되지 않았습니다.');
    }
  };

  const handleStopPython = async () => {
    try {

      // 캠 끄기
      const video = document.getElementById('webcam');
      if (video?.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        console.log('📷 웹캠 자동 종료됨');
      }
      await fetch('https://start-focus-server.onrender.com/stop', { method: 'POST' });

      const session_id = localStorage.getItem("session_id");
      if (session_id) {
        await fetch('https://learningas.shop/focus/study-sessions/end/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ session_id })
        });
        localStorage.removeItem("session_id");
      }




      alert('측정 종료됨');
      navigate('/dashboard'); // ✅ 공부 끝 후 대시보드로 이동
    } catch (err) {
      console.error('❌ Python 종료 요청 실패:', err);
      alert('서버 요청 실패');
    }
  };

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

  return (
    <div className="study-session">
      <HomeButton />
      <h1>{isResting ? '휴식 중입니다.' : '공부 중입니다.'}</h1>
      <p>공부 시작 시간: {new Date(startTime).toLocaleTimeString()}</p>
      <p>누적 공부 시간: {formatTime(studyTime)}</p>
      <p>누적 휴식 시간: {formatTime(restTime)}</p>

      <div>
        <h3>공부 장소 선택</h3>
        {['카페', '도서관', '학교'].map((p) => (
          <button key={p} onClick={() => setPlace(p)} style={{ marginRight: '10px' }}>
            {p}
          </button>
        ))}
        <p>선택한 장소: {place || '없음'}</p>
      </div>

      <button className="rest-btn" onClick={toggleRest}>
        {isResting ? '휴식 끝' : '휴식 시작'}
      </button>

      <button
        style={{ backgroundColor: 'red', color: 'white' }}
        onClick={handleStartPython}
        disabled={!place} // 장소 미선택 시 비활성화
      >
        공부 시작
      </button>

      <button onClick={handleStopPython}>공부 끝</button>

      <button onClick={handleStopWebcam} style={{ backgroundColor: 'gray', color: 'white' }}>
        캠 끄기
      </button>

      <div style={{ marginTop: '40px' }}>
        <h2>📊 집중도 변화</h2>
        <Bar data={chartData} />
      </div>

      <BlinkZoneoutDetector />

      <video
        id="webcam"
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
        style={{ border: '1px solid gray', marginTop: '20px' }}
      />
    </div>
  );
}

export default StudySessionPage;
