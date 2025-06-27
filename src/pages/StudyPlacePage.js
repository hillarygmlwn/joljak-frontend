import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import schoolImg from '../assets/school.png';
// import libraryImg from '../assets/library.png';
// import cafeImg from '../assets/cafe.png';

function StudyPlacePage() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (!selectedPlace) {
      setShowAlert(true);
      return;
    }
    // 선택한 장소 저장 로직 필요시 추가
    localStorage.setItem('place', selectedPlace);  // ✅ 추가
    navigate('/study');
  };

  const placeOptions = [
    { label: '학교', value: 'school', left: 172, img: process.env.PUBLIC_URL + '/assets/school.png' },
    { label: '도서실', value: 'library', left: 574, img: process.env.PUBLIC_URL + '/assets/library.png' },
    { label: '카페', value: 'cafe', left: 976, img: process.env.PUBLIC_URL + '/assets/cafe.png' }
  ];


  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: 'white', overflow: 'hidden' }}>
      <div style={{ left: 558, top: 112, position: 'absolute', color: 'black', fontSize: 36, fontFamily: 'Inter', fontWeight: '600' }}>
        어느 장소에 계신가요?
      </div>

      {placeOptions.map((place, idx) => (
        <div key={place.value}>
          <div
            onClick={() => {
              setSelectedPlace(place.value);
              setShowAlert(false);
            }}
            style={{
              width: 291, height: 296,
              left: place.left, top: 327,
              position: 'absolute', background: '#BEE2F3',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
              borderRadius: 9999, cursor: 'pointer',
              border: selectedPlace === place.value ? '4px solid #0091D3' : 'none'
            }}
          />

          <img
            src={place.img}
            alt={place.label}
            style={{ width: 193, height: 226, position: 'absolute', left: place.left + 49, top: 362 }}
          />

          <div style={{
            position: 'absolute',
            top: 668,
            left: place.left + 116,
            color: 'black',
            fontSize: 32,
            fontFamily: 'Inter',
            fontWeight: 400
          }}>{place.label}</div>
        </div>
      ))}

      <div onClick={handleStart} style={{
        width: 277, height: 105, left: 588, top: 794,
        position: 'absolute', background: '#0091D3',
        borderRadius: 40, cursor: 'pointer'
      }} />

      <div onClick={handleStart} style={{
        left: 660, top: 825, position: 'absolute',
        color: 'white', fontSize: 36,
        fontFamily: 'Inter', fontWeight: '600', cursor: 'pointer'
      }}>공부시작</div>

      {showAlert && (
        <div style={{
          width: '100%', height: '100%', position: 'absolute',
          top: 0, left: 0, backgroundColor: '#9E9E9E', opacity: 0.4,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            position: 'absolute',
            textAlign: 'center',
            color: 'black',
            fontSize: 36,
            fontFamily: 'Inter',
            fontWeight: 500,
            backgroundColor: 'white',
            padding: '20px 40px',
            borderRadius: '20px',
            zIndex: 999
          }}>장소를 선택해 주십시오</div>
        </div>
      )}
    </div>
  );
}

export default StudyPlacePage;
