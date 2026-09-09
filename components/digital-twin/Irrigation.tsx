"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

interface IrrigationProps {
  active: boolean;
  onSelect: () => void;
  isSelected: boolean;
}

export function Irrigation({ active, onSelect, isSelected }: IrrigationProps) {
  const pipeRef = useRef<Group>(null);
  const waterRef = useRef<Group>(null);

  useFrame((state) => {
    if (waterRef.current) {
      const time = state.clock.getElapsedTime();
      waterRef.current.children.forEach((child, i) => {
        if (active) {
          const offset = (time * 2 + i * 0.3) % 1;
          child.position.y = 0.8 - offset * 0.8;
          (child as any).material.opacity = (1 - offset) * 0.6;
        } else {
          (child as any).material.opacity = 0;
        }
      });
    }
  });

  return (
    <group>
      {/* Irrigation pipe */}
      <group
        ref={pipeRef}
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
        {/* Horizontal pipe along ground */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 9.5, 8]} />
          <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 13.5, 8]} />
          <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Vertical riser pipe */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshStandardMaterial color="#666666" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Drip emitter near plant base */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.05, 0.03, 0.08, 8]} />
          <meshStandardMaterial color="#444444" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} />
          </mesh>
        )}
      </group>

      {/* Water droplets */}
      <group ref={waterRef}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#4FC3F7" transparent opacity={0} />
          </mesh>
        ))}
      </group>

      {/* Active indicator */}
      {active && (
        <mesh position={[0.15, 0.5, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#00E676" />
        </mesh>
      )}
    </group>
  );
}
