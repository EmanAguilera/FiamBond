'use client';

import React, { useContext, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext"; 
import { auth, db } from "../config/firebase-config";
import { updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import { User, Lock, Mail, Loader2, Save } from "lucide-react";

export default function Settings() {
    const { user, setUser } = useContext(AppContext);

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
        // 🛡️ Guard against null auth/db
        if (!user || !auth || !db) return;
        setIsSubmitting(true);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found.");

            const userId = user.uid || user.id;
            if (!userId) throw new Error("User ID is missing.");

            // Added '!' to db to tell TS it is not null
            const userDocRef = doc(db!, "users", userId);

            if (formData.email !== user.email) {
                await updateEmail(currentUser, formData.email);
            }

            const updatedFields = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name}`,
                email: formData.email,
            };

            await updateDoc(userDocRef, updatedFields);

            setUser({ ...user, ...updatedFields });
            toast.success("Profile updated!");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message.includes("recent-login") 
                ? "Please re-login to change email." 
                : "Update failed.");
        } finally {
            setIsSubmitting(false);
        }
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
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="mt-4 text-slate-500 font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10">
            <Toaster position="top-right" />
            
            <header className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Account Settings</h2>
                <p className="text-slate-500 mt-1">Manage your identity and security.</p>
            </header>

            <div className="space-y-8">
                {/* Profile Card */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <User className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-700">Profile Information</h3>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600">First Name</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600">Last Name</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>

                {/* Password Card */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-700">Change Password</h3>
                    </div>
                    <form onSubmit={handlePasswordUpdate} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} placeholder="New Password" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                            <input type="password" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} placeholder="Confirm Password" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition-all">
                                Update Password
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}