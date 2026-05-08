'use client';

import { Html } from '@react-three/drei';
import { getInterfaceCoordinate } from '@/lib/interfaces/interfaceCoordinates';
import { formatInterfaceName, resolveInterfacePoint } from '@/lib/interfaces/interfacePorts';
import { useSceneStore } from '@/stores/sceneStore';
import { useInterfaceHighlightStore } from '@/stores/interfaceHighlightStore';

export function InterfaceHighlightMarker() {
  const { devices } = useSceneStore();
  const { activeHighlight } = useInterfaceHighlightStore();

  if (!activeHighlight) {
    return null;
  }

  const device = devices.find((item) => item.id === activeHighlight.deviceId);
  if (!device) {
    return null;
  }

  const point = resolveInterfacePoint(device, activeHighlight.interfaceName);
  if (!point) {
    return null;
  }

  const coordinate = getInterfaceCoordinate(device, point, 'World');
  if (!coordinate) {
    return null;
  }

  return (
    <group position={[coordinate.x, coordinate.y, coordinate.z]}>
      <mesh>
        <sphereGeometry args={[0.045, 20, 20]} />
        <meshStandardMaterial color='#ff9f43' emissive='#ffb366' emissiveIntensity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <ringGeometry args={[0.085, 0.11, 32]} />
        <meshBasicMaterial color='#ff9f43' transparent opacity={0.95} />
      </mesh>
      <Html distanceFactor={8} position={[0, 0.16, 0]}>
        <div className='rounded border border-[#f7c07a] bg-[rgba(28,28,28,0.92)] px-2 py-1 text-[11px] font-semibold text-[#ffe1b8] shadow-[0_6px_18px_rgba(0,0,0,0.28)]'>
          {device.name} / {formatInterfaceName(device, activeHighlight.interfaceName)}
        </div>
      </Html>
    </group>
  );
}
