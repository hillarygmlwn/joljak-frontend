# focus/views.py
#1. focus/views.py 에 뷰 추가하기
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .ml import predict_archetype
from .ml import (
    predict_archetype,
    get_daily_recommendation,
    detect_anomalies,
    compute_shap
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def archetype_view(request):
    """
    GET /focus/archetype/
    현재 로그인 유저의 집중 아키타입 인덱스와 (선택)설명을 반환
    """
    idx = predict_archetype(request.user)
    # front에서 TYPE_INFO 매핑을 사용 중이니, 여기서는 인덱스만 내려줘도 충분합니다.
    return Response({
        "archetype": idx
    })

#학습+휴식 시간 추천 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_schedule_view(request):
    rec = get_daily_recommendation(request.user, days=3)
    return Response(rec)

#이상치 예측
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def anomaly_view(request):
    session_id = request.query_params.get('session_id')
    if not session_id:
        return Response({'error': 'session_id 파라미터가 필요합니다.'},
                        status=status.HTTP_400_BAD_REQUEST)
    try:
        sid = int(session_id)
    except ValueError:
        return Response({'error': 'session_id는 정수여야 합니다.'},
                        status=status.HTTP_400_BAD_REQUEST)

    res = detect_anomalies(request.user, sid)
    return Response(res)


# SHAP/LIME 으로 피처 중요도 개인화
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explain_view(request):
    session_id = request.GET.get('session_id')
    if not session_id:
        return Response({'error':'session_id required'}, status=400)
    res = compute_shap(request.user, session_id)
    return Response(res)