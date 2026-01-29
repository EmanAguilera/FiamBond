'use client'; // Required due to the use of memo

import { memo } from 'react';
// NOTE: AdminUserRow needs to be defined or imported. I will use a reconstructed version for context.

// --- INTERNAL COMPONENT: AdminUserRow (Reconstructed for context) ---
// NOTE: This version is simplified to only show the user details, as the right content is custom.
const AdminUserRow = memo(({ user, badge, rightContent }) => {
    // Ensure user object has necessary fields for safe rendering
    const userObj = user || {}; 
    const initials = (userObj.full_name || userObj.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        // Added some base styling for the row
        <div className="flex items-center p-4 border border-slate-200 rounded-lg bg-white shadow-sm mb-2">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-sm">
                {initials}
            </div>

            {/* Main Info */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{userObj.full_name || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{userObj.email}</p>
                    {badge}
                </div>
            </div>

            {/* Right Side Info */}
            <div className="ml-4 flex-shrink-0">
                {rightContent}
            </div>
        </div>
    );
});
// --- END AdminUserRow Reconstruction ---


const AdminTeamWidget = ({ users }) => {
    // Fallback/Loading check
    if (!users || users.length === 0) {
        return <div className="p-8 text-center text-slate-400 italic">No admin users found.</div>;
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 text-purple-800 text-sm font-medium sticky top-0 z-10">
                Current System Administrators
            </div>
            
            <div className="p-2">
                {users.map(u => (
                    <AdminUserRow 
                        key={u.id} 
                        user={u}
                        badge={<span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>}
                        rightContent={
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded border border-purple-100">
                                Active
                            </span>
                        }
                    />
                ))}
            </div>
        </div>
    );
};

export default memo(AdminTeamWidget);