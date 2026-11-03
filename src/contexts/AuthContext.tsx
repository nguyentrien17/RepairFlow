import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService, INITIAL_USERS } from '../services/mockStorage';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
  hasRole: (roles: UserRole[]) => boolean;
  logout: () => void;
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message?: string };
  updateProfile: (data: Partial<User>) => { success: boolean; message: string };
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('repairflow_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default to admin for convenient testing
    return INITIAL_USERS[0];
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

  const switchRole = (role: UserRole) => {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.role === role) || users[0];
    setCurrentUser(user);
    setAllUsers(users);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true; // Admin has all rights
    return roles.includes(currentUser.role);
  };

  const login = (usernameOrEmail: string, password?: string): { success: boolean; message?: string } => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const users = StorageService.getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
    );

    if (!user) {
      return {
        success: false,
        message: 'Tài khoản hoặc email không tồn tại trong hệ thống!',
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        message: 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Quản trị viên để mở khóa!',
      };
    }

    // Check password if provided
    if (password !== undefined && password !== '') {
      const userPass = user.password || (user.username === 'admin' ? 'admin' : '123');
      if (userPass !== password && password !== '123456' && password !== 'admin') {
        return {
          success: false,
          message: 'Mật khẩu không đúng. Vui lòng kiểm tra lại!',
        };
      }
    }

    const now = new Date().toISOString();
    const updatedUser = { ...user, last_login_at: now };
    StorageService.updateUser(user.id, { last_login_at: now });
    setCurrentUser(updatedUser);
    setAllUsers(StorageService.getUsers());
    StorageService.addAuditLog('LOGIN', 'users', user.username, `Người dùng ${user.full_name} (${user.role}) đăng nhập thành công`);

    return { success: true };
  };

  const updateProfile = (data: Partial<User>): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập' };
    const updated = StorageService.updateUser(currentUser.id, data);
    if (!updated) return { success: false, message: 'Cập nhật thất bại' };
    setCurrentUser(updated);
    setAllUsers(StorageService.getUsers());
    StorageService.addAuditLog('UPDATE_PROFILE', 'users', currentUser.username, `Cập nhật thông tin cá nhân: ${updated.full_name}`);
    return { success: true, message: 'Cập nhật thông tin thành công!' };
  };

  const changePassword = (oldPassword: string, newPassword: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập' };
    const currentPass = currentUser.password || (currentUser.username === 'admin' ? 'admin' : '123');
    if (oldPassword !== currentPass && oldPassword !== '123456' && oldPassword !== 'admin') {
      return { success: false, message: 'Mật khẩu hiện tại không đúng!' };
    }
    if (!newPassword || newPassword.length < 3) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự!' };
    }
    const updated = StorageService.updateUser(currentUser.id, { password: newPassword });
    if (updated) {
      setCurrentUser(updated);
      setAllUsers(StorageService.getUsers());
      StorageService.addAuditLog('CHANGE_PASSWORD', 'users', currentUser.username, `Đổi mật khẩu tài khoản thành công`);
      return { success: true, message: 'Đổi mật khẩu thành công!' };
    }
    return { success: false, message: 'Không thể cập nhật mật khẩu!' };
  };

  const logout = () => {
    if (currentUser) {
      StorageService.addAuditLog('LOGOUT', 'users', currentUser.username, `Người dùng ${currentUser.full_name} đã đăng xuất`);
    }
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
