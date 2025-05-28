import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';


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
  const [summary, setSummary] = useState(null);
  const { date } = useParams();  // ⬅️ 주소에서 date 가져옴
  const [timelineData, setTimelineData] = useState(null);
  const [blinkGraphData, setBlinkGraphData] = useState(null);


  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/summary/?date=${date}`)
      .then((res) => {
        setSummary(res.data);
      })
      .catch((err) => {
        console.error("요약 정보 불러오기 실패", err);
      });

    // 신규 timeline 요청
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
    axios
      .get(`https://learningas.shop/focus/blink_summary/?date=${date}`)
      .then((res) => {
        const timeline = res.data.timeline;

        setBlinkGraphData({
          labels: timeline.map((d) =>
            `${d.time} - ${d.drowsy ? '졸음 😴' : '정상 ✅'}`
          ),
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


  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}분 ${sec}초`;
  };

  const getDetailedFeedback = (summary) => {
    const { focus_score, blink_count, zoneout_time_sec, study_time_min, heart_rate_stable, present } = summary;

    let feedback = `💡 총 평점: ${focus_score}점. `;

    if (focus_score >= 85) feedback += "매우 우수한 집중력이었습니다. 👏 ";
    else if (focus_score >= 70) feedback += "양호한 집중력을 유지했네요. 😊 ";
    else feedback += "집중력이 다소 부족했습니다. 😥 환경을 점검해보세요. ";

    if (blink_count < 50) feedback += "눈 깜빡임이 적었습니다. 눈의 피로가 누적될 수 있으니 중간중간 휴식을 권장해요. ";
    else if (blink_count > 150) feedback += "눈 깜빡임이 너무 잦습니다. 졸림이나 피로 상태일 수 있습니다. ";

    if (zoneout_time_sec > 60) feedback += `멍 때린 시간은 ${formatTime(zoneout_time_sec)}입니다. 집중에 어려움이 있었던 것 같아요. `;

    if (!present) feedback += "자리를 자주 비웠습니다. 집중 흐름에 방해가 되었을 수 있어요. ";

    if (!heart_rate_stable) feedback += "심박수에 변동이 있었습니다. 피로나 긴장을 의심해볼 수 있어요.";

    return feedback;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📘 {date} 집중도 요약</h2>
      {summary ? (
        <div>
          <p>✅ 심박수 → {summary.heart_rate_stable ? "안정적인 구간 유지" : "변동 있음"}</p>
          <p>🖊️ 필기 시간 → {summary.study_time_min}분</p>
          <p>👁️ 눈 깜빡임 → {summary.blink_count > 100 ? "잦음" : "정상"}</p>
          <p>🙈 자리 이탈 → {summary.present ? "없었음" : "자리를 비운 기록 있음"}</p>
          <p>😶 멍 → {formatTime(summary.zoneout_time_sec)}</p>
          <p>💯 최종 집중도 점수: {summary.focus_score}점</p>
          <p><strong>📌 피드백 요약:</strong></p>
          <p>{getDetailedFeedback(summary)}</p>
          {/* ✅ 여기 아래에 그래프 추가 */}
          {timelineData && (
            <div style={{ marginTop: "40px" }}>
              <h3>📊 시간대별 활동 분석</h3>
              <Bar
                data={timelineData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: '시간 (초)' },
                    },
                    x: {
                      title: { display: true, text: '10초 단위 시간' },
                    },
                  },
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
                    title: {
                      display: true,
                      text: '눈 깜빡임 + 졸음 감지',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      suggestedMax: 10,
                      title: {
                        display: true,
                        text: '깜빡임 횟수',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: '시간 (60초 간격)',
                      },
                    },
                  },
                }}
              />
            </div>
          )}





        </div>
      ) : (
        <p>데이터 로딩 중...</p>
      )}
    </div>
  );
};

export default FocusDetailPage;
