"use client";

import React, { useContext, useState, useEffect } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    KeyboardAvoidingView, 
    Platform,
    ActivityIndicator,
    Alert
} from "react-native";
import { AppContext } from "../../context/AppContext"; 
import { auth, db } from "../../config/firebase-config";
import { updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

// UI Components & Icons
import { User, Lock, Mail, Save, ChevronLeft } from "lucide-react-native";
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

export default function SettingsScreen({ onBack }) {
    const context = useContext(AppContext) || {};
    const { user, setUser } = context;

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

    const handleProfileUpdate = async () => {
        if (!user || !auth || !db) return;
        setIsSubmitting(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found.");
            
            const userId = user.uid || user.id;
            const userDocRef = doc(db, "users", userId);
            
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
            if (setUser) setUser({ ...user, ...updatedFields });
            Alert.alert("Success", "Profile updated successfully!");
        } catch (err) {
            // Safe message check for JSX
            const errMsg = err?.message || "";
            const msg = errMsg.includes("recent-login") 
                ? "Please re-login to update sensitive info." 
                : "Update failed.";
            Alert.alert("Error", msg);
        } finally { setIsSubmitting(false); }
    };

    const handlePasswordUpdate = async () => {
        if (!user || !auth) return;
        if (formData.new_password !== formData.new_password_confirmation) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }
        setIsSubmitting(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found.");
            await updatePassword(currentUser, formData.new_password);
            Alert.alert("Success", "Password updated!");
            setFormData(prev => ({ ...prev, new_password: '', new_password_confirmation: '' }));
        } catch (err) {
            Alert.alert("Security Error", "Re-authentication required. Please log out and back in.");
        } finally { setIsSubmitting(false); }
    };

    if (!user) {
        return <UnifiedLoadingWidget type="fullscreen" message="Syncing profile..." variant="indigo" />;
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                    
                    {/* --- HEADER --- */}
                    <View className="mb-10">
                        {onBack && (
                            <TouchableOpacity onPress={onBack} className="mb-4">
                                <ChevronLeft size={24} color="#64748b" />
                            </TouchableOpacity>
                        )}
                        <View className="flex-row items-center">
                            <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4 shadow-lg shadow-indigo-200" />
                            <View>
                                <Text className="text-3xl font-black text-slate-800 tracking-tighter">Settings</Text>
                                <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-[2px]">Account & Security</Text>
                            </View>
                        </View>
                    </View>

                    {/* --- PROFILE SECTION --- */}
                    <View className="bg-white rounded-[32px] border border-slate-200 shadow-sm mb-8 overflow-hidden">
                        <View className="p-6 border-b border-slate-100 flex-row items-center bg-slate-50/50">
                            <View className="p-2 bg-indigo-50 rounded-lg mr-3">
                                <User size={18} color="#4f46e5" />
                            </View>
                            <Text className="font-black text-slate-800 text-base">Profile Information</Text>
                        </View>
                        
                        <View className="p-6 space-y-5">
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">First Name</Text>
                                <TextInput 
                                    value={formData.first_name}
                                    onChangeText={(val) => setFormData({...formData, first_name: val})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Last Name</Text>
                                <TextInput 
                                    value={formData.last_name}
                                    onChangeText={(val) => setFormData({...formData, last_name: val})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</Text>
                                <TextInput 
                                    value={formData.email}
                                    onChangeText={(val) => setFormData({...formData, email: val})}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleProfileUpdate}
                                disabled={isSubmitting}
                                className="bg-indigo-600 flex-row justify-center items-center py-4 rounded-2xl mt-2 active:scale-95"
                            >
                                {isSubmitting ? <ActivityIndicator color="white" size="small" /> : (
                                    <>
                                        <Save size={18} color="white" />
                                        <Text className="text-white font-black uppercase tracking-widest ml-2 text-xs">Save Profile</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* --- SECURITY SECTION --- */}
                    <View className="bg-white rounded-[32px] border border-slate-200 shadow-sm mb-20 overflow-hidden">
                        <View className="p-6 border-b border-slate-100 flex-row items-center bg-slate-50/50">
                            <View className="p-2 bg-rose-50 rounded-lg mr-3">
                                <Lock size={18} color="#e11d48" />
                            </View>
                            <Text className="font-black text-slate-800 text-base">Security</Text>
                        </View>

                        <View className="p-6 space-y-5">
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</Text>
                                <TextInput 
                                    secureTextEntry
                                    placeholder="••••••••"
                                    value={formData.new_password}
                                    onChangeText={(val) => setFormData({...formData, new_password: val})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</Text>
                                <TextInput 
                                    secureTextEntry
                                    placeholder="••••••••"
                                    value={formData.new_password_confirmation}
                                    onChangeText={(val) => setFormData({...formData, new_password_confirmation: val})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handlePasswordUpdate}
                                disabled={isSubmitting}
                                className="bg-slate-900 flex-row justify-center items-center py-4 rounded-2xl active:scale-95"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Update Password</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}