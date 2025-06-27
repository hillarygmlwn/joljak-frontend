김희주
gimhyiju_99341
멤버들 화면 공유

정현
 님이 서버에 뛰어들어 오셨어요. — 2024-12-29 오후 4:57
얼굴 보니 좋네요, 
서경
 님. — 2024-12-29 오후 6:45
김희주
 님이 등장하셨어요! — 2024-12-30 오후 8:25
서경 — 2025-02-17 오후 7:51
2ㅓ
저전화좀
정현 — 2025-02-17 오후 7:51
넵
정현 — 2025-03-03 오후 7:01
이미지
오삼복 — 2025-03-03 오후 7:22
이미지
오삼복 — 2025-03-03 오후 7:35
이미지
서경 — 2025-03-03 오후 7:44
https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE11696417
DBpia
시선추적 데이터 기반 AI 실시간 온라인교육 맞춤형 피드백 시스템 설계 및 사용의향 평가 | DBpia
김동심, 류다현, 박규동 | 컴퓨터교육학회 논문지 | 2024.01
이미지
이미지
이미지
정현 — 2025-03-03 오후 7:49
문제 독학하다가
정답지 본느낌인데;
오삼복 — 2025-05-11 오후 3:57
[11/May/2025 15:54:05] "GET / HTTP/1.1" 404 2609
Not Found: /favicon.ico
[11/May/2025 15:54:05] "GET /favicon.ico HTTP/1.1" 404 2660
Not Found: /
서경 — 2025-06-25 오전 10:02
마이크연결만할게
마이크가 고장나서 채팅으로 해도될까 ?
서경 — 2025-06-25 오전 10:13
https://ziszini.tistory.com/139
서경 — 2025-06-25 오전 10:23
https://pizza301.tistory.com/99
서경 — 2025-06-25 오전 10:34
https://chatgpt.com/share/685b5235-82ac-800e-96f3-c174da87e946
서경 — 2025-06-25 오전 11:37
sudo systemctl status nginx
sudo systemctl status gunicorn
sudo journalctl -u gunicorn -n 100
첨부 파일 형식: acrobat
프레젠테이션1.pdf
172.50 KB
서경 — 2025-06-25 오후 12:01
첨부 파일 형식: acrobat
프레젠테이션1.pdf
137.04 KB
김희주 — 오후 1:33
https://joljak-frontend-git-main-0803s-projects.vercel.app/
React App
Web site created using create-react-app
김희주 — 오후 2:09
// ✅ Django views.py 수정 (upload_focus_data)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_focus_data(request):
    data = request.data or {}

    session = None
    session_id = data.get('session')
    if session_id:
        try:
            session = StudySession.objects.get(id=session_id, user=request.user)
        except StudySession.DoesNotExist:
            session = None

    FocusData.objects.create(
        user=request.user,
        session=session,  # ✅ 연동
        blink_count=data.get('blink_count', 0),
        eyes_closed_time=data.get('eyes_closed_time', 0.0),
        zoning_out_time=data.get('zoning_out_time', 0.0),
        present=data.get('present', True),
    )

    return Response({"message": "1 focus record saved."}, status=status.HTTP_201_CREATED)
class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100, unique=True)
    started_at = models.DateTimeField(auto_now_add=True)

class StudyEvent(models.Model):
    session = models.ForeignKey(StudySession, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20)  # 'study_start', 'study_end', etc.
    timestamp = models.DateTimeField()
✅ 2. serializers.py
python
Copy
Edit
focus/serializers.py
from rest_framework import serializers
from .models import StudyEvent, StudySession

class StudyEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyEvent
        fields = 'all'
session=session,
            event_type=event_type,
            timestamp=timestamp
        )
        serializer = StudyEventSerializer(event)
        return Response(serializer.data, status=201)
✅ 4. urls.py
python
Copy
Edit
focus/urls.py
from django.urls import path
from .views import StudyEventView

urlpatterns = [
    path('event/', StudyEventView.as_view(), name='study-event'),
]
메인 urls.py에 include("focus.urls") 되어 있어야 합니다.
오삼복 — 오후 2:28
Not Found: /
[27/Jun/2025 14:27:15] "GET / HTTP/1.0" 404 3288
김희주 — 오후 2:29
LoginPage.js:22 Mixed Content: The page at 'https://joljak-2keqb6gce-0803s-projects.vercel.app/' was loaded over HTTPS, but requested an insecure resource 'http://52.64.14.111:8000/users/login/'. This request has been blocked; the content must be served over HTTPS.
onClick @ LoginPage.js:22Understand this error
manifest.json:1 


           Failed to load resource: the server responded with a status of 401 ()
김희주 — 오후 2:36
joljak-2keqb6gce-0803s-projects.vercel.app
https://joljak-2keqb6gce-0803s-projects.vercel.app/
김희주 — 오후 4:35
https://learningas.shop/
CORS_ALLOWED_ORIGINS = [
    "https://joljak-git-main-0803s-projects.vercel.app/",
]
오삼복 — 오후 4:49
잠시만
오삼복 — 오후 6:06
focus
# focus/models.py

from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
확장
models.py
4KB
from rest_framework import serializers
from .models import FaceLostEvent#, Heartbeat
from .models import SensorData
from .models import FocusData
from .models import StudySession
확장
serializers.py
2KB

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import FocusScoreAPIView
from .views import upload_heartbeat_data # upload_pressure_data
확장
urls.py
2KB

import requests
from .serializers import StudySessionSerializer
from .models import StudySession
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import FocusDataSerializer
확장
views.py
17KB
김희주 — 오후 6:07
✅ 1. 새로운 API 추가: focus_timeline_detail
views.py 맨 아래에 다음 함수 추가:

python
Copy
Edit
from collections import defaultdict

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def focus_timeline_detail(request):
    date_str = request.GET.get('date')
    if not date_str:
        return JsonResponse({'error': 'Missing date'}, status=400)

    date = parse_date(date_str)
    start = datetime.combine(date, time.min)
    end = datetime.combine(date, time.max)

    data = FocusData.objects.filter(
        user=request.user,
        timestamp__range=(start, end)
    ).order_by('timestamp')

    timeline = []
    for item in data:
        t = item.timestamp.strftime('%H:%M:%S')
        timeline.append({
            'time': t,
            'focus_score': round(item.focus_score, 2),
            'absent': 10 if not item.present else 0,
            'zoneout': round(item.zoning_out_time, 2)
        })

    return JsonResponse({"timeline": timeline})
✅ 2. urls.py 등록
python
Copy
Edit
from .views import focus_timeline_detail

urlpatterns += [
    path('focus/timeline-detail/', focus_timeline_detail),
]
다음과 같이 views.py의 upload_focus_data() 내에서 저장 시 계산 추가 가능:

python
Copy
Edit
score = calc_focus_score(
    blink_count=data.get('blink_count', 0),
    eyes_closed_time=data.get('eyes_closed_time', 0.0),
    zoning_out_time=data.get('zoning_out_time', 0.0),
    present_ratio=1.0 if data.get('present', True) else 0.0,
    heart_rate=75,
    total_duration_sec=10  # 10초 간격 저장 기준
)

FocusData.objects.create(
    user=request.user,
    session=session,
    timestamp=dt,
    blink_count=data.get('blink_count', 0),
    eyes_closed_time=data.get('eyes_closed_time', 0.0),
    zoning_out_time=data.get('zoning_out_time', 0.0),
    present=data.get('present', True),
    focus_score=score  # ✅ 추가
)
김희주 — 오후 6:16
✅ 수정할 부분: views.py → upload_focus_data 함수
python
Copy
Edit
3) FocusData 생성
score = calc_focus_score(
    blink_count=data.get('blink_count', 0),
    eyes_closed_time=data.get('eyes_closed_time', 0.0),
    zoning_out_time=data.get('zoning_out_time', 0.0),
    present_ratio=1.0 if data.get('present', True) else 0.0,
    heart_rate=75,
    total_duration_sec=10
)

FocusData.objects.create(
    user=request.user,
    session=session,
    timestamp=dt,
    blink_count=data.get('blink_count', 0),
    eyes_closed_time=data.get('eyes_closed_time', 0.0),
    zoning_out_time=data.get('zoning_out_time', 0.0),
    present=data.get('present', True),
    focus_score=score  # ← 추가
)
https://joljak-frontend.vercel.app/
React App
Web site created using create-react-app
김희주 — 오후 6:40
✅ 1. POST /focus/data/
매 10초마다 집중도 점수를 전송하는 API

요청 예시:

json
Copy
Edit
{
  "score": 82,
  "timestamp": "2025-06-27T18:12:00Z"
}
모델 예시 (models.py):

python
Copy
Edit
class FocusData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    timestamp = models.DateTimeField()
시리얼라이저 (serializers.py):

python
Copy
Edit
class FocusDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusData
        fields = 'all'
뷰 (views.py):

python
Copy
Edit
class FocusDataView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FocusDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"status": "success"}, status=201)
        return Response(serializer.errors, status=400)
URL 등록 (urls.py):

python
Copy
Edit
path('focus/data/', FocusDataView.as_view()),
✅ 2. POST /focus/summary/
세션 종료 후 요약 데이터 전송 API

요청 예시:

json
Copy
Edit
{
  "date": "2025-06-27",
  "study_time_sec": 1230,
  "rest_time_sec": 300,
  "average_focus_score": 76
}
모델 예시 (models.py):

python
Copy
Edit
class FocusSummary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    study_time_sec = models.IntegerField()
    rest_time_sec = models.IntegerField()
    average_focus_score = models.FloatField()
시리얼라이저 (serializers.py):

python
Copy
Edit
class FocusSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusSummary
        fields = 'all'
뷰 (views.py):

python
Copy
Edit
class FocusSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FocusSummarySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"status": "saved"}, status=201)
        return Response(serializer.errors, status=400)
URL 등록 (urls.py):

python
Copy
Edit
path('focus/summary/', FocusSummaryView.as_view()),
✅ 1. models.py
이미 score 필드가 FocusData 모델에 정의되어 있으므로 변경 불필요합니다.
확인만 해보면 됩니다:

python
Copy
Edit
score = models.FloatField(default=0.0)  # ← 이 줄이 있으면 OK
✅ 2. serializers.py
10초 단위 집중도를 보내기 위해, FocusDataSerializer에 score를 포함시켜야 합니다:

python
Copy
Edit
class FocusDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusData
        fields = ['timestamp', 'score']  # ← score 꼭 포함!
✅ 3. views.py
날짜별 10초 단위 집중도 score 데이터를 보내주는 새로운 API 뷰 추가:

python
Copy
Edit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import FocusData
from .serializers import FocusDataSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def focus_score_data(request):
    user = request.user
    date_str = request.GET.get('date')

    if not date_str:
        return Response({'error': '날짜가 필요합니다.'}, status=400)

    focus_data = FocusData.objects.filter(
        user=user,
        timestamp__date=date_str
    ).order_by('timestamp')

    serializer = FocusDataSerializer(focus_data, many=True)
    timeline = []

    for item in serializer.data:
        timeline.append({
            'time': item['timestamp'][11:19],  # HH:MM:SS
            'score': item['score']
        })

    return Response({'timeline': timeline})
✅ 4. urls.py
위 focus_score_data 뷰를 URL에 등록:

python
Copy
Edit
from .views import focus_score_data

urlpatterns = [
    # ... 기존 URL들
    path('focus/data/', focus_score_data, name='focus-data'),  # ← 추가
]
------------------------------------------------
이걸로 확인
✅ 1. models.py
이미 score 필드가 FocusData 모델에 정의되어 있으므로 변경 불필요합니다.
확인만 해보면 됩니다:

python
Copy
Edit
score = models.FloatField(default=0.0)  # ← 이 줄이 있으면 OK
✅ 2. serializers.py
10초 단위 집중도를 보내기 위해, FocusDataSerializer에 score를 포함시켜야 합니다:

python
Copy
Edit
class FocusDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusData
        fields = ['timestamp', 'score']  # ← score 꼭 포함!
✅ 3. views.py
날짜별 10초 단위 집중도 score 데이터를 보내주는 새로운 API 뷰 추가:

python
Copy
Edit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import FocusData
from .serializers import FocusDataSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def focus_score_data(request):
    user = request.user
    date_str = request.GET.get('date')

    if not date_str:
        return Response({'error': '날짜가 필요합니다.'}, status=400)

    focus_data = FocusData.objects.filter(
        user=user,
        timestamp__date=date_str
    ).order_by('timestamp')

    serializer = FocusDataSerializer(focus_data, many=True)
    timeline = []

    for item in serializer.data:
        timeline.append({
            'time': item['timestamp'][11:19],  # HH:MM:SS
            'score': item['score']
        })

    return Response({'timeline': timeline})
✅ 4. urls.py
위 focus_score_data 뷰를 URL에 등록:

python
Copy
Edit
from .views import focus_score_data

urlpatterns = [
    # ... 기존 URL들
    path('focus/data/', focus_score_data, name='focus-data'),  # ← 추가
]
오삼복 — 오후 7:00

import requests
from .serializers import StudySessionSerializer
from .models import StudySession
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import FocusDataSerializer
확장
views.py
19KB
김희주 — 오후 7:00
👉 아래처럼 focus_score도 포함되도록 수정하세요:
python
Copy
Edit
@api_view(['GET'])
def focus_timeline(request):
    date_str = request.GET.get('date')
    if not date_str:
        return JsonResponse({'error': 'Missing date'}, status=400)

    date = parse_date(date_str)
    start = datetime.combine(date, time.min)
    end = datetime.combine(date, time.max)

    data = FocusData.objects.filter(timestamp__range=(start, end)).order_by('timestamp')

    timeline = []
    for item in data:
        timestamp = item.timestamp.strftime('%H:%M:%S')
        timeline.append({
            "time": timestamp,
            "focus_score": round(item.focus_score, 2),  # 추가
            "absent": 10 if not item.present else 0,
            "zoneout": round(item.zoning_out_time, 2)
        })

    return JsonResponse({"timeline": timeline})
URL 라우팅 (urls.py) 확인
해당 view가 /timeline/에 연결되어 있는지만 확인하세요:

python
Copy
Edit
path('timeline/', views.focus_timeline, name='focus-timeline'),
김희주 — 오후 7:12
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
확장
FocusDetailPage.js
7KB
오삼복 — 오후 7:19
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
확장
message.txt
8KB
﻿
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

  // 1) 하루 요약 불러오기
  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/summary/?date=${date}`)
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("요약 정보 불러오기 실패", err));
  }, [date]);

  // 2) 시간대별 활동 (자리 이탈, 멍 때림)
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

  // 3) 60초 단위 깜빡임 요약
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

  // 4) 10초 단위 집중도 점수
  useEffect(() => {
    axios
      .get(`https://learningas.shop/focus/timeline-detail/?date=${date}`)
      .then((res) => {
        const raw = res.data.timeline;
        setFocusScoreGraphData({
          labels: raw.map((r) => r.time),
          datasets: [
            {
              label: '10초 단위 집중도 점수',
              data: raw.map((r) => r.focus_score),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        });
      })
      .catch((err) => console.error("10초 단위 집중도 로딩 실패", err));
  }, [date]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}분 ${sec}초`;
  };

  const getDetailedFeedback = (summary) => {
    // present_ratio가 1이면 전 구간 자리에 앉아 있었던 것으로 간주
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

          {focusScoreGraphData && (
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
                    y: { beginAtZero: true, suggestedMax: 100, title: { display: true, text: '점수' } },
                    x: { title: { display: true, text: '시간 (HH:MM:SS)' } }
                  }
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
message.txt
8KB