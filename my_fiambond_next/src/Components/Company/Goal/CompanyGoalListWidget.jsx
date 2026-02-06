'use client';

import React, { useState, useMemo, Suspense, memo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/src/config/apiConfig';

// --- DYNAMIC IMPORTS ---
const Modal = dynamic(() => import('../../Modal'), { ssr: false });
const CompleteCompanyGoalWidget = dynamic(() => import('./CompleteCompanyGoalWidget'), { ssr: false });

const CompanyGoalListWidget = ({ goals, onDataChange }) => {
    // useState removed explicit types
    const [activeTab, setActiveTab] = useState('active'); 
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState(null);
    const [userProfiles, setUserProfiles] = useState({});

    // 1. Organize Data
    const { activeGoals, completedGoals } = useMemo(() => {
        if (!goals) return { activeGoals: [], completedGoals: [] };
        
        // Remove type from argument 'd'
        const parseDate = (d) => d ? new Date(d) : null;

        return {
            activeGoals: goals
                .filter(g => g.status === 'active')
                .map(g => ({ ...g, id: g._id || g.id, target_date: parseDate(g.target_date) })),
            completedGoals: goals
                .filter(g => g.status === 'completed')
                .map(g => ({ ...g, id: g._id || g.id, completed_at: parseDate(g.completed_at) }))
        };
    }, [goals]);

    // 2. Fetch User Profiles (Accountability)
    useEffect(() => {
        const fetchUserProfiles = async () => {
            if (!goals || goals.length === 0) return;

            const userIds = new Set();
            goals.forEach(g => {
                if (g.user_id) userIds.add(g.user_id);
                if (g.completed_by_user_id) userIds.add(g.completed_by_user_id);
            });

            if (userIds.size === 0) return;

            try {
                const idsArray = Array.from(userIds);
                const chunks = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                const newProfiles = {};
                for (const chunk of chunks) {
                    if (chunk.length === 0) continue; // Safety check
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        newProfiles[doc.id] = doc.data();
                    });
                }

                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            } catch (error) {
                console.error("Error fetching user profiles:", error);
            }
        };

        fetchUserProfiles();
    }, [goals]);

    // 3. Action Handlers (Removed explicit types from arguments)
    const handleAbandon = async (id) => {
        if (!window.confirm("Are you sure you want to abandon this strategic target? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/goals/${id}`, { method: 'DELETE' });
            
            if (!res.ok) throw new Error("Failed to delete goal on server.");
            
            toast.success("Target abandoned.");
            if (onDataChange) onDataChange(); 
            
        } catch (e) {
            console.error("Error deleting goal", e);
            toast.error(e.message || "Error abandoning target.");
        }
    };

    const openCompleteModal = (goal) => {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    };

    const handleSuccess = useCallback(() => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        if (onDataChange) onDataChange(); 
    }, [onDataChange]);

    const getUserName = (id) => {
        if (!id) return 'System';
        return userProfiles[id]?.full_name || userProfiles[id]?.display_name || 'Loading...';
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Tabs - UI fixed to use modern style */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-t-xl border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('active')} 
                    className={`py-2.5 rounded-lg font-bold transition-all ${activeTab === 'active' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-700'}`}
                >
                    Active Targets
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`py-2.5 rounded-lg font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-700'}`}
                >
                    Target History
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const isOverdue = goal.target_date && new Date() > goal.target_date;
                            return (
                                <div key={goal.id} className={`bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-xl">{goal.name}</h3>
                                            <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
                                                <span>Created by: <span className="font-semibold text-slate-700">{getUserName(goal.user_id)}</span></span>
                                                <div className="flex items-center gap-2">
                                                    <span>Deadline: <strong className="text-slate-700">{goal.target_date?.toLocaleDateString()}</strong></span>
                                                    {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">(OVERDUE)</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-extrabold text-indigo-600 text-2xl">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
                                        <button onClick={() => handleAbandon(goal.id)} className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors active:scale-95">
                                            Abandon
                                        </button>
                                        <button onClick={() => openCompleteModal(goal)} className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md shadow-emerald-100 active:scale-95">
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-center text-slate-400 italic py-6">No active strategic targets. Set one now!</p>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <div key={goal.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 opacity-90 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-600 text-lg line-through">{goal.name}</h3>
                                        <div className="text-xs text-emerald-600 mt-1">
                                            Achieved by <span className="font-bold">{getUserName(goal.completed_by_user_id || goal.user_id)}</span>
                                            <span className="mx-1">•</span>
                                            {goal.completed_at?.toLocaleDateString()}
                                        </div>

                                        {goal.achievement_url && (
                                            <a href={goal.achievement_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-xs font-bold text-indigo-600 hover:underline bg-white px-2 py-1 rounded-full shadow-sm">
                                                View Proof
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-emerald-700 text-xl">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                        <span className="text-[10px] uppercase font-extrabold text-white bg-emerald-600 px-2 py-0.5 rounded-full mt-1 inline-block">Achieved</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 italic py-6">No completed targets yet. Get to work!</p>
                        )}
                    </div>
                )}
            </div>

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