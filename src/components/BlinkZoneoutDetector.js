import React, { useEffect, useRef, useState } from 'react';

function BlinkZoneoutDetector() {
    const videoRef = useRef(null);
    const [blinkCount, setBlinkCount] = useState(0);
    const [eyeClosedTime, setEyeClosedTime] = useState(0);
    const [zoningOutTime, setZoningOutTime] = useState(0);
    const [present, setPresent] = useState(false);

    // ✅ 실시간 전송용 ref
    const blinkCountRef = useRef(0);
    const eyeClosedTimeRef = useRef(0);
    const zoningOutTimeRef = useRef(0);
    const presentRef = useRef(false);

    let blinkThreshold = 0.2;
    let blinkConsecFrames = 3;
    let eyeCloseCounter = 0;
    let prevEyeCenter = null;
    let prevFaceCenter = null;
    let eyeStillFrames = 0;
    let faceStillFrames = 0;
    let stillThreshold = 30 * 2; // 2초 정지
    let zoneoutStarted = false;

    const calcEAR = (eye) => {
        const A = distance(eye[1], eye[5]);
        const B = distance(eye[2], eye[4]);
        const C = distance(eye[0], eye[3]);
        return (A + B) / (2.0 * C);
    };

    const distance = (p1, p2) => {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    };

    const onResults = (results) => {
        const detected = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
        setPresent(detected);
        presentRef.current = detected;

        if (!detected) return;

        const keypoints = results.multiFaceLandmarks[0];
        const leftEyeIdx = [362, 385, 387, 263, 373, 380];
        const rightEyeIdx = [33, 160, 158, 133, 153, 144];

        const leftEye = leftEyeIdx.map(i => keypoints[i]);
        const rightEye = rightEyeIdx.map(i => keypoints[i]);

        const leftEAR = calcEAR(leftEye);
        const rightEAR = calcEAR(rightEye);
        const ear = (leftEAR + rightEAR) / 2;

        if (ear < blinkThreshold) {
            eyeCloseCounter++;
            setEyeClosedTime(prev => {
                eyeClosedTimeRef.current = prev + 1;
                return prev + 1;
            });
        } else {
            if (eyeCloseCounter >= blinkConsecFrames) {
                setBlinkCount(prev => {
                    blinkCountRef.current = prev + 1;
                    return prev + 1;
                });
            }
            eyeCloseCounter = 0;
        }

        const irisL = keypoints[468];
        const irisR = keypoints[473];
        const eyeCenter = {
            x: (irisL.x + irisR.x) / 2,
            y: (irisL.y + irisR.y) / 2
        };
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
                console.log('😵 멍 때리는 중...');
            }
            setZoningOutTime(prev => {
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

    // ✅ 전송: 10초마다 한 번씩만
    useEffect(() => {
        const interval = setInterval(() => {
            const payload = {
                blink_count: blinkCountRef.current,
                eyes_closed_time: parseFloat((eyeClosedTimeRef.current / 30).toFixed(2)),
                zoning_out_time: parseFloat((zoningOutTimeRef.current / 30).toFixed(2)),
                timestamp: new Date().toISOString(),
                present: presentRef.current,
            };

            console.log('📤 전송할 데이터:', payload);

            fetch('https://learningas.shop/focus/upload/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(payload),
            })
                .then(res => res.json())
                .then(data => console.log('✅ 전송 완료:', data))
                .catch(err => console.error('❌ 전송 실패:', err));

            // 초기화
            blinkCountRef.current = 0;
            eyeClosedTimeRef.current = 0;
            zoningOutTimeRef.current = 0;
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <video ref={videoRef} style={{ width: 640, height: 480 }} autoPlay playsInline muted />
            <p>🔁 Blink Count: {blinkCount}</p>
            <p>👁️ Eyes Closed Time: {eyeClosedTime} frames</p>
            <p>😵 Zoning Out Time: {zoningOutTime} frames</p>
            <p>🧍‍♀️ Present (Face Detected): {present ? '✅' : '❌'}</p>
        </div>
    );
}

export default BlinkZoneoutDetector;
