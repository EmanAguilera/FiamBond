"use client";

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { sendEmailVerification, signOut, Auth } from 'firebase/auth';
import { auth } from '@/config/firebase-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// Define the shape of your context
interface AppContextType {
    user: {
        uid: string;
        email: string;
        emailVerified: boolean;
    } | null;
    handleLogout: () => void;
}

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen({ navigation }: any) {
    const context = useContext(AppContext) as unknown as AppContextType;
    
    const user = context?.user;
    const handleLogout = context?.handleLogout;

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const userUid = user?.uid;
    const storageKey = `verificationSent_${userUid}`;

    // Handle Cooldown Timer
    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSendVerification = useCallback(async (isAutoSend = false) => {
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth || !firebaseAuth.currentUser) {
            setError("Authentication service is unavailable.");
            return;
        }

        const currentUser = firebaseAuth.currentUser;
        if (isResending) return;

        const lastSentStr = await AsyncStorage.getItem(storageKey);
        const lastSent = parseInt(lastSentStr || "0", 10);
        const now = Date.now();
        const cooldownMs = COOLDOWN_SECONDS * 1000;

        if (lastSent && now - lastSent < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
            setCooldown(remaining);
            if (!isAutoSend) setError(`Please wait ${remaining} seconds before resending.`);
            return;
        }

        setIsResending(true);
        setMessage('');
        setError('');

        try {
            await sendEmailVerification(currentUser);
            await AsyncStorage.setItem(storageKey, now.toString());
            setCooldown(COOLDOWN_SECONDS);
            setMessage('A new verification link has been sent to your email.');
        } catch (err: any) {
            setError(err.code === 'auth/too-many-requests' ? 'Too many requests. Please wait a bit.' : 'Failed to send verification email.');
        } finally {
            setIsResending(false);
        }
    }, [isResending, storageKey]);

    // Auto-check verification status
    useEffect(() => {
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) return;

        const interval = setInterval(async () => {
            if (firebaseAuth.currentUser) {
                await firebaseAuth.currentUser.reload();
                if (firebaseAuth.currentUser.emailVerified) {
                    clearInterval(interval);
                    // Navigation to the main app screen would happen here, handled by a router or navigation stack
                }
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, []);

    // Initial check and auto-send
    useEffect(() => {
        if (!userUid) return;
        
        const checkCooldown = async () => {
            const lastSentStr = await AsyncStorage.getItem(storageKey);
            const lastSent = parseInt(lastSentStr || "0", 10);
            const timeElapsed = Date.now() - lastSent;

            if (!lastSent || timeElapsed >= (COOLDOWN_SECONDS * 1000)) {
                handleSendVerification(true);
            } else {
                setCooldown(Math.ceil(((COOLDOWN_SECONDS * 1000) - timeElapsed) / 1000));
            }
        };

        checkCooldown();
    }, [userUid, handleSendVerification, storageKey]);


    const onLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        if (handleLogout) handleLogout();
    };

    if (!user) return <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." />;

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-4 py-12">
            <View className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
                
                <View className="mb-6 flex items-center justify-center">
                    <View className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100">
                        <Text style={{fontSize: 40}}>✉️</Text>
                    </View>
                </View>
                
                <Text className="text-3xl font-bold text-gray-900 tracking-tight mb-3 text-center">Verify Your Email</Text>
                <Text className="text-gray-500 font-medium mb-8 leading-relaxed text-center">
                    We've sent a verification link to:{"\n"}
                    <Text className="text-indigo-600 font-bold block mt-1">{user.email}</Text>
                </Text>
                
                {message && (
                    <View className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6">
                        <Text className="text-emerald-700 text-xs font-bold text-center">{message}</Text>
                    </View>
                )}
                {error && (
                    <View className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6">
                        <Text className="text-red-600 text-xs font-bold text-center">{error}</Text>
                    </View>
                )}
                
                <View className="space-y-4">
                    <TouchableOpacity 
                        onPress={() => handleSendVerification()} 
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 items-center justify-center" 
                        disabled={isResending || cooldown > 0 || !auth}
                    >
                        {isResending ? (
                            <UnifiedLoadingWidget type="inline" message="Sending..." variant="white" />
                        ) : (
                            <Text className="text-white">
                                {cooldown > 0 ? `Resend Available in ${cooldown}s` : 'Resend Verification Email'}
                            </Text>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={onLogout}
                        className="w-full text-gray-400 text-xs font-bold py-2" 
                        disabled={!auth}
                    >
                        <Text className="text-center uppercase tracking-widest">Sign Out & Try Another Email</Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-8 pt-6 border-t border-gray-100">
                    <Text className="text-xs text-gray-400 font-medium italic text-center">
                        Once you verify the link in your email, this page will update automatically.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
