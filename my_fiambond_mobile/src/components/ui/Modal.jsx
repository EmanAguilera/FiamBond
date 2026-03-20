'use client';

import React from 'react';
import { 
  Modal as RNModal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <RNModal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
            {/* 
               Wrapper: matches "bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
               Note: rounded-lg in Tailwind is roughly 8px 
            */}
            <View 
              className="bg-white rounded-lg shadow-2xl w-[92%] max-w-2xl overflow-hidden flex-col"
              style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}
            >
              
              {/* 
                 Modal Header: matches "flex justify-between items-center p-4 border-b border-gray-200"
              */}
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-800">
                  {title}
                </Text>
                
                {/* 
                   Close Button: matches "text-gray-400 hover:text-gray-600 text-2xl font-bold px-2"
                */}
                <TouchableOpacity 
                  onPress={onClose} 
                  activeOpacity={0.6}
                  className="px-2"
                >
                  <Text className="text-gray-400 text-2xl font-bold">×</Text>
                </TouchableOpacity>
              </View>
              
              {/* 
                 Modal Body: matches "p-6 overflow-y-auto text-gray-700"
              */}
              <ScrollView 
                className="p-6" 
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
              >
                <View className="text-gray-700">
                    {children}
                </View>
              </ScrollView>
            </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // Slightly darker backdrop to emphasize the shadow-2xl of the modal
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center', 
    alignItems: 'center',    
  },
});