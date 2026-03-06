'use client';

import React from 'react';
import { 
  Modal as RNModal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <RNModal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          className="bg-white rounded-3xl shadow-2xl w-[90%] max-w-2xl overflow-hidden"
          style={{ maxHeight: SCREEN_HEIGHT * 0.8 }}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
            <Text className="text-xl font-black text-slate-800 tracking-tight">
              {title}
            </Text>
            <TouchableOpacity 
              onPress={onClose} 
              className="p-1 bg-slate-50 rounded-full"
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          {/* Modal Body */}
          <ScrollView 
            className="p-6" 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* 
               SPECIFIC FIX: 
               Changed the wrapper below from <Text> to <View>. 
               This allows the 'children' (Transactions/Goals) to use flexbox 
               alignment, matching your Next.js centered layout perfectly.
            */}
            <View onStartShouldSetResponder={() => true}>
                {children}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center', // Centers the modal vertically
    alignItems: 'center',     // Centers the modal horizontally
  },
});