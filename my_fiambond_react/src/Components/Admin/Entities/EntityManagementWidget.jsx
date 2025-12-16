import { memo } from 'react';
import { AdminUserRow } from '../Users/AdminUserRow'; 

const EntityManagementWidget = ({ users, onTogglePremium }) => {
    return (
        <div className="max-h-[60vh] overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 text-indigo-800 text-sm font-medium sticky top-0 z-10">
                Manage "Company Dashboard" access for users.
            </div>

            {/* List */}
            {users.map(u => (
                <AdminUserRow 
                    key={u.id} 
                    user={u}
                    badge={
                        u.role === 'admin' 
                        ? <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>
                        : u.is_premium && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Company</span>
                    }
                    rightContent={
                        <button 
                            // --- MAKE SURE THIS LINE IS CORRECT: ---
                            onClick={() => onTogglePremium(u.id, u.is_premium)}
                            // ---------------------------------------
                            disabled={u.role === 'admin'} 
                            className={`text-xs font-bold px-3 py-1.5 rounded border transition shadow-sm ${
                                u.is_premium 
                                ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {u.role === 'admin' ? 'Super User' : (u.is_premium ? 'Revoke Company' : 'Grant Company')}
                        </button>
                    }
                />
            ))}
        </div>
    );
};

export default memo(EntityManagementWidget);