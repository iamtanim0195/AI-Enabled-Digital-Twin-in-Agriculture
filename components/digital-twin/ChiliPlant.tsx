"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { GroupProps } from "@react-three/fiber";
import type { PlantState } from "@/lib/plant-state";

export type ChiliPlantProps = GroupProps & {
  plantState: PlantState;
  windSpeed: number;
  rainActive: boolean;
  onSelect: () => void;
  isSelected: boolean;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

function mixColor(a: string, b: string, amount: number) {
  const colorA = new THREE.Color(a);
  const colorB = new THREE.Color(b);
  return `#${colorA.lerp(colorB, clamp(amount)).getHexString()}`;
}

function getLeafColor(health: number) {
  const normalizedHealth = clamp(health);

  if (normalizedHealth > 0.5) {
    return mixColor("#a8a522", "#2e8b3c", (normalizedHealth - 0.5) / 0.5);
  }

  return mixColor("#704c29", "#a8a522", normalizedHealth / 0.5);
}

function getDiseaseColor(diseaseName: string | null, leafState: string) {
  if (leafState === "dead") return "#4a3328";
  if (leafState === "diseased") {
    if (diseaseName?.includes("Mosaic")) return "#8f9b38";
    if (diseaseName?.includes("BacterialSpot")) return "#6f7f35";
    if (diseaseName?.includes("Anthracnose")) return "#5d4930";
    if (diseaseName?.includes("Ringspot")) return "#7f7132";
    if (diseaseName?.includes("Curl")) return "#a08d3c";
    if (diseaseName?.includes("Mealybug")) return "#9a8e45";
    if (diseaseName?.includes("Mite")) return "#aa9639";
    return "#8b8737";
  }
  if (leafState === "stressed") return "#a59a3b";
  return null;
}

export function ChiliPlant({
  plantState,
  windSpeed,
  rainActive,
  onSelect,
  isSelected,
  ...groupProps
}: ChiliPlantProps) {
  const { scene } = useGLTF("/models/chili/model.glb");
  const sway = useRef<THREE.Group>(null);
  const health = clamp(plantState.healthScore / 100);
  const growth =
    plantState.growthStage === "Seedling"
      ? 0.55
      : plantState.growthStage === "Vegetative"
        ? 0.8
        : 1;
  const heightScale =
    THREE.MathUtils.clamp(plantState.height / 40, 0.75, 1.5) * growth;
  const diseaseName = plantState.disease.name;

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return;

      const mesh = object as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((material) => {
          const clonedMaterial = material.clone();
          return clonedMaterial;
        });
      } else {
        const material = mesh.material.clone();
        mesh.material = material;
      }
    });

    return cloned;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!sway.current) return;
    const windFactor = THREE.MathUtils.clamp(windSpeed / 40, 0, 1);
    const gust = Math.sin(clock.elapsedTime * 1.7) + Math.sin(clock.elapsedTime * 2.9) * 0.35;
    sway.current.rotation.z =
      gust * windFactor * 0.09;
    sway.current.rotation.x = Math.cos(clock.elapsedTime * 1.35) * windFactor * 0.035;
  });

  return (
    <group {...groupProps} onClick={onSelect}>
      <group
        ref={sway}
        position={[0, 0.35, 0]}
        scale={[
          0.9 + growth * 0.1,
          heightScale,
          0.9 + growth * 0.1,
        ]}
      >
        <primitive object={model} />
      </group>

      {isSelected && (
        <pointLight
          color={rainActive ? "#60a5fa" : "#34d399"}
          intensity={0.35}
          distance={2.5}
        />
      )}
      {plantState.disease.risk === "HIGH" && (
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#fb7185" />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload("/models/chili/model.glb");
