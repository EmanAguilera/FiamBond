// ManageMembersWidget.jsx
import React, { useState, memo } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import Svg, { Path } from 'react-native-svg';

// --- ICONS ---
const Icons = {
    Plus: <Svg className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>,
    Invite: <Svg className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>
};

// --- Add Member Form ---
const AddMemberForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert("Invalid Email", "Please enter a valid user email.");
            return;
        }
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };

    return (
        <View className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mt-2">
            <Text className="text-xs text-slate-500 mb-4 font-medium">Enter user email to invite to this realm.</Text>
            <View className="mb-4">
                <TextInput 
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email} 
                    onChangeText={setEmail} 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800" 
                    placeholder="relative@example.com" 
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
                        {loading ? 'Inviting...' : 'Invite Member'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Member Row ---
const MemberRow = ({ member }) => {
    const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        <View className="flex-row items-center justify-between p-4 border-b border-slate-50 bg-white">
            <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center border border-teal-100">
                    <Text className="text-xs font-bold text-teal-700">{initials}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-700" numberOfLines={1}>
                        {member.full_name || member.first_name || "Unknown User"}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-medium" numberOfLines={1}>{member.email}</Text>
                </View>
            </View>
            <View className="bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 ml-2">
                <Text className="text-[8px] font-black text-teal-600 uppercase">Family</Text>
            </View>
        </View>
    );
};

// --- MAIN COMPONENT ---
const ManageMembersWidget = ({ family, members = [], onUpdate }) => {
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev'; // ← Change for real device testing

    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddMember = async (email) => {
        try {
            // 1. Find User in Firebase
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                Alert.alert("Not Found", "User email not found in the FiamBond system.");
                return;
            }

            const newUser = snapshot.docs[0].data();
            const newUserId = snapshot.docs[0].id;

            // 2. Add to Family in MongoDB
            const res = await fetch(`${API_URL}/families/${family.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMemberId: newUserId })
            });

            if (res.status === 409) {
                Alert.alert("Note", "User is already a member of this family.");
                return;
            }
            
            if (!res.ok) throw new Error("Failed to add member.");

            Alert.alert("Success", `${newUser.full_name || "User"} has been added to the realm.`);
            if (onUpdate) onUpdate();
            setShowAddForm(false);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", error.message || "Failed to invite member.");
        }
    };

    return (
        <View className="flex-1 space-y-4">
            {/* 1. TOP SECTION */}
            <View className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
                {!showAddForm ? (
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-bold text-slate-700 text-base">Family Members</Text>
                            <Text className="text-[10px] text-slate-500 font-medium">Manage household access.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowAddForm(true)}
                            activeOpacity={0.7}
                            className="bg-indigo-600 px-4 py-2.5 rounded-xl shadow-sm flex-row items-center"
                        >
                            <View className="mr-2">{Icons.Plus}</View>
                            <Text className="text-white text-xs font-bold">Invite</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Text className="font-bold text-indigo-700 text-sm mb-2">Invite New Member</Text>
                        <AddMemberForm onAdd={handleAddMember} onCancel={() => setShowAddForm(false)} />
                    </View>
                )}
            </View>

            {/* 2. LIST SECTION */}
            <View className="flex-1 mt-2">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Current Household ({members.length})
                </Text>
                
                <View className="border border-slate-200 rounded-3xl overflow-hidden bg-white h-[400px]">
                    <View className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                            Member Details
                        </Text>
                    </View>
                    
                    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                        {members && members.length > 0 ? (
                            members.map(member => (
                                <MemberRow key={member.id} member={member} />
                            ))
                        ) : (
                            <View className="p-20 items-center justify-center">
                                <Text className="text-slate-400 text-xs italic text-center leading-5">
                                    No members found. Invite your family to start collaborating.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

export default memo(ManageMembersWidget);