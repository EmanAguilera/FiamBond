import { memo } from 'react';

// NOTE: It is "export const", NOT "export default"
export const AdminUserRow = memo(({ user, badge, rightContent }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    const isPremium = user.is_premium;

    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150">
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm 
                ${isAdmin ? 'bg-purple-100 text-purple-700' : 
                  isPremium ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 'bg-slate-200 text-slate-600'}`}>
                {initials}
            </div>

            {/* User Info */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.full_name || user.first_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {badge} 
                </div>
            </div>

            {/* Right Side Action/Info */}
            <div className="ml-4 flex items-center text-right">
                {rightContent}
            </div>
        </div>
    );
});