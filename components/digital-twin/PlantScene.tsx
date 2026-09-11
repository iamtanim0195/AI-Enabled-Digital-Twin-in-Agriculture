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
  manualLampOn?: boolean;
  irrigationActive?: boolean;
  singlePlant?: boolean;
}

export function PlantScene({
  plantState,
  envState,
  cameraView,
  onCameraViewCompleted,
  onSelect,
  selection,
  manualLampOn = false,
  irrigationActive = false,
  singlePlant = false,
}: PlantSceneProps) {
  const plantPositions = singlePlant ? [[0, 0, 0]] as const : [
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
  const handleIrrigationSelect = useCallback(() => onSelect("irrigation"), [onSelect]);

  const handleBackgroundClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <Canvas
      shadows
      camera={{ position: singlePlant ? [0, 2.2, 6] : [3, 2.5, 5], fov: singlePlant ? 42 : 50, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={handleBackgroundClick}
    >
      <Suspense fallback={null}>
        <Environment
          timeOfDay={envState.timeOfDay}
          rainActive={envState.rainActive}
          windSpeed={envState.windSpeed}
          manualLampOn={manualLampOn}
          soilMoisture={plantState.soilMoisture}
          irrigationActive={irrigationActive}
          onSoilSelect={handleSoilSelect}
          onIrrigationSelect={handleIrrigationSelect}
          soilSelected={selection === "soil"}
          irrigationSelected={selection === "irrigation"}
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
