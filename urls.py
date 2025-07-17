# 2. focus/urls.py 에 경로 등록하기
# focus/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # 기존 URL 패턴들…
    path('archetype/', views.archetype_view, name='archetype'),
    path('daily-schedule/', views.daily_schedule_view, name='daily_schedule'),
]
