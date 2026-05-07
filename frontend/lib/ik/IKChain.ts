import { Euler, Group, Object3D, Quaternion, Vector3 } from 'three';
import IKJoint from './IKJoint';
import type { JointLimit, VectorPoint } from '@/lib/simulation/types';

export type JointConfig = {
  type: string;
  axis: VectorPoint;
  limit?: JointLimit;
  origin?: VectorPoint;
};

type ThreeGroup = InstanceType<typeof Group>;
type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeQuaternion = InstanceType<typeof Quaternion>;

export default class IKChain {
  private _ikJoints: IKJoint[] = [];
  private _urdfJoints: ThreeObject3D[] = [];
  private _restWorldQuaternions: ThreeQuaternion[] = [];
  private _rootJoint: IKJoint | null = null;
  private _endEffector: IKJoint | null = null;

  get ikJoints() {
    return this._ikJoints;
  }

  get endEffector() {
    return this._endEffector;
  }

  get urdfJoints() {
    return this._urdfJoints;
  }

  get restWorldQuaternions() {
    return this._restWorldQuaternions;
  }

  createFromConfig(
    jointConfigs: JointConfig[],
    glbNodes: ThreeObject3D[],
    rootParent: ThreeGroup,
  ) {
    this._rootJoint = new IKJoint();
    this.addJoint(rootParent, this._rootJoint);

    let parentJoint: IKJoint = this._rootJoint;

    for (let index = 0; index < jointConfigs.length; index += 1) {
      const config = jointConfigs[index];
      const glbNode = glbNodes[index];
      const worldQuaternion = new Quaternion();

      glbNode.getWorldQuaternion(worldQuaternion);
      this._restWorldQuaternions.push(worldQuaternion);

      const worldAxis = new Vector3(config.axis.x, config.axis.y, config.axis.z)
        .applyQuaternion(worldQuaternion)
        .normalize();

      const ikJoint = new IKJoint({
        position: toVector3(config.origin),
        rotation: new Euler(0, 0, 0),
        jointType: config.type,
        axis: worldAxis,
        limit: config.limit,
      });

      this._urdfJoints.push(glbNode);
      this.addJoint(parentJoint, ikJoint);
      parentJoint = ikJoint;
    }

    this._endEffector = parentJoint;
    return this;
  }

  private addJoint(parent: IKJoint | ThreeGroup, ikJoint: IKJoint) {
    parent.add(ikJoint);
    this._ikJoints.push(ikJoint);
  }
}

function toVector3(point?: VectorPoint) {
  return new Vector3(point?.x ?? 0, point?.y ?? 0, point?.z ?? 0);
}
