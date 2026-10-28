import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './authContextDef.ts';
import { SIMULATED_USERS, hasPermission, type WorkspaceAction } from '../services/rbac.ts';

const defaultAuthFallback: AuthContextType = {
  currentUser: SIMULATED_USERS.Admin,
  currentRole: 'Admin',
  switchRole: () => {},
  can: (action: WorkspaceAction) => hasPermission('Admin', action),
  availableUsers: Object.values(SIMULATED_USERS),
  isSimulated: true
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || defaultAuthFallback;
}

export type { AuthContextType };
