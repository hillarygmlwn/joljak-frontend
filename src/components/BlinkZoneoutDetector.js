import React, { useEffect, useRef, useState } from 'react';

function BlinkZoneoutDetector({ sessionId, isRunning }) {
    const videoRef = useRef(null);
    const [blinkCount, setBlinkCount] = useState(0);
    const [eyeClosedTime, setEyeClosedTime] = useState(0);
    const [zoningOutTime, setZoningOutTime] = useState(0);
    const [present, setPresent] = useState(false);
    const [lastAlertTime, setLastAlertTime] = useState(0);

    const blinkHistoryRef = useRef([]);

    const blinkCountRef = useRef(0);
    const eyeClosedTimeRef = useRef(0);
    const zoningOutTimeRef = useRef(0);
    const presentRef = useRef(false);

    // 이 ref가 true면 두 번째 등록을 막습니다
    const startedRef = useRef(false);

    useEffect(() => {
        // sessionId 와 isRunning 모두 true 이어야 interval 등록
        if (!sessionId || !isRunning) return;
        if (startedRef.current) return;
        startedRef.current = true;

        const interval = setInterval(() => {
            const session_id = localStorage.getItem("session_id");
            if (!session_id) return;

            const now = new Date();
            const isoTime = now.toISOString().slice(0, 19);

            const payload = {
                session: session_id,
                blink_count: blinkCountRef.current,
                eyes_closed_time: eyeClosedTimeRef.current,
                zoning_out_time: zoningOutTimeRef.current,
                present: presentRef.current,
                heart_rate: 75,
                time: isoTime
            };

            console.log("전송할 데이터:", payload);

            fetch("https://learningas.shop/focus/upload/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            })
                .then((res) => res.json())
                .then((data) => console.log("전송 완료:", data))
                .catch((err) => console.error("전송 실패:", err));

            // 전송 후 카운터 초기화
            blinkCountRef.current = 0;
            eyeClosedTimeRef.current = 0;
            zoningOutTimeRef.current = 0;
            setBlinkCount(0);
            setEyeClosedTime(0);
            setZoningOutTime(0);
        }, 10000);

        return () => clearInterval(interval);
    }, []); // 빈 배열: 마운트/언마운트 시 한 번만 실행

    let blinkThreshold = 0.2;
    let blinkConsecFrames = 3;
    let eyeCloseCounter = 0;
    let prevEyeCenter = null;
    let prevFaceCenter = null;
    let eyeStillFrames = 0;
    let faceStillFrames = 0;
    let stillThreshold = 30 * 2;
    let zoneoutStarted = false;

    const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const calcEAR = (eye) => {
        const A = distance(eye[1], eye[5]);
        const B = distance(eye[2], eye[4]);
        const C = distance(eye[0], eye[3]);
        return (A + B) / (2.0 * C);
    };

    const onResults = (results) => {
        const detected = results.multiFaceLandmarks?.length > 0;
        setPresent(detected);
        presentRef.current = detected;
        if (!detected) return;

        const keypoints = results.multiFaceLandmarks[0];
        const leftEyeIdx = [362, 385, 387, 263, 373, 380];
        const rightEyeIdx = [33, 160, 158, 133, 153, 144];

        const leftEye = leftEyeIdx.map((i) => keypoints[i]);
        const rightEye = rightEyeIdx.map((i) => keypoints[i]);

        const ear = (calcEAR(leftEye) + calcEAR(rightEye)) / 2;

        if (ear < blinkThreshold) {
            eyeCloseCounter++;
            setEyeClosedTime((prev) => {
                eyeClosedTimeRef.current = prev + 1;
                return prev + 1;
            });
        } else {
            if (eyeCloseCounter >= blinkConsecFrames) {

                const now = Date.now();
                const fiveMinAgo = now - 5 * 60 * 1000;
                blinkHistoryRef.current = blinkHistoryRef.current.filter((t) => t > fiveMinAgo);

                if (now - lastAlertTime > 10 * 1000   // ← 10초
                    && blinkHistoryRef.current.length < 3) {
                    alert('최근 5분간 깜빡임이 너무 적습니다. 휴식을 권장합니다.');
                    setLastAlertTime(now);
                }
            }
            eyeCloseCounter = 0;
        }

        const irisL = keypoints[468];
        const irisR = keypoints[473];
        const eyeCenter = { x: (irisL.x + irisR.x) / 2, y: (irisL.y + irisR.y) / 2 };
        const faceCenter = keypoints[1];
        const lastZoneoutAlertRef = useRef(Date.now());

        if (prevEyeCenter) {
            const move = distance(eyeCenter, prevEyeCenter);
            eyeStillFrames = move < 0.002 ? eyeStillFrames + 1 : 0;
        }
        prevEyeCenter = eyeCenter;

        if (prevFaceCenter) {
            const move = distance(faceCenter, prevFaceCenter);
            faceStillFrames = move < 0.002 ? faceStillFrames + 1 : 0;
        }
        prevFaceCenter = faceCenter;

        if (eyeStillFrames > stillThreshold && faceStillFrames > stillThreshold) {
            const now = Date.now();
            const MIN_ALERT_INTERVAL = 10 * 1000; // 10초

            // 첫 알람 또는 최소 10초 지난 경우에만
            if (!zoneoutStarted && now - lastZoneoutAlertRef.current > MIN_ALERT_INTERVAL) {
                zoneoutStarted = true;
                alert('멍 때리는 중인 것 같아요! 집중해볼까요?');
                lastZoneoutAlertRef.current = now;  // 알람 시각 업데이트
            }

            setZoningOutTime(prev => {
                zoningOutTimeRef.current = prev + 1;
                return prev + 1;
            });
        } else {
            zoneoutStarted = false;
        }
        useEffect(() => {
            const videoElement = videoRef.current;
            const faceMesh = new window.FaceMesh({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults(onResults);

            const camera = new window.Camera(videoElement, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoElement });
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }, []);

        const FPS = 30;
        return (
            <div>
                <video ref={videoRef} style={{ width: 640, height: 480 }} autoPlay playsInline muted />
                <p>눈 깜빡임 횟수: {blinkCount}</p>
                <p>눈 감은 시간: {(eyeClosedTime / FPS).toFixed(1)}초</p>
                <p>멍 때린 시간: {(zoningOutTime / FPS).toFixed(1)}초</p>
                <p>얼굴 감지 상태: {present ? "O" : "X"}</p>
            </div>
        );
    }

    export default BlinkZoneoutDetector;
