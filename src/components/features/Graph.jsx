// export function GraphView({ noteNodes, notes, selectedNoteId, onSelectNote }) {
//   return (
//     <section className="graph-view">
//       <svg
//         className="graph-svg"
//         viewBox="0 0 100 100"
//         preserveAspectRatio="none"
//       >
//         {noteNodes.map((node, idx) => {
//           const next = noteNodes[(idx + 1) % noteNodes.length];
//           return (
//             <line
//               key={`${node.id}-${next.id}`}
//               x1={node.x}
//               y1={node.y}
//               x2={next.x}
//               y2={next.y}
//               stroke="rgba(192,193,255,0.25)"
//               strokeWidth="0.2"
//             />
//           );
//         })}
//       </svg>

//       <div className="graph-hud">
//         <h2>Second Brain Visualizer</h2>
//         <p>{notes.length} nodes connected</p>
//       </div>

//       {noteNodes.map((node) => {
//         const active = selectedNoteId === node.id;
//         return (
//           <button
//             key={node.id}
//             className={`graph-node ${active ? "active" : ""}`}
//             style={{ left: `${node.x}%`, top: `${node.y}%` }}
//             onClick={() => onSelectNote(node.id)}
//           >
//             <span>
//               {notes.find((n) => n.id === node.id)?.title || node.title}
//             </span>
//           </button>
//         );
//       })}
//     </section>
//   );
// }
import { useEffect, useRef } from "react";
import * as THREE from "three";

const TAG_COLORS = {
  design: 0x8b80ff,
  ux: 0x8b80ff,
  productivity: 0x8b80ff,
  python: 0xff7b6b,
  backend: 0xff7b6b,
  performance: 0xff7b6b,
  research: 0x52d9a4,
  ai: 0x52d9a4,
  graph: 0x52d9a4,
  general: 0xf5c542,
};

function getNoteColor(note) {
  for (const tag of note.tags) if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  return 0xf5c542;
}

export function GraphView({ notes, selectedNoteId, onSelectNote }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a12, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a12, 0.025);

    const camera = new THREE.PerspectiveCamera(
      55,
      el.clientWidth / el.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 0, 18);

    scene.add(new THREE.AmbientLight(0x6060aa, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 8);
    scene.add(dir);

    // Star field
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(280 * 3).map(() => (Math.random() - 0.5) * 80);
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0x9090cc,
          size: 0.06,
          transparent: true,
          opacity: 0.45,
        }),
      ),
    );

    // Spread notes in 3D space
    const spread = 5.5;
    const positions = notes.map((_, i) => {
      const angle = (i / notes.length) * Math.PI * 2;
      const layer = Math.floor(i / 5);
      return new THREE.Vector3(
        Math.cos(angle) * spread,
        ((i % 3) - 1) * 2.5 - layer * 1.5,
        Math.sin(angle) * spread,
      );
    });

    const nodeMeshes = [];
    const ringMeshes = [];
    const basePositions = [...positions];

    notes.forEach((note, i) => {
      const col = getNoteColor(note);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 24, 24),
        new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.28,
          metalness: 0.55,
          emissive: col,
          emissiveIntensity: note.id === selectedNoteId ? 0.55 : 0.18,
        }),
      );
      mesh.position.copy(positions[i]);
      mesh.userData = { note, index: i };

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.03, 8, 48),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.35,
        }),
      );
      ring.rotation.x = Math.PI / 2.4;
      mesh.add(ring);
      ringMeshes.push(ring);

      scene.add(mesh);
      nodeMeshes.push(mesh);
    });

    // Edges
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x5555aa,
      transparent: true,
      opacity: 0.22,
    });
    for (let a = 0; a < positions.length; a++) {
      for (let b = a + 1; b < positions.length; b++) {
        scene.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              positions[a].clone(),
              positions[b].clone(),
            ]),
            lineMat,
          ),
        );
      }
    }

    // Edge particles
    const edgeParticles = [];
    for (let a = 0; a < positions.length; a++) {
      for (let b = a + 1; b < positions.length; b++) {
        for (let k = 0; k < 2; k++) {
          const pm = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 6, 6),
            new THREE.MeshBasicMaterial({
              color: 0x9090ff,
              transparent: true,
              opacity: 0.7,
            }),
          );
          pm.userData = { pA: positions[a], pB: positions[b], t: k / 2 };
          scene.add(pm);
          edgeParticles.push(pm);
        }
      }
    }

    // Create labels container
    const labelsContainer = document.createElement("div");
    labelsContainer.style.position = "absolute";
    labelsContainer.style.top = "0";
    labelsContainer.style.left = "0";
    labelsContainer.style.width = "100%";
    labelsContainer.style.height = "100%";
    labelsContainer.style.pointerEvents = "none";
    el.appendChild(labelsContainer);

    const labels = notes.map((note) => {
      const label = document.createElement("div");
      label.style.position = "absolute";
      label.style.padding = "4px 8px";
      label.style.background = "rgba(10, 10, 18, 0.85)";
      label.style.border = "1px solid rgba(139, 128, 255, 0.5)";
      label.style.borderRadius = "4px";
      label.style.color = "#d0d0ff";
      label.style.fontSize = "11px";
      label.style.fontWeight = "500";
      label.style.whiteSpace = "nowrap";
      label.style.pointerEvents = "auto";
      label.style.cursor = "pointer";
      label.style.maxWidth = "140px";
      label.style.overflow = "hidden";
      label.style.textOverflow = "ellipsis";
      label.textContent = note.title;
      label.onClick = () => onSelectNote(note.id);
      labelsContainer.appendChild(label);
      return label;
    });

    // Removed grid helper for cleaner view

    // Orbit state
    let spherical = { theta: 0, phi: Math.PI / 2.2, r: 18 };
    let target = { ...spherical };
    let isDragging = false,
      prevMouse = { x: 0, y: 0 };
    let autoSpin = true;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      autoSpin = false;
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      target.theta -= (e.clientX - prevMouse.x) * 0.006;
      target.phi = Math.max(
        0.3,
        Math.min(Math.PI - 0.3, target.phi - (e.clientY - prevMouse.y) * 0.006),
      );
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e) => {
      target.r = Math.max(7, Math.min(35, target.r + e.deltaY * 0.03));
      e.preventDefault();
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    el.addEventListener("wheel", onWheel, { passive: false });

    // Click to navigate
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
      if (hits.length) {
        const { note } = hits[0].object.userData;
        onSelectNote(note.id); // ← your existing handler, switches to editor
      }
    };
    el.addEventListener("click", onClick);

    // Resize
    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);
    renderer.setSize(el.clientWidth, el.clientHeight, false);

    let t = 0,
      rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;
      if (autoSpin) target.theta += 0.0018;
      spherical.theta += (target.theta - spherical.theta) * 0.08;
      spherical.phi += (target.phi - spherical.phi) * 0.08;
      spherical.r += (target.r - spherical.r) * 0.08;
      camera.position.set(
        spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.r * Math.cos(spherical.phi),
        spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta),
      );
      camera.lookAt(0, 0, 0);

      nodeMeshes.forEach((m, i) => {
        m.position.y = basePositions[i].y + Math.sin(t * 0.5 + i * 1.4) * 0.18;
        ringMeshes[i].rotation.z = t * 0.4 + i * 0.8;

        // Project 3D position to 2D screen coords for labels
        const pos3D = new THREE.Vector3();
        m.getWorldPosition(pos3D);
        const pos2D = pos3D.project(camera);
        const rect = el.getBoundingClientRect();
        const x = ((pos2D.x + 1) / 2) * rect.width;
        const y = ((1 - pos2D.y) / 2) * rect.height - 35; // Offset above node

        labels[i].style.left = `${x - 70}px`; // Center the label
        labels[i].style.top = `${y}px`;
        labels[i].style.opacity = pos2D.z < 1 ? 1 : 0.2; // Fade if behind camera
      });
      edgeParticles.forEach((ep) => {
        ep.userData.t = (ep.userData.t + 0.004) % 1;
        ep.position.lerpVectors(ep.userData.pA, ep.userData.pB, ep.userData.t);
        ep.material.opacity = 0.3 + 0.5 * Math.sin(ep.userData.t * Math.PI);
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("click", onClick);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      if (el.contains(labelsContainer)) el.removeChild(labelsContainer);
    };
  }, [notes, selectedNoteId]);

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
        background: "#0a0a12",
      }}
    />
  );
}
