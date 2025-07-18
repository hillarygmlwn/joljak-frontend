# scripts/train_anomaly.py
import pickle
import numpy as np
import django; django.setup()

from django.contrib.auth import get_user_model; User = get_user_model()
from focus.ml import get_window_features  # 각 윈도우용 피처 추출 함수
from sklearn.svm import OneClassSVM

def main():
    # 1) 모든 정상 데이터(예: 최근 30일 무이상 세션)로 윈도우 피처 집계
    X = []
    for user in User.objects.filter(is_active=True):
        windows = get_window_features(user, session_id)  # shape=(total_windows, feat_dim)
        X.append(windows)
    X = np.vstack(X)

    # 2) One-class SVM 학습
    clf = OneClassSVM(kernel='rbf', nu=0.05, gamma='auto')
    clf.fit(X)

    # 3) 저장
    with open('focus/models/anomaly_svm.pkl','wb') as f:
        pickle.dump(clf, f)
