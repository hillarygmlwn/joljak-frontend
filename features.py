
# ──────────────────────────────────────────────────────────
# 윈도우 피쳐(10초단위), 세션피쳐(한세션 단위) 계산 추가
# ──────────────────────────────────────────────────────────

import numpy as np
from django.db.models import (
    Avg, Sum, StdDev, Case, When, FloatField, Count
)
from django.db.models.functions import Trunc
from .models import SensorData

def get_window_features(user, session_id, window_sec=10):
    """
    각 윈도우에 다음 피처 추가:
      - writing_time: pressure>0로 기록된 개수  (샘플 개수 대신 시간으로 환산해도 좋아요)
      - writing_ratio: pressure>0 비율
    """
    qs = (
        SensorData.objects.filter(user=user, session_id=session_id)
        .annotate(win=Trunc('timestamp', f'{window_sec}s'))
        .values('win')
        .annotate(
            avg_focus=Avg('focus_data__focus_score'),
            sum_blink=Sum('focus_data__blink_count'),
            sum_eyes_closed=Sum('focus_data__eyes_closed_time'),
            sum_zoning=Sum('focus_data__zoning_out_time'),
            present_ratio=Avg(
                Case(
                    When(focus_data__present=True, then=1),
                    default=0,
                    output_field=FloatField()
                )
            ),
            hr_std=StdDev('heart_rate'),
            pressure_std=StdDev('pressure'),

            # 필기 관련 피처
            writing_count=Count(
                Case(
                  When(pressure__gt=0, then=1),
                  output_field=FloatField()
                )
            ),
            total_count=Count('id'),
        )
        .order_by('win')
    )

    feats = []
    for row in qs:
        n = row['total_count'] or 1
        writing_count = row['writing_count'] or 0
        feats.append([
            row['avg_focus'] or 0.0,
            row['sum_blink'] or 0,
            row['sum_eyes_closed'] or 0.0,
            row['sum_zoning'] or 0.0,
            row['present_ratio'] or 0.0,
            row['hr_std'] or 0.0,
            row['pressure_std'] or 0.0,
            writing_count,                  # 필기 횟수(샘플 개수)
            writing_count / n               # 필기 비율
        ])
    return np.array(feats, dtype=float)

def extract_session_features(user, session_id):
    X = get_window_features(user, session_id)
    if X.size == 0:
        return np.zeros(9, dtype=float)

    total_focus       = X[:,0].sum()
    avg_blink         = X[:,1].mean()
    total_zoning      = X[:,3].sum()
    total_eyes_closed = X[:,2].sum()
    hr_var            = float(np.var(X[:,5]))
    pr_var            = float(np.var(X[:,6]))
    total_writing     = X[:,7].sum()          # 전체 필기 샘플 수
    avg_writing_ratio = float(X[:,8].mean())  # 윈도우당 평균 필기 비율

    return np.array([
        total_focus,
        avg_blink,
        total_zoning,
        total_eyes_closed,
        hr_var,
        pr_var,
        total_writing,
        avg_writing_ratio,
        X.shape[0]
    ], dtype=float)
