import React from 'react';
import { useNavigate } from 'react-router-dom';

function StartPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: 'white',
      overflow: 'hidden'
    }}>
      {/* 시작하기 버튼 배경 */}
      <div
        onClick={handleStart}
        style={{
          position: 'absolute',
          width: 381,
          height: 97,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#0091D3',
          borderRadius: 40,
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          cursor: 'pointer'
        }}
      />

      {/* 시작하기 텍스트 */}
      <div
        onClick={handleStart}
        style={{
          position: 'absolute',
          left: '50%',
          top: 'calc(50% + 10px)',
          transform: 'translate(-50%, 0)',
          textAlign: 'center',
          color: 'white',
          fontSize: 28,
          fontFamily: 'Inter',
          fontWeight: '700',
          cursor: 'pointer'
        }}
      >
        시작하기
      </div>

      {/* 안내 문구 */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#333333',
        fontSize: 24,
        fontFamily: 'Inter',
        fontWeight: '500'
      }}>
        공 부?<br />시작 할까 말까? 이미 누른 거면 반은 배운 거예요
      </div>

      {/* 이미지 */}
      <img
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '5%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 209,
          borderRadius: 58
        }}
        src="/assets/study_start.png"
        alt="공부하는 공룡"
      />
    </div>
  );
}

export default StartPage;
