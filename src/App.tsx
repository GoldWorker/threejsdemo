import React, { useEffect } from "react";
import ThreeTool from "./ThreeTool";
import * as THREE from "three";

export default function App() {
  useEffect(() => {
    const threetool = new ThreeTool({
      canvas: document.getElementById("canvasFrame") as HTMLCanvasElement,
      container: document.getElementById("canvasWrap") as HTMLElement,
      mode: "dev",
    });

    const geometry = new THREE.BoxGeometry(100, 100, 100);
    const material = new THREE.MeshPhongMaterial({ color: 0x33bb77 });
    const cube = new THREE.Mesh(geometry, material);

    threetool.scene.add(cube);

    threetool.continuousRender((time) => {
      cube.rotation.x = time;
    });
  }, []);
  return (
    <div id="canvasWrap">
      <canvas id="canvasFrame" />
    </div>
  );
}
