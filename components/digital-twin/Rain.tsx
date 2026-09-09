"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, BufferGeometry, Float32BufferAttribute } from "three";

interface RainProps {
  active: boolean;
}

const RAIN_COUNT = 4000;

export function Rain({ active }: RainProps) {
  const pointsRef = useRef<Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  const velocities = useMemo(() => {
    const arr = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) {
      arr[i] = 0.15 + Math.random() * 0.1;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!pointsRef.current || !active) return;
    const geom = pointsRef.current.geometry as BufferGeometry;
    const posArr = geom.attributes.position.array as Float32Array;

    for (let i = 0; i < RAIN_COUNT; i++) {
      posArr[i * 3 + 1] -= velocities[i];
      posArr[i * 3] += 0.01;

      if (posArr[i * 3 + 1] < 0) {
        posArr[i * 3 + 1] = 15;
        posArr[i * 3] = (Math.random() - 0.5) * 20;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    geom.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={RAIN_COUNT}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#A8C0D8"
        size={0.08}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}
