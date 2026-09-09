"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh } from "three";
import { TimeOfDay, getSunPosition, getSkyColors } from "@/lib/plant-state";

interface SunProps {
  timeOfDay: TimeOfDay;
  rainActive: boolean;
}

export function Sun({ timeOfDay, rainActive }: SunProps) {
  const sunRef = useRef<Mesh>(null);
  const sunLightRef = useRef<any>(null);
  const position = useMemo(() => getSunPosition(timeOfDay), [timeOfDay]);
  const colors = useMemo(() => getSkyColors(timeOfDay), [timeOfDay]);

  const sunColor = useMemo(() => {
    if (rainActive) return "#B0B8C0";
    switch (timeOfDay) {
      case "sunrise": return "#FF9966";
      case "sunset": return "#FF7744";
      case "night": return "#4A5275";
      default: return "#FFF5E0";
    }
  }, [timeOfDay, rainActive]);

  const lightIntensity = useMemo(() => {
    const base = colors.sunIntensity;
    if (rainActive) return base * 0.3;
    return base;
  }, [colors.sunIntensity, rainActive]);

  useFrame((state) => {
    if (sunRef.current) {
      const time = state.clock.getElapsedTime();
      const pulseFactor = 1 + Math.sin(time * 0.5) * 0.03;
      sunRef.current.scale.setScalar(pulseFactor);
    }
  });

  if (timeOfDay === "night") {
    return (
      <>
        <hemisphereLight args={["#2A2F50", "#0A0E20", 0.3]} />
        <directionalLight
          ref={sunLightRef}
          position={[5, 10, 5]}
          intensity={0.15}
          color="#6A7AB5"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
      </>
    );
  }

  return (
    <>
      {/* Sun visual */}
      <mesh ref={sunRef} position={position}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color={sunColor} />
      </mesh>

      {/* Sun glow */}
      <mesh position={position}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color={sunColor} transparent opacity={0.15} />
      </mesh>

      {/* Directional light for shadows */}
      <directionalLight
        ref={sunLightRef}
        position={position}
        intensity={lightIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />

      {/* Ambient fill light */}
      <ambientLight intensity={colors.ambientIntensity * (rainActive ? 0.6 : 1)} color={rainActive ? "#9098A0" : "#FFFFFF"} />
      <hemisphereLight
        args={[
          rainActive ? "#8088A0" : colors.top,
          rainActive ? "#505860" : colors.bottom,
          (rainActive ? 0.3 : 0.5),
        ]}
      />
    </>
  );
}
