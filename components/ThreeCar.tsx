import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { CarConfig, CarModel } from '../types';

interface ThreeCarProps {
  config: CarConfig;
  isRotating?: boolean;
  tilt?: number; 
}

export const ThreeCar: React.FC<ThreeCarProps> = ({ config, isRotating = true, tilt = 0 }) => {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
       if (isRotating) {
         groupRef.current.rotation.y += delta * 0.5;
       }
       groupRef.current.rotation.z = -tilt * 0.5;
       groupRef.current.rotation.y = (isRotating ? groupRef.current.rotation.y : 0) - (tilt * 0.2);
    }
  });

  const materialProps = {
    color: config.color,
    metalness: config.texture === 'metallic' ? 0.9 : 0.4,
    roughness: config.texture === 'matte' ? 0.8 : 0.2,
    clearcoat: config.texture === 'glossy' ? 1 : 0,
    clearcoatRoughness: 0.1
  };

  const renderChassis = () => {
    switch (config.model) {
      case 'TITAN': // Armored Truck Style
        return (
          <>
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[2.2, 0.8, 4.5]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 1.2, -0.5]}>
              <boxGeometry args={[1.8, 0.6, 2.5]} />
              <meshStandardMaterial color="#111" />
            </mesh>
             {/* Bullbar */}
             <mesh position={[0, 0.4, 2.3]}>
              <boxGeometry args={[2.0, 0.4, 0.2]} />
              <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>
          </>
        );
      case 'SPECTRE': // F1 / Low Profile
        return (
          <>
            {/* Narrow Nose */}
            <mesh position={[0, 0.25, 1.5]}>
              <boxGeometry args={[0.6, 0.2, 2.0]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            {/* Wide Rear */}
            <mesh position={[0, 0.3, -1.0]}>
              <boxGeometry args={[1.6, 0.4, 2.5]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            {/* Cockpit Bubble */}
            <mesh position={[0, 0.5, -0.2]}>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshStandardMaterial color="#000" metalness={1} roughness={0} />
            </mesh>
          </>
        );
      case 'VANGUARD': // Cyber-Wedge (Angular)
        return (
          <>
            {/* Main Wedge */}
            <mesh position={[0, 0.5, 0]} rotation={[0.1, 0, 0]}>
              <cylinderGeometry args={[0.8, 1.2, 4.2, 4]} />
              <meshPhysicalMaterial {...materialProps} flatShading />
            </mesh>
            {/* Light Strip */}
            <mesh position={[0, 0.55, 2.0]}>
              <boxGeometry args={[1.4, 0.05, 0.1]} />
              <meshBasicMaterial color="#fff" />
            </mesh>
          </>
        );
      case 'SPEEDSTER': // Default
      default:
        return (
          <>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[1.8, 0.25, 4.2]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 0.75, -0.2]}>
              <boxGeometry args={[1.4, 0.5, 2.2]} />
              <meshPhysicalMaterial color="#000" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        );
    }
  };

  const wheelPositions: [number, number, number][] = config.model === 'TITAN' 
    ? [[-1.2, 0.5, 1.5], [1.2, 0.5, 1.5], [-1.2, 0.5, -1.5], [1.2, 0.5, -1.5]] // Wider, Higher
    : [[-1.0, 0.35, 1.4], [1.0, 0.35, 1.4], [-1.0, 0.35, -1.4], [1.0, 0.35, -1.4]];

  return (
    <group ref={groupRef}>
      {renderChassis()}

      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <Wheel key={i} position={pos} rimColor={config.rimColor} size={config.model === 'TITAN' ? 0.5 : 0.38} />
      ))}

      {/* Spoiler */}
      {config.spoiler && (
        <group position={[0, config.model === 'TITAN' ? 1.4 : 0.9, -2.1]}>
          <mesh position={[0, 0.3, 0]}>
             <boxGeometry args={[2.2, 0.05, 0.4]} />
             <meshPhysicalMaterial color={config.color} />
          </mesh>
          <mesh position={[-0.8, 0, 0]}>
             <boxGeometry args={[0.1, 0.6, 0.3]} />
             <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.8, 0, 0]}>
             <boxGeometry args={[0.1, 0.6, 0.3]} />
             <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      )}

      {/* Neon */}
      {config.neon && (
        <pointLight position={[0, -0.5, 0]} color={config.rimColor} intensity={5} distance={8} decay={2} />
      )}
      
      {/* Headlights */}
      <mesh position={[-0.6, config.model === 'TITAN' ? 0.8 : 0.4, 2.15]}>
        <boxGeometry args={[0.4, 0.1, 0.1]} />
        <meshStandardMaterial emissive="#00F6FF" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <mesh position={[0.6, config.model === 'TITAN' ? 0.8 : 0.4, 2.15]}>
        <boxGeometry args={[0.4, 0.1, 0.1]} />
        <meshStandardMaterial emissive="#00F6FF" emissiveIntensity={4} toneMapped={false} />
      </mesh>
    </group>
  );
};

const Wheel = ({ position, rimColor, size }: { position: [number, number, number], rimColor: string, size: number }) => {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[size, size, 0.45, 32]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[size * 0.6, size * 0.6, 0.05, 16]} />
        <meshStandardMaterial emissive={rimColor} emissiveIntensity={2} color={rimColor} toneMapped={false} />
      </mesh>
    </group>
  );
};
