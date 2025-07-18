// src/pages/FeedbackPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FeedbackIntro from '../components/FeedbackIntro';
import './FeedbackPage.css';


// ① 유형별 이름·설명·팁 매핑
const TYPE_INFO = {
    0: {
        name: '야행성',
        description: '저녁·심야에 집중도가 높고, 아침보다는 저녁에 더 잘 몰입하는 스타일',
        tip: '오늘도 밤 시간대가 최적! 8시 이후에 가장 몰입도가 높으니, 저녁 스케줄을 활용해 보세요.',
    },
    1: {
        name: '주행성',
        description: '낮 시간(오전·오후)에 집중도가 최고인 스타일',
        tip: '오전 9시~12시가 골든타임! 이 시간에 핵심 과제를 배치하면 효율이 상승합니다.',
    },
    2: {
        name: '휴식 중시형',
        description: '짧은 휴식을 자주 취해야 집중이 유지되는 스타일',
        tip: '25분 공부 후 5분 휴식(포모도로)이 딱 맞아요. 타이머를 켜두고 규칙적으로 쉬어보세요.',
    },
    3: {
        name: '스프린터형',
        description: '짧고 강한 몰입 세션을 선호해 빠르게 끝내고 다음 세션으로 넘어가는 스타일',
        tip: '100분 몰입 후 10분 휴식으로 컨디션을 회복하면 좋습니다.',
    }
};

export default function FeedbackPage() {
    const [data, setData] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [anomaly, setAnomaly] = useState(null);
    const [explain, setExplain] = useState(null);

    useEffect(() => {
        // ② 아키타입과 daily-schedule을 병렬 호출
        const token = localStorage.getItem('token');
        const archetypeReq = axios.get('/focus/archetype/', {
            headers: { Authorization: `Token ${token}` }
        });
        const scheduleReq = axios.get('/focus/daily-schedule/', {
            headers: { Authorization: `Token ${token}` }
        });
        // 현재 활성 세션 ID가 필요합니다. 저장해 두셨다면 불러오세요.
        const sessionId = localStorage.getItem('session_id');
        const anomalyReq = axios.get('/focus/anomaly/', {
            headers: { Authorization: `Token ${token}` },
            params: { session_id: sessionId }
        });
        const explainReq = axios.get('/focus/explain/', {
            headers: { Authorization: `Token ${token}` },
            params: { session_id: sessionId }
        });


        Promise.all([archetypeReq, scheduleReq, anomalyReq, explainReq])
            .then(([archetypeRes, scheduleRes, anomalyRes, explainRes]) => {
                setData(archetypeRes.data);
                setSchedule(scheduleRes.data);
                setAnomaly(anomalyRes.data);
                setExplain(explainRes.data);
            })
            .catch(console.error);
    }, []);

    if (!data || !schedule || !anomaly || !explain) return <p>로딩 중…</p>;

    const { archetype } = data;
    const info = TYPE_INFO[archetype] || {};

    // 평균 집중도 퍼센트 계산 (소수점 1자리)
    const avgPercent = (schedule.avg_focus * 100).toFixed(1);

    // ② JSX는 최상위 하나의 div로 감싸기
    return (
        <div className="feedback-page">
            {/* 페이지 기능 소개 */}
            <FeedbackIntro />
            <h2>당신의 집중 유형</h2>

            {/* 이미지 */}
            <img
                src="/assets/studytype.png"
                alt="공부 유형 소개 표"
                style={{ width: '100%', margin: '20px 0', border: '1px solid #ccc' }}
            />

            {/* 유형명 */}
            <h3 style={{ marginTop: 20 }}>
                {archetype}번 · {info.name}
            </h3>

            {/* 설명 */}
            <p style={{ lineHeight: 1.6 }}>{info.description}</p>

            {/* 맞춤 팁 */}
            <div className="tip-box">
                <strong>맞춤 팁:</strong>
                <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>{info.tip}</p>
            </div>

            {/* ③ 하루 권장 공부·휴식 시간 */}
            <div className="schedule-box">
                <h3>오늘의 학습 스케줄 추천</h3>
                <p>평균 집중도: <strong>{avgPercent}%</strong></p>
                <p>공부 권장 시간: <strong>{schedule.study_min}분</strong></p>
                <p>휴식 권장 시간: <strong>{schedule.break_min}분</strong></p>
            </div>

            {/* 이상치 섹션 */}
            <div className="section">
                <h3>최근 집중 패턴 분석</h3>
                <p>이상 집중 구간: {anomaly.anomaly_windows}/{anomaly.total_windows} ({(anomaly.anomaly_ratio * 100).toFixed(1)}%)</p>
                {anomaly.anomaly_ratio > 0.1 && (
                    <p className="warning">
                        평소와 다른 집중 패턴이 자주 관찰됩니다. 컨디션을 점검해 보세요.
                    </p>
                )}
            </div>

            {/* SHAP 설명 섹션 */}
            <div className="section shap-list">
                <h3>세션 성공 기여도 분석</h3>
                {explain.feature_names.map((f, i) => (
                    <p key={f}>
                        {f}: {explain.shap_values[i].toFixed(2)}
                    </p>
                ))}
            </div>

        </div>
    );
}
