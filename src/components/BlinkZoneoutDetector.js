import React, { useEffect, useRef, useState } from 'react';

function BlinkZoneoutDetector({ sessionId, isRunning }) {
    // ─── 1) ref & state 선언 ─────────────────────────
    const videoRef = useRef(null);

    const [blinkCount, setBlinkCount] = useState(0);
    const [eyeClosedTime, setEyeClosedTime] = useState(0);
    const [zoningOutTime, setZoningOutTime] = useState(0);
    const [present, setPresent] = useState(false);
    const [lastBlinkAlert, setLastBlinkAlert] = useState(Date.now());
    const lastZoneoutAlertRef = useRef(Date.now());

    const blinkHistoryRef = useRef([]);
    const blinkCountRef = useRef(0);
    const eyeClosedTimeRef = useRef(0);
    const zoningOutTimeRef = useRef(0);

    const startedRef = useRef(false);

    // ─── 2) 업로드용 useEffect ─────────────────────
    useEffect(() => {
        if (!sessionId || !isRunning) return;
        if (startedRef.current) return;
        startedRef.current = true;

        const FPS = 30;
        const interval = setInterval(() => {

            const session_id = localStorage.getItem("session_id");
            if (!session_id) return;

            const now = new Date();
            // 1) ISO string 전부 보내기 (Z 포함)
            const isoTime = now.toISOString();

            // 2) 프레임 → 초 단위로 변환
            const eyesClosedSec = eyeClosedTimeRef.current / FPS;
            const zoneoutSec = zoningOutTimeRef.current / FPS;

            const payload = {
                session: sessionId,
                blink_count: blinkCountRef.current,
                eyes_closed_time: eyesClosedSec,
                zoning_out_time: zoneoutSec,
                present,
                heart_rate: 75,
                time: new Date().toISOString().slice(0, 19),
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

            // 리셋
            blinkCountRef.current = 0;
            eyeClosedTimeRef.current = 0;
            zoningOutTimeRef.current = 0;
            setBlinkCount(0);
            setEyeClosedTime(0);
            setZoningOutTime(0);
        }, 10000);

        return () => clearInterval(interval);
    }, [sessionId, isRunning]);

    // ─── 3) FaceMesh 초기화용 useEffect ────────────
    useEffect(() => {
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
    }, []);

    // ─── 4) onResults 함수 (훅, return 금지) ─────────
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
        const now = Date.now();
        const detected = results.multiFaceLandmarks?.length > 0;
        setPresent(detected);
        if (!detected) return;

        const lm = results.multiFaceLandmarks[0];
        const leftEye = [362, 385, 387, 263, 373, 380].map(i => lm[i]);
        const rightEye = [33, 160, 158, 133, 153, 144].map(i => lm[i]);
        const ear = (calcEAR(leftEye) + calcEAR(rightEye)) / 2;

        // ➤ 깜빡임 로직
        if (ear < blinkThreshold) {
            eyeCloseCounter++;
            setEyeClosedTime(prev => {
                eyeClosedTimeRef.current = prev + 1;
                return prev + 1;
            });
        } else {
            if (eyeCloseCounter >= blinkConsecFrames) {
                blinkCountRef.current++;
                setBlinkCount(prev => prev + 1);

                blinkHistoryRef.current.push(now);
                const fiveMinAgo = now - 5 * 60 * 1000;
                blinkHistoryRef.current = blinkHistoryRef.current.filter(t => t > fiveMinAgo);

                if (now - lastBlinkAlert > 10 * 1000 && blinkHistoryRef.current.length < 3) {
                    alert('최근 5분간 깜빡임이 너무 적습니다. 휴식을 권장합니다.');
                    setLastBlinkAlert(now);
                }
            }
            eyeCloseCounter = 0;
        }

        // ➤ 멍때림 로직
        const eyeCenter = midpoint(lm[468], lm[473]);
        const faceCenter = lm[1];
        if (prevEyeCenter) {
            eyeStillFrames = distance(eyeCenter, prevEyeCenter) < 0.002 ? eyeStillFrames + 1 : 0;
            faceStillFrames = distance(faceCenter, prevFaceCenter) < 0.002 ? faceStillFrames + 1 : 0;
        }
        prevEyeCenter = eyeCenter;
        prevFaceCenter = faceCenter;

        if (eyeStillFrames > stillThreshold && faceStillFrames > stillThreshold) {
            if (now - lastZoneoutAlertRef.current > 10 * 1000) {
                alert('멍 때리는 중인 것 같아요! 집중해볼까요?');
                lastZoneoutAlertRef.current = now;
            }
            setZoningOutTime(prev => { zoningOutTimeRef.current = prev + 1; return prev + 1; });
        } else {
            // 리셋 플래그
        }
    }

    // ─── 5) 렌더링 ───────────────────────────────────
    const FPS = 30;
    return (
        <div>
            <video ref={videoRef} autoPlay playsInline muted width={640} height={480} />
            <p>눈 깜빡임 횟수: {blinkCount}</p>
            <p>눈 감은 시간: {(eyeClosedTime / FPS).toFixed(1)}초</p>
            <p>멍 때린 시간: {(zoningOutTime / FPS).toFixed(1)}초</p>
            <p>얼굴 감지 상태: {present ? 'O' : 'X'}</p>
        </div>
    );
}

export default BlinkZoneoutDetector;
