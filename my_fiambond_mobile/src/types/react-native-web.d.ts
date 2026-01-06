import 'react-native';

declare module 'react-native' {
  interface ViewStyle {
    boxShadow?: string;
  }
  interface TextStyle {
    // Add any text-related web props here if needed
  }
}