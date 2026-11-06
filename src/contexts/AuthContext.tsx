import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/mockStorage';
import { ApiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => Promise<void>;
  allUsers: User[];
  hasRole: (roles: UserRole[]) => boolean;
  logout: () => Promise<void>;
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('repairflow_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());

  const refreshUsers = () => {
    setAllUsers(StorageService.getUsers());
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('repairflow_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('repairflow_auth_user');
    }
  }, [currentUser]);

  // Listen for 401 unauthorized events & backend hydration events
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    const handleHydrated = () => {
      setAllUsers(StorageService.getUsers());
    };

    window.addEventListener('repairflow_unauthorized', handleUnauthorized);
    window.addEventListener('repairflow_sql_hydrated', handleHydrated);
    return () => {
      window.removeEventListener('repairflow_unauthorized', handleUnauthorized);
      window.removeEventListener('repairflow_sql_hydrated', handleHydrated);
    };
  }, []);

  // Verify httpOnly cookie session & hydrate data on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('repairflow_auth_user');
    if (!saved) return;

    ApiClient.requestStrict<{ user: User }>('/auth/me')
      .then(async (res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          if (!res.user.must_change_password) {
            await StorageService.syncFromBackend();
            setAllUsers(StorageService.getUsers());
          }
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  const switchRole = async (role: UserRole) => {
    try {
      const res = await ApiClient.requestStrict<{ user: User }>('/auth/dev-switch-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (res?.user) {
        setCurrentUser(res.user);
        await StorageService.syncFromBackend();
        setAllUsers(StorageService.getUsers());
      }
    } catch (err: any) {
      console.warn('[AuthContext] Cannot switch role:', err?.message);
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return roles.includes(currentUser.role);
  };

  // Server-side password verification & httpOnly cookie issuance
  const login = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await ApiClient.requestStrict<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          password: password || '',
        }),
      });

      setCurrentUser(res.user);
      if (!res.user.must_change_password) {
        await StorageService.syncFromBackend();
        setAllUsers(StorageService.getUsers());
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu!',
      };
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập' };
    try {
      const res = await ApiClient.requestStrict<{ user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          avatar_url: data.avatar_url,
        }),
      });
      setCurrentUser(res.user);
      StorageService.updateUserLocalOnly(res.user);
      setAllUsers(StorageService.getUsers());
      return { success: true, message: 'Cập nhật thông tin thành công!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Cập nhật thông tin thất bại!' };
    }
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' };
    }
    try {
      const res = await ApiClient.requestStrict<{ ok: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const updatedUser = { ...currentUser, must_change_password: false };
      setCurrentUser(updatedUser);
      await StorageService.syncFromBackend();
      setAllUsers(StorageService.getUsers());
      return { success: true, message: res.message || 'Đổi mật khẩu thành công!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Không thể cập nhật mật khẩu!' };
    }
  };

  const logout = async () => {
    try {
      await ApiClient.post('/auth/logout', {});
    } catch {}
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        allUsers,
        hasRole,
        logout,
        login,
        updateProfile,
        changePassword,
        refreshUsers,
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
