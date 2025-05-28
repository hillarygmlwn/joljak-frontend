import React from 'react';
import { useNavigate } from 'react-router-dom';

function StartPage() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate('/login');
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'white', overflow: 'hidden' }}>
            <div
                onClick={handleStart}
                style={{
                    width: 381, height: 97, left: 529, top: 415,
                    position: 'absolute', background: '#0091D3',
                    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: 40,
                    cursor: 'pointer'
                }}
            />

            <div
                onClick={handleStart}
                style={{
                    left: 648, top: 442, position: 'absolute',
                    textAlign: 'center', color: '#f9f9f9',
                    fontSize: 28, fontFamily: 'Inter', fontWeight: '700', wordWrap: 'break-word',
                    cursor: 'pointer'
                }}
            >
                시작하기
            </div>

            <div style={{
                left: 474, top: 168, position: 'absolute',
                textAlign: 'center', color: '#333333',
                fontSize: 24, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word'
            }}>
                공 부?<br />시작 할까 말까? 이미 누른 거면 반은 배운 거예요
            </div>

            <img
                style={{
                    width: 180, height: 209, left: 630, top: 560,
                    position: 'absolute', borderRadius: 58
                }}
                src={require('../assets/study_start.png')}
                alt="공부하는 공룡"
            />
        </div>
    );
}

export default StartPage;
