# focus/models.py 의 class 수정하기

class StudySession(models.Model):
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    place     = models.CharField(max_length=50)
    start_at  = models.DateTimeField()
    end_at    = models.DateTimeField(null=True, blank=True)

    # ── 여기에 추가 ──
    success_score = models.FloatField(
        null=True, blank=True,
        help_text="(예: 세션 성공도, 세션 길이, 별점 등)"
    )

    def __str__(self):
        return f"{self.user} @ {self.place} ({self.start_at} – {self.end_at})"

#이 뒤에 python manage.py makemigrations focus 와 python manage.py migrate 를 실행하시면, 
# StudySession 인스턴스마다 success_score 를 저장할 수 있게 됩니다.