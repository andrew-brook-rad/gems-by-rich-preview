// Ring visualiser: a procedural ring on a procedural hand, both built from
// measurements in millimetres. See docs/superpowers/specs/2026-09-09-ring-visualiser-design.md
import * as THREE from "three";
import {
  CARAT_RANGE,
  HAND_PRESETS,
  HAND_RANGE,
  HAND_TONES,
  METALS,
  SETTINGS,
  SHAPES,
  describeRing,
  handProportions,
  matchingPreset,
  outline,
  parseState,
  ringSizeFor,
  stoneDimensions,
} from "ring-model";

const BAND_TUBE = 0.9; // half the band thickness
const BAND_WIDTH = 2.1; // along the finger
const DEG = Math.PI / 180;

class RingVisualiser extends HTMLElement {
  connectedCallback() {
    if (this.started) return;
    this.started = true;
    this.state = parseState(new URLSearchParams(location.search));
    this.view = "hand";
    this.orbit = { azimuth: 2.75, polar: 0.72, distance: 260 };
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.stage = this.querySelector("[data-stage]");
    this.buildControls();
    this.reflectControls();
    try {
      this.initScene();
    } catch (error) {
      this.showFallback();
      return;
    }
    this.rebuild();
    this.bindInteraction();
    this.startLoop();
  }

  /* Controls */

  buildControls() {
    const groups = {
      shape: SHAPES.map((s) => [s, s]),
      setting: SETTINGS.map((s) => [s.id, s.label]),
      metal: METALS.map((m) => [m.id, m.label, m.color]),
      tone: HAND_TONES.map((t) => [t.id, t.label, t.color]),
      hand: HAND_PRESETS.map((p) => [p.id, p.label]),
    };
    for (const [key, options] of Object.entries(groups)) {
      const host = this.querySelector(`[data-options="${key}"]`);
      if (!host) continue;
      host.innerHTML = options
        .map(
          ([value, label, swatch]) =>
            `<button type="button" role="radio" data-set="${key}" data-value="${value}" aria-checked="false"${
              swatch ? ` style="--swatch:${swatch}"` : ""
            }>${label}</button>`,
        )
        .join("");
    }
    const carat = this.querySelector("[data-carat]");
    if (carat) Object.assign(carat, { min: CARAT_RANGE.min, max: CARAT_RANGE.max, step: CARAT_RANGE.step });
    for (const key of ["length", "span", "finger"]) {
      const input = this.querySelector(`[data-measure="${key}"]`);
      if (input) Object.assign(input, { min: HAND_RANGE[key].min, max: HAND_RANGE[key].max, step: key === "finger" ? 0.1 : 1 });
    }
    this.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-set], button[data-view], button[data-attach]");
      if (!button) return;
      if (button.dataset.set === "hand") {
        const preset = HAND_PRESETS.find((p) => p.id === button.dataset.value);
        Object.assign(this.state, { length: preset.length, span: preset.span, finger: preset.finger });
        this.update();
      } else if (button.dataset.set) {
        this.state[button.dataset.set] = button.dataset.value;
        this.update();
      } else if (button.dataset.view) {
        this.setView(button.dataset.view);
      } else if (button.hasAttribute("data-attach")) {
        this.attachToEnquiry();
      }
    });
    this.addEventListener("input", (event) => {
      const target = event.target;
      if (target.matches("[data-carat]")) {
        this.state.carat = Math.round(Number(target.value) * 100) / 100;
        this.update();
      } else if (target.matches("[data-measure]")) {
        this.state[target.dataset.measure] = Math.round(Number(target.value) * 10) / 10;
        this.update();
      }
    });
  }

  reflectControls() {
    const preset = matchingPreset(this.state);
    for (const key of ["shape", "setting", "metal", "tone", "hand"]) {
      this.querySelectorAll(`[data-set="${key}"]`).forEach((button) => {
        const current = key === "hand" ? preset?.id : this.state[key];
        button.setAttribute("aria-checked", String(button.dataset.value === current));
      });
    }
    const carat = this.querySelector("[data-carat]");
    if (carat && Number(carat.value) !== this.state.carat) carat.value = this.state.carat;
    const dims = stoneDimensions(this.state.shape, this.state.carat);
    setText(this, "[data-carat-readout]", `${this.state.carat.toFixed(2)} ct · about ${dims.length.toFixed(1)} × ${dims.width.toFixed(1)} mm`);
    for (const key of ["length", "span", "finger"]) {
      const input = this.querySelector(`[data-measure="${key}"]`);
      if (input && Number(input.value) !== this.state[key]) input.value = this.state[key];
    }
    const size = ringSizeFor(this.state.finger);
    setText(this, "[data-readout=length]", `${(this.state.length / 10).toFixed(1)} cm`);
    setText(this, "[data-readout=span]", `${(this.state.span / 10).toFixed(1)} cm`);
    setText(this, "[data-readout=finger]", `${this.state.finger.toFixed(1)} mm · about UK ${size.uk} / US ${size.us}`);
    setText(this, "[data-summary]", describeRing(this.state));
    this.querySelectorAll("[data-view]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.view === this.view));
    });
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(this.state)) params.set(key, String(value));
    history.replaceState(null, "", `${location.pathname}?${params}`);
  }

  update() {
    this.reflectControls();
    if (this.renderer) {
      this.rebuild();
      this.requestRender();
    }
  }

  /* Scene */

  initScene() {
    const canvas = this.querySelector("canvas");
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x141414);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(studioEnvironment(), 0.02).texture;
    pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(28, 1, 1, 3000);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-120, 260, 160);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(160, 120, -220);
    this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    this.glintLights = STUDIO_LIGHT_DIRECTIONS.map((d) => new THREE.Vector3(...d).normalize());
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.stage);
    this.resize();
  }

  rebuild() {
    disposeChildren(this.world);
    this.buildHand();
    this.frameCamera();
  }

  /* Hand */

  buildHand() {
    const p = handProportions(this.state);
    const tone = HAND_TONES.find((t) => t.id === this.state.tone) || HAND_TONES[0];
    const skin = new THREE.MeshPhysicalMaterial({
      color: tone.color,
      roughness: 0.62,
      metalness: 0,
      sheen: 0.6,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color(0xffffff),
      clearcoat: 0.06,
      clearcoatRoughness: 0.5,
    });
    const hand = new THREE.Group();
    this.world.add(hand);
    // Palm: a rounded slab between the wrist (z = 0) and the knuckles (z = -palmLength).
    hand.add(new THREE.Mesh(palmGeometry(p), skin));
    // Wrist stub for context.
    const wrist = new THREE.Mesh(new THREE.CapsuleGeometry(p.wristWidth / 2 - 2, 40, 6, 20), skin);
    wrist.rotation.x = Math.PI / 2;
    wrist.scale.z = (p.thickness / 2 + 1) / (p.wristWidth / 2 - 2);
    wrist.position.set(0, -0.5, 26);
    hand.add(wrist);
    // Fingers: little to index, each three segments, slightly spread and curled.
    for (const f of p.fingers) {
      const base = new THREE.Group();
      base.position.set(f.base.x, p.thickness * 0.08, -f.base.y);
      base.rotation.y = -f.spread * DEG;
      hand.add(base);
      let parent = base;
      const curls = [7, 13, 9];
      f.segments.forEach((len, i) => {
        const seg = new THREE.Group();
        seg.rotation.x = -curls[i] * DEG;
        parent.add(seg);
        const radius = (f.width / 2) * [1, 0.93, 0.85][i];
        const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(1, len - radius * 0.6), 6, 24), skin);
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.z = 0.86; // fingers are a little flatter than round
        mesh.position.z = -len / 2;
        seg.add(mesh);
        if (f.id === "ring" && i === 0) {
          this.ringMount = new THREE.Group();
          this.ringMount.position.z = -len * 0.56;
          this.ringMount.rotation.x = -Math.PI / 2;
          seg.add(this.ringMount);
          this.buildRing(f.width / 2 + 0.35);
        }
        const next = new THREE.Group();
        next.position.z = -len;
        seg.add(next);
        parent = next;
      });
    }
    // Thumb: two segments, out to the side and forward.
    const t = p.thumb;
    const thumb = new THREE.Group();
    thumb.position.set(t.base.x, p.thickness * 0.05, -t.base.y);
    thumb.rotation.order = "YXZ";
    thumb.rotation.y = -t.angle * DEG;
    thumb.rotation.x = -22 * DEG;
    hand.add(thumb);
    let parent = thumb;
    t.segments.forEach((len, i) => {
      const seg = new THREE.Group();
      seg.rotation.x = -[10, 18][i] * DEG;
      parent.add(seg);
      const radius = (t.width / 2) * [1, 0.9][i];
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(1, len - radius * 0.6), 6, 24), skin);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.z = 0.85;
      mesh.position.z = -len / 2;
      seg.add(mesh);
      const next = new THREE.Group();
      next.position.z = -len;
      seg.add(next);
      parent = next;
    });
    this.hand = hand;
    this.handLength = p.length;
  }

  /* Ring, built z-up inside ringMount (which is rotated onto the finger) */

  buildRing(innerRadius) {
    const state = this.state;
    const setting = SETTINGS.find((s) => s.id === state.setting) || SETTINGS[0];
    const metalDef = METALS.find((m) => m.id === state.metal) || METALS[0];
    const dims = stoneDimensions(state.shape, state.carat);
    const R = innerRadius;
    const metal = new THREE.MeshStandardMaterial({ color: metalDef.color, metalness: 1, roughness: 0.2, envMapIntensity: 1.4 });
    const stone = stoneMaterial(dims.depth);
    const accent = stoneMaterial(1.2);
    const mount = this.ringMount;

    const band = new THREE.Mesh(new THREE.TorusGeometry(R + BAND_TUBE, BAND_TUBE, 24, 96), metal);
    band.rotation.x = Math.PI / 2;
    band.scale.y = BAND_WIDTH / (2 * BAND_TUBE);
    mount.add(band);

    const outer = R + 2 * BAND_TUBE;
    const crownH = dims.width * 0.16;
    const pavilionH = dims.depth - crownH;
    const head = new THREE.Group();
    head.position.z = outer + pavilionH * 0.55;
    mount.add(head);

    const centreGeometry = stoneGeometry(state.shape, dims, 32);
    head.add(new THREE.Mesh(centreGeometry, stone));
    head.add(glints(centreGeometry, this.glintLights, dims.width * 0.9));

    if (setting.bezel) {
      head.add(new THREE.Mesh(rimGeometry(state.shape, dims, 1.09, 0.55), metal));
    } else if (setting.prongs) {
      const points = outline(state.shape, setting.prongs * 8);
      for (let i = 0; i < setting.prongs; i++) {
        const idx = Math.round(((i + 0.5) / setting.prongs) * points.length) % points.length;
        const [px, py] = points[idx];
        const prongH = pavilionH * 0.55 + crownH + 0.5;
        const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, prongH, 12), metal);
        prong.rotation.x = Math.PI / 2;
        prong.position.set(px * dims.width * 1.05, py * dims.length * 1.05, crownH + 0.5 - prongH / 2);
        head.add(prong);
      }
      head.add(new THREE.Mesh(rimGeometry(state.shape, dims, 0.98, 0.34, -pavilionH * 0.5), metal));
      const small = Math.min(dims.width, dims.length);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(small * 0.22, small * 0.3, pavilionH * 0.55 + 0.3, 16), metal);
      collar.rotation.x = Math.PI / 2;
      collar.position.z = -pavilionH * 0.5 - (pavilionH * 0.55 + 0.3) / 2 + 0.2;
      head.add(collar);
    }

    if (setting.halo) {
      const ringPoints = outline(state.shape, 200);
      const count = Math.max(14, Math.round((dims.length + dims.width) * 1.6));
      for (let i = 0; i < count; i++) {
        const [px, py] = ringPoints[Math.floor((i / count) * ringPoints.length)];
        const g = stoneGeometry("Round", { length: 1.3, width: 1.3, depth: 0.8 }, 12);
        const small = new THREE.Mesh(g, accent);
        small.position.set(px * (dims.width + 2.2), py * (dims.length + 2.2), crownH * 0.2);
        head.add(small);
      }
      head.add(new THREE.Mesh(rimGeometry(state.shape, dims, 1 + 2.2 / dims.width, 0.5, -0.6), metal));
    }

    if (setting.sideStones) {
      const side = stoneDimensions(state.shape, state.carat * 0.25);
      const offset = dims.width / 2 + side.width / 2 + 0.7;
      for (const dir of [-1, 1]) {
        const g = new THREE.Group();
        g.position.set(dir * offset, 0, Math.sqrt(Math.max(0, outer * outer - offset * offset)) - outer);
        g.rotation.y = Math.atan2(dir * offset, outer);
        const sg = stoneGeometry(state.shape, side, 24);
        g.add(new THREE.Mesh(sg, stone));
        g.add(glints(sg, this.glintLights, side.width * 0.8));
        g.add(new THREE.Mesh(rimGeometry(state.shape, side, 1.0, 0.28, -side.depth * 0.4), metal));
        head.add(g);
      }
    }

    if (setting.pave) {
      const radius = outer + 0.2;
      const spacing = 1.45 / radius;
      const count = Math.floor(1.25 / spacing);
      for (let i = -count; i <= count; i++) {
        const theta = i * spacing;
        if (Math.abs(theta) * radius < Math.max(dims.width, dims.length) * 0.55 + 1) continue;
        const small = new THREE.Mesh(stoneGeometry("Round", { length: 1.2, width: 1.2, depth: 0.75 }, 10), accent);
        small.position.set(Math.sin(theta) * radius, 0, Math.cos(theta) * radius);
        small.rotation.y = theta;
        mount.add(small);
      }
    }
  }

  /* Camera */

  ringWorldPosition() {
    const v = new THREE.Vector3();
    this.world.updateMatrixWorld(true);
    if (this.ringMount) this.ringMount.getWorldPosition(v);
    return v;
  }

  frameCamera() {
    const aspect = this.stage.clientWidth / Math.max(1, this.stage.clientHeight);
    this.camera.aspect = aspect;
    const target = this.ringWorldPosition();
    if (this.view === "hand") {
      this.orbit.distance = this.handLength * (aspect < 0.9 ? 1.6 : 1.25);
      target.z += this.handLength * 0.08; // centre between knuckles and palm
      target.x += this.handLength * 0.06; // and a little towards the thumb
      target.y -= 4;
    } else {
      this.orbit.distance = 52;
    }
    this.target = target;
    this.placeCamera();
  }

  placeCamera() {
    const { azimuth, polar, distance } = this.orbit;
    const t = this.target || new THREE.Vector3();
    this.camera.position.set(
      t.x + distance * Math.sin(polar) * Math.sin(azimuth),
      t.y + distance * Math.cos(polar),
      t.z + distance * Math.sin(polar) * Math.cos(azimuth),
    );
    this.camera.lookAt(t);
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const w = this.stage.clientWidth;
    const h = this.stage.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.frameCamera();
    this.requestRender();
  }

  setView(view) {
    this.view = view;
    this.orbit.azimuth = view === "hand" ? 2.75 : 2.4;
    this.orbit.polar = view === "hand" ? 0.72 : 0.8;
    this.frameCamera();
    this.reflectControls();
    this.requestRender();
  }

  /* Interaction and rendering */

  bindInteraction() {
    let dragging = null;
    this.stage.addEventListener("pointerdown", (event) => {
      dragging = { x: event.clientX, y: event.clientY, azimuth: this.orbit.azimuth, polar: this.orbit.polar };
      this.dragging = true;
      this.stage.setPointerCapture(event.pointerId);
    });
    this.stage.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const limitAzimuth = this.view === "hand" ? 1.3 : Math.PI * 4;
      this.orbit.azimuth = clamp(dragging.azimuth - (event.clientX - dragging.x) * 0.008, 2.75 - limitAzimuth, 2.75 + limitAzimuth);
      this.orbit.polar = clamp(dragging.polar + (event.clientY - dragging.y) * 0.006, 0.2, this.view === "hand" ? 1.25 : 1.15);
      this.placeCamera();
      this.requestRender();
    });
    const stop = () => {
      dragging = null;
      this.dragging = false;
    };
    this.stage.addEventListener("pointerup", stop);
    this.stage.addEventListener("pointercancel", stop);
    this.visible = true;
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
    }).observe(this.stage);
  }

  // A slow turn in the close-up view keeps the facets flashing; rendering
  // otherwise happens only on demand.
  startLoop() {
    const tick = () => {
      if (this.visible && !this.dragging && !this.reducedMotion && this.view === "closeup") {
        this.orbit.azimuth += 0.004;
        this.placeCamera();
        this.renderer.render(this.scene, this.camera);
        this.setAttribute("data-ready", "");
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  requestRender() {
    if (this.pending || !this.renderer) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      this.renderer.render(this.scene, this.camera);
      this.setAttribute("data-ready", "");
    });
  }

  showFallback() {
    this.setAttribute("data-fallback", "");
    const note = this.querySelector("[data-fallback-note]");
    if (note) note.hidden = false;
  }

  attachToEnquiry() {
    const form = document.querySelector(".enquiry-form");
    const field = form?.querySelector("[data-ring-brief-field]");
    if (!form || !field) {
      location.href = `/pages/contact?${new URLSearchParams(this.state)}`;
      return;
    }
    field.disabled = false;
    field.value = describeRing(this.state);
    const interest = form.querySelector("[data-enquiry-interest-select]");
    if (interest) {
      const option = [...interest.options].find((o) => /bespoke/i.test(o.textContent));
      if (option) interest.value = option.value;
    }
    const setting = SETTINGS.find((s) => s.id === this.state.setting) || SETTINGS[0];
    const metal = METALS.find((m) => m.id === this.state.metal) || METALS[0];
    setText(form, "[data-ring-brief-summary]", `Ring attached: ${setting.label}, ${this.state.carat.toFixed(2)} ct ${this.state.shape}, ${metal.label.toLowerCase()}, finger ${this.state.finger.toFixed(1)} mm.`);
    const context = form.querySelector("[data-ring-brief-context]");
    if (context) context.hidden = false;
    document.querySelector("#enquire")?.scrollIntoView({ behavior: "smooth" });
    form.querySelector('[autocomplete="name"]')?.focus({ preventScroll: true });
  }
}

/* Materials and geometry */

function stoneMaterial(thickness) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.0,
    transmission: 0.28,
    thickness: Math.max(0.6, thickness),
    ior: 2.4,
    envMapIntensity: 3.5,
    clearcoat: 1,
    clearcoatRoughness: 0,
    specularIntensity: 1.5,
    iridescence: 0.35,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: [200, 500],
  });
}

// A faceted stone from a 2D outline: table, crown, girdle, pavilion, culet.
function stoneGeometry(shape, dims, steps) {
  const points = outline(shape, steps);
  const crownH = dims.width * 0.16;
  const pavilionH = dims.depth - crownH;
  const ringAt = (scale, z) => points.map(([x, y]) => [x * dims.width * scale, y * dims.length * scale, z]);
  const table = ringAt(0.56, crownH);
  const girdleTop = ringAt(1, 0.25);
  const girdleBottom = ringAt(1, -0.25);
  const breakRing = ringAt(0.55, -pavilionH * 0.5);
  const culet = [0, 0, -pavilionH];
  const tri = [];
  const push = (a, b, c) => tri.push(...a, ...b, ...c);
  const centre = [0, 0, crownH];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    push(centre, table[i], table[j]);
    push(table[i], girdleTop[i], girdleTop[j]);
    push(table[i], girdleTop[j], table[j]);
    push(girdleTop[i], girdleBottom[i], girdleBottom[j]);
    push(girdleTop[i], girdleBottom[j], girdleTop[j]);
    push(girdleBottom[i], breakRing[i], breakRing[j]);
    push(girdleBottom[i], breakRing[j], girdleBottom[j]);
    push(breakRing[i], culet, breakRing[j]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Sparkle: one point per facet whose brightness follows the reflection of the
// studio lights, drawn as an additive four-point star.
function glints(geometry, lightDirections, size) {
  const pos = geometry.getAttribute("position");
  const centres = [];
  const normals = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
    const centre = a.clone().add(b).add(c).multiplyScalar(1 / 3).addScaledVector(n, 0.05);
    centres.push(centre.x, centre.y, centre.z);
    normals.push(n.x, n.y, n.z);
  }
  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.Float32BufferAttribute(centres, 3));
  points.setAttribute("facetNormal", new THREE.Float32BufferAttribute(normals, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      lights: { value: lightDirections },
      baseSize: { value: size * 6 },
    },
    vertexShader: `
      attribute vec3 facetNormal;
      uniform vec3 lights[${lightDirections.length}];
      uniform float baseSize;
      varying float vAlpha;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * facetNormal);
        vec3 v = normalize(cameraPosition - wp.xyz);
        vec3 r = reflect(-v, n);
        float s = 0.0;
        for (int i = 0; i < ${lightDirections.length}; i++) {
          s = max(s, pow(max(dot(r, lights[i]), 0.0), 90.0));
        }
        s *= smoothstep(0.0, 0.25, dot(n, v));
        vAlpha = s;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = baseSize * s * (240.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = length(p);
        float star = pow(max(0.0, 1.0 - abs(p.x)), 7.0) + pow(max(0.0, 1.0 - abs(p.y)), 7.0);
        float core = exp(-r * r * 7.0);
        float a = clamp(core + 0.7 * star * max(0.0, 1.0 - r), 0.0, 1.0) * vAlpha;
        if (a < 0.02) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a);
      }`,
  });
  return new THREE.Points(points, material);
}

// A metal rim following the outline (bezel, gallery under the stone, halo base).
function rimGeometry(shape, dims, scale, tube, z = 0) {
  const points = outline(shape, 96).map(
    ([x, y]) => new THREE.Vector3(x * dims.width * scale, y * dims.length * scale, z),
  );
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.2);
  return new THREE.TubeGeometry(curve, 96, tube, 10, true);
}

// The palm as a rounded slab: a soft trapezoid from wrist to knuckles with a
// thenar bulge on the thumb side, extruded with a bevel for rounded edges.
function palmGeometry(p) {
  const w0 = p.wristWidth / 2;
  const w1 = p.breadth / 2;
  const L = p.palmLength;
  const shape = new THREE.Shape();
  shape.moveTo(-w0, -6);
  shape.lineTo(w0 * 0.9, -6);
  shape.quadraticCurveTo(w1 * 1.25, L * 0.25, w1 * 1.02, L * 0.55); // thumb-side bulge
  shape.quadraticCurveTo(w1 * 1.02, L * 0.9, w1 * 0.92, L);
  shape.lineTo(-w1 * 0.92, L);
  shape.quadraticCurveTo(-w1 * 1.02, L * 0.6, -w0 * 1.02, L * 0.2);
  shape.quadraticCurveTo(-w0, 0, -w0, -6);
  const thickness = p.thickness;
  const bevel = thickness / 2 - 0.5;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 24,
  });
  // Shape y ran towards the fingertips; turn it to run along -Z with the
  // thickness centred on y = 0.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -(thickness - 2 * bevel) / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function disposeChildren(group) {
  while (group.children.length) {
    const child = group.children[0];
    child.traverse((node) => {
      node.geometry?.dispose();
      node.material?.dispose?.();
    });
    group.remove(child);
  }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const setText = (root, selector, text) => {
  const el = root.querySelector(selector);
  if (el) el.textContent = text;
};

// Directions of the small bright lamps in the studio, shared by the
// environment map and the glint shader so highlights and sparkles agree.
const STUDIO_LIGHT_DIRECTIONS = [
  [-0.6, 1, 0.5],
  [0.7, 0.9, 0.3],
  [0.1, 1, -0.7],
  [-0.9, 0.5, -0.4],
  [0.9, 0.35, 0.7],
  [0, 0.4, 1],
  [-0.4, 0.8, -0.9],
  [0.5, 0.2, -1],
];

// A small studio for reflections: a soft grey room, three large panels and
// a ring of small hot lamps that give the facets something to flash.
function studioEnvironment() {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0x555555, roughness: 1 }));
  room.scale.set(8, 8, 8);
  scene.add(room);
  const panel = (x, y, z, sx, sy, sz, intensity) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity) }));
    box.position.set(x, y, z);
    box.scale.set(sx, sy, sz);
    scene.add(box);
  };
  panel(-2.5, 3, 1.5, 2.2, 0.1, 1.6, 8);
  panel(2.6, 2.2, -1.5, 1.4, 0.1, 2.4, 5);
  panel(0, -3.5, 2, 3, 0.1, 1, 2);
  for (const [x, y, z] of STUDIO_LIGHT_DIRECTIONS) {
    panel(x * 3.6, y * 3.6, z * 3.6, 0.22, 0.22, 0.22, 40);
  }
  return scene;
}

if (!customElements.get("ring-visualiser"))
  customElements.define("ring-visualiser", RingVisualiser);
