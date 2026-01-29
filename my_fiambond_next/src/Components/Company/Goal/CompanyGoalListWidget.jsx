'use client'; // Required due to the use of useState, useMemo, useEffect, useCallback, memo, and dynamic imports (lazy/Suspense)

import { useState, useMemo, lazy, Suspense, memo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic'; // Use next/dynamic instead of React.lazy
// Firebase Imports for User Profile Lookup
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { toast } from 'react-hot-toast'; // Client-side toast

// --- DYNAMIC IMPORTS (Replaced lazy with next/dynamic) ---
const Modal = dynamic(() => import('../../Modal'), { ssr: false });
const CompleteCompanyGoalWidget = dynamic(() => import('./CompleteCompanyGoalWidget'), { ssr: false });

const CompanyGoalListWidget = ({ goals, onDataChange }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState(null);
    const [userProfiles, setUserProfiles] = useState({}); // Store user data (id -> profile)

    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // 1. Organize Data
    const { activeGoals, completedGoals } = useMemo(() => {
        if (!goals) return { activeGoals: [], completedGoals: [] };
        
        const parseDate = (d) => d ? new Date(d) : null;

        return {
            // Note: The original goals are API objects, so we need to map the date strings to Date objects
            activeGoals: goals.filter(g => g.status === 'active').map(g => ({ ...g, target_date: parseDate(g.target_date) })),
            completedGoals: goals.filter(g => g.status === 'completed').map(g => ({ ...g, completed_at: parseDate(g.completed_at) }))
        };
    }, [goals]);

    // 2. Fetch User Profiles (Accountability)
    useEffect(() => {
        const fetchUserProfiles = async () => {
            if (!goals || goals.length === 0) return;

            // Collect all unique User IDs (Creators and Completers)
            const userIds = new Set();
            goals.forEach(g => {
                if (g.user_id) userIds.add(g.user_id);
                if (g.completed_by_user_id) userIds.add(g.completed_by_user_id);
            });

            if (userIds.size === 0) return;

            try {
                // Fetch profiles from Firebase
                const idsArray = Array.from(userIds);
                const chunks = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                const newProfiles = {};
                for (const chunk of chunks) {
                    // Client-side Firebase operation
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        newProfiles[doc.id] = doc.data();
                    });
                }

                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            } catch (error) {
                console.error("Error fetching user profiles for goals:", error);
            }
        };

        fetchUserProfiles();
    }, [goals]);

    // 3. Action Handlers
    const handleAbandon = async (id) => {
        if (!window.confirm("Are you sure you want to abandon this strategic target?")) return;
        try {
            const res = await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Target abandoned."); // Added toast
                if (onDataChange) {
                    onDataChange(); 
                }
            } else {
                throw new Error("Failed to delete goal on server.");
            }
        } catch (e) {
            console.error("Error deleting goal", e);
            toast.error(e.message || "Error abandoning target."); // Added toast
        }
    };

    const openCompleteModal = (goal) => {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    };

    const handleSuccess = useCallback(() => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        if (onDataChange) {
            onDataChange(); 
        }
    }, [onDataChange]);

    // Helper to get name safely
    const getUserName = (id) => userProfiles[id]?.full_name || 'Loading...';

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* --- TABS --- */}
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('active')} 
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'active' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Active Targets
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Target History
                </button>
            </div>

            {/* --- LIST CONTENT --- */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const isOverdue = goal.target_date && new Date() > goal.target_date;
                            return (
                                <div key={goal.id || goal._id} className={`bg-white border rounded-lg p-4 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{goal.name}</h3>
                                            
                                            {/* ACCOUNTABILITY SECTION */}
                                            <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
                                                <span>Created by: <span className="font-medium text-slate-700">{getUserName(goal.user_id)}</span></span>
                                                
                                                <div className="flex gap-2">
                                                    <span>Deadline: <strong>{goal.target_date?.toLocaleDateString()}</strong></span>
                                                    {isOverdue && <span className="text-amber-600 font-bold">(Overdue)</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-indigo-600 text-lg">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                        <button onClick={() => handleAbandon(goal.id || goal._id)} className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded transition-colors">
                                            Abandon
                                        </button>
                                        <button onClick={() => openCompleteModal(goal)} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-sm">
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-center text-slate-400 italic py-6">No active strategic targets.</p>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <div key={goal.id || goal._id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-600 line-through text-lg">{goal.name}</h3>
                                        
                                        {/* HISTORY ACCOUNTABILITY */}
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {goal.completed_by_user_id 
                                                ? <>Completed by {getUserName(goal.completed_by_user_id)}</>
                                                : <>Created by {getUserName(goal.user_id)}</> 
                                            }
                                            <span className="mx-1">•</span>
                                            {goal.completed_at?.toLocaleDateString()}
                                        </div>

                                        {goal.achievement_url && (
                                            <a href={goal.achievement_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-xs font-bold text-emerald-600 hover:underline">
                                                View Proof
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-emerald-600">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 rounded">Achieved</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 italic py-6">No completed targets yet.</p>
                        )}
                    </div>
                )}
            </div>

            {/* --- MODAL --- */}
            <Suspense fallback={null}>
                {isCompleteModalOpen && goalToComplete && (
                    <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Achieve Target">
                        <CompleteCompanyGoalWidget goal={goalToComplete} onSuccess={handleSuccess} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
};

export default memo(CompanyGoalListWidget);