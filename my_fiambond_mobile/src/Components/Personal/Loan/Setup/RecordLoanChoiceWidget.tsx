import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface RecordLoanChoiceWidgetProps {
    onSelectFamilyLoan: () => void;
    onSelectPersonalLoan: () => void;
}

// Button Base Style (Defined OUTSIDE StyleSheet.create)
const baseBtn = {
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8,
    // REMOVE alignItems and justifyContent here to redefine them below
    // fontWeight and fontSize are omitted as they belong to Text
};

export default function RecordLoanChoiceWidget({ onSelectFamilyLoan, onSelectPersonalLoan }: RecordLoanChoiceWidgetProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Record a New Loan</Text>
            <Text style={styles.infoText}>
                Is this loan for a member of an existing family in Fiambond, or is it a personal loan to an individual?
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    onPress={onSelectFamilyLoan}
                    style={styles.primaryBtn}
                >
                    <Text style={styles.primaryBtnText}>For a Family Member</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={onSelectPersonalLoan}
                    style={styles.secondaryBtn}
                >
                    <Text style={styles.secondaryBtnText}>To an Individual (Personal)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        padding: 16, 
        gap: 16, 
    },
    title: {
        fontSize: 20, 
        fontWeight: '600', 
        textAlign: 'center',
        color: '#1F2937', 
    },
    infoText: {
        textAlign: 'center',
        color: '#4B5563', 
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: Dimensions.get('window').width > 600 ? 'row' : 'column', 
        gap: 16, 
        paddingTop: 16, 
    },

    // Button Base Styles (Used for merging)
    // primaryBtn and secondaryBtn now define alignItems/justifyContent explicitly
    
    primaryBtn: {
        ...baseBtn, // FIX: Spread the base properties
        backgroundColor: '#4F46E5', 
        alignItems: 'center', // FIX: Explicitly set for ViewStyle
        justifyContent: 'center', // FIX: Explicitly set for ViewStyle
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4, 
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryBtn: {
        ...baseBtn, // FIX: Spread the base properties
        backgroundColor: 'white', 
        alignItems: 'center', // FIX: Explicitly set for ViewStyle
        justifyContent: 'center', // FIX: Explicitly set for ViewStyle
        borderWidth: 1,
        borderColor: '#D1D5DB', 
    },
    secondaryBtnText: {
        color: '#4B5563', 
        fontWeight: 'bold',
        fontSize: 16,
    },
});