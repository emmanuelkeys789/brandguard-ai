import React, { useState, useCallback, type ReactNode } from 'react';
import {
  type UserRole,
  type WorkspaceAction,
  SIMULATED_USERS,
  DEFAULT_USER_ROLE,
  STORAGE_KEY_DEMO_ROLE,
  hasPermission
} from '../services/rbac.ts';
import { AuthContext } from './authContextDef.ts';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_DEMO_ROLE) as UserRole | null;
      if (stored && (stored === 'Admin' || stored === 'Reviewer' || stored === 'Editor')) {
        return stored;
      }
    } catch {
      // Fallback for restricted storage environments
    }
    return DEFAULT_USER_ROLE;
  });

  const currentUser = SIMULATED_USERS[currentRole] || SIMULATED_USERS.Admin;

  const switchRole = useCallback((newRole: UserRole) => {
    if (newRole !== 'Admin' && newRole !== 'Reviewer' && newRole !== 'Editor') {
      return;
    }
    setCurrentRole(newRole);
    try {
      window.localStorage.setItem(STORAGE_KEY_DEMO_ROLE, newRole);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const can = useCallback(
    (action: WorkspaceAction): boolean => {
      return hasPermission(currentRole, action);
    },
    [currentRole]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        can,
        availableUsers: Object.values(SIMULATED_USERS),
        isSimulated: true
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
