import type { StyleProp, ViewStyle } from "react-native";

export interface IGrainyGradient {
  width?: number;
  height?: number;
  colors?: string[];
  speed?: number;
  animated?: boolean;
  intensity?: number;
  size?: number;
  enabled?: boolean;
  amplitude?: number;
  brightness?: number;
  style?: StyleProp<ViewStyle>;
}
