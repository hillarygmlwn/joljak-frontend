function FocusDashboard() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [todaySummary, setTodaySummary] = useState(null);
  const [focusData, setFocusData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const resAll = await axios.get(
          'https://learningas.shop/focus/all-summary/',
          { headers: { Authorization: `Token ${token}` } }
        );
        // …생략…
        const today = /* 가장 최신 날짜 계산 or new Date() */;
        const resToday = await axios.get(
          `https://learningas.shop/focus/summary/?date=${today}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setTodaySummary(resToday.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>불러오는 중...</p>;

  return (
    <div className="dashboard-wrapper">
      <button className="hamburger-btn" onClick={()=>setSidebarOpen(o=>!o)}>
        ☰
      </button>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="profile-section">
          <img
            src={require('../assets/user_profile.png')}
            className="profile-pic"
          />
          <p>{user?.username || '사용자'}</p>
        </div>
        <div className="menu">유저설정</div>
        <div className="menu">캘린더</div>
        <div className="menu">예비1</div>
        <div className="menu logout">로그아웃</div>
      </div>

      <div className="dashboard-layout">
        <div className="left-panel">
          <h2>{user?.username || '사용자'}님</h2>
          <div className="focus-info-box">
            <p><strong>최근 집중 정보</strong></p>
            {todaySummary ? (
              <>
                <p>점수: {todaySummary.focus_score}점</p>
                <p>시간: {Math.floor(todaySummary.study_time_min)}분</p>
                <p>날짜: {todaySummary.date}</p>
              </>
            ) : (
              <p>데이터가 없습니다.</p>
            )}
          </div>
          <button onClick={()=>navigate('/study-place')}>
            공부 시작
          </button>
        </div>
        {/* 달력… */}
      </div>
    </div>
  );
}
