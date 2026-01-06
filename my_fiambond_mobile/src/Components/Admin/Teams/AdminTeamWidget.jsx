import React, { memo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Dimensions 
} from 'react-native';
// NOTE: Ensure your AdminUserRow component is a React Native component
import { AdminUserRow } from '../Users/AdminUserRow'; 

// Get screen height for max-h-[60vh] calculation
const windowHeight = Dimensions.get('window').height;

const AdminTeamWidget = ({ users }) => {

    // Calculate the height of the sticky header for ScrollView paddingTop
    const HEADER_HEIGHT = 44; // Approx height for px-4 py-3 header

    return (
        <View style={styles.container}>
            
            {/* 1. Header (Implemented with absolute positioning for "sticky" effect) */}
            <View style={[styles.header, { height: HEADER_HEIGHT }]}>
                <Text style={styles.headerText}>
                    Current System Administrators
                </Text>
            </View>

            {/* 2. List (ScrollView with content offset) */}
            {/* max-h-[60vh] overflow-y-auto -> ScrollView with max height */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollViewContent, { paddingTop: HEADER_HEIGHT }]}
            >
                {users.map(u => {
                    // Badge rendering logic for React Native View/Text
                    const badgeContent = (
                        <View style={styles.badgeBase}>
                            <Text style={styles.badgeText}>ADMIN</Text>
                        </View>
                    );

                    // Right Content rendering logic for React Native View/Text
                    const rightContent = (
                        <View style={styles.rightContentBase}>
                            <Text style={styles.rightContentText}>
                                Active
                            </Text>
                        </View>
                    );

                    return (
                        <AdminUserRow 
                            key={u.id} 
                            user={u}
                            badge={badgeContent}
                            rightContent={rightContent}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default memo(AdminTeamWidget);

// --- STYLESHEET (Mapping Tailwind to React Native) ---
const styles = StyleSheet.create({
    container: {
        maxHeight: windowHeight * 0.60, // max-h-[60vh]
        overflow: 'hidden',
        backgroundColor: '#fff', 
        borderRadius: 8,
    },
    
    // ScrollView Styles
    scrollView: {
        flex: 1, 
    },
    scrollViewContent: {
        // paddingTop added dynamically to push content under the absolute header
    },

    // 1. Header (px-4 py-3 bg-purple-50 border-b border-purple-100 text-purple-800 text-sm font-medium sticky top-0 z-10)
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        backgroundColor: '#faf5ff', // purple-50
        borderBottomWidth: 1,
        borderBottomColor: '#f3e8ff', // purple-100
        justifyContent: 'center',
    },
    headerText: {
        color: '#5b21aa', // purple-800
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },

    // Badge Styles (bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase)
    badgeBase: {
        backgroundColor: '#f3e8ff', // purple-100
        paddingHorizontal: 8, // px-2
        paddingVertical: 2, // py-0.5
        borderRadius: 9999, // rounded-full
    },
    badgeText: {
        color: '#6b21a8', // purple-700
        fontSize: 10, // text-[10px]
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Right Content Styles (text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded border border-purple-100)
    rightContentBase: {
        backgroundColor: '#faf5ff', // purple-50
        paddingHorizontal: 12, // px-3
        paddingVertical: 4, // py-1
        borderRadius: 4, // rounded
        borderWidth: 1,
        borderColor: '#f3e8ff', // border-purple-100
    },
    rightContentText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#7c3aed', // purple-600
    },
});