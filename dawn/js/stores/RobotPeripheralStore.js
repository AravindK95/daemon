/**
 * Stores data sourced from a physical remote robot.
 * Includes motor and sensor data.
 */
import AppDispatcher from '../dispatcher/AppDispatcher';
import {ActionTypes, PeripheralTypes} from '../constants/Constants';
import {EventEmitter} from 'events';
import assign from 'object-assign';
import _ from 'lodash';

// Private data.
let _peripheralData = {
  motors: {},
  peripherals: {}
}

let RobotPeripheralStore = assign({}, EventEmitter.prototype, {
  emitChange() {
    this.emit('change');
  },
  getMotors() {
    return _.toArray(_peripheralData.motors);
  },
  getPeripherals() {
    return _.toArray(_peripheralData.peripherals);
  }
});

/**
 * Remove the motor from the motors list. Helper for handleUpdateMotor.
 */
function reapMotor(id) {
  _peripheralData.motors[id].reaper = setTimeout(() => {
    delete _peripheralData.motors[id];
    RobotPeripheralStore.emitChange();
  }, 1000);
  RobotPeripheralStore.emitChange();
}

/**
 * Remove the peripheral from the peripherals list. Helper for handleUpdatePeripheral.
 */
function reapPeripheral(id) {
  _peripheralData.peripherals[id].reaper = setTimeout(() => {
    delete _peripheralData.peripherals[id];
    RobotPeripheralStore.emitChange();
  }, 1000);
  RobotPeripheralStore.emitChange();
}

/**
 * Handles receiving an UPDATE_MOTOR action. */
function handleUpdateMotor(action) {
  // Get the motor from the motors dictionary.
  let motor = _peripheralData.motors[action.id];

  // Check if our motor exists and has a reaper.
  // If so, stop the reaper.
  // If not, make a new empty object and call that the motor.
  if (motor != null && motor.reaper != null) {
    clearTimeout(motor.reaper);
  } else {
    motor = {id: action.id, peripheralType: PeripheralTypes.MOTOR_SCALAR};
    _peripheralData.motors[action.id] = motor;
  }

  // Assign properties from the action.
  motor.value = action.value;

  // Assign a new reaper, which will remove this motor if
  // no updates are received after some number of milliseconds.
  motor.reaper = setTimeout(reapMotor, 1000, action.id);
  // Notify listeners that the motors have been updated.
  RobotPeripheralStore.emitChange();
}

/**
 * Handles receiving an UPDATE_PERIPHERAL action.
 */
function handleUpdatePeripheral(action) {
  let peripheral = _peripheralData.peripherals[action.peripheral.id];

  if (peripheral != null && peripheral.reaper != null) {
    clearTimeout(peripheral.reaper);
  } else {
    peripheral = action.peripheral;
    _peripheralData.peripherals[action.peripheral.id] = peripheral;
  }

  peripheral.value = action.peripheral.value;
  peripheral.reaper = setTimeout(reapPeripheral, 1000, action.peripheral.id);
  RobotPeripheralStore.emitChange();
}

function handleUpdateName(action) {
  _peripheralData.idsToName[action.id] = action.newName;
  RobotPeripheralStore.emitChange();
}

RobotPeripheralStore.dispatchToken = AppDispatcher.register((action) => {
  switch (action.type) {
    case ActionTypes.UPDATE_MOTOR:
      handleUpdateMotor(action);
      break;
    case ActionTypes.UPDATE_PERIPHERAL:
      handleUpdatePeripheral(action);
      break;
  }
});

export default RobotPeripheralStore;
