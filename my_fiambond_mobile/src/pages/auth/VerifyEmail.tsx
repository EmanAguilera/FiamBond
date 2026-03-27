"use client";

import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    SafeAreaView, 
    Animated, 
    Platform, 
    Pressable, 
    ScrollView, 
    useWindowDimensions 
} from 'react-native';
import { AppContext } from '@/context/AppContext';
import { sendEmailVerification, signOut, Auth } from 'firebase/auth';
import { auth } from '@/config/firebase-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";
import { Mail } from "lucide-react-native"; 

// --- UPDATED IMPORT ---
import { AUTH_SETTINGS } from "@/config/apiConfig";

// Define the shape of your context
interface AppContextType {
    user: {
        uid: string;
        email: string;
        emailVerified: boolean;
    } | null;
    handleLogout: () => void;
}

// --- UPDATED CONSTANT ---
const COOLDOWN_SECONDS = AUTH_SETTINGS.emailCooldownSeconds;

export default function VerifyEmailScreen() {
    const context = useContext(AppContext) as unknown as AppContextType;
    const { width } = useWindowDimensions();
    
    const user = context?.user;
    const handleLogout = context?.handleLogout;

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const userUid = user?.uid;
    const storageKey = `verificationSent_${userUid}`;

    // Animations for tactile feedback
    const resendScale = useRef(new Animated.Value(1)).current;
    const signoutScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = (anim: Animated.Value) => {
        Animated.spring(anim, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const handlePressOut = (anim: Animated.Value) => {
        Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
    };

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
        if (!firebaseAuth || !firebaseAuth.currentUser) return;

        const currentUser = firebaseAuth.currentUser;
        if (isResending) return;

        const lastSentStr = await AsyncStorage.getItem(storageKey);
        const lastSent = parseInt(lastSentStr || "0", 10);
        const now = Date.now();
        const cooldownMs = COOLDOWN_SECONDS * 1000;

        if (lastSent && now - lastSent < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
            setCooldown(remaining);
            return;
        }

        setIsResending(true);
        setMessage('');
        setError('');

        try {
            await sendEmailVerification(currentUser);
            await AsyncStorage.setItem(storageKey, now.toString());
            setCooldown(COOLDOWN_SECONDS);
            setMessage('A new verification link has been sent.');
        } catch (err: any) {
            setError('Failed to send verification email.');
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
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, []);

    const onLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        if (handleLogout) handleLogout();
    };

    if (!user) return <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." />;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                className="px-4"
            >
                {/* Main Card Replication (max-w-md = 448px) */}
                <View 
                    style={{ width: '100%', maxWidth: 448 }}
                    className="bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl shadow-gray-300 border border-gray-100 items-center"
                >
                    {/* Icon Container */}
                    <View className="mb-6 flex items-center justify-center">
                        <View className="p-5 bg-indigo-50 rounded-[24px] shadow-sm border border-indigo-100">
                            <Mail size={40} color="#4f46e5" strokeWidth={1.5} />
                        </View>
                    </View>
                    
                    <Text className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3 text-center">
                        Verify Your Email
                    </Text>
                    
                    <Text className="text-gray-500 font-medium mb-8 leading-relaxed text-center">
                        We've sent a verification link to:{"\n"}
                        <Text className="text-indigo-600 font-bold mt-1">{user.email}</Text>
                    </Text>
                    
                    {/* Success/Error Alerts */}
                    {(message || error) && (
                        <View className={`w-full p-4 rounded-xl mb-6 border ${message ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <Text className={`text-xs font-bold text-center ${message ? 'text-emerald-700' : 'text-red-600'}`}>
                                {message || error}
                            </Text>
                        </View>
                    )}
                    
                    <View className="w-full space-y-4">
                        {/* Primary Button */}
                        <Animated.View style={{ transform: [{ scale: resendScale }] }}>
                            <Pressable 
                                onPressIn={() => handlePressIn(resendScale)}
                                onPressOut={() => handlePressOut(resendScale)}
                                onPress={() => handleSendVerification()} 
                                disabled={isResending || cooldown > 0}
                                className={`w-full bg-indigo-600 py-4 rounded-xl shadow-lg shadow-indigo-100 items-center justify-center ${ (isResending || cooldown > 0) ? 'opacity-70' : ''}`}
                            >
                                {isResending ? (
                                    <UnifiedLoadingWidget type="inline" message="Sending..." variant="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        {cooldown > 0 ? `Available in ${cooldown}s` : 'Resend Verification Email'}
                                    </Text>
                                )}
                            </Pressable>
                        </Animated.View>
                        
                        {/* Secondary Button */}
                        <Animated.View style={{ transform: [{ scale: signoutScale }] }}>
                            <Pressable 
                                onPressIn={() => handlePressIn(signoutScale)}
                                onPressOut={() => handlePressOut(signoutScale)}
                                onPress={onLogout}
                                className="w-full py-3"
                            >
                                <Text className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    Sign Out & Try Another Email
                                </Text>
                            </Pressable>
                        </Animated.View>
                    </View>

                    {/* Footer Info */}
                    <View className="mt-8 pt-6 border-t border-gray-100 w-full">
                        <Text className="text-[11px] text-gray-400 font-medium italic text-center leading-4">
                            Once you verify the link in your email, this page will update automatically.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}