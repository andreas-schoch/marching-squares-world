class InputComponent {
    constructor() {
        this.direction = [0, 0];
        this._mappings = {
            leftMouseButton: { active: false, type: "mouse", listeners: {onPress: [], onRelease: [] } },
            rightMouseButton: { active: false, type: "mouse", listeners: {onPress: [], onRelease: [] } },
            moveUp: { key: "w", active: false, type: "direction", listeners: { onPress: [], onRelease: [] }, direction: [0, -1] },
            moveLeft: { key: "a", active: false, type: "direction", listeners: { onPress: [], onRelease: [] }, direction: [-1, 0] },
            moveDown: { key: "s", active: false, type: "direction", listeners: { onPress: [], onRelease: [] }, direction: [0, 1] },
            moveRight: { key: "d", active: false, type: "direction", listeners: { onPress: [], onRelease: [] }, direction: [1, 0] },
            jump: { key: " ", active: false, type: "action", listeners: { onPress: [], onRelease: [] } },
        };

        this._reverseMappings = {
            'button 0': 'leftMouseButton',
            'button 1': 'rightMouseButton',
            'key w': 'moveUp',
            'key a': 'moveLeft',
            'key s': 'moveDown',
            'key d': 'moveRight',
            'key  ': 'jump',
        };

        this._inputHandlers = {
            mouse: this._handleMouseInput,
            direction: this._handleDirectionInput,
            action: this._handleActionInput,
        }
    }

    register =  function(action, fn, triggerOnRelease = false) {
        if (this._mappings[action]) {
            const trigger = triggerOnRelease ? 'onRelease' : 'onPress';
            this._mappings[action].listeners[trigger].push(fn);
        } else {
            console.error(`The action: ${action} does not exist. Callback ${fn} could not be registered`);
        }
    };

    _handleInput =  (evt) => {
        const currentInput = this._getCurrentInput(evt);
        if (currentInput) {
            this._inputHandlers[currentInput.type](evt, currentInput);
        }
    };

    _getCurrentInput = (evt) => {
        const prefix = evt.hasOwnProperty('button') ? 'button' : 'key';
        const inputName = this._reverseMappings[`${prefix} ${evt[prefix]}`];
        return this._mappings[inputName];
    };

    _handleDirectionInput(evt, currentInput) {
        if (!currentInput.active) {
            this.direction[0] += currentInput.direction[0];
            this.direction[1] += currentInput.direction[1];
            console.log('press', evt.key);
        } else if (currentInput.active && evt.type === 'keyup') {
            this.direction[0] -= currentInput.direction[0];
            this.direction[1] -= currentInput.direction[1];
            console.log('release', evt.key);
        }
        currentInput.active = evt.type === 'keydown';
    }

    _handleActionInput(evt, currentInput) {
        if (!currentInput.active) {
            console.log('action triggered');
            currentInput.listeners.press.forEach(fn => fn(evt));
        } else if (currentInput.active && evt.type === 'keyup') {
            console.log('action released');
            currentInput.listeners.release.forEach(fn => fn(evt));
        }
        currentInput.active = evt.type === 'keydown';
    }

    _handleMouseInput = (evt, currentInput) => {
        if (!currentInput.active) {
            console.log('mouse button triggered', currentInput);
            currentInput.listeners.press.forEach(fn => fn(evt));
        } else if (currentInput.active && evt.type === 'keyup') {
            console.log('mouse button released');
            currentInput.listeners.release.forEach(fn => fn(evt));
        }
        currentInput.active = evt.type === 'keydown';
    };

    initListeners = (element) => {
        element.addEventListener("keydown", this._handleInput);
        element.addEventListener("keyup", this._handleInput);
        element.addEventListener("mousedown", this._handleInput);
        element.addEventListener("mouseup", this._handleInput);
    };
}


const input = new InputComponent();
