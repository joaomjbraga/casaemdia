export const GRAINY_GRADIENT_SHADER = `
uniform float iTime;
uniform float2 iResolution;
uniform float4 uColor0;
uniform float4 uColor1;
uniform float4 uColor2;
uniform float4 uColor3;
uniform float4 uColor4;
uniform int uColorCount;
uniform float uAmplitude;
uniform float uGrainIntensity;
uniform float uGrainSize;
uniform int uGrainEnabled;
uniform float uBrightness;

// Hash without Sine
// https://www.shadertoy.com/view/XlGcRh
float hash(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}

vec4 getColor(float t) {
    if (uColorCount == 1) return uColor0;
    if (t < 0.5) {
        float localT = t / 0.5;
        if (uColorCount == 2) return mix(uColor0, uColor1, localT);
        if (t < 0.25) return mix(uColor0, uColor1, t / 0.25);
        return mix(uColor1, uColor2, (t - 0.25) / 0.75);
    }
    float localT = (t - 0.5) / 0.5;
    if (uColorCount <= 3) return mix(uColor2, uColor0, localT);
    if (uColorCount == 4) return mix(uColor2, uColor3, localT);
    return mix(uColor3, uColor4, localT);
}

vec4 main(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution;
    float t = iTime * 0.15;
    float wave = sin((uv.x + uv.y) * 3.14159 + t) * uAmplitude
               + sin((uv.x - uv.y) * 3.14159 + t * 1.3) * uAmplitude;
    float gradientT = clamp(uv.y * 0.6 + uv.x * 0.4 + wave, 0.0, 1.0);
    vec4 col = getColor(gradientT);

    col.rgb += uBrightness;

    if (uGrainEnabled == 1) {
        float g = hash(fragCoord * uGrainSize);
        col.rgb += (g - 0.5) * uGrainIntensity;
    }

    return vec4(col.rgb, 1.0);
}
`;
