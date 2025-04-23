
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, useTexture } from "@react-three/drei";

function Particles({ count = 2000 }) {
  const mesh = useRef<THREE.Points>(null);
  const positions = useRef<Float32Array>(new Float32Array(count * 3));
  const scales = useRef<Float32Array>(new Float32Array(count));
  const colors = useRef<Float32Array>(new Float32Array(count * 3));
  
  // Initialize positions and scales randomly
  useEffect(() => {
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions.current[i3] = (Math.random() - 0.5) * 10;
      positions.current[i3 + 1] = (Math.random() - 0.5) * 10;
      positions.current[i3 + 2] = (Math.random() - 0.5) * 10;
      
      scales.current[i] = Math.random() * 0.4 + 0.1;
      
      // Generate gradient-like colors (purple to teal to orange)
      const t = Math.random();
      if (t < 0.33) {
        // Purple
        colors.current[i3] = 0.5 + Math.random() * 0.3; // R
        colors.current[i3 + 1] = 0.3 + Math.random() * 0.2; // G
        colors.current[i3 + 2] = 0.9 + Math.random() * 0.1; // B
      } else if (t < 0.66) {
        // Teal
        colors.current[i3] = 0.1 + Math.random() * 0.1; // R
        colors.current[i3 + 1] = 0.7 + Math.random() * 0.3; // G
        colors.current[i3 + 2] = 0.8 + Math.random() * 0.2; // B
      } else {
        // Orange
        colors.current[i3] = 0.9 + Math.random() * 0.1; // R
        colors.current[i3 + 1] = 0.4 + Math.random() * 0.3; // G
        colors.current[i3 + 2] = 0.1 + Math.random() * 0.1; // B
      }
    }
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    // Slowly rotate the entire particle system
    mesh.current.rotation.x += 0.0005;
    mesh.current.rotation.y += 0.001;
    
    // Get mouse position for interactivity
    const { mouse } = state;
    const mouseX = mouse.x * 0.1;
    const mouseY = mouse.y * 0.1;
    
    // Update particle positions based on mouse
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Add slight movement in the direction of the mouse
      positionAttribute.setXYZ(
        i,
        positions.current[i3] + Math.sin(state.clock.elapsedTime * 0.1 + i) * 0.01 + mouseX * 0.05,
        positions.current[i3 + 1] + Math.cos(state.clock.elapsedTime * 0.1 + i) * 0.01 + mouseY * 0.05,
        positions.current[i3 + 2] + Math.sin(state.clock.elapsedTime * 0.1 + i) * 0.01
      );
    }
    
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function ConnectingLines() {
  const mesh = useRef<THREE.LineSegments>(null);
  const lineCount = 50;
  const positions = useRef<Float32Array>(new Float32Array(lineCount * 6)); // 2 points per line, 3 values per point
  
  useEffect(() => {
    // Create random lines connecting points
    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      // Start point
      positions.current[i6] = (Math.random() - 0.5) * 10;
      positions.current[i6 + 1] = (Math.random() - 0.5) * 10;
      positions.current[i6 + 2] = (Math.random() - 0.5) * 10;
      
      // End point
      positions.current[i6 + 3] = (Math.random() - 0.5) * 10;
      positions.current[i6 + 4] = (Math.random() - 0.5) * 10;
      positions.current[i6 + 5] = (Math.random() - 0.5) * 10;
    }
  }, []);
  
  useFrame((state) => {
    if (!mesh.current) return;
    
    // Slowly rotate the lines
    mesh.current.rotation.x += 0.0005;
    mesh.current.rotation.y += 0.001;
    
    // Update line positions for animation
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      
      // Animate end points
      positionAttribute.setXYZ(
        i * 2 + 1,
        positions.current[i6 + 3] + Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.05,
        positions.current[i6 + 4] + Math.cos(state.clock.elapsedTime * 0.2 + i) * 0.05,
        positions.current[i6 + 5] + Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.05
      );
    }
    
    positionAttribute.needsUpdate = true;
  });
  
  return (
    <lineSegments ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={lineCount * 2}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#8B5CF6" transparent opacity={0.2} />
    </lineSegments>
  );
}

export default function BannerScene() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Particles />
        <ConnectingLines />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.2} />
      </Canvas>
    </div>
  );
}
