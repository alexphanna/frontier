import { game, server, myPlayer } from '../main.js';
import { MonopolyInput, ResourceInput, YearOfPlentyInput, removeZeroes } from './notifications.js';
import { build } from "./actions.js"

function setActiveButton(button) {
    document.getElementById('buildButton').disabled = (button === 'build' ? true : false);
    document.getElementById('tradeButton').disabled = (button === 'trade' ? true : false);
    document.getElementById('chatButton').disabled = (button === 'chat' ? true : false);
}

export function showBuild() {
    setActiveButton('build');
    document.getElementById('actions').style.removeProperty('display');
    document.getElementById('chatInput').style.display = 'none';
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'left';
    for (let player of game.players) {
        let playerTitle = document.createElement('h2');
        playerTitle.textContent = player.name;
        playerTitle.style.color = player.color;
        playerTitle.style.fontWeight = 'bold';
        let playerPoints = document.createElement('span');
        playerPoints.textContent = ` (${player.points}`;
        if (player.developments['victoryPoint'] > 0) {
            playerPoints.textContent += (` + ${player.developments['victoryPoint']}`);
        }
        playerPoints.textContent += ')';
        playerTitle.appendChild(playerPoints);
        content.appendChild(playerTitle);

        if (player.specials["largestArmy"]) {
            let largestArmy = document.createElement('h3');
            largestArmy.textContent = 'Largest Army';
            largestArmy.style.fontWeight = 'bold';
            content.appendChild(largestArmy);
        }
        
        if (player.specials["longestRoad"]) {
            let longestRoad = document.createElement('h3');
            longestRoad.textContent = 'Longest Road';
            longestRoad.style.fontWeight = 'bold';
            content.appendChild(longestRoad);
        }

        let resourcesHeading = document.createElement('h3');
        resourcesHeading.textContent = 'Resources:';
        content.appendChild(resourcesHeading);
        if (player.name === myPlayer.name) {
            let resources = document.createElement('ul');
            for (let resource in player.resources) {
                resources.appendChild(document.createElement('li')).textContent = `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${player.resources[resource]}`;
            }
            content.appendChild(resources);
            let actionButtons = document.getElementById('actions').getElementsByTagName('button');
            for (let button of actionButtons) {
                if (button.id === 'settlementButton') {
                    // button.disabled = player.resources["brick"] < 1 || player.resources["lumber"] < 1 || player.resources["wool"] < 1 || player.resources["grain"] < 1;
                    button.textContent = `SETTLEMENT (${player.buildings["settlements"]})`;
                }
                else if (button.id === 'cityButton') {
                    // button.disabled = (player.resources["grain"] < 2 || player.resources["ore"] < 3);
                    button.textContent = `CITY (${player.buildings["cities"]})`;
                }
                else if (button.id === 'roadButton') {
                    // button.disabled = player.resources["brick"] < 1 || player.resources["lumber"] < 1;
                    button.textContent = `ROAD (${player.buildings["roads"]})`;
                }
                else if (button.id === 'developButton') {
                    // button.disabled = player.resources["grain"] < 1 || player.resources["wool"] < 1 || player.resources["ore"] < 1;
                }
            }
        }
        else {
            resourcesHeading.textContent += ` ${player.resources}`;
        }
        let developmentsHeading = document.createElement('h3');
        developmentsHeading.textContent = `Developments: ${myPlayer.name === player.name ? Object.values(player.developments).reduce((a, b) => a + b) : player.developments}`;
        content.appendChild(developmentsHeading);

        if (player.army > 0) {
            let knights = document.createElement('h3');
            knights.textContent = `Army: ${player.army}`;
            content.appendChild(knights);
        }

        content.appendChild(document.createElement('br'));

        if (player.name === myPlayer.name) {
            let developments = document.getElementById('developments');
            developments.innerHTML = '';
            const capitalize = (string) => {
                for (let i = 0; i < string.length; i++) {
                    if (string.charAt(i) === string.charAt(i).toUpperCase()) {
                        string = string.slice(0, i) + ' ' + string.charAt(i).toLowerCase() + string.slice(i + 1);
                    }
                }
                return string.toUpperCase();
            }
            for (let i = 0; i < Object.keys(player.developments).length; i++) {
                if (player.developments[Object.keys(player.developments)[i]] > 0
                    && Object.keys(player.developments)[i] !== 'victoryPoint') {
                    let developmentButton = document.createElement('button');
                    developmentButton.classList.add('developmentButton');
                    developmentButton.id = `${Object.keys(player.developments)[i]}Button`;
                    developmentButton.textContent = `${capitalize(Object.keys(player.developments)[i])} (${player.developments[Object.keys(player.developments)[i]]})`;
                    if (developmentButton.id === 'knightButton') {
                        developmentButton.addEventListener('click', () => {
                            game.knightPlayed = true;
                            new Notification('Move the robber');
                        });
                    }
                    else if (developmentButton.id === 'yearOfPlentyButton') {
                        developmentButton.addEventListener('click', () => {
                            new YearOfPlentyInput();
                        });
                    }
                    else if (developmentButton.id === 'monopolyButton') {
                        developmentButton.addEventListener('click', () => {
                            new MonopolyInput();
                        });
                    }
                    else if (developmentButton.id === 'roadBuildingButton') {
                        developmentButton.addEventListener('click', () => {
                            server.send('progress roadBuilding');
                            game.roadBuilding = true;
                            game.roadsBuilt = 0;
                            
                            build('road');
                            new Notification('Build two roads');
                        });
                    }
                    developments.appendChild(developmentButton);
                }
            }
        }
    }
}

export function showTrade() {
    setActiveButton('trade');
    document.getElementById('actions').style.display = 'none';
    document.getElementById('chatInput').style.display = 'none';
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'center';

    let youResourceInput = new ResourceInput(game.players.find(player => player.name === myPlayer.name).resources, 0);
    content.appendChild(youResourceInput.input);

    let downArrow = document.createElement('h2');
    downArrow.textContent = '↓';
    downArrow.style.color = '#E0E0E0';
    content.appendChild(downArrow);

    let themResourceInput = new ResourceInput();
    content.appendChild(themResourceInput.input);

    let domesticButton = document.createElement('button');
    domesticButton.textContent = 'DOMESTIC';

    domesticButton.addEventListener('click', () => {
        let you = removeZeroes(youResourceInput.resources);
        let them = removeZeroes(themResourceInput.resources);
        server.send(`trade domestic ${myPlayer.name} ${JSON.stringify(removeZeroes(you))} ${JSON.stringify(removeZeroes(them))} ${Math.random().toString(36).substring(2, 9)}`);
        showTrade();
    });
    content.appendChild(domesticButton);
    
    let maritimeButton = document.createElement('button');
    maritimeButton.textContent = 'MARITIME';

    maritimeButton.addEventListener('click', () => {
        let you = removeZeroes(youResourceInput.resources);
        let them = removeZeroes(themResourceInput.resources);
        server.send(`trade maritime ${JSON.stringify(removeZeroes(you))} ${JSON.stringify(removeZeroes(them))}`);
        showTrade();
    });
    content.appendChild(maritimeButton);
}

export function showChat() {
    setActiveButton('chat');
    document.getElementById('actions').style.display = 'none';
    document.getElementById('chatInput').style.removeProperty('display');
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'left';
    for (let message of game.chat) {
        if (message.length === 1) {
            let messageDiv = document.createElement("div");
            messageDiv.textContent = message[0];
            messageDiv.style.color = "#C0C0C0";
            messageDiv.style.fontStyle = "italic";
            content.appendChild(messageDiv);
        }
        else {
            let messageDiv = document.createElement("div");
            messageDiv.textContent = message[0];
            messageDiv.style.color = game.players.find(player => player.name === message[0]).color;
            messageDiv.style.fontWeight = "bold";
            let span = document.createElement("span");
            span.textContent = `: ${message[1]}`;
            messageDiv.appendChild(span);
            content.appendChild(messageDiv);
        }
    }
    content.scrollTop = content.scrollHeight;
}