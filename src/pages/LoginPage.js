// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import axios from 'axios';  // 상단에 추가되어 있어야 함

const SERVER = 'https://learningas.shop';

function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      // 토큰 발급 엔드포인트
      const res = await fetch(`${SERVER}/api-token-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        // 토큰과 사용자명 로컬에 저장
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', form.username);

        // axios 기본 헤더 세팅 (index.js 쪽에서 읽어감)
        // ✅ axios 기본 헤더 설정

        axios.defaults.headers.common['Authorization'] = `Token ${data.token}`;
        navigate('/dashboard');
      } else {
        alert(data.non_field_errors || data.detail || '로그인 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 요청 중 에러 발생');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>로그인</h2>
        <input
          type="text"
          name="username"
          placeholder="아이디"
          value={form.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
        />
        <button className="btn" onClick={handleSubmit}>
          로그인
        </button>

        {/* 토글 대신 간단한 내비게이션 */}
        <button
          className="link-button"
          onClick={() => navigate('/register')}
        >
          계정이 없으신가요? 회원가입
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
