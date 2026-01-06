import React, { useState } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation
} from 'react-native';
// Make sure this path points to your actual Table Widget location
// NOTE: AdminUserTableWidget must be converted to a React Native component
import AdminUserTableWidget from "../Users/AdminUserTableWidget"; 

// --- INTERNAL COMPONENT: Add Admin Form ---
const AddAdminForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) return; // Basic validation
        setLoading(true);
        await onAdd(email);
        setLoading(false);
        setEmail(""); // Clear email on success/completion
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.addAdminForm}
        >
            <Text style={styles.addAdminFormText}>Enter user email to promote.</Text>
            <View style={styles.inputWrapper}>
                <TextInput 
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required 
                    value={email} 
                    onChangeText={setEmail} 
                    placeholder="user@example.com" 
                    placeholderTextColor="#94a3b8"
                />
            </View>
            <View style={styles.formButtonContainer}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading || !email} 
                    style={[
                        styles.promoteButtonBase, 
                        (loading || !email) && styles.promoteButtonDisabled
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.promoteButtonText}>Promote</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

// --- MAIN COMPONENT EXPORT ---
export default function ManageTeamWidget({ adminUsers, onAddAdmin }) {
    const [showAddForm, setShowAddForm] = useState(false);

    const toggleForm = () => {
        // Simple animation for the toggle
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowAddForm(!showAddForm);
    };

    return (
        <View style={styles.outerContainer}>
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <View style={styles.topSectionCard}>
                {!showAddForm ? (
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>System Administrators</Text>
                            <Text style={styles.headerSubtitle}>Manage who has access to this dashboard.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={toggleForm}
                            style={styles.promoteNewAdminButton}
                        >
                            {/* SVG icon replaced with a unicode char or text */}
                            <Text style={styles.promoteButtonIcon}>+</Text>
                            <Text style={styles.promoteButtonText}>Promote New Admin</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // This replaces the 'animate-in' section
                    <View>
                        <View style={styles.promoteFormHeader}>
                            <Text style={styles.promoteFormTitle}>Promote User to Admin</Text>
                            <TouchableOpacity onPress={toggleForm}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <AddAdminForm 
                            onAdd={async (email) => {
                                await onAddAdmin(email);
                                toggleForm(); // Close form after action
                            }} 
                            onCancel={toggleForm} 
                        />
                    </View>
                )}
            </View>

            {/* 2. BOTTOM SECTION: LIST OF ADMINS */}
            <View style={styles.bottomSection}>
                <Text style={styles.adminCountText}>Current Admins ({adminUsers.length})</Text>
                <View style={styles.adminTableWrapper}>
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


// --- STYLESHEET ---
const styles = StyleSheet.create({
    outerContainer: {
        gap: 16, // space-y-4
    },
    
    // 1. TOP SECTION CARD (bg-slate-50 p-4 rounded-xl border border-slate-200)
    topSectionCard: {
        backgroundColor: '#f8fafc', // slate-50
        padding: 16,
        borderRadius: 12, // rounded-xl
        borderWidth: 1,
        borderColor: '#e2e8f0', // slate-200
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#475569', // slate-700
    },
    headerSubtitle: {
        fontSize: 12, // text-xs
        color: '#64748b', // slate-500
    },
    promoteNewAdminButton: {
        backgroundColor: '#7c3aed', // purple-600
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3, // shadow
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
    },
    promoteButtonText: {
        fontSize: 14, // text-sm
        fontWeight: 'bold',
        color: '#fff', // text-white
    },
    promoteButtonIcon: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        lineHeight: 18, // Adjust line height to center the '+'
    },

    // Promote Form Header
    promoteFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16, // mb-4
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-slate-200
        paddingBottom: 8, // pb-2
    },
    promoteFormTitle: {
        fontWeight: 'bold',
        color: '#6b21a8', // purple-700
    },
    closeButtonText: {
        fontSize: 12, // text-xs
        color: '#94a3b8', // slate-400
        // hover:text-slate-600 is handled by touch feedback
    },

    // Add Admin Form (p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2)
    addAdminForm: {
        padding: 16, // p-4
        backgroundColor: '#fff',
        borderRadius: 8, // rounded-lg
        borderWidth: 1,
        borderColor: '#f1f5f9', // slate-100
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1, // shadow-sm
        marginTop: 8, // mt-2
    },
    addAdminFormText: {
        fontSize: 12, // text-xs
        color: '#64748b', // slate-500
        marginBottom: 16, // mb-4
    },
    inputWrapper: {
        marginBottom: 16, // mb-4
    },
    input: {
        width: '100%',
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderWidth: 1,
        borderColor: '#cbd5e1', // slate-300
        borderRadius: 8, // rounded-lg
        fontSize: 14, // text-sm
    },
    formButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8, // gap-2
    },
    cancelButton: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        // hover:text-slate-700 is handled by touch feedback
    },
    cancelButtonText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#64748b', // slate-500
    },
    promoteButtonBase: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 8, // rounded-lg
        backgroundColor: '#7c3aed', // purple-600
        alignItems: 'center',
    },
    promoteButtonDisabled: {
        opacity: 0.5, // disabled:opacity-50
    },
    promoteButtonText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#fff', // text-white
    },

    // 2. BOTTOM SECTION
    bottomSection: {
        marginTop: 16, // mt-4
    },
    adminCountText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#94a3b8', // slate-400
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wider
        marginBottom: 8, // mb-2
        paddingHorizontal: 4, // px-1
    },
    adminTableWrapper: {
        borderWidth: 1,
        borderColor: '#e2e8f0', // slate-200
        borderRadius: 12, // rounded-xl
        overflow: 'hidden',
    },
});