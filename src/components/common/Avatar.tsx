import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AvatarProps {
  /** URL da foto do usuário. Se vazia, exibe o ícone de fallback. */
  photoURL?: string | null;
  /** Tamanho (largura e altura) em pixels. */
  size?: number;
  /** Raio da borda. Padrão: size / 2 (círculo). */
  borderRadius?: number;
  /** Cor da borda. */
  borderColor?: string;
  /** Largura da borda. */
  borderWidth?: number;
  /** Cor de fundo exibida atrás do ícone de fallback. */
  backgroundColor?: string;
  /** Nome do ícone de fallback. */
  iconName?: string;
  /** Biblioteca do ícone de fallback. */
  iconSet?: "mci" | "ion";
  /** Tamanho do ícone de fallback. Padrão: size * 0.55. */
  iconSize?: number;
  /** Cor do ícone de fallback. */
  iconColor?: string;
}

/**
 * Avatar de usuário reutilizável: exibe a foto (arredondada/quadrada) com
 * fallback para um ícone quando não houver foto. Substitui a lógica repetida
 * em Header, configurações e RankingCard.
 */
export default function Avatar({
  photoURL,
  size = 40,
  borderRadius,
  borderColor = "rgba(255, 255, 255, 0.15)",
  borderWidth = 1,
  backgroundColor = "rgba(255, 255, 255, 0.06)",
  iconName = "account",
  iconSet = "mci",
  iconSize,
  iconColor = "#FFFFFF",
}: AvatarProps) {
  const radius = borderRadius ?? size / 2;
  const fallbackSize = iconSize ?? Math.round(size * 0.55);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor,
          borderWidth,
          backgroundColor,
        },
      ]}
    >
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: radius },
          ]}
        />
      ) : iconSet === "ion" ? (
        <Ionicons name={iconName as any} size={fallbackSize} color={iconColor} />
      ) : (
        <MaterialCommunityIcons
          name={iconName as any}
          size={fallbackSize}
          color={iconColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
});
