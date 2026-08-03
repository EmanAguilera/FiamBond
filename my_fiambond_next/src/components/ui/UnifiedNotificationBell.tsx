'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/src/config/firebase-config';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    type: 'signup' | 'loan' | 'premium' | 'system';
}

export default function UnifiedNotificationBell({ user }: { user: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!user || !db) return;

        let unsubscribers: (() => void)[] = [];

        if (isAdmin) {
            // 👑 ADMIN ALERTS: New Sign-ups & Pending Requests
            const qAdmin = query(
                collection(db, "users"), 
                orderBy("created_at", "desc"), 
                limit(6)
            );

            const unsubAdmin = onSnapshot(qAdmin, (snapshot) => {
                const items: NotificationItem[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const isPending = data.subscription_status === 'pending_approval' || data.family_subscription_status === 'pending_approval';
                    const date = data.created_at?.toDate ? data.created_at.toDate() : new Date();
                    
                    return {
                        id: doc.id,
                        title: isPending ? "⚠️ Premium Approval Needed" : "👤 New User Sign-up",
                        message: `${data.full_name || 'New User'} (${data.email || 'No email'})`,
                        timestamp: date,
                        type: isPending ? 'premium' : 'signup'
                    };
                });
                setNotifications(items);
            }, (err) => console.error("Notification snapshot error:", err));

            unsubscribers.push(unsubAdmin);
        } else {
            // 👤 USER ALERTS: Pending Loan Confirmations
            const qUser = query(
                collection(db, "loans"),
                where("debtor_id", "==", user.uid),
                where("status", "==", "pending_confirmation"),
                limit(6)
            );

            const unsubUser = onSnapshot(qUser, (snapshot) => {
                const items: NotificationItem[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = data.created_at ? new Date(data.created_at) : new Date();
                    return {
                        id: doc.id,
                        title: "🤝 Loan Confirmation Request",
                        message: `Amount: ₱${data.amount?.toLocaleString()} - ${data.description || 'Pending loan'}`,
                        timestamp: date,
                        type: 'loan'
                    };
                });
                setNotifications(items);
            }, (err) => console.error("User notification error:", err));

            unsubscribers.push(unsubUser);
        }

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user, isAdmin]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 🔔 BELL BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-all focus:outline-none active:scale-95 flex items-center justify-center"
                aria-label="Notifications"
                title="Notifications"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-500 text-white font-black text-[10px] h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* 📋 DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                    <div className="flex justify-between items-center px-4 pb-2 mb-2 border-b border-gray-100">
                        <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">
                            {isAdmin ? 'System Notifications' : 'Realm Alerts'}
                        </h4>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            Real-time
                        </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div key={n.id} className="p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-xs text-gray-800">{n.title}</p>
                                        <span className="text-[9px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                                            {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 truncate">{n.message}</p>
                                    <p className="text-[9px] text-gray-400 mt-1 font-medium">
                                        📅 {n.timestamp.toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-xs text-gray-400 italic">
                                No new notifications.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}