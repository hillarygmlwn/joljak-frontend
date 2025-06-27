import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StudyPlacePage() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (!selectedPlace) {
      setShowAlert(true);
      return;
    }
    localStorage.setItem('place', selectedPlace);  // ✅ 안전하게 저장
    navigate('/study');
  };

  const placeOptions = [
    { label: '학교', value: 'school', img: process.env.PUBLIC_URL + '/assets/school.png' },
    { label: '도서관', value: 'library', img: process.env.PUBLIC_URL + '/assets/library.png' },
    { label: '카페', value: 'cafe', img: process.env.PUBLIC_URL + '/assets/cafe.png' }
  ];

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>어느 장소에 계신가요?</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', margin: '30px 0' }}>
        {placeOptions.map((place) => (
          <div key={place.value} onClick={() => {
            setSelectedPlace(place.value);
            setShowAlert(false);
          }} style={{
            border: selectedPlace === place.value ? '3px solid #0091D3' : '1px solid #ccc',
            padding: '10px', borderRadius: '16px', cursor: 'pointer'
          }}>
            <img
              src={place.img || ''}
              alt={place.label}
              style={{ width: '120px', height: '100px', objectFit: 'cover' }}
              onError={(e) => e.target.style.display = 'none'}  // 이미지 깨질 경우 제거
            />
            <div>{place.label}</div>
          </div>
        ))}
      </div>

      <button onClick={handleStart} style={{
        padding: '10px 30px', fontSize: '18px',
        backgroundColor: '#0091D3', color: 'white', borderRadius: '12px'
      }}>
        공부 시작
      </button>

      {showAlert && <p style={{ color: 'red', marginTop: '20px' }}>장소를 선택해주세요.</p>}
    </div>
  );
}

export default StudyPlacePage;
