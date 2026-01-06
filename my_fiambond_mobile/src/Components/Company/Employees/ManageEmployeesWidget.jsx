import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    Alert, 
    ActivityIndicator 
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
// NOTE: Ensure your Firebase config paths are correct
import { db } from '../../../config/firebase-config'; 
// NOTE: Assumed native version must exist and be imported correctly
import CompanyEmployeeListWidget from './CompanyEmployeeListWidget'; 

// --- ICON PLACEHOLDER ---
const PlusIcon = (style) => <Text style={style}>+</Text>;


// --- INTERNAL COMPONENT: Add Employee Form ---
// TypeScript interfaces are removed here
const AddEmployeeForm = ({ onAdd, onCancel }) => {
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
            <Text style={styles.addFormInfoText}>Enter user email to onboard.</Text>
            <View style={styles.mb4}>
                <TextInput 
                    style={styles.addFormInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required 
                    value={email} 
                    onChangeText={setEmail} 
                    placeholder="employee@example.com" 
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
                    style={[styles.onboardButton, (loading || !email.trim()) && styles.disabledButton]}
                >
                    {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.onboardButtonText}>Onboard</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
// TypeScript type annotations removed from props:
export default function ManageEmployeesWidget({ company, members, onUpdate }) {
    const API_URL = 'http://localhost:3000/api'; // Simplified URL
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddEmployee = async (email) => {
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

            // 2. Add to Company in MongoDB (assuming a server endpoint for this logic)
            const res = await fetch(`${API_URL}/companies/${company.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMemberId: newUserId })
            });

            if (res.status === 409) throw new Error("User is already an employee.");
            // Explicit type annotation removed here:
            if (!res.ok) throw new Error("Failed to add employee.");

            Alert.alert("Success", `${newUser.full_name || "User"} added successfully!`);
            if (onUpdate) onUpdate();
            setShowAddForm(false);

        } catch (error) { // Explicit type annotation removed here: error: any
            console.error(error);
            // Access message directly, as error type is inferred
            Alert.alert("Error", error.message || "Failed to add employee."); 
        }
    };

    return (
        <View style={styles.container}>
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <View style={styles.topSection}>
                {!showAddForm ? (
                    <View style={styles.topSectionContent}>
                        <View>
                            <Text style={styles.topSectionTitle}>Company Workforce</Text>
                            <Text style={styles.topSectionSubtitle}>Manage employee access.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowAddForm(true)}
                            style={styles.onboardButtonAction} // Changed style name to avoid conflict
                        >
                            {PlusIcon(styles.onboardIcon)}
                            <Text style={styles.onboardButtonActionText}>Onboard Employee</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.addFormWrapper}>
                        <View style={styles.addFormHeader}>
                            <Text style={styles.addFormHeaderTitle}>Onboard New Employee</Text>
                        </View>
                        <AddEmployeeForm onAdd={handleAddEmployee} onCancel={() => setShowAddForm(false)} />
                    </View>
                )}
            </View>

            {/* 2. BOTTOM SECTION: LIST OF EMPLOYEES */}
            <View>
                <Text style={styles.listHeader}>Active Team ({members.length})</Text>
                <View style={styles.listContainer}>
                    <CompanyEmployeeListWidget members={members} />
                </View>
            </View>
        </View>
    );
}

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
    
    // Onboard Button (Top Section) - Renamed style to onboardButtonAction to avoid conflict with AddForm's onboardButton
    onboardButtonAction: {
        backgroundColor: '#4F46E5', // bg-indigo-600
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2, // shadow
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, // gap-2
    },
    onboardIcon: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    onboardButtonActionText: { color: 'white', fontSize: 14, fontWeight: 'bold' }, // text-sm

    // Add Employee Form Styles
    addFormWrapper: { 
        // Simulating animate-in fade-in slide-in-from-top-2
    },
    addFormHeader: { 
        flexDirection: 'row',
        justifyContent: 'flex-start', // Adjusted to start as only title is present
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginBottom: 8,
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
        paddingVertical: 10, // Increased padding for better touch area
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
    cancelButton: { paddingHorizontal: 12, paddingVertical: 6 }, // Added touch padding
    cancelButtonText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
    
    // Onboard Button (Form Submit)
    onboardButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#4F46E5',
    },
    onboardButtonText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
    
    // Member List Styles
    listHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8', // text-slate-400
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wider
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    listContainer: {
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        borderRadius: 12, // rounded-xl
        overflow: 'hidden',
    },
    
    // Disabled Button
    disabledButton: { opacity: 0.5 },
});