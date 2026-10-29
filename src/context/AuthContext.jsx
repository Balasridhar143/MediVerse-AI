import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on first mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('pulsecare_user') || localStorage.getItem('telehealth_user');
        const savedToken = localStorage.getItem('pulsecare_token') || localStorage.getItem('telehealth_token');

        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setToken(savedToken);

          // Verify with backend
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              const fullUserData = { ...parsedUser, ...currentUser };
              setUser(fullUserData);
              localStorage.setItem('pulsecare_user', JSON.stringify(fullUserData));
            }
          } catch (e) {
            // If token is invalid or expired
            if (e.response && e.response.status === 401) {
              logout();
            }
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        console.error('Failed to parse saved user credentials', e);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Real Server-Side Role-Based Login
   * Communicates with FastAPI backend (/api/auth/login).
   * Validates credentials against PBKDF2 password hashes.
   */
  const login = async (email, password) => {
    try {
      const backendResponse = await authService.login(email.trim(), password);
      if (backendResponse && backendResponse.user && backendResponse.access_token) {
        const authenticatedUser = {
          ...backendResponse.user,
          name: backendResponse.user.full_name,
        };
        setUser(authenticatedUser);
        setToken(backendResponse.access_token);
        localStorage.setItem('pulsecare_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('pulsecare_token', backendResponse.access_token);
        localStorage.setItem('telehealth_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('telehealth_token', backendResponse.access_token);
        return authenticatedUser;
      }
      throw new Error('Invalid login response from authentication server.');
    } catch (err) {
      if (!err.response) {
        throw new Error('Cannot connect to Mediverse backend server. Please verify the backend service is running locally on port 8000.');
      }
      const errMsg = err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.';
      throw new Error(errMsg);
    }
  };

  /**
   * Passwordless Login with One-Time Password
   */
  const loginWithOtp = async (email, otpCode) => {
    try {
      const backendResponse = await authService.loginWithOtp(email.trim(), otpCode.trim());
      if (backendResponse && backendResponse.user && backendResponse.access_token) {
        const authenticatedUser = {
          ...backendResponse.user,
          name: backendResponse.user.full_name,
        };
        setUser(authenticatedUser);
        setToken(backendResponse.access_token);
        localStorage.setItem('pulsecare_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('pulsecare_token', backendResponse.access_token);
        localStorage.setItem('telehealth_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('telehealth_token', backendResponse.access_token);
        return authenticatedUser;
      }
      throw new Error('Invalid OTP response from server.');
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'OTP verification failed.';
      throw new Error(errMsg);
    }
  };

  /**
   * Real Server-Side User Registration
   * Communicates with FastAPI backend (/api/auth/register).
   */
  const register = async (userData) => {
    try {
      const backendResponse = await authService.register({
        full_name: userData.name || userData.full_name,
        email: userData.email,
        password: userData.password,
        role: userData.role === 'hospital' ? 'hospital_admin' : userData.role || 'patient',
        age: userData.age ? parseInt(userData.age, 10) : undefined,
        gender: userData.gender,
        blood_group: userData.bloodGroup || userData.blood_group,
        phone: userData.phone || '+91 98765 43210',
        address: userData.address,
        hospital_name: userData.hospitalName,
        facility_id: userData.facilityId,
        specialization: userData.specialization,
      });

      if (backendResponse && backendResponse.user && backendResponse.access_token) {
        const newUser = {
          ...backendResponse.user,
          name: backendResponse.user.full_name,
        };
        setUser(newUser);
        setToken(backendResponse.access_token);
        localStorage.setItem('pulsecare_user', JSON.stringify(newUser));
        localStorage.setItem('pulsecare_token', backendResponse.access_token);
        return newUser;
      }
      throw new Error('Registration failed.');
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Registration failed.';
      throw new Error(errMsg);
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pulsecare_user');
    localStorage.removeItem('pulsecare_token');
    localStorage.removeItem('telehealth_user');
    localStorage.removeItem('telehealth_token');
  };

  // Derive normalized role
  const rawRole = user?.role || 'patient';
  const role = rawRole === 'hospital' ? 'hospital_admin' : rawRole;
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        loginWithOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
