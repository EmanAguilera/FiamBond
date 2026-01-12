import React, { useContext, useState, useEffect, useCallback } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator 
} from 'react-native';
import { AppContext } from "../Context/AppContext";
import { auth, db } from "../config/firebase-config"; 
import { updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

// Define the shape of our User
interface UserProfile {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FormMessage {
  type: 'success' | 'error' | '';
  text: string;
}

export default function SettingsNative() {
  // FIX: In TSX, we use 'as' carefully or define the Context type in the Provider
  const context = useContext(AppContext);
  
  // Destructure with a fallback/check
  const user = context?.user as UserProfile | null;
  const setUser = context?.setUser;

  const [formData, setFormData] = useState({
    first_name: '', 
    last_name: '', 
    email: '',
    new_password: '', 
    new_password_confirmation: '',
  });

  const [profileMessage, setProfileMessage] = useState<FormMessage>({ type: '', text: '' });
  const [profileErrors, setProfileErrors] = useState<any>({}); 
  const [passwordMessage, setPasswordMessage] = useState<FormMessage>({ type: '', text: '' });
  const [passwordErrors, setPasswordErrors] = useState<any>({});
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

  const handleChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleProfileUpdate = async () => {
    if (!user || !setUser) return;
    setProfileMessage({ type: '', text: '' });
    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const userDocRef = doc(db, "users", user.uid);

      if (formData.email !== user.email && currentUser) {
        await updateEmail(currentUser, formData.email);
      }
      
      await updateDoc(userDocRef, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
      });

      const updatedUser = { ...user, first_name: formData.first_name, last_name: formData.last_name, email: formData.email };
      setUser(updatedUser);

      setProfileMessage({ type: 'success', text: "Profile updated successfully!" });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user) return;
    setPasswordMessage({ type: '', text: '' });

    if (formData.new_password !== formData.new_password_confirmation) {
      setPasswordMessage({ type: 'error', text: "The new passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated.");
      await updatePassword(currentUser, formData.new_password);
      setPasswordMessage({ type: 'success', text: "Password updated successfully!" });
      setFormData(prev => ({ ...prev, new_password: '', new_password_confirmation: '' }));
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
        </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50">
        <View className="p-4 max-w-4xl mx-auto w-full">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Account Settings</Text>

            {/* Profile Section */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <Text className="font-bold text-lg mb-4">Profile Information</Text>
                <View className="gap-4">
                    <View>
                        <Text className="text-sm font-medium mb-1">First Name</Text>
                        <TextInput 
                            value={formData.first_name} 
                            onChangeText={(t) => handleChange("first_name", t)} 
                            className="border border-gray-300 rounded-lg p-3" 
                        />
                    </View>
                    <View>
                        <Text className="text-sm font-medium mb-1">Last Name</Text>
                        <TextInput 
                            value={formData.last_name} 
                            onChangeText={(t) => handleChange("last_name", t)} 
                            className="border border-gray-300 rounded-lg p-3" 
                        />
                    </View>
                    <TouchableOpacity 
                        onPress={handleProfileUpdate}
                        className="bg-indigo-600 p-4 rounded-lg items-center"
                    >
                        <Text className="text-white font-bold">Save Changes</Text>
                    </TouchableOpacity>
                    {profileMessage.text && <Text className="text-center mt-2">{profileMessage.text}</Text>}
                </View>
            </View>

            {/* Password Section */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Text className="font-bold text-lg mb-4">Change Password</Text>
                <View className="gap-4">
                    <TextInput 
                        placeholder="New Password"
                        secureTextEntry 
                        value={formData.new_password} 
                        onChangeText={(t) => handleChange("new_password", t)} 
                        className="border border-gray-300 rounded-lg p-3" 
                    />
                    <TextInput 
                        placeholder="Confirm Password"
                        secureTextEntry 
                        value={formData.new_password_confirmation} 
                        onChangeText={(t) => handleChange("new_password_confirmation", t)} 
                        className="border border-gray-300 rounded-lg p-3" 
                    />
                    <TouchableOpacity 
                        onPress={handlePasswordUpdate}
                        className="bg-gray-800 p-4 rounded-lg items-center"
                    >
                        <Text className="text-white font-bold">Update Password</Text>
                    </TouchableOpacity>
                    {passwordMessage.text && <Text className="text-center mt-2">{passwordMessage.text}</Text>}
                </View>
            </View>
        </View>
    </ScrollView>
  );
}