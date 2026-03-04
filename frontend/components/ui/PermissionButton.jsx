'use client';

import { usePermission } from '@/context/PermissionContext';

const PermissionButton = ({ children, permission, ...props }) => {
    const { hasPermission } = usePermission();

    if (!hasPermission(permission)) {
        return null;
    }

    return <button {...props}>{children}</button>;
};

export default PermissionButton;
