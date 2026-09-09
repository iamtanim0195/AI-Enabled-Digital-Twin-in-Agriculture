"use client";

import { useMemo } from "react";
import { TimeOfDay, getSkyColors } from "@/lib/plant-state";

interface LampPostProps {
    timeOfDay: TimeOfDay;
    rainActive: boolean;
    manualLampOn: boolean;
}

export function LampPost({ timeOfDay, rainActive, manualLampOn }: LampPostProps) {
    const naturalLight = useMemo(() => {
        const skyLight = getSkyColors(timeOfDay).sunIntensity;
        return skyLight * (rainActive ? 0.3 : 1);
    }, [rainActive, timeOfDay]);
    const isOn = manualLampOn || naturalLight < 0.35;
    const cornerPositions: [number, number][] = [
        [6, -3.8],
        [6, 3.8],
        [-6, -3.8],
        [-6, 3.8],
    ];

    return (
        <group>
            {cornerPositions.map(([x, z]) => (
                <LampFixture key={`${x}-${z}`} position={[x, 0, z]} isOn={isOn} />
            ))}
        </group>
    );
}

interface LampFixtureProps {
    position: [number, number, number];
    isOn: boolean;
}

function LampFixture({ position, isOn }: LampFixtureProps) {
    const headDirection = position[0] > 0 ? -1 : 1;

    return (
        <group position={position}>
            <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.1, 2.8, 10]} />
                <meshStandardMaterial color="#263238" metalness={0.75} roughness={0.35} />
            </mesh>
            <mesh position={[headDirection * 0.35, 2.68, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.72, 10]} />
                <meshStandardMaterial color="#263238" metalness={0.75} roughness={0.35} />
            </mesh>
            <mesh position={[headDirection * 0.68, 2.57, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.24, 0.22, 16, 1, true]} />
                <meshStandardMaterial color="#37474F" metalness={0.45} roughness={0.4} side={2} />
            </mesh>
            <mesh position={[headDirection * 0.68, 2.45, 0]}>
                <sphereGeometry args={[0.11, 16, 12]} />
                <meshStandardMaterial
                    color={isOn ? "#FFD180" : "#5B5145"}
                    emissive={isOn ? "#FF9E40" : "#000000"}
                    emissiveIntensity={isOn ? 2.5 : 0}
                    roughness={0.3}
                />
            </mesh>
            <pointLight
                position={[headDirection * 0.68, 2.45, 0]}
                color="#ADD8E6"
                intensity={isOn ? 20.5 : 0}
                distance={10}
                decay={2}
                castShadow={isOn}
                shadow-mapSize={[512, 512]}
            />
        </group>
    );
}
