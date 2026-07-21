const { withAndroidStyles } = require("expo/config-plugins");

const WINDOW_BACKGROUND_COLOR = "#FFFFFF";
const TARGET_STYLES = ["AppTheme", "Theme.App.SplashScreen"];

const withAndroidWindowBackground = (config) => {
  return withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults;

    styles.resources.style = (styles.resources.style ?? []).map((style) => {
      if (!TARGET_STYLES.includes(style.$.name)) return style;

      const items = Array.isArray(style.item) ? style.item : [];
      const hasWindowBackground = items.some(
        (item) => item.$.name === "android:windowBackground",
      );

      if (hasWindowBackground) return style;

      return {
        ...style,
        item: [
          ...items,
          {
            $: { name: "android:windowBackground" },
            _: WINDOW_BACKGROUND_COLOR,
          },
        ],
      };
    });

    return modConfig;
  });
};

module.exports = withAndroidWindowBackground;
