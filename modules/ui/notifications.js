import { game, myPlayer, server } from '../../main.js';

export function createButton(text) {
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

export class ResourceInput extends HTMLDivElement {
    constructor(limits = {}, max = 0,) {
        super();

        this.resources = {
            "brick": 0,
            "grain": 0,
            "lumber": 0,
            "ore": 0,
            "wool": 0
        }
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
                if (limits != {} && max != 0) {
                    const plusButtons = this.getElementsByClassName('plusButton');
                    for (let i = 0; i < plusButtons.length; i++) {
                        plusButtons[i].disabled = Object.values(this.resources).reduce((a, b) => a + b) === max || this.resources[Object.keys(this.resources)[i]] === limits[Object.keys(this.resources)[i]];
                    }
                }
                else if (max != 0) {
                    for (let button of this.getElementsByClassName('plusButton')) {
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
                if (limits != {} && max != 0) {
                    const plusButtons = this.getElementsByClassName('plusButton');
                    for (let i = 0; i < plusButtons.length; i++) {
                        plusButtons[i].disabled = Object.values(this.resources).reduce((a, b) => a + b) === max || this.resources[Object.keys(this.resources)[i]] === limits[Object.keys(this.resources)[i]];
                    }
                }
                else if (limits != {}) {
                    plusButton.disabled = this.resources[resource] === limits[resource];
                }
                else if (max != 0) {
                    for (let button of this.getElementsByClassName('plusButton')) {
                        button.disabled = Object.values(this.resources).reduce((a, b) => a + b) === max;
                    }
                }
            });
            resourceButtons.appendChild(plusButton);

            resourceDiv.appendChild(resourceButtons);
            this.appendChild(resourceDiv);
        }
    }
}

customElements.define('resource-input', ResourceInput, { extends: 'div' });

export class Notification extends HTMLDivElement {
    constructor(message, duration = 5000) {
        super();

        this.classList.add('interface', 'notification');
        this.style.textAlign = 'center';

        this.heading = document.createElement('h3');
        this.heading.textContent = message;
        this.heading.style.margin = '10px';
        this.appendChild(this.heading);

        const removeNotification = () => this.remove();

        if (duration !== 0) {
            let countdown = document.createElement('div');
            countdown.classList.add('countdown');
            let elapsedTime = 0;
            this.appendChild(countdown);
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

customElements.define('notification-element', Notification, { extends: 'div' });

export class ErrorNotification extends Notification {
    constructor(message, duration = 5000) {
        super(message, duration);

        this.heading.style.color = '#FF2040';
    }
}

customElements.define('error-notification', ErrorNotification, { extends: 'div' });

export class TradeNotification extends Notification {
    constructor(name, you, them, id) {
        super(name, 0);

        this.style.textAlign = 'left';
        this.id = id;

        this.heading.style.fontWeight = 'bold';
        this.heading.style.color = game.players.find(myPlayer => myPlayer.name === name).color;
        let span = document.createElement('span');
        span.textContent = `: ${TradeNotification.stringifyResources(JSON.parse(them))} → ${TradeNotification.stringifyResources(JSON.parse(you))}`;
        this.heading.appendChild(span);
        
        const removeTradeOffer = () => this.remove();

        let buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.flexDirection = 'row-reverse';
        let acceptButton = createButton('ACCEPT');
        acceptButton.addEventListener('click', () => {
            server.send(`trade accept ${name} ${you} ${myPlayer.name} ${them} ${id}`);
            removeTradeOffer();
        });
        buttons.appendChild(acceptButton);
        let declineButton = createButton('DECLINE');
        declineButton.addEventListener('click', removeTradeOffer);
        buttons.appendChild(declineButton);
        this.appendChild(buttons);
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

customElements.define('trade-notification', TradeNotification, { extends: 'div' });

export class YearOfPlentyInput extends Notification {
    constructor() {
        super("Year of Plenty: choose 2 resources to take from the bank.", 0);

        this.heading.style.fontWeight = 'bold';

        let selector = new ResourceInput({}, 2);
        this.appendChild(selector);

        let confirmButton = createButton('CONFIRM');
        confirmButton.addEventListener('click', () => {
            server.send(`progress yearOfPlenty ${JSON.stringify(removeZeroes(selector.resources))}`);
            this.remove();
        });

        this.appendChild(confirmButton);
    }
}

customElements.define('year-of-plenty-input', YearOfPlentyInput, { extends: 'div' });

export class DiscardInput extends Notification {
    constructor(resources) {
        super(`You have more than 7 resources, discard ${Object.values(resources).reduce((a, b) => a + b) - 7} of your resources.`, 0);

        this.heading.style.fontWeight = 'bold';

        let selector = new ResourceInput(resources, Object.values(resources).reduce((a, b) => a + b) - 7);
        this.appendChild(selector);

        let confirmButton = createButton('CONFIRM');
        confirmButton.addEventListener('click', () => {
            server.send(`discard ${JSON.stringify(removeZeroes(selector.resources))}`);
            this.remove();
        });

        this.appendChild(confirmButton);
    }
}

customElements.define('discard-input', DiscardInput, { extends: 'div' });

export class MonopolyInput extends Notification {
    constructor() {
        super("Monopoly: choose 1 resource to take all of from every player.", 0);

        this.heading.style.fontWeight = 'bold';

        const resources = ['brick', 'grain', 'lumber', 'ore', 'wool'];
        for (let resource of resources) {
            let button = createButton(resource.toUpperCase());
            button.addEventListener('click', () => {
                server.send(`progress monopoly ${resource}`);
                this.remove();
            });
            this.appendChild(button);
        }
    }
}

customElements.define('monopoly-input', MonopolyInput, { extends: 'div' });