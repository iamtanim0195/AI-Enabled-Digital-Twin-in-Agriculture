"use client";

import { useMemo } from "react";
import { TimeOfDay, getSkyColors } from "@/lib/plant-state";
import { Sun } from "./Sun";
import { Clouds } from "./Clouds";
import { Rain } from "./Rain";
import { Soil } from "./Soil";
import { LampPost } from "./LampPost";

interface EnvironmentProps {
  timeOfDay: TimeOfDay;
  rainActive: boolean;
  windSpeed: number;
  manualLampOn: boolean;
  soilMoisture: number;
  onSoilSelect: () => void;
  soilSelected: boolean;
}

export function Environment({
  timeOfDay,
  rainActive,
  windSpeed,
  manualLampOn,
  soilMoisture,
  onSoilSelect,
  soilSelected,
}: EnvironmentProps) {
  const skyColors = useMemo(() => getSkyColors(timeOfDay), [timeOfDay]);

  const skyTopColor = useMemo(() => {
    if (rainActive) return "#3A4050";
    return skyColors.top;
  }, [skyColors.top, rainActive]);

  const skyBottomColor = useMemo(() => {
    if (rainActive) return "#5A6070";
    return skyColors.bottom;
  }, [skyColors.bottom, rainActive]);

  const fogColor = useMemo(() => {
    if (rainActive) return "#4A5060";
    return skyColors.fog;
  }, [skyColors.fog, rainActive]);

  const fogNear = rainActive ? 8 : 15;
  const fogFar = rainActive ? 25 : 45;

  return (
    <>
      {/* Sky background using a large sphere */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color={skyTopColor} side={1} fog={false} />
      </mesh>

      {/* Sky gradient overlay - bottom hemisphere */}
      <mesh position={[0, -10, 0]}>
        <sphereGeometry args={[49, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={skyBottomColor} side={1} transparent opacity={0.6} fog={false} />
      </mesh>

      {/* Stars at night */}
      {timeOfDay === "night" && <Stars />}

      {/* Lighting */}
      <Sun timeOfDay={timeOfDay} rainActive={rainActive} />

      {/* Clouds */}
      <Clouds timeOfDay={timeOfDay} windSpeed={windSpeed} rainActive={rainActive} />

      {/* Rain */}
      <Rain active={rainActive} />

      {/* Automatically illuminates the plot when daylight is low. */}
      <LampPost timeOfDay={timeOfDay} rainActive={rainActive} manualLampOn={manualLampOn} />

      {/* Fog */}
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/* Ground/Soil */}
      <Soil
        rainActive={rainActive}
        soilMoisture={soilMoisture}
        timeOfDay={timeOfDay}
        onSelect={onSoilSelect}
        isSelected={soilSelected}
      />
    </>
  );
}

function Stars() {
  const starPositions = useMemo(() => {
    const count = 200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const r = 40;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) + 5;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={starPositions}
          itemSize={3}
          args={[starPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#FFFFFF" size={0.15} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}
