import React, { useState, useContext, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ScrollView,
    Alert, // Replaces toast and confirm
    ActivityIndicator,
    Platform
} from 'react-native';
import { AppContext } from '../../../Context/AppContext';
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';


// --- REACT NATIVE STYLESHEET (MOVED UP FOR ACCESS) ---
const styles = StyleSheet.create({
    // Utility Styles
    iconBase: { fontSize: 16 },
    mb4: { marginBottom: 16 },
    wFull: { width: '100%' },
    flexRow: { flexDirection: 'row' },

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
    
    createFamilyButton: {
        backgroundColor: '#4F46E5', // bg-indigo-600
        color: 'white',
        paddingHorizontal: 12, // px-3
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2, // shadow
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
    },
    createFamilyIcon: { color: 'white', fontSize: 16 },
    createFamilyText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    // Create Form Styles
    createFormWrapper: { 
        // Simulating animate-in fade-in slide-in-from-top-2
    },
    createFormHeader: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    createFormHeaderTitle: { fontWeight: 'bold', color: '#4F46E5', fontSize: 14 },
    createFormContainer: {
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
    createFormInfoText: { fontSize: 12, color: '#64748B', marginBottom: 16 },
    createFormInput: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1', // border-slate-300
        borderRadius: 8,
        fontSize: 14,
    },
    createFormActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8, // gap-2
    },
    cancelButton: { padding: 4 },
    cancelButtonText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
    createButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#4F46E5',
    },
    createButtonText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
    disabledButton: { opacity: 0.5 },

    // 2. List Section Styles
    listHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8', // text-slate-400
        textTransform: 'uppercase',
        letterSpacing: 1.5, // tracking-wider
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
        color: '#475569', // text-slate-600
    },
    listStickyHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#475569',
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingText: { 
        color: '#94A3B8', 
        fontSize: 12, 
        marginLeft: 8 
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

    // Family Row Styles
    rowContainer: {
        flexDirection: 'column', // default to column
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9', // border-slate-100
        // last:border-0 (handled by checking index if necessary, but visually fine without)
        // hover:bg-slate-50 (use TouchableOpacity activeOpacity)
        gap: 16, // gap-4
    },
    rowDetailsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
        flexGrow: 1,
    },
    initialsCircle: {
        width: 40, // w-10 h-10
        height: 40,
        flexShrink: 0,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        borderWidth: 1,
    },
    ownerCircle: { 
        backgroundColor: '#E0E7FF', // bg-indigo-100
        color: '#4F46E5', // text-indigo-700
        borderColor: '#C7D2FE', // border-indigo-200
    },
    memberCircle: {
        backgroundColor: '#F1F5F9', // bg-slate-100
        color: '#475569', // text-slate-600
        borderColor: '#E2E8F0', // border-slate-200
    },
    initialsText: { fontWeight: 'bold', fontSize: 14 },
    
    familyNameText: { fontSize: 14, fontWeight: 'bold', color: '#334155' }, // text-slate-700
    familyOwnerText: { fontSize: 12, color: '#94A3B8' }, // text-xs text-slate-400

    rowActionsRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        alignSelf: 'flex-end', // self-end md:self-auto
    },
    
    // Editing Styles
    editInputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        width: 200, // md:w-48
        paddingVertical: 4, // To visually align with text
    },
    editInput: {
        flex: 1,
        paddingHorizontal: 8, // px-2
        paddingVertical: 4, // py-1
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
        fontSize: 14,
    },
    editLoading: { 
        marginLeft: 8, 
        position: 'absolute', 
        right: 4, 
    },
    saveButton: { 
        padding: 8, // p-2
        color: '#059669', // text-emerald-600
        borderRadius: 8,
    },
    cancelEditButton: {
        padding: 8,
        color: '#9CA3AF', // text-slate-400
        borderRadius: 8,
    },

    // Action Buttons
    enterRealmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, // gap-1
        backgroundColor: '#EEF2FF', // bg-indigo-50
        color: '#4F46E5', // text-indigo-600
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C7D2FE', // border-indigo-100
    },
    enterRealmText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 12 },
    ownerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        paddingLeft: 8, // pl-2
        marginLeft: 4, // ml-1
        gap: 4, // gap-1
    },
    iconButtonBase: {
        padding: 8,
        color: '#9CA3AF', // text-slate-400
        borderRadius: 8,
    },
});


// --- ICON PLACEHOLDER (Replace with react-native-vector-icons) ---
const Icon = ({ name, style, size = 16 }) => {
    let iconText = '';
    switch (name) {
        case 'Enter': iconText = '➜'; break;
        case 'Edit': iconText = '✎'; break;
        case 'Trash': iconText = '🗑️'; break;
        case 'Check': iconText = '✓'; break;
        case 'X': iconText = '✕'; break;
        case 'Plus': iconText = '+'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: size, lineHeight: size }, style]}>{iconText}</Text>;
};
const Icons = {
    Enter: <Icon name="Enter" style={styles.iconBase} />,
    Edit: <Icon name="Edit" style={styles.iconBase} />,
    Trash: <Icon name="Trash" style={styles.iconBase} />,
    Check: <Icon name="Check" style={styles.iconBase} />,
    X: <Icon name="X" style={styles.iconBase} />
};


// --- INTERNAL COMPONENT: Create Family Form ---
const CreateFamilyForm = ({ onAdd, onCancel }) => {
    const [familyName, setFamilyName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!familyName.trim()) return Alert.alert("Error", "Family name cannot be empty.");
        setLoading(true);
        await onAdd(familyName);
        setLoading(false);
    };

    return (
        <View style={styles.createFormContainer}>
            <Text style={styles.createFormInfoText}>Name your new family realm.</Text>
            <View style={styles.mb4}>
                <TextInput 
                    style={styles.createFormInput}
                    value={familyName} 
                    onChangeText={setFamilyName} 
                    placeholder="e.g. The Smiths" 
                    editable={!loading}
                />
            </View>
            <View style={styles.createFormActions}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading || !familyName.trim()} 
                    style={[styles.createButton, (loading || !familyName.trim()) && styles.disabledButton]}
                >
                    <Text style={styles.createButtonText}>
                        {loading ? 'Creating...' : 'Create'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- INTERNAL COMPONENT: Family Row ---
const FamilyRow = ({ family, onEnter, onRename, onDelete }) => {
    const initials = (family.family_name || "F").substring(0, 2).toUpperCase();
    const isOwner = family.isOwner;
    const ownerName = family.ownerDetails?.full_name || "Unknown";

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(family.family_name);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!editName.trim() || editName === family.family_name) {
            setIsEditing(false);
            return;
        }
        setLoading(true);
        const success = await onRename(family.id, editName);
        if (success) setIsEditing(false);
        setLoading(false);
    };

    const handleDelete = () => {
        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete "${family.family_name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        setLoading(true);
                        await onDelete(family.id);
                        setLoading(false);
                    } 
                },
            ]
        );
    };

    return (
        <View style={styles.rowContainer}>
            {/* LEFT SIDE: Icon & Details */}
            <View style={styles.rowDetailsLeft}>
                <View style={[styles.initialsCircle, isOwner ? styles.ownerCircle : styles.memberCircle]}>
                    <Text style={styles.initialsText}>{initials}</Text>
                </View>
                
                <View style={styles.wFull}>
                    {isEditing ? (
                        <View style={styles.editInputWrapper}>
                            <TextInput 
                                style={styles.editInput}
                                value={editName}
                                onChangeText={setEditName}
                                autoFocus
                                editable={!loading}
                                onSubmitEditing={handleSave}
                            />
                            {loading && <ActivityIndicator size="small" color="#4F46E5" style={styles.editLoading} />}
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.familyNameText}>{family.family_name}</Text>
                            <Text style={styles.familyOwnerText}>
                                {isOwner ? 'Head of Household' : `Owner: ${ownerName}`}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* RIGHT SIDE: Actions */}
            <View style={styles.rowActionsRight}>
                {isEditing ? (
                    <>
                        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
                            {Icons.Check}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => { setIsEditing(false); setEditName(family.family_name); }} 
                            disabled={loading} 
                            style={styles.cancelEditButton}
                        >
                            {Icons.X}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity 
                            onPress={() => onEnter(family)}
                            style={styles.enterRealmButton}
                        >
                            <Text style={styles.enterRealmText}>Enter Realm </Text>
                            {Icons.Enter}
                        </TouchableOpacity>

                        {isOwner && (
                            <View style={styles.ownerActions}>
                                <TouchableOpacity 
                                    onPress={() => setIsEditing(true)} 
                                    style={styles.iconButtonBase}
                                >
                                    {Icons.Edit}
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleDelete}
                                    style={styles.iconButtonBase}
                                >
                                    {Icons.Trash}
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
const ManageFamiliesWidget = ({ onEnterRealm }) => {
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const [families, setFamilies] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- HELPER: Check for Transactions ---
    const checkHasTransactions = async (familyId) => {
        try {
            const res = await fetch(`${API_URL}/transactions?family_id=${familyId}`);
            if (res.ok) {
                const transactions = await res.json();
                return transactions.length > 0;
            }
            return false; 
        } catch (error) {
            console.error("Error checking transactions:", error);
            Alert.alert("Error", "Network error while checking transaction history.");
            return true; // Safe assumption: prevent deletion/rename if status is uncertain
        }
    };

    const fetchFamilies = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/families?user_id=${user.uid}`);
            if (!res.ok) throw new Error('Failed to fetch families');
            const raw = await res.json();
            
            let mapped = raw.map(f => ({
                ...f,
                id: (f._id || f.id).toString(),
                isOwner: f.owner_id === user.uid
            }));

            const ownerIds = [...new Set(mapped.map(f => f.owner_id))];
            const ownersMap = {};

            if (ownerIds.length > 0) {
                // Fetch up to 10 owners (Firestore 'in' limit)
                const usersRef = collection(db, "users");
                const ownersQuery = query(usersRef, where(documentId(), "in", ownerIds.slice(0, 10))); 
                const ownersSnapshot = await getDocs(ownersQuery);
                ownersSnapshot.forEach(doc => { ownersMap[doc.id] = doc.data(); });
            }

            mapped = mapped.map(family => ({
                ...family,
                ownerDetails: ownersMap[family.owner_id] || { full_name: 'Unknown' }
            }));

            setFamilies(mapped);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not load families.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFamilies(); }, [user]); // Replaced useCallback dependencies with direct use

    const handleCreate = async (name) => {
        try {
            const res = await fetch(`${API_URL}/families`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    family_name: name,
                    owner_id: user.uid,
                    member_ids: [user.uid]
                })
            });

            if (!res.ok) throw new Error("Creation failed");
            Alert.alert("Success", "Family created successfully!");
            setShowCreateForm(false);
            fetchFamilies(); 
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to create family.");
        }
    };

    // --- RENAME WITH VALIDATION ---
    const handleRename = async (familyId, newName) => {
        const hasTx = await checkHasTransactions(familyId);
        if (hasTx) {
            Alert.alert("Denied", "Cannot rename family: Transactions exist. Family must be empty to rename.");
            return false;
        }

        try {
            const res = await fetch(`${API_URL}/families/${familyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ family_name: newName })
            });

            if (!res.ok) throw new Error("Update failed");
            Alert.alert("Success", "Family renamed.");
            fetchFamilies();
            return true;
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to rename family.");
            return false;
        }
    };

    // --- DELETE WITH VALIDATION ---
    const handleDelete = async (familyId) => {
        const hasTx = await checkHasTransactions(familyId);
        if (hasTx) {
            Alert.alert("Denied", "Cannot delete family: Transactions exist. Please archive instead.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/families/${familyId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Deletion failed");
            Alert.alert("Success", "Family deleted.");
            fetchFamilies();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete family.");
        }
    };

    return (
        <View style={styles.container}>
            {/* 1. TOP SECTION */}
            <View style={styles.topSection}>
                {!showCreateForm ? (
                    <View style={styles.topSectionContent}>
                        <View>
                            <Text style={styles.topSectionTitle}>My Families</Text>
                            <Text style={styles.topSectionSubtitle}>Manage household realms.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowCreateForm(true)}
                            style={styles.createFamilyButton}
                        >
                            <Icon name="Plus" style={styles.createFamilyIcon} />
                            <Text style={styles.createFamilyText}>Create Family</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.createFormWrapper}>
                        <View style={styles.createFormHeader}>
                            <Text style={styles.createFormHeaderTitle}>Create New Family</Text>
                        </View>
                        <CreateFamilyForm onAdd={handleCreate} onCancel={() => setShowCreateForm(false)} />
                    </View>
                )}
            </View>

            {/* 2. LIST SECTION */}
            <View>
                <Text style={styles.listHeader}>Available Realms ({families.length})</Text>
                <View style={styles.listContainer}>
                    <View style={styles.listStickyHeader}>
                        <Text style={styles.listStickyHeaderText}>Family Details</Text>
                    </View>
                    <ScrollView style={{maxHeight: 400}}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#94A3B8" />
                                <Text style={styles.loadingText}>Loading realms...</Text>
                            </View>
                        ) : families.length > 0 ? (
                            families.map(family => (
                                <FamilyRow 
                                    key={family.id} 
                                    family={family} 
                                    onEnter={onEnterRealm}
                                    onRename={handleRename}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyListContainer}>
                                <Text style={styles.emptyListText}>
                                    You are not part of any families yet.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

export default ManageFamiliesWidget;