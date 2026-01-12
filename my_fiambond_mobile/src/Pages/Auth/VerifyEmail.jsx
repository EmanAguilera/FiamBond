import React, { useContext, useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    SafeAreaView, 
    ActivityIndicator 
} from 'react-native';
import { AppContext } from '../../Context/AppContext.jsx';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase-config';
import { useNavigation } from '@react-navigation/native';

export default function VerifyEmail() {
    const { user, handleLogout } = useContext(AppContext);
    const navigation = useNavigation();
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    clearInterval(interval);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                    });
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [navigation]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResendVerification = async () => {
        if (!auth.currentUser) return;
        setIsResending(true);
        setMessage('');
        setError('');
        try {
            await sendEmailVerification(auth.currentUser);
            setMessage('A new verification email has been sent.');
            setCooldown(60);
        } catch (err) {
            setError('Failed to resend email. Please try again later.');
        } finally {
            setIsResending(false);
        }
    };

    const isButtonDisabled = isResending || cooldown > 0;

    return (
        <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
            <View className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100 items-center">
                <View className="w-16 h-16 bg-indigo-50 rounded-full items-center justify-center mb-6">
                    <Text className="text-2xl">📧</Text>
                </View>
                <Text className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Verify Your Email</Text>
                <View className="mb-6 items-center">
                    <Text className="text-gray-500 text-center text-sm">Link sent to:</Text>
                    <Text className="text-gray-900 font-bold text-base mt-1">{user?.email}</Text>
                </View>
                <Text className="text-xs text-gray-400 text-center mb-8">Redirects automatically after verification.</Text>
                {message ? <View className="bg-emerald-50 p-3 rounded-xl mb-4 w-full"><Text className="text-emerald-700 text-xs text-center">{message}</Text></View> : null}
                {error ? <View className="bg-rose-50 p-3 rounded-xl mb-4 w-full"><Text className="text-rose-700 text-xs text-center">{error}</Text></View> : null}
                <View className="w-full space-y-3">
                    <TouchableOpacity onPress={handleResendVerification} disabled={isButtonDisabled} className={`py-4 rounded-xl items-center flex-row justify-center ${isButtonDisabled ? 'bg-indigo-300' : 'bg-indigo-600'}`}>
                        {isResending && <ActivityIndicator size="small" color="white" className="mr-2" />}
                        <Text className="text-white font-bold text-sm">{isResending ? 'Sending...' : (cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} className="py-4 rounded-xl items-center border border-gray-200 bg-white">
                        <Text className="text-gray-600 font-bold text-sm">Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}