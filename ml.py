# focus/ml.py

import pickle
import numpy as np
import torch
from datetime import date, timedelta
from .rl_model import PolicyNet
from .ml import get_last_n_days_summary
from django.conf import settings
from django.db import models
from django.db.models import (
    Avg, Min, Max, Sum, StdDev,
    Case, When, FloatField, Q
)
from django.db.models.functions import TruncDate, ExtractHour
from .ml import get_window_features

from .models import FocusData, SensorData, StudySession

# ──────────────────────────────────────────────────────────
# 1) 미리 학습해 둔 KMeans 모델 불러오기
# ──────────────────────────────────────────────────────────
MODEL_PATH = settings.BASE_DIR / 'focus' / 'models' / 'kmeans_archetype.pkl'
with open(MODEL_PATH, 'rb') as f:
    kmeans_model = pickle.load(f)


# ──────────────────────────────────────────────────────────
# 2) 최근 days일 치 “하루 요약” 집계 함수
# ──────────────────────────────────────────────────────────
def get_last_n_days_summary(user, days=7):
    end = date.today()
    start = end - timedelta(days=days-1)

    # FocusData에서 날짜별로 기본 통계 집계
    qs = (
        FocusData.objects
        .filter(user=user, timestamp__date__range=(start, end))
        .annotate(day=TruncDate('timestamp'))
        .values('day')
        .annotate(
            focus_score=Avg('focus_score'),
            blink_count=Sum('blink_count'),
            zoneout_time=Sum('zoning_out_time'),
            absent_ratio=Avg(
                Case(
                    When(present=False, then=1),
                    default=0,
                    output_field=FloatField()
                )
            ),
            # 시작 시간대(시) 평균
            start_hour=Avg(ExtractHour('timestamp')),
        )
        .order_by('day')
    )

    # StudySession에서 날짜별 세션 길이 통계 (분 단위)
    sess_qs = (
        StudySession.objects
        .filter(user=user, start_at__date__range=(start, end), end_at__isnull=False)
        .annotate(day=TruncDate('start_at'))
        .values('day')
        .annotate(
            avg_len=Avg(
                (models.F('end_at') - models.F('start_at'))
            ),
            min_len=Min(models.F('end_at') - models.F('start_at')),
            max_len=Max(models.F('end_at') - models.F('start_at')),
        )
        .order_by('day')
    )

    # 두 QuerySet을 날짜별 dict로 합치기
    daily_map = {d['day']: d for d in qs}
    for s in sess_qs:
        day = s['day']
        # Python timedelta → 분으로 변환
        avg_min = s['avg_len'].total_seconds() / 60 if s['avg_len'] else 0
        min_min = s['min_len'].total_seconds() / 60 if s['min_len'] else 0
        max_min = s['max_len'].total_seconds() / 60 if s['max_len'] else 0

        daily_map.setdefault(day, {}).update({
            'avg_focus': avg_min,
            'min_focus': min_min,
            'max_focus': max_min,
        })

    # 순서 보장하면서 리스트로 반환, 부족한 날은 0으로 채움
    daily = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        row = daily_map.get(day, {})
        daily.append({
            'focus_score':   float(row.get('focus_score', 0.0)),
            'blink_count':   float(row.get('blink_count', 0)),
            'zoneout_time':  float(row.get('zoneout_time', 0.0)) / 60,  # 초→분
            'absent_ratio':  float(row.get('absent_ratio', 0.0)),
            'start_hour':    float(row.get('start_hour', 0.0)),
            'avg_focus':     float(row.get('avg_focus', 0.0)),
            'min_focus':     float(row.get('min_focus', 0.0)),
            'max_focus':     float(row.get('max_focus', 0.0)),
        })
    return daily


# ──────────────────────────────────────────────────────────
# 3) 특성 벡터 생성 함수 수정
# ──────────────────────────────────────────────────────────
def extract_user_features(user, days=7):
    """
    get_last_n_days_summary로 뽑은 days일치 요약을
    (days, feature_dim) 배열로 리턴 후,
    KMeans가 기대하는 1차원 벡터(평균)로 변환합니다.
    """
    daily = get_last_n_days_summary(user, days)
    X = np.array([
        [
            d['focus_score'],
            d['blink_count'],
            d['zoneout_time'],
            d['absent_ratio'],
            d['start_hour'],
            d['avg_focus'],
            d['min_focus'],
            d['max_focus'],
        ]
        for d in daily
    ], dtype=float)  # shape = (days, 8)

    # KMeans 입력은 1행짜리 2D array이므로, 여기에 일일 데이터를 평균으로 축약
    feature_vector = X.mean(axis=0).reshape(1, -1)
    return feature_vector


# ──────────────────────────────────────────────────────────
# 4) 예측 함수는 그대로
# ──────────────────────────────────────────────────────────
def predict_archetype(user):
    features = extract_user_features(user)
    label = kmeans_model.predict(features)[0]
    return int(label)

# ──────────────────────────────────────────────────────────
# 휴식/학습 시간 추천 함수
# ──────────────────────────────────────────────────────────

# 모델 로드 (입력 차원도 extract_user_features와 맞춰주세요)
STATE_DIM = 8     # 예시: extract_user_features에서 쓰는 피처 개수
MODEL_PATH = settings.BASE_DIR / 'focus' / 'models' / 'policy_net.pkl'

policy = PolicyNet(STATE_DIM)
with open(MODEL_PATH, 'rb') as f:
    policy.load_state_dict(pickle.load(f))
policy.eval()

def get_daily_recommendation(user, days=3):
    """
    최근 days일 요약에서 집중도 시퀀스를 뽑아서
    policy가 '휴식'을 권할 때까지 공부한 분(min)을 리턴.
    휴식 권장 분은 기본 2분으로 고정합니다.
    """
    # 1) 최근 days일치 요약 중 집중도 시계열만 뽑아요.
    #    get_last_n_days_summary가 하루 단위로 요약을 반환하니,
    #    과거 days일의 focus_score를 모아서 배열로 만듭니다.
    daily = get_last_n_days_summary(user, days=days)
    # focus_score가 [0~1] 정규화돼 있다고 가정
    seq = torch.tensor([ d['focus_score'] for d in daily ], dtype=torch.float32)

    # 2) policy에게 하루치 상태(state)를 한번만 넘겨서 액션을 구분합니다.
    #    (여기선 단순히 평균 집중도로 판단해서, 평균이 낮으면 짧게, 높으면 길게)
    avg_focus = seq.mean().item()

    # 임계치(threshold)에 비해 평균 집중도가 높으면 더 오래, 낮으면 짧게 권장
    # 예시: 평균 ≥ 0.8 → 50분, 0.6~0.8 → 40분, 0.4~0.6 → 30분, 그 이하 → 20분
    if avg_focus >= 0.8:
        study_min = 50
    elif avg_focus >= 0.6:
        study_min = 40
    elif avg_focus >= 0.4:
        study_min = 30
    else:
        study_min = 20

    break_min = 2  # 휴식은 2분으로 고정

    return {
        'study_min': study_min,
        'break_min': break_min,
        'avg_focus': round(avg_focus, 2)
    }

# ──────────────────────────────────────────────────────────
# 목적: 사용자의 평소 집중 패턴과 크게 다른 순간을 찾아내어 “요즘 컨디션이 평소와 다릅니다” 같은 통찰을 제공

# 언제: 피드백 페이지를 열었을 때, 최근 세션 중 이상 구간이 있었는지 요약해서 보여줌
# ──────────────────────────────────────────────────────────

with open(settings.BASE_DIR/'focus'/'models'/'anomaly_svm.pkl','rb') as f:
    anomaly_clf = pickle.load(f)

def detect_anomalies(user):
    """
    윈도우별로 이상치(–1) / 정상(1) 레이블 반환
    그리고 이상치가 총 몇 %였는지 요약
    """
    X = get_window_features(user)            # (T, feat_dim)
    preds = anomaly_clf.predict(X)           # 1 or -1
    total = len(preds)
    n_anom = (preds == -1).sum()
    return {
      'anomaly_ratio': round(n_anom/total, 3),
      'anomaly_windows': int(n_anom),
      'total_windows': int(total)
    }