// FocusDetailPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FocusDetailPage = () => {
  const { date } = useParams();
  const [summary, setSummary] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [blinkData, setBlinkData] = useState(null);
  const [focusScoreData, setFocusScoreData] = useState(null);

  // 1) 하루 요약
  useEffect(() => {
    axios
      .get(`/focus/summary/?date=${date}`)
      .then((res) => setSummary(res.data))
      .catch((err) => console.error('요약 불러오기 실패', err));
  }, [date]);

  // 1.5) 집중 유지 시간 가져오기
  useEffect(() => {
    axios
      .get(`/focus/focus-durations/?threshold=60`)  // 필요하면 threshold 파라미터 조정
      .then(res => setFocusDurations(res.data))
      .catch(err => console.error('집중 유지 시간 불러오기 실패', err));
  }, []);

  // 2) 자리 이탈·멍
  useEffect(() => {
    axios.get(`/focus/timeline/?date=${date}`)
      .then(res => {
        const raw = res.data.timeline;
        setTimelineData({
          labels: raw.map(r => r.time),
          datasets: [
            {
              label: '자리 이탈',
              data: raw.map(r => r.absent),
              backgroundColor: 'red'
            },
            {
              label: '멍 때림',
              data: raw.map(r => r.zoneout),
              backgroundColor: 'blue'
            }
          ]
        });
      })
      .catch(err => console.error('타임라인 불러오기 실패', err));
  }, [date]);

  // 3) 60초 단위 깜빡임
  useEffect(() => {
    axios.get(`/focus/blink_summary/?date=${date}`)
      .then(res => {
        const tl = res.data.timeline;
        setBlinkData({
          labels: tl.map(d => d.time),
          datasets: [
            {
              label: '깜빡임 횟수',
              data: tl.map(d => d.blink_count),
              backgroundColor: 'green'
            }
          ]
        });
      })
      .catch(err => console.error('blink summary 실패', err));
  }, [date]);

  // 4) 10초 단위 집중도 (focus_score)
  useEffect(() => {
    axios.get(`/focus/timeline-detail/?date=${date}`)
      .then(res => {
        const raw = res.data.timeline;
        setFocusScoreData({
          labels: raw.map(r => r.time),
          datasets: [
            {
              label: '10초 집중도',
              data: raw.map(r => r.focus_score),
              backgroundColor: 'orange'
            }
          ]
        });
      })
      .catch(err => console.error('집중도 그래프 불러오기 실패', err));
  }, [date]);

  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  if (!summary) return <p>데이터 로딩 중...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{date} 집중도 요약</h2>
      <p>점수: {summary.focus_score}</p>
      {focusDurations && (
        <p>
          집중 유지: 평균 {focusDurations.average_focused_min}분
          (최대 {focusDurations.max_focused_min}분, 최소 {focusDurations.min_focused_min}분)
        </p>
      )}
      <p>깜빡임: {summary.blink_count}회</p>
      <p>멍 때림: {formatTime(summary.zoneout_time_sec)}</p>
      <p>자리 이탈 비율: {Math.round(summary.present_ratio * 100)}%</p>

      {timelineData && (
        <div>
          <h3>시간대별 활동</h3>
          <Bar data={timelineData} />
        </div>
      )}

      {blinkData && (
        <div>
          <h3>60초 단위 깜빡임</h3>
          <Bar data={blinkData} />
        </div>
      )}

      {focusScoreData && focusScoreData.labels.length > 0 ? (
        <div>
          <h3>10초 단위 집중도</h3>
          <Bar data={focusScoreData} />
        </div>
      ) : (
        <p>10초 집중도 데이터 없음</p>
      )}
    </div>
  );
};

export default FocusDetailPage;