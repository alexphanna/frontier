import { game } from '../../main.js';

export class Selector extends HTMLDivElement {
    constructor(options, colors = [], bold = true) {
        super();
        
        for (let i = 0; i < options.length; i++) {
            let optionDiv = document.createElement('div');
            optionDiv.style.display = 'flex';
            optionDiv.style.alignItems = 'center';
            optionDiv.style.marginBottom = '10px';

            let checkButton = document.createElement('button');
            checkButton.classList.add('smallButton');
            checkButton.textContent = '✓';
            checkButton.style.marginRight = '10px';
            checkButton.style.border = '2px solid #80808080';
            checkButton.addEventListener('click', () => {
                checkButton.textContent = checkButton.textContent === '✓' ? ' ' : '✓';
            });
            optionDiv.appendChild(checkButton);

            let optionHeading = document.createElement('h3');
            optionHeading.textContent = options[i];
            optionHeading.style.fontWeight = bold ? 'bold' : 'normal';
            if (options.length === colors.length) optionHeading.style.color = colors[i];
            optionDiv.appendChild(optionHeading);

            this.appendChild(optionDiv);
        }
    }
}

customElements.define('selector-element', Selector, { extends: 'div' });

export class PlayerSelector extends Selector {
    constructor() {
        super(game.players.map(player => player.name), game.players.map(player => player.color));      
    }
}

customElements.define('player-selector', PlayerSelector, { extends: 'div' });