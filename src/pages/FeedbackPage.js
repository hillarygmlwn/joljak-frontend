// src/pages/FeedbackPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ① 유형별 이름·설명·팁 매핑
const TYPE_INFO = {
  0: {
    name: '야행성(夜行性)',
    description: '저녁·심야에 집중도가 높고, 아침보다는 저녁에 더 잘 몰입하는 스타일',
    tip: '오늘도 밤 시간대가 최적! 8시 이후에 가장 몰입도가 높으니, 저녁 스케줄을 활용해 보세요.',
  },
  1: {
    name: '주행성(日行性)',
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
    tip: '15분 전력질주 후 2분 스트레칭으로 컨디션을 회복하면 좋습니다.',
  }
};

export default function FeedbackPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('/focus/archetype/', {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` }
    })
    .then(res => setData(res.data))
    .catch(console.error);
  }, []);

  if (!data) return <p>로딩 중…</p>;

  const { archetype } = data;
  const info = TYPE_INFO[archetype] || {};

  // ② JSX는 최상위 하나의 div로 감싸기
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
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
      <div style={{
        background: '#f0f8ff',
        border: '1px solid #cce',
        borderRadius: 8,
        padding: 16,
        marginTop: 20
      }}>
        <strong>맞춤 팁:</strong>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>{info.tip}</p>
      </div>
    </div>
  );
}
