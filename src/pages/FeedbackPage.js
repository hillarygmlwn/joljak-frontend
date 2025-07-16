import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ArchetypePage() {
    const [data, setData] = useState(null);

    useEffect(() => {
        axios.get('/focus/archetype/', {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` }
        })
            .then(res => setData(res.data))
            .catch(console.error);
    }, []);

    if (!data) return <p>로딩 중…</p>;
    return (
        <div style={{ padding: 20 }}>
            <h2>당신의 집중 유형</h2>
            <img
                src="/assets/studytype.png"
                alt="공부 유형 소개 표"
                style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
            />
        </div>
    );
}
