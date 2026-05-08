import type { DeviceType } from '@/types/scene';

export const defaultFields: Record<DeviceType, readonly (readonly [string, string])[]> = {
  robot: [
    ['Name', 'ARC-2000i #2'],
    ['Material', 'dark_grey'],
    ['Visible', 'Enabled'],
    ['BOM', 'Visual Components ARC-2000i'],
    ['Category', 'Robots'],
    ['Axis1', '0'],
    ['Axis2', '-22.584'],
    ['Axis3', '27.359'],
    ['Axis4', '0'],
    ['Axis5', '50.226'],
    ['Axis6', '0'],
  ],
  conveyor: [
    ['Name', 'Conveyor Feed 01'],
    ['Length', '1000'],
    ['Width', '600'],
    ['Height', '800'],
    ['Speed', '200 mm/s'],
  ],
  lift: [
    ['Name', 'Lift Shuttle 01'],
    ['nodeName', 'LiftNode'],
    ['carrierNodeName', 'Carrier_00'],
    ['Speed', '0.5 m/s'],
  ],
  storage: [
    ['Name', 'Storage Rack A'],
    ['Cells', '8'],
    ['Allocation', 'FIFO'],
  ],
  workpiece: [
    ['Name', 'Workpiece'],
    ['Category', 'Workpiece'],
    ['Visible', 'Enabled'],
  ],
};

export const simulationFields: Record<DeviceType, readonly (readonly [string, string])[]> = {
  robot: [
    ['Executor', 'Executor'],
    ['Workspace', 'WorkSpace'],
    ['Signal Action', 'SignalAction'],
    ['PDF Export Level', 'Complete'],
    ['Simulation Level', 'Detailed'],
  ],
  conveyor: [
    ['StartOffset', '0'],
    ['EndOffset', '0'],
  ],
  lift: [
    ['rootAxis', 'x'],
    ['carrierAxis', 'y'],
    ['rootRange', '-4.142 ~ 0.858'],
    ['carrierRange', '0.185 ~ 3.160'],
  ],
  storage: [
    ['cells', 'A1 ~ A8'],
    ['allocation', 'FIFO'],
  ],
  workpiece: [
    ['MotionInterface', 'bottom'],
    ['GraspInterface', 'top'],
  ],
};
