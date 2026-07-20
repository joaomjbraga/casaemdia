import {
  Blur,
  Canvas,
  ColorMatrix,
  Group,
  matchFont,
  Paint,
  Skia,
  Text,
  useFont,
} from "@shopify/react-native-skia";
import React, { memo, useEffect, useMemo } from "react";
import { Platform, StyleSheet, View, type TextStyle } from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { THRESHOLD_MATRIX } from "./conf";
import { calculateBlur, calculateOpacity } from "./helpers";
import type { IGooeyText, IGooeyTextItem } from "./types";

const GooeyTextItem: React.FC<IGooeyTextItem> = ({
  text,
  index,
  totalTexts,
  masterClock,
  cooldownFraction,
  font,
  color,
  x,
  y,
}) => {
  const visibility = useDerivedValue(() => {
    const cycleIndex = Math.floor(masterClock.value) % totalTexts;
    const nextIndex = (cycleIndex + 1) % totalTexts;
    const progressInCycle = masterClock.value % 1;

    let morphProgress = 0;
    if (progressInCycle >= cooldownFraction) {
      morphProgress =
        (progressInCycle - cooldownFraction) / (1 - cooldownFraction);
    }

    if (index === cycleIndex) {
      return 1 - morphProgress;
    }
    if (index === nextIndex) {
      return morphProgress;
    }
    return 0;
  }, [index, totalTexts, cooldownFraction]);

  const blur = useDerivedValue(() => calculateBlur(visibility.value), []);
  const opacity = useDerivedValue(() => calculateOpacity(visibility.value), []);

  return (
    <Group
      layer={
        <Paint>
          <Blur blur={blur} />
        </Paint>
      }
      opacity={opacity}
    >
      <Text
        x={x + 1.4}
        y={y + 2}
        text={text}
        font={font}
        color="rgba(0,0,0,0.34)"
      />
      <Text x={x} y={y} text={text} font={font} color={color} />
    </Group>
  );
};

function useSystemFont(
  fontFamily: string | undefined,
  fontSize: number,
  fontWeight: TextStyle["fontWeight"],
  skip: boolean,
) {
  return useMemo(() => {
    if (skip) return null;

    const family =
      fontFamily ??
      Platform.select({
        ios: "Helvetica",
        android: "sans-serif",
        default: "serif",
      });

    try {
      return matchFont({
        fontFamily: family as string,
        fontSize,
        fontWeight: fontWeight as any,
      });
    } catch {
      const fontMgr = Skia.FontMgr.System();
      const numericWeight =
        fontWeight === "bold"
          ? 700
          : fontWeight === "normal"
            ? 400
            : parseInt(fontWeight as string, 10) || 400;
      const typeface = fontMgr.matchFamilyStyle(family as string, {
        weight: numericWeight,
      });
      return typeface ? Skia.Font(typeface, fontSize) : null;
    }
  }, [skip, fontFamily, fontSize, fontWeight]);
}

export const GooeyText: React.FC<IGooeyText> &
  React.FunctionComponent<IGooeyText> = memo<IGooeyText>(
  ({
    texts,
    morphTime = 1,
    cooldownTime = 0.25,
    style,
    fontSize = 48,
    color = "black",
    fontSource,
    fontFamily,
    fontWeight = "bold",
    width = 300,
    height = 100,
  }) => {
    const customFont = useFont(fontSource ?? null, fontSize);
    const systemFont = useSystemFont(
      fontFamily,
      fontSize,
      fontWeight,
      !!fontSource,
    );
    const font = fontSource ? customFont : systemFont;

    const cycleTime = cooldownTime + morphTime;
    const cooldownFraction = cooldownTime / cycleTime;
    const totalDuration = cycleTime * texts.length;
    const masterClock = useSharedValue<number>(0);

    useEffect(() => {
      if (texts.length < 2 || !font) return;

      masterClock.value = 0;
      masterClock.value = withRepeat(
        withTiming(texts.length, {
          duration: totalDuration * 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );

      return () => {
        cancelAnimation(masterClock);
      };
    }, [texts.length, totalDuration, font, masterClock]);

    const textPositions = useMemo(() => {
      if (!font) {
        return texts.map(() => width / 2);
      }

      return texts.map((text) => {
        try {
          const measured = font.measureText(text);
          return (width - measured.width) / 2;
        } catch {
          return width / 2;
        }
      });
    }, [font, width, texts]);

    const textY = height / 2 + fontSize / 3;

    if (!font) {
      return <View style={[styles.container, { width, height }, style]} />;
    }

    if (texts.length < 2) {
      return (
        <View style={[styles.container, { width, height }, style]}>
          <Canvas style={styles.canvas}>
            <Text
              x={textPositions[0] ?? width / 2}
              y={textY}
              text={texts[0] ?? ""}
              font={font}
              color={color}
            />
          </Canvas>
        </View>
      );
    }

    return (
      <View style={[styles.container, { width, height }, style]}>
        <Canvas style={styles.canvas}>
          <Group
            layer={
              <Paint>
                <ColorMatrix matrix={THRESHOLD_MATRIX} />
              </Paint>
            }
          >
            {texts.map((text, index) => (
              <GooeyTextItem
                key={`${text}-${index}`}
                text={text}
                index={index}
                totalTexts={texts.length}
                masterClock={masterClock}
                cooldownFraction={cooldownFraction}
                font={font}
                color={color}
                x={textPositions[index] ?? width / 2}
                y={textY}
              />
            ))}
          </Group>
        </Canvas>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  canvas: {
    flex: 1,
  },
});

export default memo(GooeyText);
