import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

const GRAPH_THEME = {
  dark: {
    backgroundHex: 0x080810,
    fogHex: 0x080810,
    ambientIntensity: 0.56,
    directionalIntensity: 0.9,
    starColor: 0x7f84c7,
    edgeColor: 0x3c4278,
    pulseColor: 0x9ea6ff,
    nodeColor: 0xaeb7ff,
    nodeEmissive: 0x6977ff,
    selectedColor: 0xffffff,
    selectedEmissive: 0xc9d0ff,
  },
  light: {
    backgroundHex: 0xeef3ff,
    fogHex: 0xeef3ff,
    ambientIntensity: 0.75,
    directionalIntensity: 1.05,
    starColor: 0x7b8ecc,
    edgeColor: 0x8ca0dc,
    pulseColor: 0x4d63c9,
    nodeColor: 0x4f66d8,
    nodeEmissive: 0x93a5ff,
    selectedColor: 0x233fc5,
    selectedEmissive: 0x95a8ff,
  },
};

export function GraphView({
  notes,
  selectedNoteId,
  onSelectNote,
  theme = "dark",
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const palette = theme === "light" ? GRAPH_THEME.light : GRAPH_THEME.dark;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(palette.backgroundHex, 1);
    el.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;";
    el.appendChild(labelRenderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(palette.fogHex, 0.022);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 0, 20);

    scene.add(new THREE.AmbientLight(0xffffff, palette.ambientIntensity));
    const dir = new THREE.DirectionalLight(
      0xffffff,
      palette.directionalIntensity,
    );
    dir.position.set(5, 10, 8);
    scene.add(dir);

    // Subtle starfield
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(400 * 3).map(() => (Math.random() - 0.5) * 100);
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: palette.starColor,
          size: 0.05,
          transparent: true,
          opacity: theme === "light" ? 0.35 : 0.6,
        }),
      ),
    );

    // Node positions — fibonacci sphere spread
    const positions = notes.map((_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / notes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 5.5;
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 1.2,
        r * Math.sin(phi) * Math.sin(theta),
      );
    });

    const nodeMeshes = [];
    const basePositions = positions.map((p) => p.clone());

    notes.forEach((note, i) => {
      const isSelected = note.id === selectedNoteId;

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.22 : 0.15, 16, 16),
        new THREE.MeshStandardMaterial({
          color: isSelected ? palette.selectedColor : palette.nodeColor,
          roughness: 0.32,
          metalness: 0.28,
          emissive: isSelected
            ? palette.selectedEmissive
            : palette.nodeEmissive,
          emissiveIntensity: isSelected ? 0.9 : 0.38,
        }),
      );
      mesh.position.copy(positions[i]);
      mesh.userData = { note };
      scene.add(mesh);
      nodeMeshes.push(mesh);

      // Label
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = note.title;
      btn.className = `graph-node-label ${isSelected ? "active" : ""}`.trim();
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectNote(note.id);
      });
      const labelObj = new CSS2DObject(btn);
      labelObj.position.set(0, 0.42, 0);
      labelObj.center.set(0.5, 1.1);
      mesh.add(labelObj);
    });

    // Edges — thin, low opacity
    for (let a = 0; a < positions.length; a++) {
      for (let b = a + 1; b < positions.length; b++) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          positions[a].clone(),
          positions[b].clone(),
        ]);
        scene.add(
          new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({
              color: palette.edgeColor,
              transparent: true,
              opacity: theme === "light" ? 0.34 : 0.5,
            }),
          ),
        );
      }
    }

    // Pulse particles along edges
    const pulseParticles = [];
    for (let a = 0; a < positions.length; a++) {
      for (let b = a + 1; b < positions.length; b++) {
        for (let k = 0; k < 2; k++) {
          const pm = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 6, 6),
            new THREE.MeshBasicMaterial({
              color: palette.pulseColor,
              transparent: true,
              opacity: 0,
            }),
          );
          pm.userData = {
            pA: positions[a].clone(),
            pB: positions[b].clone(),
            t: (k / 2 + a * 0.13 + b * 0.07) % 1,
            speed: 0.0025 + Math.random() * 0.0015,
          };
          scene.add(pm);
          pulseParticles.push(pm);
        }
      }
    }

    // Orbit
    let sph = { theta: 0.3, phi: Math.PI / 2.1, r: 20 };
    let tgt = { ...sph };
    let isDragging = false,
      prevMouse = { x: 0, y: 0 };
    let autoSpin = true;

    const onMD = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      autoSpin = false;
    };
    const onMU = () => {
      isDragging = false;
    };
    const onMM = (e) => {
      if (!isDragging) return;
      tgt.theta -= (e.clientX - prevMouse.x) * 0.005;
      tgt.phi = Math.max(
        0.3,
        Math.min(Math.PI - 0.3, tgt.phi - (e.clientY - prevMouse.y) * 0.005),
      );
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onWH = (e) => {
      tgt.r = Math.max(8, Math.min(38, tgt.r + e.deltaY * 0.04));
      e.preventDefault();
    };

    let lastTouch = null;
    const onTS = (e) => {
      lastTouch = e.touches[0];
      autoSpin = false;
    };
    const onTM = (e) => {
      if (!lastTouch) return;
      const t = e.touches[0];
      tgt.theta -= (t.clientX - lastTouch.clientX) * 0.005;
      tgt.phi = Math.max(
        0.3,
        Math.min(
          Math.PI - 0.3,
          tgt.phi - (t.clientY - lastTouch.clientY) * 0.005,
        ),
      );
      lastTouch = t;
      e.preventDefault();
    };

    el.addEventListener("mousedown", onMD);
    window.addEventListener("mouseup", onMU);
    window.addEventListener("mousemove", onMM);
    el.addEventListener("wheel", onWH, { passive: false });
    el.addEventListener("touchstart", onTS, { passive: true });
    el.addEventListener("touchmove", onTM, { passive: false });

    const raycaster = new THREE.Raycaster();
    const mouse2 = new THREE.Vector2();
    const onClick = (e) => {
      const rect = el.getBoundingClientRect();
      mouse2.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouse2, camera);
      const hits = raycaster.intersectObjects(nodeMeshes);
      if (hits.length) onSelectNote(hits[0].object.userData.note.id);
    };
    el.addEventListener("click", onClick);

    const ro = new ResizeObserver(() => {
      const W = el.clientWidth,
        H = el.clientHeight;
      renderer.setSize(W, H, false);
      labelRenderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    labelRenderer.setSize(el.clientWidth, el.clientHeight);

    let time = 0,
      rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      time += 0.01;

      if (autoSpin) tgt.theta += 0.001;
      sph.theta += (tgt.theta - sph.theta) * 0.06;
      sph.phi += (tgt.phi - sph.phi) * 0.06;
      sph.r += (tgt.r - sph.r) * 0.06;

      camera.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi),
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta),
      );
      camera.lookAt(0, 0, 0);

      // Gentle bob
      nodeMeshes.forEach((m, i) => {
        m.position.y =
          basePositions[i].y + Math.sin(time * 0.5 + i * 1.1) * 0.12;
      });

      // Pulse travel
      pulseParticles.forEach((pp) => {
        pp.userData.t = (pp.userData.t + pp.userData.speed) % 1;
        pp.position.lerpVectors(pp.userData.pA, pp.userData.pB, pp.userData.t);
        const arc = Math.sin(pp.userData.t * Math.PI);
        pp.material.opacity = arc * 0.45;
      });

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("mousedown", onMD);
      window.removeEventListener("mouseup", onMU);
      window.removeEventListener("mousemove", onMM);
      el.removeEventListener("wheel", onWH);
      el.removeEventListener("touchstart", onTS);
      el.removeEventListener("touchmove", onTM);
      el.removeEventListener("click", onClick);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      if (el.contains(labelRenderer.domElement))
        el.removeChild(labelRenderer.domElement);
    };
  }, [notes, selectedNoteId, onSelectNote, theme]);

  return (
    <section
      className="graph-view"
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
