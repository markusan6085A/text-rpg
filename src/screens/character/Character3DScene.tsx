/**
 * 3D-сцена персонажа в стилі Lineage 2
 * Камінь, колони, атмосферне освітлення, персонаж як billboard
 */
import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture, Billboard } from "@react-three/drei";
import * as THREE from "three";

// L2 кольори: темний камінь, золото, фіолетовий
const STONE_COLOR = "#1a1510";
const STONE_DARK = "#0d0a08";
const GOLD_ACCENT = "#c7ad80";
const PURPLE_GLOW = "#4a2c6d";

function StoneFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color={STONE_DARK} roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function Pillar({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.5, z]} castShadow receiveShadow>
      <boxGeometry args={[0.4, 2, 0.4]} />
      <meshStandardMaterial color={STONE_COLOR} roughness={0.85} metalness={0.15} />
    </mesh>
  );
}

function CharacterBillboard({ imageSrc }: { imageSrc: string }) {
  const texture = useTexture(imageSrc);
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={[0, 0.2, 0]} layers={0}>
      <planeGeometry args={[1.8, 2.4]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function SceneContent({ characterImage }: { characterImage: string }) {
  return (
    <>
      <fog attach="fog" args={["#0a0806", 3, 12]} />
      <ambientLight intensity={0.25} color={PURPLE_GLOW} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={0.8}
        color={GOLD_ACCENT}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <pointLight position={[0, 2, 2]} intensity={0.3} color={GOLD_ACCENT} />
      <StoneFloor />
      <Pillar x={-1.5} z={-1.8} />
      <Pillar x={1.5} z={-1.8} />
      <CharacterBillboard imageSrc={characterImage} />
    </>
  );
}

interface Character3DSceneProps {
  characterImage: string;
  className?: string;
}

export default function Character3DScene({ characterImage, className = "" }: Character3DSceneProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: "220px" }}>
      <Canvas
        camera={{ position: [0, 0.3, 2.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={[1, 2]}
        style={{ background: "linear-gradient(180deg, #0d0a08 0%, #1a1510 50%, #0a0806 100%)" }}
      >
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshBasicMaterial color="#333" wireframe />
            </mesh>
          }
        >
          <SceneContent characterImage={characterImage} />
        </Suspense>
      </Canvas>
    </div>
  );
}
