import { createContext, useState, useEffect } from 'react';
import axios from '../axios';

export const AuthContext = createContext({
  user: null,
  token: null,
  logout: () => {},   // 빈 함수라도 기본값에 선언
});



export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) setUser({ username });
    // (선택) /users/me/ API 호출로 더 정확한 정보를 가져와도 좋습니다.
  }, []);

 

  return (
    <AuthContext.Provider value={{  user, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
