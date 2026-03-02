"use client";

import React, { useContext, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AppContext } from "@/src/context/AppContext"; 
import { auth, db } from "@/src/config/firebase-config";
import { updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import { User, Lock, Mail, Save } from "lucide-react";

// 🏎️ Unified UI Principle
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

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
            toast.error(err.message.includes("recent-login") ? "Please re-login to update." : "Update failed.");
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
        return <UnifiedLoadingWidget type="fullscreen" message="Syncing Profile..." variant="indigo" />;
    }

    return (
        <div className="w-full px-6 md:px-12 lg:px-16 max-w-[1600px] mx-auto pb-20">
            <Toaster position="top-right" />
            
            <header className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-12 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">Settings</h1>
                            <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Account & Security</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Grid Layout - lg:grid-cols-2 ensures they are side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* 1. Profile Information Card */}
                <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col h-full transition-all hover:shadow-2xl hover:shadow-gray-200/40">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 shadow-sm">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Profile Information</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public & Private Identity</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleProfileUpdate} className="flex flex-col flex-grow">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 ml-1">First Name</label>
                                    <input 
                                        type="text" 
                                        name="first_name" 
                                        value={formData.first_name} 
                                        onChange={handleChange} 
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold text-gray-700" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Last Name</label>
                                    <input 
                                        type="text" 
                                        name="last_name" 
                                        value={formData.last_name} 
                                        onChange={handleChange} 
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold text-gray-700" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold text-gray-700" 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pushes button to bottom */}
                        <div className="mt-12">
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <UnifiedLoadingWidget type="inline" variant="white" message="Updating..." />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save Profile Changes
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* 2. Security Section Card */}
                <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col h-full transition-all hover:shadow-2xl hover:shadow-gray-200/40">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100 shadow-sm">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Security</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password & Protection</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handlePasswordUpdate} className="flex flex-col flex-grow">
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                                <input 
                                    type="password" 
                                    name="new_password" 
                                    value={formData.new_password} 
                                    onChange={handleChange} 
                                    placeholder="••••••••" 
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-semibold text-gray-700" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                                <input 
                                    type="password" 
                                    name="new_password_confirmation" 
                                    value={formData.new_password_confirmation} 
                                    onChange={handleChange} 
                                    placeholder="••••••••" 
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-semibold text-gray-700" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* mt-auto pushes this button to the bottom, aligning with the left card */}
                        <div className="mt-auto pt-12">
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full flex items-center justify-center bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <UnifiedLoadingWidget type="inline" variant="white" message="Updating..." />
                                ) : "Update Security Credentials"}
                            </button>
                        </div>
                    </form>
                </section>

            </div>
        </div>
    );
}