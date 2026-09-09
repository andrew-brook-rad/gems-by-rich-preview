// A ray-traced gem: light refracts into the stone, bounces between the real
// facets (found with a bounding volume hierarchy on the GPU) and leaves to
// sample a sharp studio cube map. Red, green and blue are traced with slightly
// different refractive indices so the exits fan out into fire. This is the
// same approach as the diamond demo in three-mesh-bvh (MIT), adapted to a
// cube map, a Fresnel surface reflection and the visualiser's unit stones.
import { MeshBVH, MeshBVHUniformStruct, shaderStructs, shaderIntersectFunction, SAH } from "./ring-optics.js";

export const GEM_OPTICS = { ior: 2.42, dispersion: 0.009, bounces: 5 };

// Flat, non-indexed facets plus a bounds tree the shader can walk.
export function gemGeometry(THREE, triangles) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(triangles, 3));
  geometry.computeVertexNormals();
  geometry.boundsTree = new MeshBVH(geometry, { strategy: SAH, maxLeafTris: 1 });
  return geometry;
}

export function gemMaterial(THREE, geometry, envMap, options = {}) {
  const optics = { ...GEM_OPTICS, ...options };
  const bvh = new MeshBVHUniformStruct();
  bvh.updateFrom(geometry.boundsTree);
  return new THREE.ShaderMaterial({
    uniforms: {
      envMap: { value: envMap },
      bvh: { value: bvh },
      bounces: { value: optics.bounces },
      ior: { value: optics.ior },
      dispersion: { value: optics.dispersion },
      color: { value: new THREE.Color(optics.color ?? 0xffffff) },
      envIntensity: { value: optics.envIntensity ?? 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        vWorldNormal = normalize(transpose(inverse(mat3(modelMatrix))) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      #define RAY_OFFSET 0.001
      precision highp isampler2D;
      precision highp usampler2D;
      #include <common>
      ${shaderStructs}
      ${shaderIntersectFunction}
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      uniform samplerCube envMap;
      uniform mat4 modelMatrix;
      uniform BVH bvh;
      uniform float bounces;
      uniform float ior;
      uniform float dispersion;
      uniform vec3 color;
      uniform float envIntensity;

      vec3 envSample(vec3 direction) {
        return textureCube(envMap, direction).rgb * envIntensity;
      }

      // Follow one ray through the stone and return where it leaves, in world
      // space. Total internal reflection keeps it inside for another bounce.
      vec3 traceThrough(vec3 direction, vec3 normal, float eta, mat4 toLocal) {
        vec3 d = refract(direction, normal, 1.0 / eta);
        vec3 o = vWorldPosition + d * RAY_OFFSET;
        o = (toLocal * vec4(o, 1.0)).xyz;
        d = normalize((toLocal * vec4(d, 0.0)).xyz);
        for (float i = 0.0; i < bounces; i++) {
          uvec4 faceIndices = uvec4(0u);
          vec3 faceNormal = vec3(0.0, 0.0, 1.0);
          vec3 barycoord = vec3(0.0);
          float side = 1.0;
          float dist = 0.0;
          if (!bvhIntersectFirstHit(bvh, o, d, faceIndices, faceNormal, barycoord, side, dist)) break;
          vec3 hit = o + d * dist;
          vec3 out_ = refract(d, faceNormal, eta);
          if (dot(out_, out_) > 0.0) { d = out_; break; }
          d = reflect(d, faceNormal);
          o = hit + d * RAY_OFFSET;
        }
        return normalize((modelMatrix * vec4(d, 0.0)).xyz);
      }

      void main() {
        mat4 toLocal = inverse(modelMatrix);
        vec3 normal = normalize(vWorldNormal);
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        if (dot(normal, direction) > 0.0) normal = -normal;
        float cosine = clamp(-dot(normal, direction), 0.0, 1.0);
        float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
        float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
        vec3 surface = envSample(reflect(direction, normal));
        vec3 red = envSample(traceThrough(direction, normal, ior * (1.0 - dispersion), toLocal));
        vec3 green = envSample(traceThrough(direction, normal, ior, toLocal));
        vec3 blue = envSample(traceThrough(direction, normal, ior * (1.0 + dispersion), toLocal));
        vec3 inside = vec3(red.r, green.g, blue.b) * color;
        gl_FragColor = vec4(mix(inside, surface, fresnel), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
