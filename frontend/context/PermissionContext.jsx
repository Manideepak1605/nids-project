'use client';

import { AuthProvider, useAuth } from './AuthContext';

// For backward compatibility
export const PermissionProvider = AuthProvider;
export const usePermission = useAuth;
