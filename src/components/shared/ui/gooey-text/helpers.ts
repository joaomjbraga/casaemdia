export const calculateBlur = <T extends number>(visibility: T): T => {
  "worklet";
  const blur = Math.max(0.8, visibility * 2.6);
  return blur as unknown as number as T;
};

export const calculateOpacity = <T extends number>(visibility: T): T => {
  "worklet";
  const normalized = Math.max(0.2, Math.min(1, visibility));
  return normalized as unknown as number as T;
};
