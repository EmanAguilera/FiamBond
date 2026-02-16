'use client';

import React, { useContext, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../context/AppContext"; 
import { auth, db } from "../../config/firebase-config";
import { updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import { User, Lock, Mail, Loader2, Save } from "lucide-react";

// ⭐️ INTEGRATION: Using UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

export default function Settings() {
    const context = useContext(AppContext) || {};
    const { user, setUser } = context;

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProfileUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !auth || !db) return;
        setIsSubmitting(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found.");
            const userId = user.uid || user.id;
            const userDocRef = doc(db, "users", userId);
            if (formData.email !== user.email) await updateEmail(currentUser, formData.email);
            const updatedFields = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name}`,
                email: formData.email,
            };
            await updateDoc(userDocRef, updatedFields);
            if (setUser) setUser({ ...user, ...updatedFields });
            toast.success("Profile updated!");
        } catch (err: any) {
            toast.error(err.message.includes("recent-login") ? "Please re-login." : "Update failed.");
        } finally { setIsSubmitting(false); }
    };

    const handlePasswordUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !auth) return;
        if (formData.new_password !== formData.new_password_confirmation) {
            toast.error("Passwords do not match.");
            return;
        }
        setIsSubmitting(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found.");
            await updatePassword(currentUser, formData.new_password);
            toast.success("Password updated!");
            setFormData(prev => ({ ...prev, new_password: '', new_password_confirmation: '' }));
        } catch (err: any) {
            toast.error("Re-authentication required.");
        } finally { setIsSubmitting(false); }
    };

    if (!mounted || !user) {
        return <UnifiedLoadingWidget type="fullscreen" message="Syncing your profile..." variant="indigo" />;
    }

    return (
        /* ⭐️ ALIGNMENT: Matching Realm padding and spacing */
        <div className="w-full px-6 md:px-12 lg:px-16 max-w-[1600px] mx-auto pb-20">
            <Toaster position="top-right" />
            
            <header className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80 shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Settings</h1>
                            <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Account & Security</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ⭐️ BALANCE: Changed grid to 50/50 (lg:grid-cols-2) for equal weight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Profile Section */}
                <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-8 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                        <div className="p-2.5 bg-indigo-50 rounded-xl">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="font-black text-slate-800 text-lg">Profile Information</h3>
                    </div>
                    
                    <form onSubmit={handleProfileUpdate} className="p-8 space-y-7 flex-grow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                <input 
                                    type="text" 
                                    name="first_name" 
                                    value={formData.first_name} 
                                    onChange={handleChange} 
                                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                <input 
                                    type="text" 
                                    name="last_name" 
                                    value={formData.last_name} 
                                    onChange={handleChange} 
                                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    className="w-full pl-14 pr-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="flex items-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Update Profile
                            </button>
                        </div>
                    </form>
                </section>

                {/* Security Section */}
                <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-8 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                        <div className="p-2.5 bg-rose-50 rounded-xl">
                            <Lock className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="font-black text-slate-800 text-lg">Security</h3>
                    </div>
                    
                    <form onSubmit={handlePasswordUpdate} className="p-8 space-y-7 flex-grow">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                            <input 
                                type="password" 
                                name="new_password" 
                                value={formData.new_password} 
                                onChange={handleChange} 
                                placeholder="••••••••" 
                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-semibold text-slate-700" 
                                required 
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                            <input 
                                type="password" 
                                name="new_password_confirmation" 
                                value={formData.new_password_confirmation} 
                                onChange={handleChange} 
                                placeholder="••••••••" 
                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-semibold text-slate-700" 
                                required 
                            />
                        </div>
                        
                        {/* ⭐️ ALIGNMENT: This spacer ensures the button on the right aligns horizontally with the left button */}
                        <div className="hidden md:block h-[5.5rem]"></div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black hover:shadow-xl hover:shadow-slate-200 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Change Password"}
                        </button>
                    </form>
                </section>

            </div>
        </div>
    );
}