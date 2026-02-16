'use client';

import React, { useContext, useEffect, useState, useCallback, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { AppContext } from "../../context/AppContext";
import { API_BASE_URL } from '../../config/apiConfig';
import { db } from '../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// 🏎️ Simplex Loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// Dynamic Imports
const Modal = dynamic(() => import('../ui/Modal'), { ssr: false });
const CompleteGoalWidget = dynamic(() => import('./UnifiedCompleteGoalWidget'), { ssr: false });

type GoalMode = 'personal' | 'family' | 'company';

interface Props {
    mode: GoalMode;
    entityId: string | number; // uid, family_id, or company_id
    onDataChange?: () => void;
    externalGoals?: any[]; 
}

export default function UnifiedGoalListWidget({ mode, entityId, onDataChange, externalGoals }: Props) {
    // FIX: Context casting para sa build reliability
    const context = useContext(AppContext) as any || {};
    const user = context.user;

    const [internalGoals, setInternalGoals] = useState<any[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState<any>(null);

    // 1. Fetching Logic (Memoized)
    const fetchGoals = useCallback(async () => {
        if (!entityId || externalGoals) return;
        setLoading(true);
        try {
            const paramKey = mode === 'personal' ? 'user_id' : mode === 'family' ? 'family_id' : 'company_id';
            const res = await fetch(`${API_BASE_URL}/goals?${paramKey}=${entityId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setInternalGoals(data);
        } catch (err) {
            toast.error("Could not load goals");
        } finally {
            setLoading(false);
        }
    }, [mode, entityId, externalGoals]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    // 2. Data Processing (Memoized for performance)
    const goalsToProcess = useMemo(() => externalGoals || internalGoals, [externalGoals, internalGoals]);

    const { activeGoals, completedGoals } = useMemo(() => {
        const parseDate = (d: any) => d ? new Date(d) : null;
        const list = goalsToProcess.map(g => ({
            ...g,
            id: g._id || g.id,
            processed_target_date: parseDate(g.target_date),
            processed_completed_at: parseDate(g.completed_at)
        }));
        return {
            activeGoals: list.filter(g => g.status === 'active'),
            completedGoals: list.filter(g => g.status === 'completed')
        };
    }, [goalsToProcess]);

    // 3. Firebase Profile Enrichment
    useEffect(() => {
        const enrichProfiles = async () => {
            const uids = new Set<string>();
            goalsToProcess.forEach(g => {
                if (g.user_id) uids.add(g.user_id);
                if (g.completed_by_user_id) uids.add(g.completed_by_user_id);
            });

            if (uids.size === 0) return;
            const idsArray = Array.from(uids);
            const newProfiles: any = {};
            
            try {
                // Batch fetch (Max 10 per "in" query sa Firebase)
                for (let i = 0; i < idsArray.length; i += 10) {
                    const chunk = idsArray.slice(i, i + 10);
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const snap = await getDocs(q);
                    snap.forEach(doc => { newProfiles[doc.id] = doc.data(); });
                }
                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            } catch (e) { console.error("Profile fetch error", e); }
        };
        enrichProfiles();
    }, [goalsToProcess]);

    // 4. Actions
    const handleAbandon = async (id: string) => {
        if (!window.confirm("Abandon this target? This will be removed from your active ledger.")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/goals/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success("Goal abandoned");
            fetchGoals();
            onDataChange?.();
        } catch (e) { toast.error("Failed to delete"); }
    };

    const getUserName = (id: string) => userProfiles[id]?.full_name || userProfiles[id]?.display_name || 'Member';

    if (loading && !goalsToProcess.length) {
        return <UnifiedLoadingWidget type="section" message="Syncing Ledger..." />;
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-lg">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 border-b border-slate-200">
                {(['active', 'history'] as const).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`py-2.5 rounded-lg font-bold transition-all ${
                            activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-700'
                        }`}
                    >
                        {tab === 'active' ? (mode === 'company' ? 'Active Targets' : 'Active Goals') : 'History'}
                    </button>
                ))}
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'active' ? (
                    <div className="space-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const isOverdue = goal.processed_target_date && new Date() > goal.processed_target_date;
                            return (
                                <div key={goal.id} className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${isOverdue ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-xl">{goal.name}</h3>
                                            <div className="text-xs text-slate-500 mt-2 space-y-1">
                                                <p>Lead: <span className="font-semibold text-slate-700">{getUserName(goal.user_id)}</span></p>
                                                <p className="flex items-center gap-2">
                                                    Deadline: <span className="font-bold text-slate-700">{goal.processed_target_date?.toLocaleDateString()}</span>
                                                    {isOverdue && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px]">OVERDUE</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-extrabold text-indigo-600 text-2xl">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
                                        <button onClick={() => handleAbandon(goal.id)} className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">Abandon</button>
                                        <button 
                                            onClick={() => { setGoalToComplete(goal); setIsCompleteModalOpen(true); }}
                                            className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
                                        >
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : <p className="text-center py-10 text-slate-400 italic">No active items.</p>}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <div key={goal.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-600 text-lg line-through truncate">{goal.name}</h3>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            Achieved by <span className="font-bold">{getUserName(goal.completed_by_user_id || goal.user_id)}</span> on {goal.processed_completed_at?.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-emerald-700 text-xl">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                        <span className="text-[10px] uppercase font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full mt-1 inline-block">Success</span>
                                    </div>
                                </div>
                                {goal.achievement_url && (
                                    <a href={goal.achievement_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm hover:bg-indigo-50 transition-colors">View Proof</a>
                                )}
                            </div>
                        )) : <p className="text-center py-10 text-slate-400 italic">History is empty.</p>}
                    </div>
                )}
            </div>

            <Suspense fallback={<UnifiedLoadingWidget type="inline" />}>
                {isCompleteModalOpen && goalToComplete && (
                    <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Goal Achievement">
                        <CompleteGoalWidget 
                            goal={goalToComplete} 
                            mode={mode} 
                            onSuccess={() => { 
                                setIsCompleteModalOpen(false); 
                                fetchGoals(); 
                                onDataChange?.(); 
                            }} 
                        />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}