# 2. focus/urls.py 에 경로 등록하기
# focus/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # 기존 URL 패턴들…
    path('archetype/', views.archetype_view, name='archetype'),
    path('daily-schedule/', views.daily_schedule_view, name='daily_schedule'),
    path('anomaly/', views.anomaly_view, name='anomaly'),
    path('explain/', views.explain_view, name='explain'),
]

#4번까지 완료 