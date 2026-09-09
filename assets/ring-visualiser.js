// Ring visualiser: a procedural 3D ring drawn over a calibrated hand
// photograph. Units are millimetres. See docs/superpowers/specs/2026-09-09-ring-visualiser-design.md
import * as THREE from "three";
import {
  CARAT_RANGE,
  METALS,
  RING_SIZES,
  SETTINGS,
  SHAPES,
  describeRing,
  outline,
  parseState,
  stoneDimensions,
} from "ring-model";

const BAND_TUBE = 0.9; // half the band thickness
const BAND_WIDTH = 2.1; // along the finger

class RingVisualiser extends HTMLElement {
  connectedCallback() {
    if (this.started) return;
    this.started = true;
    this.state = parseState(new URLSearchParams(location.search));
    this.view = "hand";
    this.rotation = { x: 0, y: 0 };
    this.calibration = {
      x: Number(this.dataset.fingerX) / 100,
      y: Number(this.dataset.fingerY) / 100,
      width: Number(this.dataset.fingerWidth) / 100,
      angle: (Number(this.dataset.fingerAngle) * Math.PI) / 180,
    };
    this.stage = this.querySelector("[data-stage]");
    this.photo = this.querySelector("[data-hand-photo]");
    this.buildControls();
    this.reflectControls();
    try {
      this.initScene();
    } catch (error) {
      this.showFallback();
      return;
    }
    this.buildRing();
    this.bindInteraction();
    this.requestRender();
  }

  /* Controls */

  buildControls() {
    const groups = {
      shape: SHAPES.map((s) => [s, s]),
      setting: SETTINGS.map((s) => [s.id, s.label]),
      metal: METALS.map((m) => [m.id, m.label]),
      size: RING_SIZES.map((r) => [r.id, r.label]),
    };
    for (const [key, options] of Object.entries(groups)) {
      const host = this.querySelector(`[data-options="${key}"]`);
      if (!host) continue;
      host.innerHTML = options
        .map(
          ([value, label]) =>
            `<button type="button" role="radio" data-set="${key}" data-value="${value}" aria-checked="false"${
              key === "metal" ? ` style="--swatch:${METALS.find((m) => m.id === value).color}"` : ""
            }>${label}</button>`,
        )
        .join("");
    }
    const carat = this.querySelector("[data-carat]");
    if (carat) {
      carat.min = CARAT_RANGE.min;
      carat.max = CARAT_RANGE.max;
      carat.step = CARAT_RANGE.step;
    }
    this.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-set], button[data-view], button[data-attach]");
      if (!button) return;
      if (button.dataset.set) {
        const key = button.dataset.set;
        this.state[key] = key === "carat" ? Number(button.dataset.value) : button.dataset.value;
        this.update();
      } else if (button.dataset.view) {
        this.setView(button.dataset.view);
      } else if (button.hasAttribute("data-attach")) {
        this.attachToEnquiry();
      }
    });
    this.addEventListener("input", (event) => {
      if (event.target.matches("[data-carat]")) {
        this.state.carat = Math.round(Number(event.target.value) * 100) / 100;
        this.update();
      }
    });
  }

  reflectControls() {
    for (const key of ["shape", "setting", "metal", "size"]) {
      this.querySelectorAll(`[data-set="${key}"]`).forEach((button) => {
        button.setAttribute("aria-checked", String(button.dataset.value === this.state[key]));
      });
    }
    const carat = this.querySelector("[data-carat]");
    if (carat && Number(carat.value) !== this.state.carat) carat.value = this.state.carat;
    const dims = stoneDimensions(this.state.shape, this.state.carat);
    const readout = this.querySelector("[data-carat-readout]");
    if (readout) readout.textContent = `${this.state.carat.toFixed(2)} ct · about ${dims.length.toFixed(1)} × ${dims.width.toFixed(1)} mm`;
    const summary = this.querySelector("[data-summary]");
    if (summary) summary.textContent = describeRing(this.state);
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
      this.buildRing();
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
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.localClippingEnabled = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(roomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(20, 1, 1, 4000);
    // The orient group follows the finger's angle in the photograph; the ring
    // group inside it carries the visitor's drag rotation.
    this.orient = new THREE.Group();
    this.orient.rotation.z = this.calibration.angle;
    this.scene.add(this.orient);
    this.ringGroup = new THREE.Group();
    this.orient.add(this.ringGroup);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-60, 120, 220);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(120, -40, 160);
    this.scene.add(fill);
    this.clip = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.6);
    this.buildHandPlane();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.stage);
    this.resize();
  }

  buildHandPlane() {
    const loader = new THREE.TextureLoader();
    loader.load(this.photo.currentSrc || this.photo.src, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const image = texture.image;
      this.handAspect = image.height / image.width;
      this.handTexture = texture;
      const geometry = new THREE.PlaneGeometry(1, this.handAspect);
      this.handPlane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
      this.scene.add(this.handPlane);
      this.photo.hidden = true;
      this.layoutHand();
      this.requestRender();
    });
  }

  // Scale the photograph so the calibrated finger width equals the chosen ring's inner diameter.
  layoutHand() {
    if (!this.handPlane) return;
    const size = RING_SIZES.find((r) => r.id === this.state.size) || RING_SIZES[1];
    const mmPerImageWidth = size.diameter / this.calibration.width;
    const planeW = mmPerImageWidth;
    const planeH = planeW * this.handAspect;
    this.handPlane.scale.set(planeW, planeH, 1);
    // Finger base at the origin: shift the plane so that point lands on (0, 0).
    this.handPlane.position.set(
      (0.5 - this.calibration.x) * planeW,
      (this.calibration.y - 0.5) * planeH,
      -BAND_TUBE - 0.2,
    );
    this.handPlane.rotation.z = 0;
    this.handPlane.visible = this.view === "hand";
    this.planeH = planeH;
    this.frameCamera();
  }

  frameCamera() {
    const aspect = this.stage.clientWidth / Math.max(1, this.stage.clientHeight);
    this.camera.aspect = aspect;
    const fov = (this.camera.fov * Math.PI) / 180;
    if (this.view === "hand" && this.planeH) {
      // Frame a window around the ring finger: about 78 mm tall, centred a
      // little above the ring so the finger and knuckles give scale.
      const windowH = 78;
      const windowW = windowH * aspect;
      const distance = Math.max(windowH, windowW / aspect) / 2 / Math.tan(fov / 2);
      this.camera.position.set(0, 10, distance);
      this.camera.lookAt(0, 10, 0);
    } else {
      const size = RING_SIZES.find((r) => r.id === this.state.size) || RING_SIZES[1];
      const span = size.diameter + 2 * BAND_TUBE + 6;
      const distance = span / 2 / Math.tan(fov / 2) / Math.min(1, aspect) * 1.15;
      this.camera.position.set(0, 0, distance);
      this.camera.lookAt(0, 0, 0);
    }
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
    this.ringGroup.rotation.set(0, 0, 0);
    this.rotation = { x: 0, y: 0 };
    this.scene.background.set(view === "hand" ? 0x111111 : 0x0e0e0e);
    this.orient.rotation.z = view === "hand" ? this.calibration.angle : 0;
    if (this.handPlane) this.handPlane.visible = view === "hand";
    this.buildRing();
    this.frameCamera();
    this.reflectControls();
    this.requestRender();
  }

  /* Ring */

  buildRing() {
    disposeChildren(this.ringGroup);
    const state = this.state;
    const size = RING_SIZES.find((r) => r.id === state.size) || RING_SIZES[1];
    const setting = SETTINGS.find((s) => s.id === state.setting) || SETTINGS[0];
    const metalDef = METALS.find((m) => m.id === state.metal) || METALS[0];
    const dims = stoneDimensions(state.shape, state.carat);
    const R = size.diameter / 2; // inner radius
    const clipping = this.view === "hand" ? [this.clip] : [];
    const metal = new THREE.MeshStandardMaterial({
      color: metalDef.color,
      metalness: 1,
      roughness: 0.24,
      envMapIntensity: 1.3,
      clippingPlanes: clipping,
    });
    const stone = stoneMaterial(dims.depth);
    const accent = stoneMaterial(1.2);

    // Band: a torus around the finger axis (Y), flattened along the finger.
    const band = new THREE.Mesh(new THREE.TorusGeometry(R + BAND_TUBE, BAND_TUBE, 24, 96), metal);
    band.rotation.x = Math.PI / 2;
    band.scale.y = BAND_WIDTH / (2 * BAND_TUBE);
    this.ringGroup.add(band);

    const outer = R + 2 * BAND_TUBE; // top surface of the band
    const crownH = dims.width * 0.16;
    const pavilionH = dims.depth - crownH;
    const head = new THREE.Group();
    // The pavilion sinks partly into the head so the stone sits low on the band.
    head.position.z = outer + pavilionH * 0.55;
    this.ringGroup.add(head);

    // Centre stone
    const centre = new THREE.Mesh(stoneGeometry(state.shape, dims, 32), stone);
    head.add(centre);

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
      // A collar joining the head to the band.
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(dims.width, dims.length) * 0.22, Math.min(dims.width, dims.length) * 0.3, pavilionH * 0.55 + 0.3, 16), metal);
      collar.rotation.x = Math.PI / 2;
      collar.position.z = -pavilionH * 0.5 - (pavilionH * 0.55 + 0.3) / 2 + 0.2;
      head.add(collar);
    }

    if (setting.halo) {
      const ringPoints = outline(state.shape, 200);
      const count = Math.max(14, Math.round((dims.length + dims.width) * 1.6));
      for (let i = 0; i < count; i++) {
        const [px, py] = ringPoints[Math.floor((i / count) * ringPoints.length)];
        const small = new THREE.Mesh(stoneGeometry("Round", { length: 1.3, width: 1.3, depth: 0.8 }, 12), accent);
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
        const angle = Math.atan2(dir * offset, outer);
        g.position.set(dir * offset, 0, Math.sqrt(Math.max(0, outer * outer - offset * offset)) - outer);
        g.rotation.y = angle;
        g.add(new THREE.Mesh(stoneGeometry(state.shape, side, 24), stone));
        g.add(new THREE.Mesh(rimGeometry(state.shape, side, 1.0, 0.28, -side.depth * 0.4), metal));
        head.add(g);
      }
    }

    if (setting.pave) {
      const radius = outer + 0.2;
      const spacing = 1.45 / radius; // radians between 1.2 mm stones
      const count = Math.floor(1.25 / spacing);
      for (let i = -count; i <= count; i++) {
        const theta = i * spacing;
        if (Math.abs(theta) * radius < Math.max(dims.width, dims.length) * 0.55 + 1) continue; // leave room for the head
        const small = new THREE.Mesh(stoneGeometry("Round", { length: 1.2, width: 1.2, depth: 0.75 }, 10), accent);
        small.position.set(Math.sin(theta) * radius, 0, Math.cos(theta) * radius);
        small.rotation.y = theta;
        this.ringGroup.add(small);
      }
    }

    // Slight resting tilt so light catches the facets in the hand view.
    this.ringGroup.rotation.x = this.rotation.x;
    this.ringGroup.rotation.y = this.rotation.y;
  }

  /* Interaction and rendering */

  bindInteraction() {
    let dragging = null;
    const limit = () => (this.view === "hand" ? { x: 0.45, y: 0.6 } : { x: Math.PI, y: Math.PI });
    this.stage.addEventListener("pointerdown", (event) => {
      dragging = { x: event.clientX, y: event.clientY, rx: this.rotation.x, ry: this.rotation.y };
      this.stage.setPointerCapture(event.pointerId);
    });
    this.stage.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const l = limit();
      this.rotation.y = clamp(dragging.ry + (event.clientX - dragging.x) * 0.01, -l.y, l.y);
      this.rotation.x = clamp(dragging.rx + (event.clientY - dragging.y) * 0.01, -l.x, l.x);
      this.ringGroup.rotation.set(this.rotation.x, this.rotation.y, 0);
      this.requestRender();
    });
    const stop = () => (dragging = null);
    this.stage.addEventListener("pointerup", stop);
    this.stage.addEventListener("pointercancel", stop);
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
    const summary = form.querySelector("[data-ring-brief-summary]");
    if (summary) {
      const setting = SETTINGS.find((s) => s.id === this.state.setting) || SETTINGS[0];
      const metal = METALS.find((m) => m.id === this.state.metal) || METALS[0];
      summary.textContent = `Ring attached: ${setting.label}, ${this.state.carat.toFixed(2)} ct ${this.state.shape}, ${metal.label.toLowerCase()}.`;
    }
    const context = form.querySelector("[data-ring-brief-context]");
    if (context) context.hidden = false;
    document.querySelector("#enquire")?.scrollIntoView({ behavior: "smooth" });
    form.querySelector('[autocomplete="name"]')?.focus({ preventScroll: true });
  }
}

/* Geometry helpers */

function stoneMaterial(thickness) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf8f9ff,
    metalness: 0,
    roughness: 0.02,
    transmission: 0.45,
    thickness: Math.max(0.6, thickness),
    ior: 2.4,
    envMapIntensity: 3.2,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1.2,
    iridescence: 0.25,
    iridescenceIOR: 1.8,
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
    push(centre, table[i], table[j]); // table fan
    push(table[i], girdleTop[i], girdleTop[j]); // crown facets
    push(table[i], girdleTop[j], table[j]);
    push(girdleTop[i], girdleBottom[i], girdleBottom[j]); // girdle
    push(girdleTop[i], girdleBottom[j], girdleTop[j]);
    push(girdleBottom[i], breakRing[i], breakRing[j]); // upper pavilion
    push(girdleBottom[i], breakRing[j], girdleBottom[j]);
    push(breakRing[i], culet, breakRing[j]); // lower pavilion
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// A metal rim following the outline (bezel, gallery under the stone, halo base).
function rimGeometry(shape, dims, scale, tube, z = 0) {
  const points = outline(shape, 96).map(
    ([x, y]) => new THREE.Vector3(x * dims.width * scale, y * dims.length * scale, z),
  );
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.2);
  return new THREE.TubeGeometry(curve, 96, tube, 10, true);
}

function disposeChildren(group) {
  while (group.children.length) {
    const child = group.children[0];
    child.traverse((node) => {
      node.geometry?.dispose();
      if (node.material && !node.material.__shared) node.material.dispose?.();
    });
    group.remove(child);
  }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A small studio environment for reflections, after three.js's RoomEnvironment (MIT).
function roomEnvironment() {
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry();
  geometry.deleteAttribute("uv");
  const room = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0x9a9a9a, roughness: 1 }));
  room.position.y = -0.2;
  room.scale.set(6, 6, 6);
  scene.add(room);
  const light = (x, y, z, sx, sy, sz, intensity) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity) }));
    box.position.set(x, y, z);
    box.scale.set(sx, sy, sz);
    scene.add(box);
  };
  light(-2, 1.5, 2, 1.2, 0.1, 1.2, 12); // key overhead
  light(2, 2.2, -1, 0.8, 0.1, 2, 6);
  light(0, -2.5, 2.4, 2.4, 0.1, 0.6, 3);
  light(-2.9, 0.4, 0, 0.1, 1.2, 1.6, 4);
  light(2.9, -0.2, 0.8, 0.1, 1.4, 1.2, 4);
  light(0.4, 2.9, 0.6, 0.6, 0.1, 0.6, 20); // a small hot spot for sparkle
  return scene;
}

if (!customElements.get("ring-visualiser"))
  customElements.define("ring-visualiser", RingVisualiser);
