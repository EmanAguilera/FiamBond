import React, { memo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions 
} from 'react-native';
// NOTE: Ensure your AdminUserRow component is a React Native component
import { AdminUserRow } from '../Users/AdminUserRow'; 

// Get screen height for max-h-[60vh] calculation
const windowHeight = Dimensions.get('window').height;

const EntityManagementWidget = ({ users, onTogglePremium }) => {
    
    // Calculate the height of the sticky header for ScrollView paddingTop
    const HEADER_HEIGHT = 44; // Approx height for px-4 py-3 header

    return (
        <View style={styles.container}>
            
            {/* 1. Header (Implemented with absolute positioning for "sticky" effect) */}
            <View style={[styles.header, { height: HEADER_HEIGHT }]}>
                <Text style={styles.headerText}>
                    Manage "Company Dashboard" access for users.
                </Text>
            </View>

            {/* 2. List (ScrollView with content offset) */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollViewContent, { paddingTop: HEADER_HEIGHT }]}
            >
                {users.map(u => {
                    // Badge rendering logic for React Native View/Text
                    const badgeContent = u.role === 'admin' 
                        ? (
                            <View style={[styles.badgeBase, styles.badgePurple]}>
                                <Text style={styles.badgeTextPurple}>ADMIN</Text>
                            </View>
                        )
                        : u.is_premium && (
                            <View style={[styles.badgeBase, styles.badgeAmber]}>
                                <Text style={styles.badgeTextAmber}>COMPANY</Text>
                            </View>
                        );

                    // Conditional button styles
                    const buttonIsPremium = u.is_premium;
                    const buttonIsDisabled = u.role === 'admin';
                    
                    const buttonStyles = [
                        styles.buttonBase,
                        buttonIsDisabled && styles.buttonDisabled,
                        buttonIsPremium ? styles.buttonRevoke : styles.buttonGrant,
                    ];
                    
                    const buttonTextStyles = [
                        styles.buttonText,
                        buttonIsPremium ? styles.buttonTextRevoke : styles.buttonTextGrant
                    ];

                    return (
                        <AdminUserRow 
                            key={u.id} 
                            user={u}
                            badge={badgeContent}
                            rightContent={
                                <TouchableOpacity
                                    // --- MAKE SURE THIS LINE IS CORRECT: ---
                                    onPress={() => onTogglePremium(u.id, u.is_premium)}
                                    // ---------------------------------------
                                    disabled={buttonIsDisabled} 
                                    style={buttonStyles}
                                >
                                    <Text style={buttonTextStyles}>
                                        {u.role === 'admin' ? 'Super User' : (u.is_premium ? 'Revoke Company' : 'Grant Company')}
                                    </Text>
                                </TouchableOpacity>
                            }
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default memo(EntityManagementWidget);

// --- STYLESHEET (Mapping Tailwind to React Native) ---
const styles = StyleSheet.create({
    container: {
        maxHeight: windowHeight * 0.60, // max-h-[60vh]
        overflow: 'hidden',
        // Add border/background if this is the only thing in the screen
        backgroundColor: '#fff', 
        borderRadius: 8,
    },
    
    // ScrollView Styles
    scrollView: {
        flex: 1, // Ensure it takes available space in the container
    },
    scrollViewContent: {
        // Content padding top is set dynamically by the component to push items below the absolute header
    },

    // 1. Header (px-4 py-3 bg-indigo-50 border-b border-indigo-100 text-indigo-800 text-sm font-medium sticky top-0 z-10)
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        backgroundColor: '#eef2ff', // indigo-50
        borderBottomWidth: 1,
        borderBottomColor: '#e0e7ff', // indigo-100
        justifyContent: 'center',
    },
    headerText: {
        color: '#3730a3', // indigo-800
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },

    // Badge Styles (inside AdminUserRow's badge prop)
    badgeBase: {
        paddingHorizontal: 8, // px-2
        paddingVertical: 2, // py-0.5
        borderRadius: 9999, // rounded-full
        textTransform: 'uppercase',
    },
    badgeText: {
        fontSize: 10, // text-[10px]
        fontWeight: 'bold',
    },
    // Admin Badge (bg-purple-100 text-purple-700)
    badgePurple: { backgroundColor: '#f3e8ff' }, 
    badgeTextPurple: { color: '#6b21a8', fontSize: 10, fontWeight: 'bold' },
    // Company Badge (bg-amber-100 text-amber-700)
    badgeAmber: { backgroundColor: '#fffbe3' }, 
    badgeTextAmber: { color: '#b45309', fontSize: 10, fontWeight: 'bold' },

    // Button Styles (inside AdminUserRow's rightContent prop)
    buttonBase: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 4, // rounded
        borderWidth: 1,
        // shadow-sm
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1, 
    },
    buttonText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonDisabled: {
        opacity: 0.5, // disabled:opacity-50
    },

    // Revoke Button (is_premium true)
    // bg-white border-red-200 text-red-600
    buttonRevoke: {
        backgroundColor: '#fff',
        borderColor: '#fecaca', // red-200
    },
    buttonTextRevoke: {
        color: '#dc2626', // red-600
    },

    // Grant Button (is_premium false)
    // bg-indigo-600 border-indigo-600 text-white
    buttonGrant: {
        backgroundColor: '#4f46e5', // indigo-600
        borderColor: '#4f46e5',
    },
    buttonTextGrant: {
        color: '#fff', // text-white
    },
    // Note: React Native TouchableOpacity handles press, but hover effects (hover:bg-red-50) 
    // are omitted here as they require manual state management or a dedicated library.
});