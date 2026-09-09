"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { TimeOfDay } from "@/lib/plant-state";

interface SoilProps {
  rainActive: boolean;
  soilMoisture: number;
  timeOfDay: TimeOfDay;
  onSelect: () => void;
  isSelected: boolean;
}
export function Soil({ rainActive, soilMoisture, timeOfDay, onSelect, isSelected }: SoilProps) {
  const groundRef = useRef<Group>(null);

  const soilColor = useMemo(() => {
    if (rainActive || soilMoisture > 70) return "#3D2817";
    if (soilMoisture < 30) return "#8B6F47";
    return "#5D3F23";
  }, [rainActive, soilMoisture]);

  useFrame((state) => {
    if (groundRef.current && rainActive) {
      const time = state.clock.getElapsedTime();
      const mat = (groundRef.current.children[0] as any).material;
      if (mat) {
        mat.opacity = 0.9 + Math.sin(time * 0.5) * 0.05;
      }
    }
  });

  return (
    <group
      ref={groundRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* Broad agricultural plot */}
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[14, 0.3, 10]} />
        <meshStandardMaterial color={soilColor} roughness={1} transparent opacity={0.9} />
      </mesh>

      {/* Cultivation furrows keep the planting grid readable from above. */}
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={`furrow-x-${index}`} position={[-6 + index * 2, 0.01, 0]} receiveShadow>
          <boxGeometry args={[0.05, 0.025, 9.5]} />
          <meshStandardMaterial color="#3f2b1a" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={`furrow-z-${index}`} position={[0, 0.012, -4 + index * 1.6]} receiveShadow>
          <boxGeometry args={[13.5, 0.025, 0.05]} />
          <meshStandardMaterial color="#3f2b1a" roughness={1} />
        </mesh>
      ))}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[7.1, 7.18, 64]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Ground plane for shadows */}
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#5B7B3A" roughness={0.9} />
      </mesh>

    </group>
  );
}

