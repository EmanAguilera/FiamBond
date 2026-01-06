import React, { useState, useContext, useMemo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    Alert, 
    Dimensions, 
    Platform,
    ActivityIndicator,
    ViewStyle
} from 'react-native';
import { AppContext } from '../../../Context/AppContext.jsx';

// --- INTERFACES FOR TYPE SAFETY ---
interface Family {
    id: string;
    family_name: string;
    owner_id: string;
    owner?: { full_name: string };
    [key: string]: any;
}

interface FamilyListItemProps {
    family: Family;
    onFamilyUpdated: (updatedFamily: Family) => void;
    onFamilyDeleted: (familyId: string) => void;
}

// Interfaces for Context Fix 
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------

// Button Base Style properties (for manual merging)
// NOTE: This is the single definition, fixing error 2451 by removing the redundant one below.
const BASE_BTN_PROPERTIES = {
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 6, 
    alignItems: 'center',
    justifyContent: 'center',
} as const;

export default function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }: FamilyListItemProps) {
    const { user } = useContext(AppContext)! as AppContextType; 
    
    const [isEditing, setIsEditing] = useState(false);
    const [familyName, setFamilyName] = useState(family.family_name);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:3000/api'; 

    const isOwner = user?.uid === family.owner_id;
    const canPerformActions = isOwner;

    // Memoize the dynamic styles based on screen width
    const dynamicStyles = useMemo(() => {
        const isSmallScreen = Dimensions.get('window').width < 600;
        return StyleSheet.create({
            displayArea: {
                flexDirection: isSmallScreen ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isSmallScreen ? 'flex-start' : 'center',
                gap: 16, 
            },
            actionsWrapper: {
                flexDirection: 'row',
                width: isSmallScreen ? '100%' : 'auto',
                alignItems: 'center',
                gap: 8, 
                flexShrink: 0,
                marginTop: isSmallScreen ? 8 : 0,
            },
            btnFlex: {
                flex: isSmallScreen ? 1 : 0, 
            }
        });
    }, [Dimensions.get('window').width]);
    
    async function handleUpdate() {
        if (!familyName.trim() || familyName === family.family_name) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/families/${family.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ family_name: familyName }),
            });

            if (!response.ok) {
                throw new Error('Failed to update family name on server.');
            }

            const updatedFamily = { ...family, family_name: familyName };
            onFamilyUpdated(updatedFamily);
            setIsEditing(false);
            Alert.alert("Success", "Family name updated.");

        } catch (err: any) {
            console.error('Failed to update family:', err);
            setError('Failed to update the family name.');
            Alert.alert("Error", 'Failed to update the family name.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete the family "${family.family_name}"? This action cannot be undone.`,
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

                            if (!response.ok) {
                                throw new Error('Failed to delete family on server.');
                            }
                            
                            onFamilyDeleted(family.id);
                            Alert.alert("Success", "Family deleted.");

                        } catch (err: any) {
                            console.error('Failed to delete family:', err);
                            setError('Failed to delete the family.');
                            Alert.alert("Error", 'Failed to delete the family.');
                        } finally {
                            setLoading(false);
                        }
                    } 
                },
            ]
        );
    }

    return (
        <View style={styles.container}>
            {isEditing ? (
                <View style={styles.editForm}>
                    <TextInput
                        style={styles.textInput}
                        value={familyName}
                        onChangeText={setFamilyName}
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={handleUpdate} style={[styles.primaryBtnSm, dynamicStyles.btnFlex]} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.primaryBtnTextSm}>Save</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.secondaryBtnSm, dynamicStyles.btnFlex]} disabled={loading}>
                        <Text style={styles.secondaryBtnTextSm}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={dynamicStyles.displayArea}>
                    <View style={styles.detailsWrapper}> 
                        <Text style={styles.familyName} numberOfLines={1}>{family.family_name}</Text>
                        <Text style={styles.ownerText} numberOfLines={1}>Owner: {family.owner?.full_name || 'Loading...'}</Text>
                    </View>
                    
                    <View style={dynamicStyles.actionsWrapper}> 
                        {isOwner && (
                            <>
                                <TouchableOpacity
                                    onPress={() => setIsEditing(true)}
                                    style={[styles.secondaryBtnSm, dynamicStyles.btnFlex]}
                                    disabled={!canPerformActions || loading}
                                >
                                    <Text style={styles.secondaryBtnTextSm}>Rename</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    style={[styles.dangerBtnSm, dynamicStyles.btnFlex]}
                                    disabled={!canPerformActions || loading}
                                >
                                    {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.dangerBtnTextSm}>Delete</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        padding: 16, 
        backgroundColor: '#F9FAFB', 
        borderWidth: 1,
        borderColor: '#E5E7EB', 
        borderRadius: 6, 
        gap: 12, 
    },
    
    // Edit Form Styles
    editForm: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, 
    },
    textInput: {
        flex: 1,
        padding: 8, 
        borderWidth: 1,
        borderColor: '#D1D5DB', 
        borderRadius: 6, 
        fontSize: 16,
    },
    
    // Display Styles
    detailsWrapper: {
        minWidth: 0, 
        flexShrink: 1, 
    },
    familyName: {
        fontWeight: '600', 
        fontSize: 18, 
        color: '#374151', 
    },
    ownerText: {
        fontSize: 12, 
        color: '#6B7280', 
    },
    
    // Primary Button (Save)
    primaryBtnSm: {
        ...BASE_BTN_PROPERTIES, 
        backgroundColor: '#4F46E5', 
    } as ViewStyle, 

    primaryBtnTextSm: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    // Secondary Button (Rename/Cancel)
    secondaryBtnSm: {
        ...BASE_BTN_PROPERTIES, 
        backgroundColor: 'white', 
        borderWidth: 1,
        borderColor: '#D1D5DB', 
    } as ViewStyle, 

    secondaryBtnTextSm: {
        color: '#4B5563', 
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    // Danger Button (Delete)
    dangerBtnSm: {
        ...BASE_BTN_PROPERTIES, 
        backgroundColor: '#DC2626', 
    } as ViewStyle, 

    dangerBtnTextSm: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    // Error Text
    errorText: {
        color: '#DC2626', 
        fontSize: 12, 
        marginTop: 8,
    },
});