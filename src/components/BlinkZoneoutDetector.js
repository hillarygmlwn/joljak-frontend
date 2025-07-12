import React, { useEffect, useRef, useState } from 'react';
import alertsound from '../assets/alertsound.mp3';  // 알림음 파일 경로

function BlinkZoneoutDetector({ sessionId, isRunning }) {
  // ─── 1) ref & state 선언 ─────────────────────────
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const zoneoutStartRef = useRef(null);

  // ▶ 눈 감김 카운터를 useRef 로 선언
  const eyeCloseCounterRef = useRef(0);
  // ▶ 이전 눈·얼굴 위치도 useRef
  const prevEyeCenterRef = useRef(null);
  const prevFaceCenterRef = useRef(null);
  const eyeStillFramesRef = useRef(0);
  const faceStillFramesRef = useRef(0);

  const [blinkCount, setBlinkCount] = useState(0);
  const [eyeClosedTime, setEyeClosedTime] = useState(0);
  const [zoningOutTime, setZoningOutTime] = useState(0);
  const [present, setPresent] = useState(false);

  // 알림 타이밍 관리용
  const lastBlinkAlertRef = useRef(Date.now());
  const lastZoneoutAlertRef = useRef(Date.now());
  const lastLongZoneoutAlertRef = useRef(Date.now());

  // 카운팅 및 업로드 로직용 ref
  const blinkHistoryRef = useRef([]);
  const blinkCountRef = useRef(0);
  const eyeClosedTimeRef = useRef(0);
  const zoningOutTimeRef = useRef(0);
  const presenceFramesRef = useRef(0);

  const startedRef = useRef(false);

  // 눈 5초 이상 감음용 ref
  const lastLongCloseAlertRef = useRef(Date.now());
  const LONG_CLOSE_FRAMES = 30 * 5; // 5초*FPS(30)

  // 3) 실제 경과 시간 계산
  const zoningSeconds = zoneoutStartRef.current
    ? (Date.now() - zoneoutStartRef.current) / 1000
    : 0;


  // ─── playAndAlert 헬퍼 ─────────────────────────
  const playAndAlert = (message) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    // 1) 소리를 먼저 재생
    audioRef.current.play().catch(() => {
      console.warn('-- 자동 재생 차단됨 --');
    });
    // 2) sound가 재생되는 동안 alert은 지연
    //    (예: 500ms 뒤에 alert 띄우기)
    setTimeout(() => {
      alert(message);
    }, 500);
  };


  // ─── 2) 10초마다 서버 업로드 ─────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;  // SSR 차단
    if (!videoRef.current) return;             // videoRef 확인
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

      console.log("전송할 데이터:", payload);
      fetch("https://learningas.shop/focus/upload/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("token")}`,
        },
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

    if (!videoRef.current) return;

    const faceMesh = new window.FaceMesh({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => { await faceMesh.send({ image: videoRef.current }); },
      width: 640,
      height: 480,
    });
    camera.start();
  }, [videoRef.current]);

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
    return (distance(eye[1], eye[5]) + distance(eye[2], eye[4])) /
      (2 * distance(eye[0], eye[3]));
  }
  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1) 이전 프레임 지우기
    ctx.clearRect(0, 0, width, height);

    // 2) 얼굴 인식 여부 판정
    const detected = results.multiFaceLandmarks?.length > 0;
    setPresent(detected);
    if (!detected) return;
    presenceFramesRef.current++;

    // 3) 랜드마크 & EAR 계산
    const lm = results.multiFaceLandmarks[0];
    const leftEyePts = [362, 385, 387, 263, 373, 380].map(i => lm[i]);
    const rightEyePts = [33, 160, 158, 133, 153, 144].map(i => lm[i]);
    const ear = (calcEAR(leftEyePts) + calcEAR(rightEyePts)) / 2;



    // 4) 얼굴 바운딩 박스 계산
    const xs = lm.map(p => p.x * width);
    const ys = lm.map(p => p.y * height);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    // 사각형 그리기
    ctx.strokeStyle = 'magenta';
    ctx.lineWidth = 2;
    ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);

    // 왼쪽 눈 윤곽 그리기
    const leftEyeIdx = [362, 385, 387, 263, 373, 380];
    ctx.beginPath();
    leftEyeIdx.forEach((idx, i) => {
      const x = lm[idx].x * width;
      const y = lm[idx].y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 오른쪽 눈 윤곽 그리기
    const rightEyeIdx = [33, 160, 158, 133, 153, 144];
    ctx.beginPath();
    rightEyeIdx.forEach((idx, i) => {
      const x = lm[idx].x * width;
      const y = lm[idx].y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'lime';
    ctx.stroke();

    // 상태 텍스트 찍기 (예: 블링크 수)
    ctx.font = '18px Arial';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Blinks: ${blinkCountRef.current}`, 10, 25);
    ctx.fillText(`EAR: ${ear.toFixed(2)}`, 10, 45);


    const leftEye = [362, 385, 387, 263, 373, 380].map(i => lm[i]);
    const rightEye = [33, 160, 158, 133, 153, 144].map(i => lm[i]);


    const now = Date.now();
    blinkHistoryRef.current.push(now);





    // ▶ 깜빡임 로직 (useRef 기반)
    const ec = eyeCloseCounterRef.current;
    if (ear < blinkThreshold) {
      eyeCloseCounterRef.current = ec + 1;
      // 눈 감은 프레임 누적
      setEyeClosedTime(prev => {
        eyeClosedTimeRef.current = prev + 1;
        return prev + 1;
      });

      // 5초(=150프레임) 이상 눈 감고 있으면 바로 알림
      if (
        eyeCloseCounterRef.current >= LONG_CLOSE_FRAMES &&
        Date.now() - lastLongCloseAlertRef.current > 5000
      ) {
        playAndAlert('눈을 5초 이상 감고 있어요! 깨어보세요.');
        lastLongCloseAlertRef.current = Date.now();
      }
    } else {
      if (ec >= blinkConsecFrames) {
        blinkCountRef.current++;
        setBlinkCount(c => c + 1);
      }
      eyeCloseCounterRef.current = 0;
    }


    // ▶ 멍때림(정지) 로직
    const eyeCenter = midpoint(lm[468], lm[473]);
    const faceCenter = lm[1];
    const isEyeStill = prevEyeCenterRef.current && distance(eyeCenter, prevEyeCenterRef.current) < 0.002;
    const isFaceStill = prevFaceCenterRef.current && distance(faceCenter, prevFaceCenterRef.current) < 0.002;
    prevEyeCenterRef.current = eyeCenter;
    prevFaceCenterRef.current = faceCenter;

    if (isEyeStill && isFaceStill) {
      // 멍때림 시작 기록
      if (zoneoutStartRef.current === null) {
        zoneoutStartRef.current = Date.now();
      }
    } else {
      zoneoutStartRef.current = null;
    }

    const zoningSeconds = zoneoutStartRef.current ? (Date.now() - zoneoutStartRef.current) / 1000 : 0;
    setZoningOutTime(zoningSeconds);

    // 5초 이상 멍때림 시 바로 알림
    if (
      zoningSeconds >= 5 &&
      Date.now() - lastZoneoutAlertRef.current > 5000
    ) {
      playAndAlert('멍때림이 5초 이상 지속되고 있어요! 집중하세요.');
      lastZoneoutAlertRef.current = Date.now();
    }


  }
  // ─── 5) 렌더링 ───────────────────────────────────
  const FPS = 30;

  return (
    <>
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
        {/* ─── (2) audio 태그 삽입 ─── */}
        <audio ref={audioRef} src={alertsound} preload="auto" />

      </div>

      <div style={{ marginTop: 10 }}>
        <p>눈 깜빡임 횟수: {blinkCount}</p>
        <p>눈 감은 시간: {(eyeClosedTimeRef.current / FPS).toFixed(1)}초</p>
        <p>멍 때린 시간: {zoningSeconds.toFixed(1)}초</p>
        <p>얼굴 감지 상태: {present ? 'O' : 'X'}</p>
      </div>
    </>
  );
}

export default BlinkZoneoutDetector;  