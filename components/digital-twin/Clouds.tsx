"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { TimeOfDay, getSkyColors } from "@/lib/plant-state";

interface CloudsProps {
  timeOfDay: TimeOfDay;
  windSpeed: number;
  rainActive: boolean;
}

interface CloudData {
  position: [number, number, number];
  scale: [number, number, number];
  speed: number;
}

export function Clouds({ timeOfDay, windSpeed, rainActive }: CloudsProps) {
  const groupRef = useRef<Group>(null);
  const colors = useMemo(() => getSkyColors(timeOfDay), [timeOfDay]);

  const cloudColor = useMemo(() => {
    if (rainActive) return "#606878";
    switch (timeOfDay) {
      case "sunrise": return "#FFD8B8";
      case "sunset": return "#E89878";
      case "night": return "#2A3045";
      default: return "#FFFFFF";
    }
  }, [timeOfDay, rainActive]);

  const clouds = useMemo<CloudData[]>(() => {
    const count = rainActive ? 8 : 6;
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 30,
        8 + Math.random() * 4,
        (Math.random() - 0.5) * 20 - 5,
      ] as [number, number, number],
      scale: [
        2 + Math.random() * 2,
        0.8 + Math.random() * 0.5,
        1.5 + Math.random() * 1.5,
      ] as [number, number, number],
      speed: 0.3 + Math.random() * 0.4,
    }));
  }, [rainActive]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const windFactor = windSpeed / 20;

    groupRef.current.children.forEach((cloud, i) => {
      cloud.position.x += delta * 0.3 * windFactor * (clouds[i]?.speed || 0.5);
      if (cloud.position.x > 18) {
        cloud.position.x = -18;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <Cloud key={i} data={cloud} color={cloudColor} opacity={rainActive ? 0.9 : 0.75} />
      ))}
    </group>
  );
}

function Cloud({
  data,
  color,
  opacity,
}: {
  data: CloudData;
  color: string;
  opacity: number;
}) {
  const puffs = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      position: [
        (i - 2) * 0.6 + Math.random() * 0.3,
        Math.random() * 0.2,
        Math.random() * 0.3,
      ] as [number, number, number],
      scale: 0.6 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <group position={data.position} scale={data.scale}>
      {puffs.map((puff, i) => (
        <mesh key={i} position={puff.position} scale={puff.scale}>
          <sphereGeometry args={[0.5, 12, 8]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
