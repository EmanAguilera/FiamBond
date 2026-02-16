'use client';

import React from 'react';
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';

export const Icons = {
    // Basic Actions
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    
    // Realm Specific
    Users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    Build: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
    Lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
    
    // Dashboard Icons
    Wallet: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Flag: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>,
    Gift: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>,
    Printer: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>,
    
    // Admin Specific
    Money: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Entities: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 v5m-4 0h4" /></svg>,
    Report: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
};

export const Btn = ({ onClick, type = 'sec', icon, children, className = '', disabled = false, isLoading = false }) => {
    const styles = {
        pri: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        admin: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm border border-transparent",
        comp: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        pending: "bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed"
    };

    return (
        <button
            onClick={disabled || isLoading ? null : onClick}
            disabled={disabled || isLoading}
            className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto shadow-sm ${className} relative overflow-hidden`}
        >
            {isLoading ? (
                <UnifiedLoadingWidget type="inline" />
            ) : (
                <>
                    {icon} {children}
                </>
            )}
        </button>
    );
};

export const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert = false, isLoading = false }) => (
    <div 
        onClick={isLoading ? null : onClick} 
        className={`bg-white/60 backdrop-blur-xl border rounded-2xl shadow-lg p-6 cursor-pointer group transition-all hover:shadow-xl flex flex-col text-left relative overflow-hidden ${isAlert ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200/50'}`}
    >
        {/* 🟢 Card-level loading section */}
        {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                <UnifiedLoadingWidget type="section" />
            </div>
        )}

        <div className="flex justify-between items-start">
            <h4 className={`font-bold pr-4 ${isAlert ? 'text-amber-800' : 'text-gray-600'}`}>{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
            {subtext && (
                <p className={`text-xs mt-1 font-bold ${isAlert ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
                    {subtext}
                </p>
            )}
        </div>
        <span className="text-indigo-600 text-sm mt-3 inline-block transition-all duration-200 group-hover:text-indigo-700">
            {linkText} &rarr;
        </span>
    </div>
);