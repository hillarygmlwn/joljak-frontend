import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FocusDetailPage = () => {
  const { date } = useParams();
  const [summary, setSummary] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [blinkGraphData, setBlinkGraphData] = useState(null);
  const [focusScoreGraphData, setFocusScoreGraphData] = useState(null);

  // 1) 하루 요약 불러오기
  useEffect(() => {
    axios.get(`/focus/summary/?date=${date}`)
      .then(res => setSummary(res.data))
      .catch(err => console.error('요약 정보 불러오기 실패', err));
  }, [date]);

  // 2) 시간대별 활동 (자리 이탈, 멍 때림)
  useEffect(() => {
    axios.get(`/focus/timeline/?date=${date}`)
      .then(res => {
        const raw = res.data.timeline;
        if (!raw) return;
        setTimelineData({
          labels: raw.map(r => r.time),
          datasets: [
            { label: '자리 이탈', data: raw.map(r => r.absent), backgroundColor: 'rgba(255,99,132,0.6)' },
            { label: '멍 때림', data: raw.map(r => r.zoneout), backgroundColor: 'rgba(255,206,86,0.6)' }
          ]
        });
      })
      .catch(err => console.error('timeline 로딩 실패', err));
  }, [date]);

  // 3) 60초 단위 깜빡임 요약
  useEffect(() => {
    axios.get(`/focus/blink_summary/?date=${date}`)
      .then(res => {
        const raw = res.data.timeline;
        if (!raw) return;
        setBlinkGraphData({
          labels: raw.map(d => d.time),
          datasets: [
            { label: '눈 깜빡임 횟수 (60초 단위)', data: raw.map(d => d.blink_count), backgroundColor: raw.map(d => d.drowsy ? 'rgba(255,99,132,0.6)' : 'rgba(75,192,192,0.6)') }
          ]
        });
      })
      .catch(err => console.error('blink summary 로딩 실패', err));
  }, [date]);

  // 4) 10초 단위 집중도 점수
  useEffect(() => {
    axios.get(`/focus/timeline-detail/?date=${date}`)
      .then(res => {
        const raw = res.data.timeline;
        if (!raw) return;
        setFocusScoreGraphData({
          labels: raw.map(r => r.time),
          datasets: [
            { label: '10초 단위 집중도 점수', data: raw.map(r => r.focus_score), backgroundColor: 'rgba(54,162,235,0.6)' }
          ]
        });
      })
      .catch(err => console.error('10초 단위 집중도 로딩 실패', err));
  }, [date]);

  return (
    <div style={{ padding: '20px' }}>
      {/* ... rest of component unchanged ... */}
    </div>
  );
};

export default FocusDetailPage;
