class actionButton extends HTMLButtonElement {
    constructor(action, onclick, width = "100%") {
        super();
        this.classList.add('actionButton');
        this.style.width = width;
        this.textContent = action;
        this.addEventListener('click', onclick);
    }
}

export default class actionNav extends HTMLDivElement {
    constructor() {
        super();
    }
    // reduce repeated code in append and prepend
    appendAction(action, onclick, width = "100%") {
        const button = new actionButton(action, onclick);
        let row;
        if (width === "50%") {
            if (this.getElementsByClassName('actionButton').length % 2 === 0) {
                if (this.getElementsByClassName('actionNav').length > 0) {
                    let previousRow = this.getElementsByClassName('actionNav')[this.children.length - 1];
                    for (let button of previousRow.getElementsByClassName('actionButton')) {
                        button.style.borderBottom = '1px solid #80808080';
                    }
                }
                row = document.createElement('div');
                row.classList.add('actionNav');
                this.appendChild(row);
            }
            else {        
                row = this.getElementsByClassName('actionNav')[this.children.length - 1];
                let leftButton = row.getElementsByClassName('actionButton')[0];
                leftButton.style.borderRight = '1px solid #80808080';
                button.style.borderLeft = '1px solid #80808080';
            }
        }
        else if (width === "100%") {
            if (this.getElementsByClassName('actionNav').length > 0) {
                let previousRow = this.getElementsByClassName('actionNav')[this.children.length - 1];
                for (let button of previousRow.getElementsByClassName('actionButton')) {
                    button.style.borderBottom = '1px solid #80808080';
                }
            }
            row = document.createElement('div');
            row.classList.add('actionNav');
            this.appendChild(row);
        }
        if (this.getElementsByClassName('actionNav').length > 1) {
            button.style.borderTop = '1px solid #80808080';
        }
        row.appendChild(button);
    }
    prependAction(action, onclick, width = "100%") {
        const button = new actionButton(action, onclick);
        let row;
        if (width === "50%") {
            if (this.getElementsByClassName('actionButton').length % 2 === 0) {
                if (this.getElementsByClassName('actionNav').length > 0) {
                    let previousRow = this.getElementsByClassName('actionNav')[0];
                    for (let button of previousRow.getElementsByClassName('actionButton')) {
                        button.style.borderTop = '1px solid #80808080';
                    }
                }
                row = document.createElement('div');
                row.classList.add('actionNav');
                this.insertBefore(row, this.firstChild);
            }
            else {        
                row = this.getElementsByClassName('actionNav')[0];
                let rightButton = row.getElementsByClassName('actionButton')[0];
                rightButton.style.borderLeft = '1px solid #80808080';
                button.style.borderRight = '1px solid #80808080';
            }
        }
        else if (width === "100%") {
            if (this.getElementsByClassName('actionNav').length > 0) {
                let previousRow = this.getElementsByClassName('actionNav')[0];
                for (let button of previousRow.getElementsByClassName('actionButton')) {
                    button.style.borderTop = '1px solid #80808080';
                }
            }
            row = document.createElement('div');
            row.classList.add('actionNav');
            this.insertBefore(row, this.firstChild);
        }
        if (this.getElementsByClassName('actionNav').length > 1) {
            button.style.borderBottom = '1px solid #80808080';
        }
        row.appendChild(button);
    }
}

customElements.define('action-button', actionButton, { extends: 'button' });
customElements.define('action-nav', actionNav, { extends: 'div' });