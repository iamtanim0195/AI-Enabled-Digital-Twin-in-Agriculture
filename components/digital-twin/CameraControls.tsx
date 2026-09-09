"use client";

import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";

export type CameraView = "default" | "plant" | "top" | "reset";

interface CameraControlsProps {
  view: CameraView;
  onViewCompleted: () => void;
}

export function CameraControls({ view, onViewCompleted }: CameraControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    const targets: Record<CameraView, { pos: Vector3; target: Vector3 }> = {
      default: {
        pos: new Vector3(3, 2.5, 5),
        target: new Vector3(0, 1, 0),
      },
      plant: {
        pos: new Vector3(1.5, 1.8, 2.5),
        target: new Vector3(0, 1.2, 0),
      },
      top: {
        pos: new Vector3(0, 8, 0.01),
        target: new Vector3(0, 0, 0),
      },
      reset: {
        pos: new Vector3(3, 2.5, 5),
        target: new Vector3(0, 1, 0),
      },
    };

    if (view === "default") return;

    const target = targets[view];
    animateCamera(camera, target.pos, target.target, controlsRef.current, () => {
      onViewCompleted();
    });
  }, [view, camera, onViewCompleted]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={1.5}
      maxDistance={15}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minPolarAngle={0.1}
      target={[0, 1, 0]}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

function animateCamera(
  camera: any,
  targetPos: Vector3,
  targetLookAt: Vector3,
  controls: any,
  onComplete: () => void
) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const duration = 1000;
  const startTime = performance.now();

  function step() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easeT = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPos, targetPos, easeT);
    controls.target.lerpVectors(startTarget, targetLookAt, easeT);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onComplete();
    }
  }

  step();
}
