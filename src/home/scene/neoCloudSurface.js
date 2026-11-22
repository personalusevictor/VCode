export function installNeoClouds(material) {
  const time = { value: 0 };
  const night = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNeoTime = time;
    shader.uniforms.uNeoNight = night;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vNeoSurface; varying float vNeoShoulder;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvNeoSurface = position; vNeoShoulder = abs(normal.z);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `
      #include <common>
      uniform float uNeoTime;
      uniform float uNeoNight;
      varying vec3 vNeoSurface; varying float vNeoShoulder;
      float neoHash(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * 0.1031);
        q += dot(q, q.yzx + 33.33);
        return fract((q.x + q.y) * q.z);
      }
      float neoNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(neoHash(i), neoHash(i + vec2(1., 0.)), f.x),
                   mix(neoHash(i + vec2(0., 1.)), neoHash(i + vec2(1., 1.)), f.x), f.y);
      }
      float neoMist(vec2 p) {
        float n = 0.;
        mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
        n += 0.57 * neoNoise(p);
        p = turn * p * 2.05 + 2.7;
        n += 0.28 * neoNoise(p);
        p = turn * p * 2.03 + 4.1;
        n += 0.15 * neoNoise(p);
        return n;
      }
    `,
      )
      .replace(
        "#include <color_fragment>",
        `
      #include <color_fragment>
      vec2 neoP = vNeoSurface.xy * 0.78 + vNeoSurface.z * vec2(0.3, -0.18);
      vec2 neoDrift = vec2(uNeoTime * 0.14, -uNeoTime * 0.09);
      vec2 neoWarp = vec2(neoNoise(neoP * 0.65 + neoDrift * 0.45), neoNoise(neoP * 0.55 - neoDrift * 0.4 + vec2(7.2, 2.1)));
      float neoDensity = neoMist(neoP + neoDrift + neoWarp * 1.7);
      float neoVeil = neoMist(neoP * 1.2 - neoDrift * 0.65 + vec2(4.2, 1.7));
      float neoRange = clamp((neoDensity - 0.25) * 1.95, 0.0, 1.0);
      vec3 neoIce = vec3(0.16, 0.48, 0.95);
      vec3 neoCloudColor = mix(vec3(0.002, 0.009, 0.055), vec3(0.005, 0.075, 0.28), smoothstep(0.03, 0.25, neoRange));
      neoCloudColor = mix(neoCloudColor, vec3(0.0343, 0.0467, 0.8714), smoothstep(0.20, 0.46, neoRange));
      neoCloudColor = mix(neoCloudColor, vec3(0.025, 0.28, 0.96), smoothstep(0.46, 0.72, neoRange));
      neoCloudColor = mix(neoCloudColor, neoIce, smoothstep(0.72, 0.96, neoRange));
      neoCloudColor = mix(neoCloudColor, neoIce, smoothstep(0.54, 0.80, neoVeil) * 0.55);
      neoCloudColor = mix(vec3(0.018, 0.075, 0.48), neoCloudColor, 0.55);
      neoCloudColor *= mix(vec3(1.0), vec3(0.55, 0.59, 0.78), uNeoNight);

      float neoSide = 1.0 - smoothstep(0.08, 0.78, vNeoShoulder);
      float neoCore = 1.0 - smoothstep(0.012, 0.034, abs(vNeoSurface.z));
      vec3 neoSideColor = mix(neoCloudColor * 0.48, vec3(0.0343, 0.12, 1.0), neoCore * 0.85);
      diffuseColor.rgb = mix(neoCloudColor, neoSideColor, neoSide);
      totalEmissiveRadiance += neoCloudColor * (0.045 + neoDensity * 0.06);
      totalEmissiveRadiance += vec3(0.01, 0.065, 0.6) * neoCore * neoSide * 0.10;
    `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, mix(0.13, 0.24, uNeoNight), neoCore * neoSide);
    `,
      )
      .replace(
        "#include <opaque_fragment>",
        `float neoRim = 1.0 - smoothstep(0.38, 0.96, vNeoShoulder);
        outgoingLight *= mix(vec3(1.0), vec3(0.37, 0.50, 0.72), neoRim * uNeoNight);
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => "vcode-continuous-cobalt-core-v9";
  return { time, night };
}
