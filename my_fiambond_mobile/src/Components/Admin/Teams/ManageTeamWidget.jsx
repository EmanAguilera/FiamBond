import React, { useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    ScrollView 
} from "react-native";
import Svg, { Path } from "react-native-svg";
import AdminUserTableWidget from "../Users/AdminUserTableWidget"; 

// --- ICONS ---
const Icons = {
    Plus: (
        <Svg className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </Svg>
    )
};

// --- INTERNAL COMPONENT: Add Admin Form ---
const AddAdminForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) return;
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };

    return (
        <View className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mt-2">
            <Text className="text-xs text-slate-500 mb-4 font-medium">Enter user email to promote to Administrator.</Text>
            <View className="mb-4">
                <TextInput 
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email} 
                    onChangeText={setEmail} 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800" 
                    placeholder="user@example.com" 
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
                    className={`px-5 py-2 rounded-xl bg-purple-600 flex-row items-center ${loading ? 'opacity-50' : ''}`}
                >
                    {loading && <ActivityIndicator size="small" color="white" className="mr-2" />}
                    <Text className="text-xs font-bold text-white">
                        {loading ? 'Processing...' : 'Promote'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN COMPONENT EXPORT ---
export default function ManageTeamWidget({ adminUsers = [], onAddAdmin }) {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <View className="flex-1 space-y-6">
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <View className="bg-slate-50 p-5 rounded-[32px] border border-slate-200">
                {!showAddForm ? (
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <Text className="font-bold text-slate-700 text-base">System Administrators</Text>
                            <Text className="text-[10px] text-slate-500 font-medium">Manage who has access to this dashboard.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowAddForm(true)}
                            activeOpacity={0.7}
                            className="bg-purple-600 px-4 py-2.5 rounded-xl shadow-sm flex-row items-center"
                        >
                            <View className="mr-2">{Icons.Plus}</View>
                            <Text className="text-white text-xs font-bold">Add</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View className="flex-row justify-between items-center mb-4 border-b border-slate-200 pb-2">
                            <Text className="font-bold text-purple-700 text-sm">Promote User to Admin</Text>
                            <TouchableOpacity onPress={() => setShowAddForm(false)}>
                                <Text className="text-xs font-bold text-slate-400">Close</Text>
                            </TouchableOpacity>
                        </View>
                        <AddAdminForm 
                            onAdd={async (email) => {
                                await onAddAdmin(email);
                                setShowAddForm(false); 
                            }} 
                            onCancel={() => setShowAddForm(false)} 
                        />
                    </View>
                )}
            </View>

            {/* 2. BOTTOM SECTION: LIST OF ADMINS */}
            <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Current Admins ({adminUsers.length})
                </Text>
                
                <View className="border border-slate-200 rounded-[32px] overflow-hidden bg-white">
                    <AdminUserTableWidget 
                        users={adminUsers} 
                        type="admin" 
                        headerText={null} 
                    />
                </View>
            </View>
        </View>
    );
}