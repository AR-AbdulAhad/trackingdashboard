import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const decodeAdmin = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName,
      role: decoded.role || 'ADMIN',
      pageAccess: decoded.pageAccess || [],
      // profilePhoto is no longer in JWT to avoid header size limits
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [admin, setAdmin] = useState(() => {
    // Try to load cached admin with photo from localStorage first
    const cached = localStorage.getItem('adminData');
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
    return decodeAdmin(localStorage.getItem('adminToken'));
  });

  const fetchMe = useCallback(async (currentToken) => {
    if (!currentToken) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
        try { localStorage.setItem('adminData', JSON.stringify(data)); } catch { /* ignore if too big */ }
      } else if (res.status === 401) {
        logout();
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  }, []);

  // Fetch full profile (with photo) on initial load if we have a token
  useEffect(() => {
    if (token) {
      fetchMe(token);
    }
  }, [token, fetchMe]);

  const login = useCallback((newToken, adminData) => {
    localStorage.setItem('adminToken', newToken);
    if (adminData) {
      try { localStorage.setItem('adminData', JSON.stringify(adminData)); } catch { /* ignore */ }
    }
    setToken(newToken);
    setAdmin(adminData || decodeAdmin(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('auth_token');
    setToken(null);
    setAdmin(null);
  }, []);

  const updateAdmin = useCallback((adminData) => {
    setAdmin(adminData);
    try { localStorage.setItem('adminData', JSON.stringify(adminData)); } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, updateAdmin, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
