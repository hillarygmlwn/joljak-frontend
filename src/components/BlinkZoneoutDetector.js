import React, { useEffect, useRef, useState } from 'react';
import alertsound from '../assets/alertsound.mp3';  // 알림음 파일 경로

function BlinkZoneoutDetector({ sessionId, isRunning }) {
  // ─── 1) ref & state 선언 ─────────────────────────
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const [blinkCount, setBlinkCount] = useState(0);
  const [eyeClosedTime, setEyeClosedTime] = useState(0);
  const [zoningOutTime, setZoningOutTime] = useState(0);
  const [present, setPresent] = useState(false);

  // 알림 타이밍 관리용
  const lastBlinkAlertRef = useRef(Date.now());
  const lastZoneoutAlertRef = useRef(Date.now());

  // 카운팅 및 업로드 로직용 ref
  const blinkHistoryRef = useRef([]);
  const blinkCountRef = useRef(0);
  const eyeClosedTimeRef = useRef(0);
  const zoningOutTimeRef = useRef(0);
  const presenceFramesRef = useRef(0);

  const startedRef = useRef(false);

  // ─── playAndAlert 헬퍼 ─────────────────────────
  const playAndAlert = (message) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      console.warn('-- 자동 재생 차단됨 --');
    });
    setTimeout(() => alert(message), 50);
  };

  // ─── 2) 10초마다 서버 업로드 ─────────────────────
  useEffect(() => {
    if (!sessionId || !isRunning) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const FPS = 30;
    const REQUIRED_FRAMES = FPS * 5; // 5초
    const interval = setInterval(() => {
      const now = new Date();
      const payload = {
        session: sessionId,
        blink_count: blinkCountRef.current,
        eyes_closed_time: eyeClosedTimeRef.current / FPS,
        zoning_out_time: zoningOutTimeRef.current / FPS,
        present: presenceFramesRef.current >= REQUIRED_FRAMES,
        heart_rate: 75,
        time: now.toISOString(),
      };
      fetch('https://learningas.shop/focus/upload/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      }).catch(console.error);

      // 카운터 초기화
      blinkCountRef.current = 0;
      eyeClosedTimeRef.current = 0;
      zoningOutTimeRef.current = 0;
      presenceFramesRef.current = 0;
      setBlinkCount(0);
      setEyeClosedTime(0);
      setZoningOutTime(0);
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionId, isRunning]);

  // ─── 3) Mediapipe FaceMesh 초기화 ────────────────
  useEffect(() => {
    const faceMesh = new window.FaceMesh({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    faceMesh.onResults(onResults);
    new window.Camera(videoRef.current, {
      onFrame: async () => await faceMesh.send({ image: videoRef.current }),
      width: 640,
      height: 480,
    }).start();
  }, []);

  // ─── 4) onResults (프레임별 처리) ─────────────────
  let eyeCloseCounter = 0;
  let prevEyeCenter = null;
  let prevFaceCenter = null;
  let eyeStillFrames = 0;
  let faceStillFrames = 0;

  const blinkThreshold = 0.2;
  const blinkConsecFrames = 3;
  const stillThreshold = 60; // 2초 @30fps

  function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }
  function calcEAR(eye) {
    return (distance(eye[1], eye[5]) + distance(eye[2], eye[4])) / (2 * distance(eye[0], eye[3]));
  }
  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width,
      H = canvas.height;

    // 1) clear + 얼굴 체크
    ctx.clearRect(0, 0, W, H);
    const detected = !!results.multiFaceLandmarks?.length;
    setPresent(detected);
    if (!detected) return;
    presenceFramesRef.current++;

    // 2) EAR 계산
    const lm = results.multiFaceLandmarks[0];
    const leftPts = [362, 385, 387, 263, 373, 380].map(i => lm[i]);
    const rightPts = [33, 160, 158, 133, 153, 144].map(i => lm[i]);
    const ear = (calcEAR(leftPts) + calcEAR(rightPts)) / 2;

    // 3) 바운딩 박스 그리기
    const xs = lm.map(p => p.x * W);
    const ys = lm.map(p => p.y * H);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    ctx.strokeStyle = 'magenta';
    ctx.lineWidth = 2;
    ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);

    // 4) 눈 윤곽 그리기
    [[362, 385, 387, 263, 373, 380], [33, 160, 158, 133, 153, 144]].forEach(idxs => {
      ctx.beginPath();
      idxs.forEach((i, j) => {
        const x = lm[i].x * W,
          y = lm[i].y * H;
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 5) 텍스트 그리기
    ctx.font = '18px Arial';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Blinks: ${blinkCount}`, 10, 25);
    ctx.fillText(`EAR: ${ear.toFixed(2)}`, 10, 45);

    // 6) 깜빡임 로직
    const now = Date.now();
    if (ear < blinkThreshold) {
      eyeCloseCounter++;
      setEyeClosedTime(prev => {
        eyeClosedTimeRef.current = prev + 1;
        return prev + 1;
      });
    } else {
      if (eyeCloseCounter >= blinkConsecFrames) {
        blinkCountRef.current++;
        setBlinkCount(c => c + 1);
        blinkHistoryRef.current.push(now);
        if (
          now - lastBlinkAlertRef.current > 10000 &&
          blinkHistoryRef.current.filter(t => t > now - 300000).length < 3
        ) {
          playAndAlert('최근 5분간 깜빡임이 너무 적습니다. 휴식을 권장합니다.');
          lastBlinkAlertRef.current = now;
        }
      }
      eyeCloseCounter = 0;
    }

    // 7) 멍때림 로직
    const eyeCenter = midpoint(lm[468], lm[473]);
    const faceCenter = lm[1];
    if (prevEyeCenter) {
      eyeStillFrames = distance(eyeCenter, prevEyeCenter) < 0.002 ? eyeStillFrames + 1 : 0;
      faceStillFrames = distance(faceCenter, prevFaceCenter) < 0.002 ? faceStillFrames + 1 : 0;
    }
    prevEyeCenter = eyeCenter;
    prevFaceCenter = faceCenter;
    if (eyeStillFrames > stillThreshold && faceStillFrames > stillThreshold) {
      if (now - lastZoneoutAlertRef.current > 10000) {
        playAndAlert('멍 때리는 중인 것 같아요! 집중해볼까요?');
        lastZoneoutAlertRef.current = now;
      }
      setZoningOutTime(prev => {
        zoningOutTimeRef.current = prev + 1;
        return prev + 1;
      });
    }
  }

  // ─── 5) 렌더링 ───────────────────────────────────
  const FPS = 30;
  return (
    <div style={{ position: 'relative', width: 640, height: 480 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={640}
        height={480}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <audio ref={audioRef} src={alertsound} preload="auto" />
      <p>눈 깜빡임 횟수: {blinkCount}</p>
      <p>눈 감은 시간: {(eyeClosedTime / FPS).toFixed(1)}초</p>
      <p>멍 때린 시간: {(zoningOutTime / FPS).toFixed(1)}초</p>
      <p>얼굴 감지 상태: {present ? 'O' : 'X'}</p>
    </div>
  );
}

export default BlinkZoneoutDetector;
