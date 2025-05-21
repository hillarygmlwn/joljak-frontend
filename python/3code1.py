import cv2
import mediapipe as mp
import numpy as np
import dlib
import os
import pandas as pd
from imutils import face_utils
from scipy.spatial import distance as dist
from datetime import datetime, timedelta
import requests
import time

# dlib 설정
predictor_path = "C:/Users/heejukim/Downloads/blinking_and_attendance2/test_001/shape_predictor_68_face_landmarks.dat"
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(predictor_path)

# EAR 계산 함수
def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)

def calc_EAR(eye):
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])
    return (A + B) / (2.0 * C)

# mediapipe 설정
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

# haar 설정
script_dir = os.path.dirname(os.path.abspath(__file__))
face_cascade_path = os.path.join(script_dir, "haarcascade_frontalface_alt.xml")
face_cascade = cv2.CascadeClassifier(face_cascade_path)

# 웹캠 설정
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# 파라미터
EYE_AR_THRESH = 0.2
EYE_AR_CONSEC_FRAMES = 3
EYE_CLOSED_THRESHOLD_SEC = 2
FPS = 30
STILL_THRESHOLD = 2
MOVEMENT_EPSILON = 2.5
BLINK_EAR_THRESHOLD = 0.18

# 상태 변수 초기화
COUNTER = 0
TOTAL = 0
EYE_CLOSED_DURATION = 0
prev_eye_pos = None
prev_face_pos = None
eye_still_time = 0
face_still_time = 0
blink_log = []
face_miss_log = []
zoneout_log = []
face_lost = False
face_lost_start = None
zoneout = False
zoneout_start = None

# 프로그램 시작 시간
program_start_time = datetime.now()

# 실시간 전송 데이터 초기화
focus_data = {
    "blink_count": 0,
    "eyes_closed_time": 0,
    "zoning_out_time": 0,
    
}

frame_face_detected = False  # 10초 동안 얼굴이 한 번이라도 감지되면 True
last_send_time = time.time()

# 메인 루프
while cap.isOpened():
    print("1️⃣ 시작됨")  # 프로그램 시작
    cap = cv2.VideoCapture(0)
    print("2️⃣ 웹캠 객체 생성 완료")

    ret, frame = cap.read()
    print("3️⃣ 첫 프레임 시도")
    if not ret:
        print("⚠️ 프레임을 읽지 못했습니다.")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # 얼굴 인식 (haar)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        if not face_lost:
            face_lost = True
            face_lost_start = datetime.now()
            print("▶ 얼굴 사라짐:", face_lost_start.strftime('%H:%M:%S'))
    else:
        frame_face_detected = True  # ▶▶ 여기 추가 ◀◀
        if face_lost and face_lost_start is not None:
            now = datetime.now()
            lost_duration = (now - face_lost_start).total_seconds()
            print(f"▶ 얼굴 재탐지됨: {now.strftime('%H:%M:%S')} (사라졌던 시간: {lost_duration:.2f}초)")
            if lost_duration >= 3:
                face_miss_log.append((
                    face_lost_start.strftime('%Y-%m-%d %H:%M:%S'),
                    now.strftime('%Y-%m-%d %H:%M:%S')
                ))
                print("→ face_miss_log 기록됨")
            face_lost = False


        for (x, y, fw, fh) in faces:
            cv2.rectangle(frame, (x, y), (x + fw, y + fh), (255, 0, 255), 2)

    # 눈 깜빡임 감지 (dlib)
    rects = detector(gray, 0)
    for rect in rects:
        shape = predictor(gray, rect)
        shape = face_utils.shape_to_np(shape)
        leftEye = shape[36:42]
        rightEye = shape[42:48]
        leftEAR = eye_aspect_ratio(leftEye)
        rightEAR = eye_aspect_ratio(rightEye)
        ear = (leftEAR + rightEAR) / 2.0

        if ear < EYE_AR_THRESH:
            COUNTER += 1
            EYE_CLOSED_DURATION += 1
        else:
            if COUNTER >= EYE_AR_CONSEC_FRAMES:
                TOTAL += 1
                blink_log.append(datetime.now().strftime('%Y-%m-%d %H:%M'))
            COUNTER = 0
            EYE_CLOSED_DURATION = 0

        if EYE_CLOSED_DURATION > FPS * EYE_CLOSED_THRESHOLD_SEC:
            cv2.putText(frame, "Eyes closed", (30, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        cv2.putText(frame, f"Blinks: {TOTAL}", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, f"EAR: {ear:.2f}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.drawContours(frame, [cv2.convexHull(leftEye)], -1, (0, 255, 0), 1)
        cv2.drawContours(frame, [cv2.convexHull(rightEye)], -1, (0, 255, 0), 1)

    # 멍 감지 (mediapipe)
    results = face_mesh.process(rgb)
    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0]

        def get_point(idx):
            lm = landmarks.landmark[idx]
            return np.array([lm.x * w, lm.y * h])

        try:
            left_iris = get_point(468)
            right_iris = get_point(473)
            eye_center = np.mean([left_iris, right_iris], axis=0)
            face_center = get_point(1)

            left_eye_idxs = [362, 385, 387, 263, 373, 380]
            left_eye = [get_point(i) for i in left_eye_idxs]
            left_ear = calc_EAR(left_eye)
            is_blinking = left_ear < BLINK_EAR_THRESHOLD

            if not is_blinking:
                if prev_eye_pos is not None:
                    eye_move = np.linalg.norm(eye_center - prev_eye_pos)
                    eye_still_time = eye_still_time + 1 if eye_move < MOVEMENT_EPSILON else 0
                else:
                    eye_still_time += 1
                prev_eye_pos = eye_center

            if prev_face_pos is not None:
                face_move = np.linalg.norm(face_center - prev_face_pos)
                face_still_time = face_still_time + 1 if face_move < MOVEMENT_EPSILON else 0
            prev_face_pos = face_center

            is_eye_still = eye_still_time > FPS * STILL_THRESHOLD
            is_face_still = face_still_time > FPS * STILL_THRESHOLD

            if is_eye_still and is_face_still:
                if not zoneout:
                    zoneout = True
                    zoneout_start = datetime.now()
                status = "Zoning out..."
                color = (0, 0, 255)
            else:
                if zoneout:
                    zoneout = False
                    zoneout_log.append((zoneout_start.strftime('%Y-%m-%d %H:%M:%S'), datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
                status = "Focused"
                color = (0, 255, 0)

            cv2.putText(frame, status, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
            cv2.circle(frame, tuple(left_iris.astype(int)), 3, (255, 0, 0), -1)
            cv2.circle(frame, tuple(right_iris.astype(int)), 3, (0, 0, 255), -1)
            cv2.circle(frame, tuple(face_center.astype(int)), 5, (0, 255, 255), -1)

        except:
            pass

    # 데이터 전송
    focus_data["blink_count"] = TOTAL
    focus_data["eyes_closed_time"] = round(EYE_CLOSED_DURATION / FPS, 3)
    focus_data["zoning_out_time"] = round(eye_still_time / FPS, 3) if is_eye_still and is_face_still else 0

    if time.time() - last_send_time > 10:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 기존 focus_data에 현재 상태 추가
        focus_data["timestamp"] = current_time
        focus_data["present"] = frame_face_detected

        try:
            res = requests.post("https://learningas.shop/focus/upload/", json=focus_data)
            print("전송 완료:", res.status_code, focus_data)
        except Exception as e:
            print("전송 실패:", e)
        last_send_time = time.time()
        frame_face_detected = False
        focus_data["blink_count"] = 0
        focus_data["eyes_closed_time"] = 0
        focus_data["zoning_out_time"] = 0
        TOTAL = 0  # ← 여기에 추가!



    cv2.imshow("Focus & Blink Monitor", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

# 프로그램 종료 시간
program_end_time = datetime.now()
total_runtime_sec = (program_end_time - program_start_time).total_seconds()

# 얼굴 부재 시간 및 absence log 정리
#absence_log = []
face_total_lost_sec = 0

# for start_str, end_str in face_miss_log:
#     start = datetime.strptime(start_str, "%Y-%m-%d %H:%M:%S")
#     end = datetime.strptime(end_str, "%Y-%m-%d %H:%M:%S")
#     duration = (end - start).total_seconds()

#     if duration >= 3:
#         absence_log.append(["false", start_str, "true", end_str])
#         face_total_lost_sec += duration

absence_ratio = face_total_lost_sec / total_runtime_sec if total_runtime_sec > 0 else 0
# focus_data["absence_log"] = absence_log
# focus_data["absence_ratio"] = round(absence_ratio, 3)

# CSV 파일 저장
pd.DataFrame(blink_log, columns=["BlinkTime"]).to_csv("blinks.csv", index=False)
pd.DataFrame(face_miss_log, columns=["FaceLostStart", "FaceLostEnd"]).to_csv("face_lost.csv", index=False)
pd.DataFrame(zoneout_log, columns=["ZoneoutStart", "ZoneoutEnd"]).to_csv("zoneout.csv", index=False)
# pd.DataFrame(absence_log, columns=["State1", "Time1", "State2", "Time2"]).to_csv("absence_log.csv", index=False)

# 로그 확인용 출력
print("총 실행 시간(초):", int(total_runtime_sec))
print("자리 비운 시간(초):", int(face_total_lost_sec))
print(f"자리 비운 비율: {absence_ratio:.2%}")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           