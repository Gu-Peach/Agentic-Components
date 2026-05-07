import { Quaternion, Vector3 } from 'three';
import IKChain from './IKChain';
import IKJoint from './IKJoint';

type ThreeVector3 = InstanceType<typeof Vector3>;

const endEffectorWorldPosition = new Vector3();
const endEffectorWorldToLocalPosition = new Vector3();
const targetWorldToLocalPosition = new Vector3();
const fromToQuaternion = new Quaternion();
const inverseQuaternion = new Quaternion();
const jointAxisAfterRotation = new Vector3();

export default function ccdIKSolver(
  ikChain: IKChain,
  targetPosition: ThreeVector3,
  tolerance: number,
  maxNumOfIterations: number,
) {
  const { ikJoints, endEffector } = ikChain;
  if (!endEffector) {
    return;
  }

  let targetDistance = endEffector
    .worldToLocal(targetWorldToLocalPosition.copy(targetPosition))
    .length();
  let iteration = 0;

  while (targetDistance > tolerance && iteration <= maxNumOfIterations) {
    for (let index = ikJoints.length - 2; index >= 0; index -= 1) {
      solveJoint(ikJoints[index], endEffector, targetPosition);
    }

    targetDistance = endEffector
      .worldToLocal(targetWorldToLocalPosition.copy(targetPosition))
      .length();
    iteration += 1;
  }
}

function solveJoint(
  ikJoint: IKJoint,
  endEffector: IKJoint,
  targetPosition: ThreeVector3,
) {
  if (ikJoint.isFixed) {
    ikJoint.updateMatrixWorld();
    return;
  }

  endEffector.getWorldPosition(endEffectorWorldPosition);

  const directionToEndEffector = ikJoint
    .worldToLocal(endEffectorWorldToLocalPosition.copy(endEffectorWorldPosition))
    .normalize();

  const directionToTarget = ikJoint
    .worldToLocal(targetWorldToLocalPosition.copy(targetPosition))
    .normalize();

  fromToQuaternion.setFromUnitVectors(directionToEndEffector, directionToTarget);
  ikJoint.quaternion.multiply(fromToQuaternion);

  if (ikJoint.isHinge || ikJoint.isRootJoint) {
    inverseQuaternion.copy(ikJoint.quaternion).invert();
    jointAxisAfterRotation.copy(ikJoint.axis).applyQuaternion(inverseQuaternion);
    fromToQuaternion.setFromUnitVectors(ikJoint.axis, jointAxisAfterRotation);
    ikJoint.quaternion.multiply(fromToQuaternion);
  }

  clampJoint(ikJoint);
  ikJoint.updateMatrixWorld();
}

function clampJoint(ikJoint: IKJoint) {
  if (!ikJoint.limit) {
    return;
  }

  const axisName = ikJoint.axisName;
  if (!axisName) {
    return;
  }

  const axisValue = ikJoint.axis[axisName];
  if (Math.abs(axisValue) < 0.001) {
    return;
  }

  const sinHalf = ikJoint.quaternion[axisName] / axisValue;
  const angle = Math.atan2(sinHalf, ikJoint.quaternion.w) * 2;
  const clamped = Math.min(
    Math.max(angle, ikJoint.limit.lower),
    ikJoint.limit.upper,
  );

  if (Math.abs(clamped - angle) > 0.0001) {
    ikJoint.quaternion.setFromAxisAngle(ikJoint.axis, clamped);
  }
}
