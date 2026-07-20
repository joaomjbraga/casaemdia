import type { SkFont } from "@shopify/react-native-skia";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

export interface IGooeyText {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
  color?: string;
  fontSource?: number | null;
  fontFamily?: string;
  fontWeight?: TextStyle["fontWeight"];
  width?: number;
  height?: number;
}

export interface IGooeyTextItem {
  text: string;
  index: number;
  totalTexts: number;
  masterClock: SharedValue<number>;
  cooldownFraction: number;
  font: SkFont | null;
  color: string;
  x: number;
  y: number;
}
