import { game, player, server } from '../main.js';

function createButton(text) {
    let button = document.createElement('button');
    button.textContent = text;
    button.style.margin = '10px';
    return button;
};

export function removeZeroes(obj) {
    for (let key in obj) {
        if (obj[key] === 0) {
            delete obj[key];
        }
    }
    return obj;
}

export class ResourceInput {
    constructor(limits = {}, limit = 0) {
        this.resources = {
            "brick": 0,
            "grain": 0,
            "lumber": 0,
            "ore": 0,
            "wool": 0
        }
        this.input = document.createElement('div');
        for (let resource of Object.keys(this.resources)) {
            let resourceDiv = document.createElement('div');
            resourceDiv.style.display = 'flex';
            resourceDiv.style.alignItems = 'center';
            resourceDiv.style.justifyContent = 'space-between';

            let resourceHeading = document.createElement('h3');
            resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + this.resources[resource];
            resourceDiv.appendChild(resourceHeading);

            let resourceButtons = document.createElement('div');
            resourceButtons.style.display = 'flex';

            let minusButton = document.createElement('button');
            minusButton.classList.add('smallButton');
            minusButton.textContent = '-';
            minusButton.disabled = true;
            minusButton.addEventListener('click', () => {
                this.resources[resource]--;
                minusButton.disabled = this.resources[resource] === 0;
                resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + this.resources[resource];
                if (limit != 0) {
                    for (let button of this.input.getElementsByClassName('plusButton')) {
                        button.disabled = false;
                    }
                }
                else if (limits != {}) {
                    plusButton.disabled = false;
                }
            });
            resourceButtons.appendChild(minusButton);

            let plusButton = document.createElement('button');
            plusButton.classList.add('smallButton', 'plusButton');
            plusButton.textContent = '+';
            plusButton.disabled = (limits != {} && this.resources[resource] === limits[resource]);
            plusButton.addEventListener('click', () => {
                this.resources[resource]++;
                minusButton.disabled = this.resources[resource] === 0;
                resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + this.resources[resource];
                if (limit != 0) {
                    for (let button of this.input.getElementsByClassName('plusButton')) {
                        button.disabled = Object.values(this.resources).reduce((a, b) => a + b) === limit;
                    }
                }
                else if (limits != {}) {
                    plusButton.disabled = this.resources[resource] === limits[resource];
                }
            });
            resourceButtons.appendChild(plusButton);

            resourceDiv.appendChild(resourceButtons);
            this.input.appendChild(resourceDiv);
        }
    }
}

export class Notification {
    constructor(message, duration = 5000) {
        this.notification = document.createElement('div');
        this.notification.classList.add('interface', 'notification');

        this.heading = document.createElement('h3');
        this.heading.textContent = message;
        this.heading.style.margin = '10px';
        this.notification.appendChild(this.heading);

        this.notifications = document.getElementById('notifications');
        this.notification.style.textAlign = 'center';
        this.notifications.appendChild(this.notification);

        const removeNotification = () => this.notifications.removeChild(this.notification);

        if (duration !== 0) {
            let countdown = document.createElement('div');
            countdown.classList.add('countdown');
            let elapsedTime = 0;
            this.notification.appendChild(countdown);
            let interval = setInterval(() => {
                elapsedTime += 10;
                countdown.style.width = `${((duration - elapsedTime) / duration) * 100}%`;
                if (elapsedTime >= duration) {
                    removeNotification();
                    clearInterval(interval);
                }
            }, 10);
        }
    }
}

export class ErrorNotification extends Notification {
    constructor(message, duration = 5000) {
        super(message, duration);

        this.heading.style.color = '#FF2040';
    }
}

export class TradeNotification extends Notification {
    constructor(name, you, them, id, duration = 5000) {
        super(name, duration);

        this.heading.style.fontWeight = 'bold';
        this.heading.style.color = game.players.find(player => player.name === name).color;
        let span = document.createElement('span');
        span.textContent = `: ${this.stringifyResources(JSON.parse(them))} → ${this.stringifyResources(JSON.parse(you))}`;
        this.heading.appendChild(span);
        
        const removeTradeOffer = () => this.notifications.removeChild(this.notification);

        let buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.flexDirection = 'row-reverse';
        let acceptButton = createButton('ACCEPT');
        acceptButton.addEventListener('click', () => {
            server.send(`trade accept ${name} ${you} ${player.name} ${them} ${id}`);
            removeTradeOffer();
        });
        buttons.appendChild(acceptButton);
        let declineButton = createButton('DECLINE');
        declineButton.addEventListener('click', removeTradeOffer);
        buttons.appendChild(declineButton);
        this.notification.appendChild(buttons);
    }

    static stringifyResources(resources) {
        let string = '';
        for (let resource in resources) {
            string += `${resources[resource]} ${resource}`;
            if (Object.keys(resources).length == 2) {
                if (Object.keys(resources).indexOf(resource) == 0) {
                    string += ' and ';
                }
            }
            else if (Object.keys(resources).indexOf(resource) != Object.keys(resources).length - 1) {
                if (Object.keys(resources).indexOf(resource) == Object.keys(resources).length - 2) {
                    string += ' and ';
                }
                else {
                    string += ', ';
                }
            }
        }
        return string;
    }
}

export class YearOfPlentyInput extends Notification {
    constructor() {
        super("Year of Plenty", 0);

        this.heading.style.fontWeight = 'bold';

        let selector = new ResourceInput({}, 2);
        selector.input.style.margin = '10px';
        this.notification.appendChild(selector.input);


        let confirmButton = createButton('CONFIRM');
        confirmButton.addEventListener('click', () => {
            server.send(`progress yearOfPlenty ${JSON.stringify(removeZeroes(selector.resources))}`);
            this.notifications.removeChild(this.notification);
        });

        this.notification.appendChild(confirmButton);
    }
}

export class MonopolyInput extends Notification {
    constructor() {
        super("Monopoly", 0);

        this.heading.style.fontWeight = 'bold';

        const resources = ['brick', 'grain', 'lumber', 'ore', 'wool'];
        for (let resource of resources) {
            let button = createButton(resource.toUpperCase());
            button.addEventListener('click', () => {
                server.send(`progress monopoly ${resource}`);
                this.notifications.removeChild(this.notification);
            });
            this.notification.appendChild(button);
        }

        this.notifications.appendChild(this.notification);
    }
}

export class KnightInput extends Notification {
    constructor(names) {
        super("Knight", 0);

        this.heading.style.fontWeight = 'bold';
        
        for (let name of names) {
            let playerButton = createButton(name.toUpperCase());
            playerButton.style.color = game.players.find(player => player.name === name).color;
            playerButton.addEventListener('click', () => {
                server.send(`knight ${name}`);
                this.notifications.removeChild(this.notification);
            });
            this.notification.appendChild(playerButton);
        }

        this.notifications.appendChild(this.notification);
    }
}