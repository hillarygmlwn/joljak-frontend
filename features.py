# focus/features.py
import numpy as np
from django.db.models import Avg, Sum, StdDev, Case, When, FloatField, Count
from django.db.models.functions import Trunc
from .models import FocusData, SensorData

def get_window_features(user, session_id, window_sec=10):
    # 1) FocusData 집계
    fd_qs = (
        FocusData.objects
        .filter(user=user, session_id=session_id)
        .annotate(win=Trunc('timestamp', f'{window_sec}s'))
        .values('win')
        .annotate(
            avg_focus=Avg('focus_score'),
            sum_blink=Sum('blink_count'),
            sum_eyes_closed=Sum('eyes_closed_time'),
            sum_zoning=Sum('zoning_out_time'),
            present_ratio=Avg(
                Case(When(present=True, then=1), default=0, output_field=FloatField())
            ),
            total_count=Count('id'),
        )
        .order_by('win')
    )

    # 2) SensorData 집계 (심박·압력·필기)
    sd_qs = (
        SensorData.objects
        .filter(user=user, session_id=session_id)
        .annotate(win=Trunc('timestamp', f'{window_sec}s'))
        .values('win')
        .annotate(
            hr_std=StdDev('heart_rate'),
            pressure_std=StdDev('pressure'),
            writing_count=Count(
                Case(When(pressure__gt=0, then=1), output_field=FloatField())
            )
        )
        .order_by('win')
    )

    # 3) 두 결과를 win 기준으로 합치기
    fd_map = {r['win']: r for r in fd_qs}
    sd_map = {r['win']: r for r in sd_qs}

    feats = []
    for win in sorted(set(fd_map) | set(sd_map)):
        f = fd_map.get(win, {})
        s = sd_map.get(win, {})
        n = f.get('total_count', 1)
        wc = s.get('writing_count', 0)
        feats.append([
            f.get('avg_focus', 0.0),
            f.get('sum_blink', 0),
            f.get('sum_eyes_closed', 0.0),
            f.get('sum_zoning', 0.0),
            f.get('present_ratio', 0.0),
            s.get('hr_std', 0.0),
            s.get('pressure_std', 0.0),
            wc,            # 필기 횟수
            wc / n         # 윈도우당 필기 비율
        ])

    return np.array(feats, dtype=float)
