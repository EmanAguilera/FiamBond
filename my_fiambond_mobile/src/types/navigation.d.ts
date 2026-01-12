import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the parameter list for each screen in your stack navigator
// The keys are the screen names, and the values are the params they expect.
// `undefined` means the screen does not expect any params.
export type RootStackParamList = {
  Login: { message?: string } | undefined;
  Register: undefined;
  Welcome: undefined;
  UserRealm: undefined; // Assuming HomeStack is a stack navigator itself
  AdminRealm: undefined;
  Terms: undefined;
  Privacy: undefined;
  // Add other screens here as needed
};

// Define the types for the navigation and route props for the Login screen
export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

// You can also define a combined type for convenience
export type LoginScreenProps = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};

// Define the types for the navigation and route props for the Register screen
export type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
export type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;

// You can also define a combined type for convenience
export type RegisterScreenProps = {
  navigation: RegisterScreenNavigationProp;
};
