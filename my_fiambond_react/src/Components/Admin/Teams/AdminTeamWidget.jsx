import { memo } from 'react';
import { AdminUserRow } from '../Users/AdminUserRow';

const AdminTeamWidget = ({ users }) => {
    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 text-purple-800 text-sm font-medium sticky top-0 z-10">
                Current System Administrators
            </div>
            
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
    );
};

export default memo(AdminTeamWidget);