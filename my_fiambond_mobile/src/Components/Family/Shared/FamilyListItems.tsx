import React, { useState, useContext, memo } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator 
} from 'react-native';
import { AppContext } from '../../../Context/AppContext.jsx';

interface FamilyListItemProps {
    family: any;
    onFamilyUpdated: (updatedFamily: any) => void;
    onFamilyDeleted: (familyId: string) => void;
}

function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }: FamilyListItemProps) {
    const context = useContext(AppContext) as any;
    const user = context?.user;

    const [isEditing, setIsEditing] = useState(false);
    const [familyName, setFamilyName] = useState(family.family_name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // API URL Setup (Use your computer's IP for physical devices)
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev';

    const isOwner = user?.uid === family.owner_id;

    async function handleUpdate() {
        if (!familyName.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Send PATCH request to Node.js Backend
            const response = await fetch(`${API_URL}/families/${family.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ family_name: familyName }),
            });

            if (!response.ok) {
                throw new Error('Failed to update family name.');
            }

            // 2. Update UI via Parent Callback
            const updatedFamily = { ...family, family_name: familyName };
            onFamilyUpdated(updatedFamily);
            setIsEditing(false);
            Alert.alert("Success", "Family name updated.");

        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update the family name.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        Alert.alert(
            "Delete Family",
            `Are you sure you want to delete "${family.family_name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        setLoading(true);
                        setError(null);
                        try {
                            const response = await fetch(`${API_URL}/families/${family.id}`, {
                                method: 'DELETE',
                            });

                            if (!response.ok) throw new Error('Failed to delete.');
                            
                            onFamilyDeleted(family.id);
                            Alert.alert("Deleted", "Family realm has been removed.");
                        } catch (err) {
                            setError('Failed to delete the family.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }

    return (
        <View className="p-5 bg-white border border-slate-100 rounded-3xl mb-4 shadow-sm">
            {isEditing ? (
                <View className="space-y-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Rename Family</Text>
                    <TextInput
                        value={familyName}
                        onChangeText={setFamilyName}
                        placeholder="Family Name"
                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-base"
                        autoFocus
                        returnKeyType="done"
                    />
                    <View className="flex-row gap-2">
                        <TouchableOpacity 
                            onPress={handleUpdate}
                            disabled={loading}
                            className="flex-1 bg-indigo-600 py-3 rounded-xl items-center justify-center"
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => { setIsEditing(false); setFamilyName(family.family_name); }}
                            className="flex-1 bg-slate-100 py-3 rounded-xl items-center justify-center"
                        >
                            <Text className="text-slate-600 font-bold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4"> 
                        <Text className="font-bold text-lg text-slate-800" numberOfLines={1}>
                            {family.family_name}
                        </Text>
                        <Text className="text-[10px] text-slate-400 font-medium uppercase mt-1">
                            Owner: {family.owner?.full_name || 'Loading...'}
                        </Text>
                    </View>
                    
                    <View className="flex-row items-center gap-2"> 
                        {isOwner && (
                            <>
                                <TouchableOpacity
                                    onPress={() => setIsEditing(true)}
                                    className="bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100"
                                >
                                    <Text className="text-indigo-600 font-bold text-[10px]">Rename</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    className="bg-rose-50 px-3 py-2 rounded-lg border border-rose-100"
                                >
                                    <Text className="text-rose-600 font-bold text-[10px]">Delete</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            )}

            {error && (
                <View className="mt-3 bg-rose-50 p-2 rounded-lg">
                    <Text className="text-[10px] text-rose-600 text-center font-bold">{error}</Text>
                </View>
            )}
        </View>
    );
}

export default memo(FamilyListItem);