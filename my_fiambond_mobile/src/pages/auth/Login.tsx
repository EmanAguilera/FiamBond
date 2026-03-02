"use client";

import React, { useState, useEffect } from "react";
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
  Alert
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
  
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CONFIG: Google Sign In ---
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: "818608486797-pujgl59qscfvqpek8o4m6vebnb7cbfs2.apps.googleusercontent.com",
        iosClientId: "818608486797-c2rrbocuvhu54jiiu3lnp28hn6hdlade.apps.googleusercontent.com",
      });
    }
  }, []);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setGeneralError(null);
  };

  // --- LOGIC: Save/Sync User to Firestore ---
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

  // --- LOGIC: Password Reset ---
  const handlePasswordReset = async () => {
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, formData.email);
      Alert.alert("Success", "Password reset email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setGeneralError("No account found with this email address.");
      } else {
        setGeneralError("Failed to send reset email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIC: Email/Password Login ---
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
      setGeneralError("Incorrect email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- LOGIC: Google Login (Web & Native) ---
  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user);
      } else {
        if (!GoogleSignin) throw new Error("Google Sign-In is not available.");
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        
        const idToken = response.data?.idToken || response.idToken;
        if (!idToken) throw new Error("No ID Token found");

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        await saveUserToFirestore(result.user);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert("Sign In Error", "Google Authentication Failed");
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
          contentContainerStyle={{ flexGrow: 1 }} 
          className="px-4 justify-center"
          showsVerticalScrollIndicator={false}
        >
          
          <View className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200 border border-gray-100">
            
            {/* Header */}
            <View className="mb-8 items-center">
                <Text className="text-3xl font-black text-gray-900 tracking-tight text-center">
                  Sign in to your account
                </Text>
                <Text className="text-gray-500 mt-2 font-medium">
                  Welcome back to FiamBond
                </Text>
            </View>
            
            {/* Google Button */}
            <TouchableOpacity 
              onPress={handleGoogleSignIn} 
              disabled={isSubmitting}
              className="flex-row items-center justify-center bg-white border border-gray-300 py-3.5 rounded-xl shadow-sm active:opacity-70"
            > 
              <Image 
                source={{ uri: 'https://www.svgrepo.com/show/475656/google-color.svg' }} 
                className="w-5 h-5 mr-3"
              />
              <Text className="font-bold text-gray-700 text-sm">Sign In With Google</Text>
            </TouchableOpacity>

            {/* Separator */}
            <View className="flex-row items-center py-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Form */}
            <View className="space-y-5">
              
              {/* Email */}
              <View>
                <Text className="text-gray-700 font-bold mb-1.5 ml-1 text-sm">Email address</Text>
                <TextInput 
                  className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                  placeholder="john.doe@example.com"
                  placeholderTextColor="#9ca3af"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password */}
              <View>
                <View className="flex-row justify-between items-center mb-1.5 px-1">
                    <Text className="text-gray-700 font-bold text-sm">Password</Text>
                    <TouchableOpacity onPress={handlePasswordReset}>
                        <Text className="text-xs font-bold text-indigo-600">Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
                <TextInput 
                  className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry
                />
              </View>
              
              {/* Error Message */}
              {generalError && (
                <View className="bg-red-50 border border-red-100 p-3 rounded-lg">
                  <Text className="text-red-600 text-center font-bold text-xs">
                    {generalError}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity 
                onPress={handleLoginSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                className={`bg-indigo-600 py-4 rounded-xl items-center mt-2 shadow-lg shadow-indigo-200 ${isSubmitting ? 'opacity-70' : ''}`}
              >
                <Text className="text-white font-bold text-base">Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Link */}
            <View className="flex-row justify-center mt-8">
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
