"use client";

import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { ChiliPlant } from "./ChiliPlant";
import { Environment } from "./Environment";
import { CameraControls, CameraView } from "./CameraControls";
import { PlantState, EnvironmentState } from "@/lib/plant-state";
import { SelectionType } from "./SelectionPanel";

interface PlantSceneProps {
  plantState: PlantState;
  envState: EnvironmentState;
  cameraView: CameraView;
  onCameraViewCompleted: () => void;
  onSelect: (type: SelectionType) => void;
  selection: SelectionType;
}

export function PlantScene({
  plantState,
  envState,
  cameraView,
  onCameraViewCompleted,
  onSelect,
  selection,
}: PlantSceneProps) {
  const plantPositions = [
    [-4.5, 0, -3.2],
    [-1.5, 0, -3.2],
    [1.5, 0, -3.2],
    [4.5, 0, -3.2],
    [-4.5, 0, 0],
    [-1.5, 0, 0],
    [1.5, 0, 0],
    [4.5, 0, 0],
    [-4.5, 0, 3.2],
    [-1.5, 0, 3.2],
    [1.5, 0, 3.2],
    [4.5, 0, 3.2],
  ] as const;
  const handlePlantSelect = useCallback(() => onSelect("plant"), [onSelect]);
  const handleSoilSelect = useCallback(() => onSelect("soil"), [onSelect]);

  const handleBackgroundClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.5, 5], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={handleBackgroundClick}
    >
      <Suspense fallback={null}>
        <Environment
          timeOfDay={envState.timeOfDay}
          rainActive={envState.rainActive}
          windSpeed={envState.windSpeed}
          soilMoisture={plantState.soilMoisture}
          onSoilSelect={handleSoilSelect}
          soilSelected={selection === "soil"}
        />

        {plantPositions.map((position, index) => (
          <ChiliPlant
            key={`papaya-${index}`}
            position={position}
            plantState={plantState}
            windSpeed={envState.windSpeed}
            rainActive={envState.rainActive}
            onSelect={handlePlantSelect}
            isSelected={selection === "plant"}
          />
        ))}

        <CameraControls view={cameraView} onViewCompleted={onCameraViewCompleted} />
      </Suspense>
    </Canvas>
  );
}
