import { createContext } from 'react';
import type { SimulatedUser, UserRole, WorkspaceAction } from '../services/rbac.ts';

export interface AuthContextType {
  currentUser: SimulatedUser;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  can: (action: WorkspaceAction) => boolean;
  availableUsers: SimulatedUser[];
  isSimulated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
