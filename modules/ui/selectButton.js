import { game, myPlayer } from '../../main.js';

export class SelectButton extends HTMLDivElement {
    constructor(textContent, onclick, options, colors = [], bold = true) {
        super();
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.alignItems = 'center';
        this.style.margin = '20px';
        this.style.marginTop = '40px';

        let button = document.createElement('div');
        button.style.display = 'flex';
        
        let primary = document.createElement('button');
        primary.textContent = textContent;
        primary.onclick = onclick;
        primary.style.margin='0px';
        primary.style.borderRight='1px solid #80808080';
        button.appendChild(primary);

        let secondary = document.createElement('button');
        secondary.textContent = '▼';
        secondary.style.margin='0px';
        secondary.style.width='30px';
        secondary.style.borderLeft='1px solid #80808080';
        secondary.style.display='flex';
        secondary.style.alignItems='center';
        secondary.style.justifyContent='center';
        secondary.onclick = () => {
            secondary.textContent = secondary.textContent === '▼' ? '▲' : '▼';
            let dropdownMenu = this.querySelectorAll('div')[1];
            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
        };
        button.appendChild(secondary);

        this.appendChild(button);

        let dropdownMenu = document.createElement('div');
        dropdownMenu.style.backgroundColor = '#20202080';
        dropdownMenu.style.width = '100%';
        dropdownMenu.style.display = 'none';

        this.selectedOptions = options;
        
        for (let i = 0; i < options.length; i++) {
            let optionDiv = document.createElement('div');
            optionDiv.style.display = 'flex';
            optionDiv.style.alignItems = 'center';
            optionDiv.style.margin = '10px';


            let checkButton = document.createElement('button');
            checkButton.classList.add('checkButton');
            checkButton.textContent = '✓';
            checkButton.style.marginRight = '10px';
            checkButton.addEventListener('click', () => {
                checkButton.textContent = checkButton.textContent === '✓' ? ' ' : '✓';
                if (checkButton.textContent === '✓') {
                    this.selectedOptions.push(options[i]);
                }
                else {
                    this.selectedOptions = this.selectedOptions.filter(option => option !== options[i]);
                }
            });
            optionDiv.appendChild(checkButton);

            let optionHeading = document.createElement('h3');
            optionHeading.textContent = options[i];
            optionHeading.style.fontWeight = bold ? 'bold' : 'normal';
            if (options.length === colors.length) optionHeading.style.color = colors[i];
            optionDiv.appendChild(optionHeading);

            dropdownMenu.appendChild(optionDiv);
        }

        this.appendChild(dropdownMenu);
    }
}

customElements.define('select-button', SelectButton, { extends: 'div' });

export class PlayerSelectButton extends SelectButton {
    constructor(textContent, onclick) {
        super(textContent, onclick, game.players.map(player => player.name).filter(name => name !== myPlayer.name), game.players.map(player => player.color).filter(color => color !== myPlayer.color));
    }
}

customElements.define('player-select-button', PlayerSelectButton, { extends: 'div' });