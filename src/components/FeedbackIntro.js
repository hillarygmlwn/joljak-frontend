// src/components/FeedbackIntro.js
import React from 'react';

export default function FeedbackIntro() {
  return (
    <div style={{
      background: '#e8f4fd',
      border: '1px solid #b3d8fd',
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
      lineHeight: 1.6
    }}>
      <h2 style={{ marginTop: 0 }}>Feedback 페이지 안내</h2>
      <ul style={{ paddingLeft: 20 }}>
        <li>
          <strong>나만의 집중 유형 진단</strong><br/>
          당신만의 집중 스타일(야행성·주행성·휴식 중시형·스프린터형)을 진단합니다.<br/>
          나에게 맞는 공부 시간대와 휴식 사이클을 바로 확인할 수 있어요.
        </li>
        <li>
          <strong>학습 스케줄 추천</strong><br/>
          최근 평균 집중도 기반으로 오늘의 공부/휴식 시간을 분 단위로 알려드립니다.<br/>
          예시:<br/>
          • 평균 집중도 85% → 50분 공부 후 2분 휴식<br/>
          • 평균 집중도 65% → 40분 공부 후 2분 휴식<br/>
          과도한 공부로 지치지 않고, 적절한 휴식으로 효율을 극대화할 수 있어요.
        </li>
        <li>
          <strong>이상치 탐지</strong><br/>
          공부 중 평소와 다른 패턴이 얼마나 있었는지 분석해 컨디션 경고를 제공합니다.<br/>
          이상 집중 구간이 특정 비율 이상일 때는 컨디션 점검 알림이 뜹니다.<br/>
          갑자기 방해받거나 집중력이 저하된 순간을 짚어 줘서, 학습 환경이나 컨디션을 바로 개선할 수 있어요.
        </li>
        <li>
          <strong>집중 요소 중요도 해석</strong><br/>
          집중 성공에 가장 큰 영향을 준 요소(눈 깜빡임, 필기 시간, 멍 때린 시간 등)를 시각화합니다.<br/>
          각 요소별로 ‘내 세션 성공에 미친 영향도’를 나열하여<br/>
          나만의 강·약점을 파악하고, 다음 학습에서는 어떤 부분을 보완해야 할지도 알 수 있어요.
        </li>
      </ul>
      <p style={{ marginTop: 20, fontWeight: 'bold' }}>
        이제 Feedback 페이지에서 나의 학습 패턴을 360°로 진단받고,<br/>
        효과적인 공부 계획과 컨디션 관리를 한 번에 경험해 보세요!<br/>
        궁금한 점이 있으면 언제든 피드백 부탁드립니다. 감사합니다!
      </p>
    </div>
  );
}
