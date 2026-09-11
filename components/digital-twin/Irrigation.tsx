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
  const pumpWaterRef = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (pumpWaterRef.current) {
      pumpWaterRef.current.children.forEach((child, i) => {
        const progress = (time * 1.4 + i * 0.16) % 1;
        const arc = Math.sin(progress * Math.PI) * 0.42;
        child.position.x = 0.7 - progress * 0.7;
        child.position.y = 0.62 + arc - progress * 0.35;
        (child as any).material.opacity = active ? 0.9 - progress * 0.5 : 0;
      });
    }

    if (waterRef.current) {
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

        {/* Water pump */}
        <mesh position={[0.7, 0.28, 0]} castShadow>
          <boxGeometry args={[0.5, 0.45, 0.42]} />
          <meshStandardMaterial color={active ? "#167c5a" : "#374151"} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.7, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.35} metalness={0.7} />
        </mesh>
        <mesh position={[0.7, 0.28, 0.22]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color={active ? "#34d399" : "#64748b"} />
        </mesh>

        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} />
          </mesh>
        )}
      </group>

      {/* Animated water stream from the pump outlet to the irrigation pipe */}
      {active && (
        <mesh position={[0.35, 0.71, 0]} rotation={[0, 0, -1.32]}>
          <cylinderGeometry args={[0.018, 0.018, 0.75, 8]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} />
        </mesh>
      )}

      <group ref={pumpWaterRef}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[0.7, 0.62, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0} />
          </mesh>
        ))}
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
        <mesh position={[0.7, 0.57, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#00E676" />
        </mesh>
      )}
    </group>
  );
}
