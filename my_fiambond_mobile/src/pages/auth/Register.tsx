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
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Custom components
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// Conditionally require GoogleSignin for native platforms only
const GoogleSignin = Platform.OS !== 'web' ? require("@react-native-google-signin/google-signin").GoogleSignin : null;

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", 
    last_name: "", 
    email: "", 
    password: "", 
    password_confirmation: "",
  });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CONFIG: Google Sign In ---
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: "818608486797-pujgl59qscfvqpek8o4m6vebnb7cbfs2.apps.googleusercontent.com",
        iosClientId: "818608486797-c2rrbocuvhu54jiiu3lnp28hn6hdlade.apps.googleusercontent.com",
        offlineAccess: true,
      });
    }
  }, []);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setGeneralError(null);
  };

  // --- LOGIC: Sync User to Firestore ---
  const saveUserToFirestore = async (user: any, customData?: Partial<RegisterFormData>) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const nameParts = user.displayName?.split(" ") || ["", ""];
      await setDoc(userDocRef, {
        first_name: customData?.first_name || nameParts[0],
        last_name: customData?.last_name || (nameParts.slice(1).join(" ") || ""),
        full_name: customData ? `${customData.first_name} ${customData.last_name}` : user.displayName,
        email: user.email,
        created_at: serverTimestamp(),
        role: 'user'
      });
    }
  };

  // --- LOGIC: Email/Password Registration ---
  async function handleRegisterSubmit() {
    setGeneralError(null);
    
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setGeneralError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await saveUserToFirestore(user, formData);
      
      // Sign out after registration (matches Next.js flow)
      await signOut(auth);
      
      // Navigate to Login with success message
      router.push('/(auth)/login');

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('This email is already registered.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- LOGIC: Google Sign Up (Native & Web) ---
  const handleGoogleSignUp = async () => {
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
      // Note: Google sign-up usually stays logged in, so navigation handles it via App listener
    } catch (error: any) {
      console.error('Google registration error:', error);
      setGeneralError("Google sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {isSubmitting && (
        <UnifiedLoadingWidget type="fullscreen" message="Creating your account..." variant="indigo" />
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
          
          <View className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200 border border-gray-100 my-10">
            {/* Header */}
            <View className="mb-8 items-center">
                <Text className="text-3xl font-black text-gray-900 tracking-tight text-center">
                  Create Account
                </Text>
                <Text className="text-gray-500 mt-2 font-medium">
                  Join the FiamBond Realm
                </Text>
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity 
              onPress={handleGoogleSignUp} 
              disabled={isSubmitting}
              className="flex-row items-center justify-center bg-white border border-gray-300 py-3.5 rounded-xl shadow-sm active:opacity-70"
            > 
              <Image 
                source={{ uri: 'https://www.svgrepo.com/show/475656/google-color.svg' }} 
                className="w-5 h-5 mr-3"
              />
              <Text className="font-bold text-gray-700 text-sm">Sign Up With Google</Text>
            </TouchableOpacity>

            {/* Separator */}
            <View className="flex-row items-center py-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Or use email
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Form */}
            <View className="space-y-5">
              
              {/* Name Row */}
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-gray-700 font-bold mb-1.5 ml-1 text-sm">First Name</Text>
                  <TextInput 
                    className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                    placeholder="John"
                    placeholderTextColor="#9ca3af"
                    value={formData.first_name}
                    onChangeText={(val) => handleInputChange('first_name', val)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-bold mb-1.5 ml-1 text-sm">Last Name</Text>
                  <TextInput 
                    className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                    placeholder="Doe"
                    placeholderTextColor="#9ca3af"
                    value={formData.last_name}
                    onChangeText={(val) => handleInputChange('last_name', val)}
                  />
                </View>
              </View>

              {/* Email */}
              <View>
                <Text className="text-gray-700 font-bold mb-1.5 ml-1 text-sm">Email address</Text>
                <TextInput 
                  className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleInputChange('email', val)}
                />
              </View>

              {/* Password */}
              <View>
                <Text className="text-gray-700 font-bold mb-1.5 ml-1 text-sm">Password</Text>
                <TextInput 
                  className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(val) => handleInputChange('password', val)}
                />
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-gray-700 font-bold mb-1.5 ml-1 text-sm">Confirm Password</Text>
                <TextInput 
                  className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-sm"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.password_confirmation}
                  onChangeText={(val) => handleInputChange('password_confirmation', val)}
                />
              </View>
              
              {/* Error Box */}
              {generalError && (
                <View className="bg-red-50 border border-red-100 p-3 rounded-lg mt-2">
                  <Text className="text-red-600 text-center font-bold text-xs">
                    {generalError}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity 
                onPress={handleRegisterSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                className={`bg-indigo-600 py-4 rounded-xl items-center mt-4 shadow-lg shadow-indigo-200 ${isSubmitting ? 'opacity-70' : ''}`}
              >
                <Text className="text-white font-bold text-base">Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-500 font-medium text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-indigo-600 font-bold text-sm">Sign in here</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
