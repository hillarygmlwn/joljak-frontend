import React, { useEffect, useRef, useState } from 'react';

function BlinkZoneoutDetector() {
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

    // 이 ref가 true가 되면 interval 등록을 건너뜁니다
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;    // 이미 등록했다면 아무것도 안 함
        startedRef.current = true;

        const interval = setInterval(() => {
            // …payload 생성…
            fetch("https://learningas.shop/focus/upload/", { … })
                .then(/*…*/)
                .catch(/*…*/);

            // 전송 후 ref / state 리셋
            blinkCountRef.current = 0;
            eyeClosedTimeRef.current = 0;
            zoningOutTimeRef.current = 0;
            setBlinkCount(0);
            setEyeClosedTime(0);
            setZoningOutTime(0);
        }, 10000);

        return () => {
            clearInterval(interval);
            // StrictMode 언마운트(첫 번째 마운트 후)에는 플래그만 유지해서 다시 등록 안 됨
        };
    }, []);  // 빈 배열: 마운트/언마운트 사이클에만 반응

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
                setBlinkCount((prev) => {
                    blinkCountRef.current = prev + 1;
                    return prev + 1;
                });

                const now = Date.now();
                blinkHistoryRef.current.push(now);
                const fiveMinAgo = now - 5 * 60 * 1000;
                blinkHistoryRef.current = blinkHistoryRef.current.filter((t) => t > fiveMinAgo);

                if (blinkHistoryRef.current.length < 3 && now - lastAlertTime > 5 * 60 * 1000) {
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
            if (!zoneoutStarted) {
                zoneoutStarted = true;
                alert('😵‍💫 멍 때리는 중인 것 같아요! 집중해볼까요?');
            }
            setZoningOutTime((prev) => {
                zoningOutTimeRef.current = prev + 1;
                return prev + 1;
            });
        } else {
            zoneoutStarted = false;
        }
    };

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

    useEffect(() => {
        const interval = setInterval(() => {
            const session_id = localStorage.getItem("session_id");
            if (!session_id) {
                console.warn("⚠️ 세션 ID 없음: 먼저 /study-sessions/start/로 세션을 시작하세요.");
                return;
            }

            const now = new Date();
            const isoTime = now.toISOString().slice(0, 19); // "2025-06-27T10:49:15"

            const payload = {
                session: session_id,  // ✅ 반드시 유효한 세션 ID
                blink_count: blinkCountRef.current,
                eyes_closed_time: eyeClosedTimeRef.current,
                zoning_out_time: zoningOutTimeRef.current,
                present: presentRef.current,
                heart_rate: 75,
                time: isoTime  // ✅ ISO-8601 형식
            };

            console.log("📤 전송할 데이터:", payload);

            fetch("https://learningas.shop/focus/upload/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log("✅ 전송 완료:", data);
                })
                .catch((err) => {
                    console.error("❌ 전송 실패:", err);
                });

            blinkCountRef.current = 0;
            eyeClosedTimeRef.current = 0;
            zoningOutTimeRef.current = 0;

            setBlinkCount(0);
            setEyeClosedTime(0);
            setZoningOutTime(0);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <video ref={videoRef} style={{ width: 640, height: 480 }} autoPlay playsInline muted />
            <p>🔁 Blink Count: {blinkCount}</p>
            <p>👁️ Eyes Closed Time: {eyeClosedTime} frames</p>
            <p>😵 Zoning Out Time: {zoningOutTime} frames</p>
            <p>🧍‍♀️ Present (Face Detected): {present ? "✅" : "❌"}</p>
        </div>
    );
}

export default BlinkZoneoutDetector;
