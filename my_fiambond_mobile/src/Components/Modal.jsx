// my_fiambond_mobile/src/Components/RNModalWrapper.jsx
import React, { memo } from 'react';
import { Modal as RNModal, TouchableOpacity, View, Text, ScrollView, StyleSheet } from 'react-native';

// Local styles specifically for this modal wrapper
const styles = StyleSheet.create({
    modalOverlay: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
    },
    modalContentContainer: { 
        width: '90%', 
        maxHeight: '80%', 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20, 
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    },
    modalHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 15 
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: '600', 
        color: '#1f2937' 
    },
    modalCloseButton: { 
        padding: 5 
    },
    modalCloseText: { 
        fontSize: 24, 
        color: '#6b7280' 
    },
    modalBody: { 
        flexGrow: 1 
    },
});

const RNModalWrapper = memo(({ isOpen, onClose, title, children }) => {
    return (
        <RNModal animationType="slide" transparent={true} visible={isOpen} onRequestClose={onClose}>
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View 
                    style={styles.modalContentContainer} 
                    onStartShouldSetResponder={() => true} 
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <Text style={styles.modalCloseText}>&times;</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        {children}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </RNModal>
    );
});

export default RNModalWrapper;