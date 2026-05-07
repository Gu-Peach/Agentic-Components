import { Group, Object3D, Vector3 } from 'three';
import IKChain from './IKChain';
import IKSolver from './IKSolver';
import type { DeviceConfig } from '@/lib/simulation/types';

type ThreeGroup = InstanceType<typeof Group>;
type ThreeObject3D = InstanceType<typeof Object3D>;

export type BuiltIKResult = {
  ikChain: IKChain;
  ikSolver: IKSolver;
  ikTarget: ThreeObject3D;
  endEffectorNode: ThreeObject3D | null;
  containerGroup: ThreeGroup;
};

export function buildIKFromDeviceConfig(
  deviceConfig: DeviceConfig,
  glbScene: ThreeObject3D,
): BuiltIKResult | null {
  const urdf = deviceConfig.urdf;
  if (!urdf?.joints.length || !deviceConfig.rootNodeName) {
    return null;
  }

  const rootNode = glbScene.getObjectByName(deviceConfig.rootNodeName);
  if (!rootNode) {
    console.warn(`[buildIK] rootNodeName "${deviceConfig.rootNodeName}" not found`);
    return null;
  }

  const glbNodes = resolveJointNodes(urdf.joints, glbScene);
  if (!glbNodes) {
    return null;
  }

  const origins = computeOrigins(rootNode, glbNodes);
  const rootWorldPosition = new Vector3();
  rootNode.getWorldPosition(rootWorldPosition);

  const container = new Group();
  container.name = `ik_container_${deviceConfig.id}`;
  container.position.copy(rootWorldPosition);
  container.visible = false;

  const ikChain = new IKChain();
  ikChain.createFromConfig(
    urdf.joints.map((joint, index) => ({
      type: joint.type,
      axis: joint.axis,
      limit: joint.limit,
      origin: origins[index],
    })),
    glbNodes,
    container,
  );

  const ikSolver = new IKSolver({
    shouldUpdateGLB: true,
    tolerance: 0.001,
    maxNumOfIterations: 50,
  });
  ikSolver.ikChain = ikChain;

  const ikTarget = new Object3D();
  ikTarget.name = `ik_target_${deviceConfig.id}`;
  setInitialTarget(ikTarget, ikChain);
  ikSolver.target = ikTarget;

  const endEffectorName =
    urdf.endEffectorNodeName ?? urdf.joints[urdf.joints.length - 1].nodeName;

  return {
    ikChain,
    ikSolver,
    ikTarget,
    endEffectorNode: glbScene.getObjectByName(endEffectorName) ?? null,
    containerGroup: container,
  };
}

function resolveJointNodes(
  joints: NonNullable<DeviceConfig['urdf']>['joints'],
  glbScene: ThreeObject3D,
) {
  const nodes: ThreeObject3D[] = [];

  for (const joint of joints) {
    const node = glbScene.getObjectByName(joint.nodeName);
    if (!node) {
      console.warn(`[buildIK] joint nodeName "${joint.nodeName}" not found`);
      return null;
    }
    nodes.push(node);
  }

  return nodes;
}

function computeOrigins(rootNode: ThreeObject3D, glbNodes: ThreeObject3D[]) {
  rootNode.updateWorldMatrix(true, true);
  glbNodes.forEach((node) => node.updateWorldMatrix(true, false));

  const origins = [];
  let previousPosition = new Vector3();
  rootNode.getWorldPosition(previousPosition);

  for (const glbNode of glbNodes) {
    const nodePosition = new Vector3();
    glbNode.getWorldPosition(nodePosition);
    origins.push(new Vector3().subVectors(nodePosition, previousPosition));
    previousPosition = nodePosition;
  }

  return origins;
}

function setInitialTarget(ikTarget: ThreeObject3D, ikChain: IKChain) {
  if (!ikChain.endEffector) {
    return;
  }

  const endEffectorPosition = new Vector3();
  ikChain.endEffector.getWorldPosition(endEffectorPosition);
  ikTarget.position.copy(endEffectorPosition);
}
