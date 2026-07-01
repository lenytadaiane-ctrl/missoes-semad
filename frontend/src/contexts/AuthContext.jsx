import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem('semad_auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function login(data) {
    localStorage.setItem('semad_auth', JSON.stringify(data));
    setAuth(data);
  }

  function logout() {
    localStorage.removeItem('semad_auth');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ user: auth?.usuario, role: auth?.role, token: auth?.token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
