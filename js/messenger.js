class MessengerComponent {
    constructor() {
        this.listeners =  {};
    }
    emitMessage = (message, ...args) => {
        this.listeners[message].forEach((fn) => fn(...args));
    };

    onMessage = (message, fn) => {
        console.log("listener added: ", this.listeners);
        if (!this.listeners[message]) { this.listeners[message] = []; }
        this.listeners[message].push(fn);
    };
}
