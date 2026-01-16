import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import Svg, { Path } from 'react-native-svg';
import CompanyEmployeeListWidget from './CompanyEmployeeListWidget';

// --- ICONS ---
const Icons = {
    Plus: (
        <Svg className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </Svg>
    )
};

// --- INTERNAL COMPONENT: Add Employee Form ---
// Type annotations removed from the function signature
const AddEmployeeForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return;
        }
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };

    return (
        <View className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mt-2">
            <Text className="text-xs text-slate-500 mb-4 font-medium">Enter user email to onboard.</Text>
            <View className="mb-4">
                <TextInput 
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email} 
                    onChangeText={setEmail} 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800" 
                    placeholder="employee@example.com" 
                    placeholderTextColor="#94a3b8"
                />
            </View>
            <View className="flex-row justify-end gap-3">
                <TouchableOpacity onPress={onCancel} className="px-4 py-2">
                    <Text className="text-xs font-bold text-slate-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading} 
                    className={`px-5 py-2 rounded-xl bg-indigo-600 flex-row items-center ${loading ? 'opacity-50' : ''}`}
                >
                    {loading && <ActivityIndicator size="small" color="white" className="mr-2" />}
                    <Text className="text-xs font-bold text-white">
                        {loading ? 'Onboarding...' : 'Onboard'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
// Type annotations removed from the function signature
export default function ManageEmployeesWidget({ company, members, onUpdate }) {
    // API URL for mobile environments (use your local machine IP if testing on physical device)
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev'; 
    const [showAddForm, setShowAddForm] = useState(false);

    // Type annotation removed from the parameter 'email'
    const handleAddEmployee = async (email) => {
        try {
            // 1. Find User in Firebase
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                Alert.alert("Error", "User email not found in the FiamBond system.");
                return;
            }

            const newUser = snapshot.docs[0].data();
            const newUserId = snapshot.docs[0].id;

            // 2. Add to Company in MongoDB
            const res = await fetch(`${API_URL}/companies/${company.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMemberId: newUserId })
            });

            if (res.status === 409) {
                Alert.alert("Wait", "User is already an employee of this company.");
                return;
            }
            
            if (!res.ok) throw new Error("Failed to add employee.");

            Alert.alert("Success", `${newUser.full_name || "User"} added successfully!`);
            if (onUpdate) onUpdate();
            setShowAddForm(false);

        } catch (error) { // Removed ': any' type annotation
            console.error(error);
            // Accessing message from error object is safe even if 'any' is not used
            Alert.alert("Error", error.message || "Failed to add employee.");
        }
    };

    return (
        <View className="space-y-6">
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <View className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
                {!showAddForm ? (
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-bold text-slate-700 text-base">Company Workforce</Text>
                            <Text className="text-[10px] text-slate-500 font-medium">Manage employee access.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowAddForm(true)}
                            activeOpacity={0.7}
                            className="bg-indigo-600 px-4 py-2.5 rounded-xl shadow-sm flex-row items-center"
                        >
                            <View className="mr-2">{Icons.Plus}</View>
                            <Text className="text-white text-xs font-bold">Onboard</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Text className="font-bold text-indigo-700 text-sm mb-2">Onboard New Employee</Text>
                        <AddEmployeeForm onAdd={handleAddEmployee} onCancel={() => setShowAddForm(false)} />
                    </View>
                )}
            </View>

            {/* 2. BOTTOM SECTION: LIST OF EMPLOYEES */}
            <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Active Team ({members.length})
                </Text>
                <View className="border border-slate-200 rounded-3xl overflow-hidden bg-white">
                    <CompanyEmployeeListWidget members={members} />
                </View>
            </View>
        </View>
    );
}