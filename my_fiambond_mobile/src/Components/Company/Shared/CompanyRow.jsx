import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// TypeScript interfaces are removed

// TypeScript type annotation removed from function signature
const CompanyRow = ({ title, subtitle, icon, badge, rightContent, onClick }) => {
    // Determine the container type based on whether onClick is provided
    const Container = onClick ? TouchableOpacity : View;
    
    return (
        <Container 
            onPress={onClick}
            style={[styles.container, onClick && styles.containerClickable]}
            // Set activeOpacity only if onClick is provided, otherwise it defaults to 1 for View (no visual change)
            activeOpacity={onClick ? 0.9 : 1} // Changed from 0.7 to 0.9 for a softer press feedback
        >
            {/* Icon / Avatar */}
            <View style={styles.iconWrapper}>
                {icon}
            </View>

            {/* Main Info */}
            <View style={styles.detailsWrapper}>
                <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
                <View style={styles.subtitleWrapper}>
                    <Text style={styles.subtitleText}>{subtitle}</Text>
                    {badge}
                </View>
            </View>

            {/* Right Side Action/Info */}
            <View style={styles.rightContentWrapper}>
                {rightContent}
            </View>
        </Container>
    );
};

export default memo(CompanyRow);

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100 (Corrected from original typo 'F3FF6')
        backgroundColor: 'white',
    },
    containerClickable: {
        // hover:bg-gray-50 simulation is handled by TouchableOpacity activeOpacity
    },
    
    // Icon / Avatar
    iconWrapper: {
        flexShrink: 0,
        width: 40, // w-10 h-10
        height: 40,
        borderRadius: 20, // rounded-full
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9', // bg-slate-100
        // The text color/size for the icon content is expected to be passed via the 'icon' prop
        // The container style defines background/shape
    },

    // Main Info
    detailsWrapper: {
        marginLeft: 16, // ml-4
        flexGrow: 1,
        minWidth: 0, // min-w-0
    },
    titleText: {
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
        fontSize: 16,
    },
    subtitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        marginTop: 2, // mt-0.5
    },
    subtitleText: {
        fontSize: 14, // text-sm
        color: '#6B7280', // text-gray-500
    },

    // Right Side
    rightContentWrapper: {
        marginLeft: 16, // ml-4
        flexDirection: 'row',
        alignItems: 'center',
        // textAlign: 'right', // Not applicable to View
    }
});