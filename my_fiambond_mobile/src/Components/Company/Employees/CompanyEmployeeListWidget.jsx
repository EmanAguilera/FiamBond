import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// --- INTERNAL COMPONENT: Employee Row ---
const EmployeeRow = ({ member }) => {
    const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        <View style={styles.employeeRowContainer}>
            <View style={styles.employeeDetailsLeft}>
                <View style={styles.employeeInitialsCircle}>
                    <Text style={styles.employeeInitialsText}>{initials}</Text>
                </View>
                <View>
                    <Text style={styles.employeeNameText}>{member.full_name || member.first_name || "Unknown User"}</Text>
                    <Text style={styles.employeeEmailText}>{member.email}</Text>
                </View>
            </View>
            <View style={styles.employeeTag}>
                <Text style={styles.employeeTagText}>Active</Text>
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
const CompanyEmployeeListWidget = ({ members }) => {
    return (
        <View style={styles.widgetContainer}>
            <View style={styles.listStickyHeader}>
                <Text style={styles.listStickyHeaderText}>Employee Details</Text>
            </View>
            <ScrollView style={styles.listScrollView}>
                {members && members.length > 0 ? (
                    members.map(member => (
                        <EmployeeRow key={member.id} member={member} />
                    ))
                ) : (
                    <View style={styles.emptyListContainer}>
                        <Text style={styles.emptyListText}>
                            No employees found.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default CompanyEmployeeListWidget;

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // --- Widget Container ---
    widgetContainer: {
        // max-h-[50vh] is handled by setting a height/flex on the ScrollView
        flex: 1, 
        maxHeight: 400, // Example max height
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
    },

    // --- List Header ---
    listStickyHeader: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        backgroundColor: '#F8FAFC', // bg-slate-50
        borderBottomWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        zIndex: 10, // sticky top-0
    },
    listStickyHeaderText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#475569', // text-slate-600
    },
    
    // --- Scroll View ---
    listScrollView: {
        flex: 1,
        backgroundColor: 'white',
    },

    // --- Employee Row ---
    employeeRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, // p-4
        borderBottomWidth: 1,
        borderColor: '#F1F5F9', // border-slate-100
        // hover:bg-slate-50 simulation uses activeOpacity on TouchableOpacity if needed
    },
    employeeDetailsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
    },
    employeeInitialsCircle: {
        width: 32, // w-8 h-8
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E7FF', // bg-indigo-100
        color: '#4F46E5', // text-indigo-600
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#C7D2FE', // border-indigo-200
    },
    employeeInitialsText: { fontWeight: 'bold', fontSize: 12, color: '#4F46E5' },
    employeeNameText: { fontSize: 14, fontWeight: 'bold', color: '#334155' }, // text-slate-700
    employeeEmailText: { fontSize: 12, color: '#94A3B8' }, // text-xs text-slate-400
    employeeTag: {
        paddingHorizontal: 8, // px-2
        paddingVertical: 4, // py-1
        borderRadius: 4,
        backgroundColor: '#EEF2FF', // bg-indigo-50
        borderWidth: 1,
        borderColor: '#C7D2FE', // border-indigo-100
    },
    employeeTagText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4F46E5', // text-indigo-600
    },

    // --- Empty List ---
    emptyListContainer: {
        padding: 32, // p-8
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyListText: {
        color: '#94A3AF', // text-slate-400
        fontSize: 14,
        fontStyle: 'italic',
    },
});