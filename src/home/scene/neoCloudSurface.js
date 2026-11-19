export function installNeoClouds(material) {
  const time = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNeoTime = time;
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
      varying vec3 vNeoSurface; varying float vNeoShoulder;
      float neoCloudOutline(vec2 p) {

        float d = min(length((p - vec2(-0.27, 0.0)) / vec2(0.27, 0.15)) - 1.0,
                      length((p - vec2(0.02, 0.09)) / vec2(0.33, 0.22)) - 1.0);
        d = min(d, length((p - vec2(0.34, -0.01)) / vec2(0.25, 0.14)) - 1.0);
        return max(d * 0.15, -p.y - 0.08);
      }
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


      float neoSide = 1.0 - smoothstep(0.08, 0.78, vNeoShoulder);
      float neoCore = 1.0 - smoothstep(0.012, 0.034, abs(vNeoSurface.z));
      vec3 neoSideColor = mix(neoCloudColor * 0.48, vec3(0.0343, 0.12, 1.0), neoCore * 0.85);
      diffuseColor.rgb = mix(neoCloudColor, neoSideColor, neoSide);
      totalEmissiveRadiance += neoCloudColor * (0.045 + neoDensity * 0.06);
      totalEmissiveRadiance += vec3(0.01, 0.065, 0.6) * neoCore * neoSide * 0.10;

      vec2 neoMotif = vNeoSurface.xy + vec2(uNeoTime * 0.012, 0.0);
      neoMotif.x += floor((neoMotif.y + 1.2) / 2.4) * 1.4;
      neoMotif = mod(neoMotif + vec2(1.7, 1.2), vec2(3.4, 2.4)) - vec2(1.7, 1.2);
      float neoCloudEdge = neoCloudOutline(neoMotif);
      float neoLineWidth = max(fwidth(neoCloudEdge), 0.002);
      float neoEtching = 1.0 - smoothstep(0.002, 0.002 + neoLineWidth, abs(neoCloudEdge));
      neoEtching += (1.0 - smoothstep(0.002, 0.002 + neoLineWidth, abs(neoCloudEdge + 0.032))) * 0.45;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.61, 1.0), neoEtching * 0.035);

    `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.13, neoCore * neoSide) + neoEtching * 0.012;
    `,
      );
  };
  material.customProgramCacheKey = () => "vcode-continuous-cobalt-core-v7";
  return time;
}
