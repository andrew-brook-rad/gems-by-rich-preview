// Ring visualiser: a studio ring with an optional hand outline, built from
// measurements in millimetres. See docs/superpowers/specs/2026-09-09-ring-visualiser-design.md
import * as THREE from "three";
import {
  CARAT_RANGE,
  HAND_PRESETS,
  HAND_RANGE,
  METALS,
  SETTINGS,
  SHAPES,
  describeRing,
  handProportions,
  matchingPreset,
  parseState,
  ringSizeFor,
  stoneDimensions,
  stoneOutline,
  settingContour,
  settingProfile,
} from "ring-model";

import { BAND_SECTION, bandGeometry, accentSeat } from "./ring-band.js";
import { stoneTriangles } from "./ring-stone-geometry.js";
import { gemGeometry, gemMaterial } from "./ring-gem.js";

const BAND_TUBE = BAND_SECTION.tube;
const DEG = Math.PI / 180;

class RingVisualiser extends HTMLElement {
  connectedCallback() {
    if (this.started) return;
    this.started = true;
    this.state = parseState(new URLSearchParams(location.search));
    this.view = "closeup";
    this.orbit = { azimuth: 0.28, polar: 0.32, distance: 65 };
    this.zoom = 1;
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
    this.loadStones();
  }

  // Real facet meshes arrive after the first frame; until then, and if they
  // fail to load, stones use the simpler procedural cut.
  async loadStones() {
    const url = this.dataset.stones;
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      this.stones = await response.json();
    } catch (error) {
      return;
    }
    if (!this.isConnected || !this.renderer) return;
    this.rebuild();
    this.requestRender();
  }

  /* Controls */

  buildControls() {
    const groups = {
      shape: SHAPES.map((s) => [s, s === "Round" ? "Round brilliant" : s]),
      setting: SETTINGS.map((s) => [s.id, s.label]),
      metal: METALS.map((m) => [m.id, m.label, m.color]),
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
    setText(this, ".visualiser__hint", this.view === "hand" ? "Hand outline · Approximate scale" : "Drag to rotate · Pinch to zoom");
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
    this.scene.background = new THREE.Color(0x191c1b);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const studio = studioEnvironment();
    this.environmentTarget = pmrem.fromScene(studio, 0.01);
    this.scene.environment = this.environmentTarget.texture;
    pmrem.dispose();
    // The gems trace rays into a sharp, high-range copy of the same studio so
    // each facet flashes a distinct lamp rather than a blurred average.
    this.gemEnvironment = new THREE.WebGLCubeRenderTarget(256, {
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    new THREE.CubeCamera(0.1, 100, this.gemEnvironment).update(this.renderer, studio);
    disposeChildren(studio);
    this.gemLibrary = new Map();
    this.camera = new THREE.PerspectiveCamera(28, 1, 1, 3000);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-120, 260, 160);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(160, 120, -220);
    this.scene.add(rim);
    this.scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x62503a, 0.65));
    for (const [i, direction] of STUDIO_LIGHT_DIRECTIONS.entries()) {
      if (i % 3 !== 0) continue;
      const lamp = new THREE.DirectionalLight(i % 3 === 0 ? 0xffedcf : 0xeaf2ff, 0.45);
      lamp.position.set(...direction).multiplyScalar(150);
      this.scene.add(lamp);
    }
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

  // One unit-width facet mesh and ray-tracing material per shape, scaled per
  // stone. Every shape keeps fixed proportions so the cache never goes stale.
  gemFor(shape, dims) {
    if (!this.stones) return null;
    let gem = this.gemLibrary.get(shape);
    if (!gem) {
      const unit = { width: 1, length: dims.length / dims.width, depth: dims.depth / dims.width };
      const geometry = gemGeometry(THREE, stoneTriangles(this.stones, shape, unit, 0.16));
      const material = gemMaterial(THREE, geometry, this.gemEnvironment.texture);
      gem = { geometry, material };
      this.gemLibrary.set(shape, gem);
    }
    return gem;
  }

  /* Hand */

  buildHand() {
    const p = handProportions(this.state);
    const hand = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-p.wristWidth / 2, -12);
    shape.bezierCurveTo(-p.breadth * 0.57, p.palmLength * 0.35, -p.breadth * 0.53, p.palmLength * 0.8, p.fingers[0].base.x - p.fingers[0].width / 2, p.fingers[0].base.y);
    for (const f of p.fingers) {
      const angle = f.spread * DEG;
      const dx = Math.sin(angle), dy = Math.cos(angle), r = f.width / 2;
      const x = f.base.x + dx * (f.length - r), y = f.base.y + dy * (f.length - r);
      shape.lineTo(x - dy * r, y + dx * r);
      shape.bezierCurveTo(x - dy * r + dx * r * 1.4, y + dx * r + dy * r * 1.4, x + dy * r + dx * r * 1.4, y - dx * r + dy * r * 1.4, x + dy * r, y - dx * r);
      shape.lineTo(f.base.x + dy * r, f.base.y - dx * r);
    }
    const t = p.thumb, tx = t.base.x + Math.sin(t.angle * DEG) * t.length, ty = t.base.y + Math.cos(t.angle * DEG) * t.length;
    shape.quadraticCurveTo(p.breadth * 0.48, p.palmLength * 0.42, tx - t.width * 0.35, ty + t.width * 0.4);
    shape.bezierCurveTo(tx + t.width * 0.5, ty + t.width, tx + t.width, ty - t.width * 0.3, tx + t.width * 0.25, ty - t.width * 0.55);
    shape.quadraticCurveTo(p.breadth * 0.55, p.palmLength * 0.16, p.wristWidth / 2, -12);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(shape.getPoints(12).map(v => new THREE.Vector3(v.x, 0, -v.y))), new THREE.LineBasicMaterial({ color: 0xc2b7a2, transparent: true, opacity: 0.65 }));
    hand.add(line);
    this.world.add(hand);
    hand.visible = this.view === "hand";
    const f = p.fingers.find(f => f.id === "ring");
    this.ringMount = new THREE.Group();
    const along = f.length * 0.22;
    this.ringMount.position.set(f.base.x + Math.sin(f.spread * DEG) * along, 0, -f.base.y - Math.cos(f.spread * DEG) * along);
    this.ringMount.rotation.set(-Math.PI / 2, 0, f.spread * DEG);
    this.world.add(this.ringMount);
    this.buildRing(f.width / 2 + 0.35);
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
    const mount = this.ringMount;

    const band = new THREE.Mesh(bandGeometry(THREE, R), metal);
    band.name = "shank";
    mount.add(band);

    const profile = settingProfile(dims, R);
    const { outer, crown: crownH, pavilion: pavilionH } = profile;
    const head = new THREE.Group();
    head.position.z = profile.girdle;
    mount.add(head);
    this.head = head;

    const addDiamond = (host, shape, dimensions) => {
      const gem = this.gemFor(shape, dimensions);
      if (gem) {
        const mesh = new THREE.Mesh(gem.geometry, gem.material);
        mesh.scale.setScalar(dimensions.width);
        mesh.userData.shared = true;
        mesh.add(glints(gem.geometry, this.glintLights, dimensions.width));
        host.add(mesh);
        return;
      }
      const geometry = stoneGeometry(shape, dimensions, 32);
      host.add(new THREE.Mesh(geometry, stone));
      host.add(glints(geometry, this.glintLights, dimensions.width));
    };
    const addBasket = (host, shape, dimensions, prongs = 4) => {
      const seat = settingProfile(dimensions, R);
      host.add(new THREE.Mesh(rimGeometry(shape, dimensions, seat.galleryScale, 0.18, seat.galleryZ, 0.23), metal));
      const contour = settingContour(shape, dimensions, 0.19);
      for (let i = 0; i < prongs; i++) {
        const index = Math.round((i + 0.5) / prongs * contour.length) % contour.length;
        const [x, y] = contour[index];
        const tipZ = Math.min(0.14, seat.crown * 0.3);
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x * 0.63, y * 0.63, seat.galleryZ),
          new THREE.Vector3(x, y, -0.12),
          new THREE.Vector3(x, y, tipZ),
        ]);
        host.add(new THREE.Mesh(new THREE.TubeGeometry(path, 16, 0.20, 8, false), metal));
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), metal);
        tip.position.set(x, y, tipZ);
        host.add(tip);
      }
    };
    addDiamond(head, state.shape, dims);
    // Open shoulder struts meet the gallery from outside the pavilion.
    for (const sign of [-1, 1]) {
      const x = Math.min(outer * 0.72, dims.width * 0.5 + 1.6);
      const z = Math.sqrt(Math.max(0, (R + BAND_TUBE) ** 2 - x ** 2));
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * x, 0, z),
        new THREE.Vector3(sign * (dims.width * 0.37 + 0.45), 0, profile.girdle - pavilionH * 0.8),
        new THREE.Vector3(sign * (dims.width * 0.30 + 0.23), 0, profile.girdle + profile.galleryZ),
      ]);
      mount.add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.28, 10, false), metal));
    }
    if (setting.bezel) {
      head.add(new THREE.Mesh(rimGeometry(state.shape, dims, 1, 0.24, 0, 0.26), metal));
      head.add(new THREE.Mesh(rimGeometry(state.shape, dims, profile.galleryScale, 0.20, profile.galleryZ, 0.23), metal));
      // Slim basket posts support the bezel without a solid cup under the stone.
      addBasket(head, state.shape, dims, 4);
    } else {
      addBasket(head, state.shape, dims, setting.prongs);
    }

    if (setting.halo || setting.hiddenHalo) {
      const hidden = setting.hiddenHalo;
      const size = hidden ? 0.75 : 1.15;
      const scale = hidden ? profile.galleryScale : 1;
      const clearance = hidden ? 0.72 : 1.02;
      const z = hidden ? profile.galleryZ : -0.10;
      const curve = new THREE.CatmullRomCurve3(settingContour(state.shape, dims, clearance, scale).map(([x, y]) => new THREE.Vector3(x, y, z)), true, "centripetal");
      const count = Math.floor(curve.getLength() / (size + 0.24));
      const positions = [];
      for (const point of curve.getSpacedPoints(count).slice(0, -1)) {
        if (positions.every(other => other.distanceTo(point) >= size + 0.12)) positions.push(point);
      }
      positions.forEach(position => {
        const small = new THREE.Group();
        small.position.copy(position);
        addDiamond(small, "Round", { width: size, length: size, depth: size * 0.61 });
        head.add(small);
      });
      head.add(new THREE.Mesh(rimGeometry(state.shape, dims, scale, 0.23, z - size * 0.52, clearance), metal));
    }

    if (setting.sideStones) {
      const side = stoneDimensions("Round", state.carat * 0.18);
      const offset = dims.width / 2 + side.width / 2 + 0.75;
      for (const dir of [-1, 1]) {
        const group = new THREE.Group();
        group.position.set(dir * offset, 0, -0.45);
        addDiamond(group, "Round", side);
        addBasket(group, "Round", side);
        head.add(group);
        const support = new THREE.CatmullRomCurve3([
          new THREE.Vector3(dir * Math.min(offset, outer * 0.86), 0, outer * 0.5),
          new THREE.Vector3(dir * offset, 0, profile.girdle - side.depth - 0.7),
          new THREE.Vector3(dir * (offset + side.width * 0.3 + 0.5), 0, profile.girdle - 0.45 + settingProfile(side, R).galleryZ),
        ]);
        mount.add(new THREE.Mesh(new THREE.TubeGeometry(support, 16, 0.25, 8, false), metal));
      }
    }

    if (setting.pave) {
      // Each accent sits above the surface, with its own metal seat. Spacing
      // uses arc length and stone diameter so neighbours cannot intersect.
      const startX = dims.width / 2 + (setting.halo ? 2.2 : 0.8);
      let theta = Math.asin(Math.min(0.92, startX / outer));
      for (let i = 0; theta < 1.40; i++) {
        const size = setting.graduated ? Math.max(0.85, 1.65 - i * 0.16) : 1.15;
        const seat = accentSeat(R, size);
        const radius = seat.radius;
        for (const dir of [-1, 1]) {
          const group = new THREE.Group();
          group.name = "shoulder-diamond";
          group.userData.diameter = size;
          group.position.set(dir * Math.sin(theta) * radius, 0, Math.cos(theta) * radius);
          group.rotation.y = dir * theta;
          const dimensions = { width: size, length: size, depth: size * 0.61 };
          addDiamond(group, "Round", dimensions);
          const rim = new THREE.Mesh(new THREE.TorusGeometry(seat.rimRadius, seat.rimTube, 8, 32), metal);
          rim.position.z = seat.rimZ;
          group.add(rim);
          // Supports stay outside the pavilion, down to the band's surface.
          for (const side of [-1, 1]) {
            const baseY = side * seat.baseY;
            const surface = R + BAND_TUBE + BAND_TUBE * Math.sqrt(1 - (baseY / (BAND_SECTION.width / 2)) ** 2);
            const base = new THREE.Vector3(0, baseY, surface - radius - 0.04);
            const top = new THREE.Vector3(0, side * seat.rimRadius, seat.rimZ);
            const direction = top.clone().sub(base);
            const post = new THREE.Mesh(new THREE.CylinderGeometry(seat.postRadius, seat.postRadius, direction.length(), 8), metal);
            post.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
            post.position.copy(base).add(top).multiplyScalar(0.5);
            group.add(post);
          }
          mount.add(group);
        }
        theta += (size + 0.28) / radius;
      }
    }
  }

  /* Camera */

  ringWorldPosition() {
    const v = new THREE.Vector3();
    this.world.updateMatrixWorld(true);
    if (this.head) this.head.getWorldPosition(v);
    return v;
  }

  frameCamera() {
    if (!this.ringMount) return;
    const aspect = this.stage.clientWidth / Math.max(1, this.stage.clientHeight);
    this.camera.aspect = aspect;
    const target = this.ringWorldPosition();
    if (this.view === "hand") {
      target.set(0, 0, -this.handLength * 0.46);
      this.orbit.distance = this.handLength * 3.4 / Math.min(1, aspect);
    } else {
      const bounds = new THREE.Box3().setFromObject(this.ringMount);
      bounds.getCenter(target);
      // Allow space for view buttons and the caption at every screen width.
      const size = bounds.getSize(new THREE.Vector3());
      const frame = Math.max(size.x / Math.min(1, aspect), size.z, size.y * 0.65);
      this.orbit.distance = frame / (2 * Math.tan(14 * DEG)) * 1.6 / this.zoom;
      target.y += size.y * 0.18;
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
    this.orbit.azimuth = view === "hand" ? 0 : 0.28;
    this.orbit.polar = view === "hand" ? 0.01 : view === "top" ? 0.01 : 0.32;
    this.zoom = 1;
    if (!this.renderer) return;
    this.hand.visible = view === "hand";
    this.frameCamera();
    this.reflectControls();
    this.requestRender();
  }

  /* Interaction and rendering */

  bindInteraction() {
    const canvas = this.querySelector("canvas");
    const pointers = new Map();
    let previous = null;
    canvas.addEventListener("pointerdown", event => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.dragging = true;
      previous = null;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId)) return;
      const old = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (previous && this.view !== "hand") {
          this.zoom = clamp(this.zoom * distance / previous, 0.7, 1.8);
          this.frameCamera();
        }
        previous = distance;
      } else if (this.view !== "hand") {
        this.orbit.azimuth -= (event.clientX - old.x) * 0.008;
        this.orbit.polar = clamp(this.orbit.polar + (event.clientY - old.y) * 0.006, 0.01, 1.48);
        this.placeCamera();
      }
      this.requestRender();
    });
    const stop = event => {
      pointers.delete(event.pointerId);
      previous = null;
      this.dragging = pointers.size > 0;
    };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    canvas.addEventListener("lostpointercapture", stop);
    canvas.addEventListener("wheel", event => {
      if (this.view === "hand") return;
      event.preventDefault();
      this.zoom = clamp(this.zoom * Math.exp(-event.deltaY * 0.001), 0.7, 1.8);
      this.frameCamera();
      this.requestRender();
    }, { passive: false });
    canvas.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "Home"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") return this.setView("closeup");
      if (this.view === "hand") return;
      if (event.key === "+" || event.key === "-") this.zoom = clamp(this.zoom + (event.key === "+" ? 0.1 : -0.1), 0.7, 1.8);
      else if (event.key === "ArrowLeft" || event.key === "ArrowRight") this.orbit.azimuth += event.key === "ArrowLeft" ? 0.12 : -0.12;
      else this.orbit.polar = clamp(this.orbit.polar + (event.key === "ArrowUp" ? -0.08 : 0.08), 0.01, 1.48);
      this.frameCamera();
      this.requestRender();
    });
    this.visible = true;
    this.intersectionObserver = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; });
    this.intersectionObserver.observe(this.stage);
  }

  // Animate the studio reflections gently, keeping the chosen camera still.
  startLoop() {
    let last = 0;
    const tick = now => {
      if (!this.isConnected) return;
      if (this.visible && !document.hidden && !this.dragging && !this.reducedMotion && this.view !== "hand" && now - last > 32) {
        last = now;
        this.world.traverse(node => {
          if (node.material?.uniforms?.time) node.material.uniforms.time.value = now / 1000;
        });
        this.renderer.render(this.scene, this.camera);
        this.setAttribute("data-ready", "");
      }
      this.animation = requestAnimationFrame(tick);
    };
    this.animation = requestAnimationFrame(tick);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.animation);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (this.world) disposeChildren(this.world);
    for (const gem of this.gemLibrary?.values() || []) {
      gem.geometry.dispose();
      gem.material.dispose();
    }
    this.environmentTarget?.dispose();
    this.gemEnvironment?.dispose();
    this.renderer?.dispose();
  }

  requestRender() {
    if (this.pending || !this.renderer) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      if (!this.isConnected) return;
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
    transmission: 0.94,
    thickness: Math.max(0.15, thickness * 0.08),
    ior: 2.4,
    envMapIntensity: 1.8,
    clearcoat: 1,
    clearcoatRoughness: 0,
    specularIntensity: 1.5,
    dispersion: 0.08,
    iridescence: 0.10,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: [200, 500],
  });
}

// A faceted stone from a 2D outline: table, crown, girdle, pavilion, culet.
function stoneGeometry(shape, dims, steps) {
  const points = stoneOutline(shape, steps);
  const crownH = dims.width * 0.16;
  const pavilionH = dims.depth - crownH;
  const ringAt = (scale, z) => points.map(([x, y]) => [x * dims.width * scale, y * dims.length * scale, z]);
  const table = ringAt(0.56, crownH);
  const girdleTop = ringAt(1, Math.min(0.08, crownH * 0.15));
  const girdleBottom = ringAt(1, -Math.min(0.08, crownH * 0.15));
  const breakRing = ringAt(0.55, -pavilionH * 0.5);
  const culet = [0, 0, -pavilionH];
  const tri = [];
  const push = (a, b, c) => tri.push(...a, ...b, ...c);
  const centre = [0, 0, crownH];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    push(centre, table[i], table[j]);
    const mid = [(table[i][0] + table[j][0] + girdleTop[i][0] + girdleTop[j][0]) / 4 * 1.06,
      (table[i][1] + table[j][1] + girdleTop[i][1] + girdleTop[j][1]) / 4 * 1.06, crownH * (i % 2 ? 0.42 : 0.58)];
    push(table[i], girdleTop[i], mid);
    push(girdleTop[i], girdleTop[j], mid);
    push(girdleTop[j], table[j], mid);
    push(table[j], table[i], mid);
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
    if (n.z < 0.1 || n.z > 0.99) continue;
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
      baseSize: { value: Math.min(26, size * 4) },
      time: { value: 0 },
    },
    vertexShader: `
      attribute vec3 facetNormal;
      uniform vec3 lights[${lightDirections.length}];
      uniform float baseSize;
      uniform float time;
      varying float vAlpha;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * facetNormal);
        vec3 v = normalize(cameraPosition - wp.xyz);
        vec3 r = reflect(-v, n);
        float s = 0.0;
        for (int i = 0; i < ${lightDirections.length}; i++) {
          s = max(s, pow(max(dot(r, normalize(lights[i] + vec3(sin(time * 0.65 + float(i)) * 0.09, 0.0, cos(time * 0.55 + float(i)) * 0.09))), 0.0), 38.0));
        }
        s *= smoothstep(0.0, 0.25, dot(n, v));
        s *= 0.45 + 0.55 * pow(0.5 + 0.5 * sin(time * 1.8 + position.x * 7.0 + position.y * 11.0), 4.0);
        vAlpha = s * 0.85;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(baseSize * sqrt(s) * (65.0 / -mv.z), 1.0, 42.0);
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
function rimGeometry(shape, dims, scale, tube, z = 0, clearance = 0) {
  const points = settingContour(shape, dims, clearance, scale).map(([x, y]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  return new THREE.TubeGeometry(curve, 128, tube, 8, true);
}

function disposeChildren(group) {
  while (group.children.length) {
    const child = group.children[0];
    child.traverse((node) => {
      if (node.userData.shared) return;
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
  [-0.2, 1, 0.15],
  [0.3, 1, -0.2],
  [-1, 0.25, 0.2],
  [1, 0.6, -0.2],
];

// A small studio for reflections: a graded room that is bright above and
// dim below, three large soft panels, and a ring of hot lamps. Crown facets
// pick up the bright ceiling and lamps while pavilion facets return the dark
// floor, which is the contrast a cut stone needs to read as a diamond.
function studioEnvironment() {
  const scene = new THREE.Scene();
  const room = new THREE.SphereGeometry(8, 48, 24);
  const positions = room.getAttribute("position");
  const colours = [];
  const smooth = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  for (let i = 0; i < positions.count; i++) {
    const height = positions.getY(i) / 8;
    const value = height < 0 ? 0.04 + 0.14 * smooth(-1, 0, height) : 0.18 + 0.42 * smooth(0, 1, height);
    colours.push(value, value * 0.995, value * 0.98);
  }
  room.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  scene.add(new THREE.Mesh(room, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
  const panel = (x, y, z, sx, sy, sz, intensity) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity) }));
    box.position.set(x, y, z);
    box.scale.set(sx, sy, sz);
    scene.add(box);
  };
  panel(-2.5, 3, 1.5, 2.6, 0.1, 2.0, 5);
  panel(2.6, 2.2, -1.5, 1.8, 0.1, 2.8, 3.5);
  panel(0, -3.5, 2, 3, 0.1, 1, 1.2);
  for (const [x, y, z] of STUDIO_LIGHT_DIRECTIONS) {
    panel(x * 3.6, y * 3.6, z * 3.6, 0.4, 0.4, 0.4, 22);
  }
  return scene;
}

if (!customElements.get("ring-visualiser"))
  customElements.define("ring-visualiser", RingVisualiser);
