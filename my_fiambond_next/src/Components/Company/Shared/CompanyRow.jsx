'use client'; // Required due to the use of memo

import { memo } from 'react';

export const CompanyRow = memo(({ title, subtitle, icon, badge, rightContent, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`flex items-center p-4 border-b last:border-b-0 border-gray-100 transition-colors duration-150 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        >
            {/* Icon / Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-sm">
                {icon}
            </div>

            {/* Main Info */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{subtitle}</p>
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