import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase-config";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signOut, 
  GoogleAuthProvider, 
  signInWithCredential 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export default function Register() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", last_name: "", email: "", password: "", password_confirmation: "",
  });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "818608486797-pujgl59qscfvqpek8o4m6vebnb7cbfs2.apps.googleusercontent.com",
      iosClientId: "818608486797-c2rrbocuvhu54jiiu3lnp28hn6hdlade.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);

  const handleRegisterSubmit = async () => {
    setGeneralError(null);
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setGeneralError("Please fill in all fields.");
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: user.email,
        created_at: serverTimestamp(),
      });
      await sendEmailVerification(user);
      await signOut(auth);
      Alert.alert("Success", "Registration successful! Please verify your email.", [{ text: "OK", onPress: () => navigation.navigate('Login') }]);
    } catch (error: any) {
      setGeneralError(error.code === 'auth/email-already-in-use' ? 'Email already in use.' : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) throw new Error("No ID Token");

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

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
        });
      }
      navigation.navigate("Home");
    } catch (error) {
      setGeneralError("Google sign-up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <Text className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Create account</Text>
          <TouchableOpacity onPress={handleGoogleSignIn} disabled={loading} className="flex-row items-center justify-center bg-white border border-gray-300 py-4 rounded-xl">
            <Text className="text-gray-700 font-bold text-base">Sign Up With Google</Text>
          </TouchableOpacity>
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-xs text-gray-400 font-bold">OR EMAIL</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>
          <View>
            <View className="flex-row gap-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">First Name</Text>
                <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl" value={formData.first_name} onChangeText={(v) => setFormData({...formData, first_name: v})} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Last Name</Text>
                <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl" value={formData.last_name} onChangeText={(v) => setFormData({...formData, last_name: v})} />
              </View>
            </View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Email</Text>
              <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(v) => setFormData({...formData, email: v})} />
            </View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
              <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl" secureTextEntry value={formData.password} onChangeText={(v) => setFormData({...formData, password: v})} />
            </View>
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Confirm</Text>
              <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl" secureTextEntry value={formData.password_confirmation} onChangeText={(v) => setFormData({...formData, password_confirmation: v})} />
            </View>
            {generalError && <Text className="text-red-500 text-sm mb-4 text-center">{generalError}</Text>}
            <TouchableOpacity onPress={handleRegisterSubmit} disabled={loading} className="bg-indigo-600 py-4 rounded-xl items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Create Account</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} className="mt-8 items-center">
            <Text className="text-gray-600 text-sm">Have an account? <Text className="text-indigo-600 font-bold">Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}