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

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('repairflow_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('repairflow_auth_user');
    }
  }, [currentUser]);

  const switchRole = (role: UserRole) => {
    const user = allUsers.find((u) => u.role === role) || allUsers[0];
    setCurrentUser(user);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true; // Admin has all rights
    return roles.includes(currentUser.role);
  };

  const logout = () => {
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
