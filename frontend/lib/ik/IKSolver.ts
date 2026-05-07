import { Object3D, Quaternion } from 'three';
import IKChain from './IKChain';
import ccdIKSolver from './ccdIKSolver';

type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeQuaternion = InstanceType<typeof Quaternion>;

export default class IKSolver {
  private _ikChain: IKChain | null = null;
  private _target: ThreeObject3D | null = null;
  private _tempQuaternion: ThreeQuaternion = new Quaternion();
  private _parentWorldQuaternion: ThreeQuaternion = new Quaternion();

  public tolerance: number;
  public maxNumOfIterations: number;
  public shouldUpdateGLB: boolean;

  constructor(config: {
    tolerance?: number;
    maxNumOfIterations?: number;
    shouldUpdateGLB?: boolean;
  } = {}) {
    this.tolerance = config.tolerance ?? 0.001;
    this.maxNumOfIterations = config.maxNumOfIterations ?? 50;
    this.shouldUpdateGLB = config.shouldUpdateGLB ?? true;
  }

  get ikChain() {
    return this._ikChain;
  }

  set ikChain(newIkChain: IKChain | null) {
    this._ikChain = newIkChain;
  }

  set target(newTarget: ThreeObject3D | null) {
    this._target = newTarget;
  }

  solve() {
    if (!this._ikChain || !this._target) {
      return;
    }

    ccdIKSolver(
      this._ikChain,
      this._target.position,
      this.tolerance,
      this.maxNumOfIterations,
    );

    if (this.shouldUpdateGLB) {
      this.updateGLBNodes();
    }
  }

  private updateGLBNodes() {
    if (!this._ikChain) {
      return;
    }

    const { ikJoints, urdfJoints, restWorldQuaternions } = this._ikChain;

    for (let index = 0; index < urdfJoints.length; index += 1) {
      const ikJoint = ikJoints[index + 1];
      const glbNode = urdfJoints[index];

      ikJoint.getWorldQuaternion(this._tempQuaternion);

      if (glbNode.parent) {
        glbNode.parent.getWorldQuaternion(this._parentWorldQuaternion);
      } else {
        this._parentWorldQuaternion.identity();
      }

      glbNode.quaternion
        .copy(this._parentWorldQuaternion)
        .invert()
        .multiply(this._tempQuaternion)
        .multiply(restWorldQuaternions[index]);
    }
  }
}
