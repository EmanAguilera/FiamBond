"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image,
  Alert,
  useWindowDimensions,
  Pressable,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "@/config/firebase-config";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// --- UPDATED IMPORT ---
import { GOOGLE_AUTH_CONFIG } from "@/config/apiConfig";

// Custom components
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// Conditionally require GoogleSignin for native platforms only
const GoogleSignin = Platform.OS !== 'web' ? require("@react-native-google-signin/google-signin").GoogleSignin : null;

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Focus states for input rings
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const isDesktop = width >= 768;

  // --- CONFIG: Google Sign In (Updated to use apiconfig) ---
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure(GOOGLE_AUTH_CONFIG);
    }
  }, []);

  // Tactile Feedback Animation (active:scale-[0.98])
  const createScaleAnim = () => useRef(new Animated.Value(1)).current;
  const googleScale = createScaleAnim();
  const submitScale = createScaleAnim();

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setGeneralError(null);
  };

  const saveUserToFirestore = async (user: any) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const nameParts = user.displayName?.split(" ") || ["", ""];
      await setDoc(userDocRef, {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" ") || "",
        full_name: user.displayName,
        email: user.email,
        created_at: serverTimestamp(),
        role: 'user'
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      Alert.alert("Success", "Password reset email sent!");
    } catch (error: any) {
      setGeneralError("Failed to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleLoginSubmit() {
    if (!formData.email || !formData.password) {
      setGeneralError("Please fill in all fields.");
      return;
    }
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (error: any) {
      setGeneralError("Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user);
      } else {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const idToken = response.data?.idToken || response.idToken;
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        await saveUserToFirestore(result.user);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Google Authentication Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {isSubmitting && (
        <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." variant="indigo" />
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingVertical: 20 
          }} 
          className="px-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card: max-w-md replication */}
          <View 
            style={{ width: '100%', maxWidth: 448 }} // 448px is Tailwind's max-w-md
            className="bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl shadow-gray-300 border border-gray-100"
          >
            
            {/* Header */}
            <View className="mb-8 items-center">
                <Text className="text-3xl font-extrabold text-gray-900 tracking-tight text-center">
                  Sign in to your account
                </Text>
                <Text className="text-gray-500 mt-2 font-medium">
                  Welcome back to FiamBond
                </Text>
            </View>
            
            {/* Google Button */}
            <Animated.View style={{ transform: [{ scale: googleScale }] }}>
              <Pressable 
                onPressIn={() => handlePressIn(googleScale)}
                onPressOut={() => handlePressOut(googleScale)}
                onPress={handleGoogleSignIn} 
                disabled={isSubmitting}
                className="flex-row items-center justify-center bg-white border border-gray-300 py-3.5 rounded-xl shadow-sm"
              > 
                <Image 
                  source={{ uri: 'https://www.svgrepo.com/show/475656/google-color.svg' }} 
                  style={{ width: 20, height: 20, marginRight: 12 }}
                />
                <Text className="font-bold text-gray-700 text-sm">Sign In With Google</Text>
              </Pressable>
            </Animated.View>

            {/* Separator */}
            <View className="flex-row items-center py-8">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Form */}
            <View className="space-y-5">
              
              {/* Email */}
              <View className="space-y-1">
                <Text className="text-sm font-bold text-gray-700 ml-1">Email address</Text>
                <TextInput 
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    borderWidth: 1,
                    borderColor: focusedInput === 'email' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: focusedInput === 'email' ? '#fff' : '#f9fafb',
                    elevation: focusedInput === 'email' ? 2 : 0
                  }}
                  className="p-4 rounded-xl text-gray-900 text-sm transition-all"
                  placeholder="john.doe@example.com"
                  placeholderTextColor="#9ca3af"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password */}
              <View className="space-y-1">
                <View className="flex-row justify-between items-center ml-1">
                    <Text className="text-sm font-bold text-gray-700">Password</Text>
                    <TouchableOpacity onPress={handlePasswordReset}>
                        <Text className="text-xs font-bold text-indigo-600">Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
                <TextInput 
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    borderWidth: 1,
                    borderColor: focusedInput === 'password' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: focusedInput === 'password' ? '#fff' : '#f9fafb',
                    elevation: focusedInput === 'password' ? 2 : 0
                  }}
                  className="p-4 rounded-xl text-gray-900 text-sm transition-all"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry
                />
              </View>
              
              {/* Error Message */}
              {generalError && (
                <View className="bg-red-50 border border-red-100 p-3 rounded-xl mt-2">
                  <Text className="text-red-600 text-center font-bold text-xs">
                    {generalError}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <Pressable 
                  onPressIn={() => handlePressIn(submitScale)}
                  onPressOut={() => handlePressOut(submitScale)}
                  onPress={handleLoginSubmit}
                  disabled={isSubmitting}
                  className={`bg-indigo-600 py-4 rounded-xl items-center mt-2 shadow-lg shadow-indigo-100 ${isSubmitting ? 'opacity-70' : ''}`}
                >
                  <Text className="text-white font-bold text-base">Sign In</Text>
                </Pressable>
              </Animated.View>
            </View>

            {/* Footer Link */}
            <View className="flex-row justify-center mt-10">
              <Text className="text-gray-500 font-medium text-sm">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-indigo-600 font-bold text-sm">Register here</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}