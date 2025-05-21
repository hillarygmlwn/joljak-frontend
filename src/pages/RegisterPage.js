// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const SERVER = 'https://learningas.shop';

function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async () => {
    const res = await fetch(`${SERVER}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      alert('회원가입 성공!');
      navigate('/');
    } else {
      alert(data.error || '회원가입 실패');
    }
  };

  return (
    <div className="register-container">
      <h2>회원가입</h2>
      <input
        type="text"
        name="username"
        placeholder="아이디"
        value={form.username}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder="이메일"
        value={form.email}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={handleChange}
      />
      <button className="btn" onClick={handleRegister}>
        회원가입
      </button>
      <p>
        이미 계정이 있으신가요?{' '}
        <span className="link" onClick={() => navigate('/')}>
          로그인
        </span>
      </p>
    </div>
  );
}

export default RegisterPage;
