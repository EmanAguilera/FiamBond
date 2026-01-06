import React, { useState, memo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';

// TypeScript interfaces are removed here

// --- ICON PLACEHOLDER ---
const PlusIcon = (style) => <Text style={style}>+</Text>;


// --- INTERNAL COMPONENT: Add Member Form ---
// Type annotations removed
const AddMemberForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) return Alert.alert("Error", "Email cannot be empty.");
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };

    return (
        <View style={styles.addFormContainer}>
            <Text style={styles.addFormInfoText}>Enter user email to invite.</Text>
            <View style={styles.mb4}>
                <TextInput 
                    style={styles.addFormInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    // Removed 'required' prop
                    value={email} 
                    onChangeText={setEmail} 
                    placeholder="relative@example.com" 
                    editable={!loading}
                />
            </View>
            <View style={styles.addFormActions}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading || !email.trim()} 
                    style={[styles.inviteButton, (loading || !email.trim()) && styles.disabledButton]}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.inviteButtonText}>Invite</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- INTERNAL COMPONENT: Member Row ---
// Type annotation removed
const MemberRow = ({ member }) => {
    const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        <View style={styles.memberRowContainer}>
            <View style={styles.memberDetailsLeft}>
                <View style={styles.memberInitialsCircle}>
                    <Text style={styles.memberInitialsText}>{initials}</Text>
                </View>
                <View>
                    <Text style={styles.memberNameText}>{member.full_name || member.first_name || "Unknown User"}</Text>
                    <Text style={styles.memberEmailText}>{member.email}</Text>
                </View>
            </View>
            <View style={styles.memberTag}>
                <Text style={styles.memberTagText}>Family</Text>
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
// Type annotations removed
const ManageMembersWidget = ({ family, members, onUpdate }) => {
    const API_URL = 'http://localhost:3000/api'; // Simplified URL
    const [showAddForm, setShowAddForm] = useState(false);

    // Type annotation removed
    const handleAddMember = async (email) => {
        try {
            // 1. Find User in Firebase
            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                Alert.alert("Error", "User email not found in system.");
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

            if (res.status === 409) throw new Error("User is already a member.");
            if (!res.ok) throw new Error("Failed to add member.");

            Alert.alert("Success", `${newUser.full_name || "User"} added successfully!`);
            if (onUpdate) onUpdate();
            setShowAddForm(false);

        } catch (error) { // Type annotation removed here: error: any
            console.error(error);
            Alert.alert("Error", error.message || "Failed to add member.");
        }
    };

    return (
        <View style={styles.container}>
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <View style={styles.topSection}>
                {!showAddForm ? (
                    <View style={styles.topSectionContent}>
                        <View>
                            <Text style={styles.topSectionTitle}>Family Members</Text>
                            <Text style={styles.topSectionSubtitle}>Manage household access.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowAddForm(true)}
                            style={styles.inviteButtonAction} // New name to avoid conflict
                        >
                            {PlusIcon(styles.inviteIcon)}
                            <Text style={styles.inviteButtonActionText}>Invite Member</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.addFormWrapper}>
                        <View style={styles.addFormHeader}>
                            <Text style={styles.addFormHeaderTitle}>Invite New Member</Text>
                        </View>
                        <AddMemberForm onAdd={handleAddMember} onCancel={() => setShowAddForm(false)} />
                    </View>
                )}
            </View>

            {/* 2. BOTTOM SECTION: LIST */}
            <View>
                <Text style={styles.listHeader}>Current Household ({members.length})</Text>
                <View style={styles.listContainer}>
                    <View style={styles.listStickyHeader}>
                        <Text style={styles.listStickyHeaderText}>Member Details</Text>
                    </View>
                    <ScrollView style={{maxHeight: 400}}>
                        {members && members.length > 0 ? (
                            members.map(member => (
                                <MemberRow key={member.id} member={member} />
                            ))
                        ) : (
                            <View style={styles.emptyListContainer}>
                                <Text style={styles.emptyListText}>
                                    No members found.
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

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // Utility Styles
    mb4: { marginBottom: 16 },

    // Main Widget Styles
    container: { gap: 16 }, // space-y-4

    // 1. Top Section Styles
    topSection: {
        backgroundColor: '#F8FAFC', // bg-slate-50
        padding: 16, // p-4
        borderRadius: 12, // rounded-xl
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
    },
    topSectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topSectionTitle: { fontWeight: 'bold', color: '#334155' }, // text-slate-700
    topSectionSubtitle: { fontSize: 12, color: '#64748B' }, // text-xs text-slate-500
    
    inviteButtonAction: { // Renamed from inviteButton to avoid conflict
        backgroundColor: '#4F46E5', // bg-indigo-600
        paddingHorizontal: 12, // px-3
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2, // shadow
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
    },
    inviteButtonActionText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    inviteIcon: { color: 'white', fontSize: 16 },

    // Add Member Form Styles
    addFormWrapper: { 
        // Simulating animate-in fade-in slide-in-from-top-2
    },
    addFormHeader: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addFormHeaderTitle: { fontWeight: 'bold', color: '#4F46E5', fontSize: 14 },
    addFormContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9', // border-slate-100
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1, // shadow-sm
        marginTop: 8, // mt-2
    },
    addFormInfoText: { fontSize: 12, color: '#64748B', marginBottom: 16 },
    addFormInput: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1', // border-slate-300
        borderRadius: 8,
        fontSize: 14,
    },
    addFormActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8, // gap-2
    },
    cancelButton: { padding: 4 },
    cancelButtonText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
    
    inviteButton: { // Style for the invite button inside the form (different name than the action button)
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#4F46E5',
    },
    inviteButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    
    // Member List Styles
    listHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8', // text-slate-400
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wider (changed from 1.5)
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    listContainer: {
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        borderRadius: 12, // rounded-xl
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    listStickyHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12, // py-3
        backgroundColor: '#F8FAFC', // bg-slate-50
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    listStickyHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#475569',
    },
    emptyListContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyListText: {
        color: '#94A3B8',
        fontSize: 14,
        fontStyle: 'italic',
    },

    // Member Row Styles
    memberRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, // p-4
        borderBottomWidth: 1,
        borderColor: '#F1F5F9', // border-slate-100
    },
    memberDetailsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
    },
    memberInitialsCircle: {
        width: 32, // w-8 h-8
        height: 32,
        borderRadius: 16,
        backgroundColor: '#CCFBF1', // bg-teal-100
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#99F6E4', // border-teal-200
    },
    memberInitialsText: { fontWeight: 'bold', fontSize: 12, color: '#0D9488' },
    memberNameText: { fontSize: 14, fontWeight: 'bold', color: '#334155' }, // text-slate-700
    memberEmailText: { fontSize: 12, color: '#94A3B8' }, // text-xs text-slate-400
    memberTag: {
        paddingHorizontal: 8, // px-2
        paddingVertical: 4, // py-1
        borderRadius: 4,
        backgroundColor: '#D1FAE5', // bg-teal-50
        borderWidth: 1,
        borderColor: '#A7F3D0', // border-teal-100
    },
    memberTagText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#047857', // text-teal-600
    },
    
    // Disabled Button for Form
    disabledButton: { opacity: 0.5 },
});