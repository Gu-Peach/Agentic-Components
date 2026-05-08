import type {
  DeviceInterfaceConfig,
  InterfacePoint,
  SceneDevice,
} from '@/types/scene';

export const FLOW_INPUT_INTERFACE = 'flow_input';
export const FLOW_OUTPUT_INTERFACE = 'flow_output';

const FLOW_POINTS: InterfacePoint[] = [
  {
    name: FLOW_INPUT_INTERFACE,
    displayName: '输入',
    direction: 'in',
    description: '工艺流程的输入口。',
  },
  {
    name: FLOW_OUTPUT_INTERFACE,
    displayName: '输出',
    direction: 'out',
    description: '工艺流程的输出口。',
  },
];

const INPUT_KEYWORDS = ['entry', 'input', 'in', 'bottom'];
const OUTPUT_KEYWORDS = ['exit', 'output', 'out', 'top'];

export function getFlowInterfacePoints() {
  return FLOW_POINTS;
}

export function getFlowInterfacePointsForDevice(device: SceneDevice) {
  return device.type === 'workpiece' ? [] : FLOW_POINTS;
}

export function isFlowInterfaceName(interfaceName: string) {
  return interfaceName === FLOW_INPUT_INTERFACE || interfaceName === FLOW_OUTPUT_INTERFACE;
}

export function formatInterfaceName(device: SceneDevice, interfaceName: string) {
  if (interfaceName === FLOW_INPUT_INTERFACE) {
    return '输入';
  }

  if (interfaceName === FLOW_OUTPUT_INTERFACE) {
    return '输出';
  }

  return resolveInterfacePoint(device, interfaceName)?.displayName ?? interfaceName;
}

export function getDeviceInterfaces(device: SceneDevice): InterfacePoint[] {
  const config = device.interfaceConfig;
  if (!config) return [];
  if (config.interfaces?.length) return config.interfaces;
  const robotPoint = buildRobotToolPoint(config);
  return robotPoint ? [robotPoint] : [];
}

export function resolveInterfacePoint(
  device: SceneDevice,
  interfaceName: string,
): InterfacePoint | undefined {
  if (interfaceName === FLOW_INPUT_INTERFACE) {
    return resolveFlowPoint(device, 'input');
  }

  if (interfaceName === FLOW_OUTPUT_INTERFACE) {
    return resolveFlowPoint(device, 'output');
  }

  return getDeviceInterfaces(device).find((point) => point.name === interfaceName);
}

function resolveFlowPoint(device: SceneDevice, flowSide: 'input' | 'output') {
  const config = device.interfaceConfig;
  const points = getDeviceInterfaces(device);

  if (config?.transfer) {
    const mappedName = flowSide === 'input' ? config.transfer.from : config.transfer.to;
    const mappedPoint = points.find((point) => point.name === mappedName);
    if (mappedPoint) {
      return mappedPoint;
    }
  }

  const point = points.find((item) => matchesFlowSide(item, flowSide));
  if (point) {
    return point;
  }

  if (device.type === 'robot') {
    return buildRobotToolPoint(config);
  }

  return flowSide === 'input' ? points[0] : points[points.length - 1] ?? points[0];
}

function matchesFlowSide(point: InterfacePoint, flowSide: 'input' | 'output') {
  if (flowSide === 'input' && point.direction === 'in') {
    return true;
  }

  if (flowSide === 'output' && point.direction === 'out') {
    return true;
  }

  const name = point.name.toLowerCase();
  const keywords = flowSide === 'input' ? INPUT_KEYWORDS : OUTPUT_KEYWORDS;
  return keywords.some((keyword) => name === keyword || name.includes(keyword));
}

function buildRobotToolPoint(config?: DeviceInterfaceConfig | null) {
  if (!config) {
    return undefined;
  }

  const jointName = config.interface?.jointName
    ?? config.urdf?.interfaceJointName
    ?? config.urdf?.joints.at(-1)?.name;

  if (!jointName) {
    return undefined;
  }

  return {
    name: config.interface?.name ?? jointName,
    displayName: config.interface?.name ?? '抓取点',
    source: jointName,
    description: config.interface?.description ?? '机械臂末端抓取点。',
  };
}
