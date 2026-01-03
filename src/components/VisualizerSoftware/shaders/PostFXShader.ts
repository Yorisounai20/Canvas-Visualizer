// Custom Post-Processing Shader for visual effects
export const PostFXShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'vignetteStrength': { value: 0.0 },
    'vignetteSoftness': { value: 0.5 },
    'saturation': { value: 1.0 },
    'contrast': { value: 1.0 },
    'gamma': { value: 1.0 },
    'tintR': { value: 1.0 },
    'tintG': { value: 1.0 },
    'tintB': { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignetteStrength;
    uniform float vignetteSoftness;
    uniform float saturation;
    uniform float contrast;
    uniform float gamma;
    uniform float tintR;
    uniform float tintG;
    uniform float tintB;
    varying vec2 vUv;

    vec3 adjustSaturation(vec3 color, float sat) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(gray), color, sat);
    }

    vec3 adjustContrast(vec3 color, float con) {
      return (color - 0.5) * con + 0.5;
    }

    vec3 adjustGamma(vec3 color, float gam) {
      return pow(color, vec3(1.0 / gam));
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Apply color tint
      color *= vec3(tintR, tintG, tintB);

      // Apply saturation
      color = adjustSaturation(color, saturation);

      // Apply contrast
      color = adjustContrast(color, contrast);

      // Apply gamma
      color = adjustGamma(color, gamma);

      // Apply vignette
      if (vignetteStrength > 0.0) {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float vignette = smoothstep(vignetteSoftness, vignetteSoftness - vignetteStrength, dist);
        color *= vignette;
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `
};
