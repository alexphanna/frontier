import { Notification, createButton } from './notifications.js';
import { game, server } from '../../main.js';

export function createRobber(radius) {
    let robber = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    robber.setAttribute("r", radius);
    robber.setAttribute("fill", "#000000C0");
    
    return robber;
}

export class RobberInput extends Notification {
    constructor(names) {
        super("Robber", 0);

        this.heading.style.fontWeight = 'bold';
        
        for (let name of names) {
            let playerButton = createButton(name.toUpperCase());
            playerButton.style.color = game.players.find(myPlayer => myPlayer.name === name).color;
            playerButton.addEventListener('click', () => {
                server.send(`rob ${name}`);
                this.remove();
            });
            this.appendChild(playerButton);
        }
    }
}

customElements.define('robber-input', RobberInput, { extends: 'div' });