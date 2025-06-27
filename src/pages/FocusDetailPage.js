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
  const navigate = useNavigate();
  const { date } = useParams();
  const [summary, setSummary] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [blinkGraphData, setBlinkGraphData] = useState(null);
  const [focusScoreGraphData, setFocusScoreGraphData] = useState(null);

  // ✅ 1. 하루 요약 불러오기
  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/summary/?date=${date}`)
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("요약 정보 불러오기 실패", err));
  }, [date]);

  // ✅ 2. 시간대별 활동 (자리 이탈, 멍 때림)
  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/timeline/?date=${date}`)
      .then((res) => {
        const raw = res.data.timeline;
        setTimelineData({
          labels: raw.map((r) => r.time),
          datasets: [
            {
              label: '자리 이탈',
              data: raw.map((r) => r.absent),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            {
              label: '멍 때림',
              data: raw.map((r) => r.zoneout),
              backgroundColor: 'rgba(255, 206, 86, 0.6)',
            },
          ],
        });
      })
      .catch((err) => console.error("timeline 로딩 실패", err));
  }, [date]);

  // ✅ 3. 60초 단위 깜빡임 요약
  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/blink_summary/?date=${date}`)
      .then((res) => {
        const timeline = res.data.timeline;
        setBlinkGraphData({
          labels: timeline.map((d) => `${d.time} - ${d.drowsy ? '졸음 😴' : '정상 ✅'}`),
          datasets: [
            {
              label: '눈 깜빡임 횟수 (60초 단위)',
              data: timeline.map((d) => d.blink_count),
              backgroundColor: timeline.map((d) =>
                d.drowsy ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)'
              )
            }
          ]
        });
      })
      .catch((err) => console.error("blink summary 로딩 실패", err));
  }, [date]);

  // ✅ 4. 10초 단위 집중도 점수
  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/data/?date=${date}`)
      .then((res) => {
        console.log("✅ 백엔드 응답:", res.data);
        const raw = res.data.hourly_stats || [];

        console.log("📈 시간별 집중도 데이터:", raw);

        if (!Array.isArray(raw)) {
          console.error("📛 hourly_stats가 배열이 아닙니다.", raw);
          return;
        }

        setFocusScoreGraphData({
          labels: raw.map((r) => r.hour?.slice(11, 16) ?? 'Unknown'), // HH:MM 포맷
          datasets: [
            {
              label: '집중도 점수 (평균)',
              data: raw.map((r) => r.count ? Math.round(100 - (r.total_zoning_time / (r.count * 10)) * 100) : 0),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        });
      })
      .catch((err) => {
        console.error("❌ 집중도 그래프 로딩 실패", err);
      });
  }, [date]);


  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}분 ${sec}초`;
  };

  const getDetailedFeedback = (summary) => {
    const present = summary.present_ratio === 1;
    const heartRateStable = summary.heart_rate;

    let feedback = `💡 총 평점: ${summary.focus_score}점. `;
    if (summary.focus_score >= 85) feedback += "매우 우수한 집중력이었습니다. 👏 ";
    else if (summary.focus_score >= 70) feedback += "양호한 집중력을 유지했네요. 😊 ";
    else feedback += "집중력이 다소 부족했습니다. 😥 환경을 점검해보세요. ";

    if (summary.blink_count < 50)
      feedback += "눈 깜빡임이 적었습니다. 눈의 피로가 누적될 수 있으니 중간중간 휴식을 권장해요. ";
    else if (summary.blink_count > 150)
      feedback += "눈 깜빡임이 너무 잦습니다. 졸림이나 피로 상태일 수 있습니다. ";

    if (summary.zoneout_time_sec > 60)
      feedback += `멍 때린 시간은 ${formatTime(summary.zoneout_time_sec)}입니다. 집중에 어려움이 있었던 것 같아요. `;

    if (!present) feedback += "자리를 자주 비웠습니다. 집중 흐름에 방해가 되었을 수 있어요. ";
    if (!heartRateStable) feedback += "심박수에 변동이 있었습니다. 피로나 긴장을 의심해볼 수 있어요.";

    return feedback;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📘 {date} 집중도 요약</h2>
      {summary ? (
        <div>
          <p>✅ 심박수 → {summary.heart_rate ? "안정적인 구간 유지" : "변동 있음"}</p>
          <p>🖊️ 필기 시간 → {summary.study_time_min}분</p>
          <p>👁️ 눈 깜빡임 → {summary.blink_count > 100 ? "잦음" : "정상"}</p>
          <p>🙈 자리 이탈 → {summary.present_ratio === 1 ? "없었음" : "자리를 비운 기록 있음"}</p>
          <p>😶 멍 → {formatTime(summary.zoneout_time_sec)}</p>
          <p>💯 최종 집중도 점수: {summary.focus_score}점</p>
          <p><strong>📌 피드백 요약:</strong></p>
          <p>{getDetailedFeedback(summary)}</p>

          {timelineData && (
            <div style={{ marginTop: "40px" }}>
              <h3>📊 시간대별 활동 분석</h3>
              <Bar
                data={timelineData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: '시간 (초)' } },
                    x: { title: { display: true, text: '10초 단위 시간' } }
                  }
                }}
              />
            </div>
          )}

          {blinkGraphData && (
            <div style={{ marginTop: "40px" }}>
              <h3>👁️ 60초 단위 눈 깜빡임 분석</h3>
              <Bar
                data={blinkGraphData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: '눈 깜빡임 + 졸음 감지' }
                  },
                  scales: {
                    y: { beginAtZero: true, suggestedMax: 10, title: { display: true, text: '깜빡임 횟수' } },
                    x: { title: { display: true, text: '시간 (60초 간격)' } }
                  }
                }}
              />
            </div>
          )}

          {focusScoreGraphData && focusScoreGraphData.labels.length > 0 ? (
            <div style={{ marginTop: "40px" }}>
              <h3>🎯 10초 단위 집중도 점수</h3>
              <Bar
                data={focusScoreGraphData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: '집중도 점수 (10초 단위)' }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      suggestedMax: 100,
                      title: { display: true, text: '점수' },
                    },
                    x: {
                      title: { display: true, text: '시간 (HH:MM:SS)' },
                      ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10, // 시간 많아지면 축 밀리는 문제 방지
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p>⚠️ 집중도 데이터 없음 또는 로딩 실패</p>
          )}
        </div>
      ) : (
        <p>데이터 로딩 중...</p>
      )}
    </div>
  );
};

export default FocusDetailPage;
