import { Euler, Group, Vector3 } from 'three';
import type { JointLimit } from '@/lib/simulation/types';

const AXIS_NAMES = ['x', 'y', 'z'] as const;

type AxisName = (typeof AXIS_NAMES)[number];
type ThreeEuler = InstanceType<typeof Euler>;
type ThreeVector3 = InstanceType<typeof Vector3>;

type IKJointSource = {
  position: ThreeVector3;
  rotation: ThreeEuler;
  jointType: string;
  axis: ThreeVector3;
  limit?: JointLimit;
};

export default class IKJoint extends Group {
  public axis = new Vector3(0, 1, 0);
  public isRootJoint = true;
  public isHinge = false;
  public isFixed = false;
  public isIkJoint = true;
  public limit: JointLimit = { lower: 0, upper: 0 };

  constructor(source?: IKJointSource) {
    super();
    this.position.set(0, 0, 0);

    if (!source) {
      return;
    }

    this.position.copy(source.position);
    this.rotation.copy(source.rotation);
    this.isRootJoint = false;
    this.isHinge = source.jointType === 'revolute';
    this.isFixed = source.jointType === 'fixed';
    this.axis.copy(source.axis);
    this.limit = source.limit ?? { lower: -Math.PI, upper: Math.PI };
  }

  get axisName(): AxisName | null {
    const values = this.axis.toArray();
    let maxIndex = -1;
    let maxValue = 0;

    for (let index = 0; index < values.length; index += 1) {
      const value = Math.abs(values[index]);
      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    }

    return maxIndex >= 0 ? AXIS_NAMES[maxIndex] : null;
  }
}
