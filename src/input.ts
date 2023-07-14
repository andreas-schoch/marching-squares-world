import { Vector2 } from "./utils/vector";

type Action = "moveUp" | "moveLeft" | "moveDown" | "moveRight" | "leftMouseButton" | "rightMouseButton" | "jump" | "shift" | "dig" | "arrowUp" | "arrowDown" | "arrowLeft" | "arrowRight" | "q";
type MouseAction = "leftMouseButton" | "rightMouseButton";

interface IInputMapping {
  key?: string;
  active: boolean;
  type: "action" | "mouse";
  listeners: {
    onPress: Array<(evt: KeyboardEvent | MouseEvent) => void>;
    onRelease: Array<(evt: KeyboardEvent | MouseEvent) => void>;
  };
  direction?: Vector2;
}

export class InputComponent {
  direction: Vector2;
  mousePos: Vector2 | null;
  lastMouseMoveEvent: MouseEvent | null;
  _mappings: Record<Action | MouseAction, IInputMapping>;
  private _reverseMappings: Record<string, Action>;
  private _inputHandlers: { mouse: (evt: any, currentInput: any) => void; action: (evt: any, currentInput: any) => void; };

  constructor() {
    this.direction = [0, 0];
    this.mousePos = null;
    this.lastMouseMoveEvent = null;
    // TODO if feasible get rid of type property. It seems unnecessary here
    // TODO instead of hardcoding it here like this, it should read the mappings from a config file (json) which then is used to create this object
    // TODO instead of having a single direction property hardcoded, pass a direction interface with a unique identifier and the direction vector
    //      then a direction can be accessed by that identifier to get the value (allowing multiple directional inputs)
    this._mappings = {
      leftMouseButton: {active: false, type: "mouse", listeners: {onPress: [], onRelease: []}},
      rightMouseButton: {active: false, type: "mouse", listeners: {onPress: [], onRelease: []}},
      moveUp: {key: "w", active: false, type: "action", listeners: {onPress: [], onRelease: []}, direction: [0, -1]},
      moveLeft: {key: "a", active: false, type: "action", listeners: {onPress: [], onRelease: []}, direction: [-1, 0]},
      moveDown: {key: "s", active: false, type: "action", listeners: {onPress: [], onRelease: []}, direction: [0, 1]},
      moveRight: {key: "d", active: false, type: "action", listeners: {onPress: [], onRelease: []}, direction: [1, 0]},
      jump: {key: " ", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      shift: {key: "Shift", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      dig: {key: "x", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      arrowUp: {key: "arrowUp", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      arrowDown: {key: "arrowDown", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      arrowLeft: {key: "arrowLeft", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      arrowRight: {key: "arrowRight", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
      q: {key: "q", active: false, type: "action", listeners: {onPress: [], onRelease: []}},
    };

    this._reverseMappings = {
      'button 0': 'leftMouseButton',
      'button 1': 'rightMouseButton',
      'key w': 'moveUp',
      'key a': 'moveLeft',
      'key s': 'moveDown',
      'key d': 'moveRight',
      'key  ': 'jump',
      'key Shift': 'shift',
      'key x': 'dig',
      'key ArrowUp': 'arrowUp',
      'key ArrowDown': 'arrowDown',
      'key ArrowLeft': 'arrowLeft',
      'key ArrowRight': 'arrowRight',
      'key q': 'q'
    };

    this._inputHandlers = {
      mouse: this._handleMouseInput.bind(this),
      action: this._handleActionInput.bind(this),
    }
  }

  register = (action: Action | MouseAction, onPress?: () => void, onRelease?: () => void) => {
    const m = this._mappings[action];
    if (m){
      if (onPress) this._mappings[action].listeners.onPress.push(onPress);
      if (onRelease) this._mappings[action].listeners.onRelease.push(onRelease);
    } else {
      console.error(`The action: ${action} does not exist. Callback could not be registered`);
    }
  };

  _handleInput = (evt: KeyboardEvent | MouseEvent) => {
    const currentInput = this._getCurrentInput(evt);
    if (currentInput) {
      this._inputHandlers[currentInput.type](evt, currentInput);
    }
  };

  _getCurrentInput = (evt: KeyboardEvent | MouseEvent): IInputMapping => {
    const isMouseEvent = (evt as MouseEvent).button !== undefined;
    const prefix = isMouseEvent ? 'button' : 'key';
    const inputName = this._reverseMappings[`${prefix} ${isMouseEvent ? (evt as MouseEvent).button : (evt as KeyboardEvent).key}`];
    return this._mappings[inputName];
  };

  _handleDirectionInput(evt: KeyboardEvent, currentInput: IInputMapping) {
    if (!currentInput.direction) return;
    if (!currentInput.active) {
      this.direction[0] += currentInput.direction[0];
      this.direction[1] += currentInput.direction[1];
    } else if (currentInput.active && evt.type === 'keyup') {
      this.direction[0] -= currentInput.direction[0];
      this.direction[1] -= currentInput.direction[1];
    }
  }

  _handleActionInput(evt: KeyboardEvent, currentInput: IInputMapping) {
    if (currentInput.direction) {
      this._handleDirectionInput(evt, currentInput);
    }

    if (!currentInput.active) {
      currentInput.listeners.onPress.forEach(fn => fn(evt));
    } else if (currentInput.active && evt.type === 'keyup') {
      currentInput.listeners.onRelease.forEach(fn => fn(evt));
    }
    currentInput.active = evt.type === 'keydown';
  }

  _handleMouseInput = (evt: MouseEvent, currentInput: IInputMapping) => {
    if (!currentInput.active && evt.type === 'mousedown') {
      currentInput.listeners.onPress.forEach(fn => fn(evt));
    } else if (currentInput.active && evt.type === 'mouseup') {
      currentInput.listeners.onRelease.forEach(fn => fn(evt));
    }
    currentInput.active = evt.type === 'mousedown';
  };

  _handleMouseMove = (evt: MouseEvent) => {
    // TODO rethink this. Not sure if best approach to store event object and use it when necessary. Maybe only store mouse position
    this.lastMouseMoveEvent = evt;
  };

  initListeners = (element: HTMLElement) => {
    element.addEventListener("keydown", this._handleInput);
    element.addEventListener("keyup", this._handleInput);
    element.addEventListener("mousedown", this._handleInput);
    element.addEventListener("mouseup", this._handleInput);
    element.addEventListener("mousemove", this._handleMouseMove);
  };
}

// FIXME input sometimes not released when pressing multiple keys
