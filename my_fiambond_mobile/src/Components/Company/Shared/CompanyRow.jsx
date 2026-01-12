// CompanyRow.jsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export const CompanyRow = memo(({ 
  title, 
  subtitle, 
  icon, 
  badge, 
  rightContent, 
  onClick 
}) => {
  
  // The inner content structure
  const RowContent = (
    <View className="flex-row items-center p-4 border-b border-slate-100 bg-white">
      {/* Icon / Avatar Circle */}
      <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center overflow-hidden">
        {/* Handle if icon is a string (initials) or a component */}
        {typeof icon === 'string' ? (
          <Text className="font-bold text-slate-600 text-sm">{icon}</Text>
        ) : (
          icon
        )}
      </View>

      {/* Main Info Area */}
      <View className="ml-4 flex-1 justify-center">
        <Text 
          className="font-bold text-slate-800 text-sm" 
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <Text 
            className="text-xs text-slate-500 mr-2" 
            numberOfLines={1}
          >
            {subtitle}
          </Text>
          {badge}
        </View>
      </View>

      {/* Right Side Content (Price, Date, or Chevron) */}
      {rightContent && (
        <View className="ml-2 items-end">
          {rightContent}
        </View>
      )}
    </View>
  );

  // If an onClick is provided, make the row touchable
  if (onClick) {
    return (
      <TouchableOpacity 
        onPress={onClick} 
        activeOpacity={0.6}
      >
        {RowContent}
      </TouchableOpacity>
    );
  }

  // Default static view
  return RowContent;
});