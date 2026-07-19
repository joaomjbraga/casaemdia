import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export default function LoginBackground() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "#0A3D38",
          "#0C2E2B",
          "#091F1D",
          "#061514",
          "#040E0D",
          "#020807",
          "#010404",
          "#000000",
        ]}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
});
