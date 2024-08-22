import { game, server, myPlayer, ui, getTurnPlayer, getRound } from '../main.js';
import { Notification, MonopolyInput, ResourceInput, YearOfPlentyInput, removeZeroes } from './ui/notifications.js';
import { build } from "./actions.js"
import actionNav from './ui/actionNav.js';
import { PlayerSelectButton } from './ui/selectButton.js';

function setActiveButton(button) {
    while (document.getElementById('sidebar').children.length > 1) {
        document.getElementById('sidebar').removeChild(document.getElementById('sidebar').lastChild);
    }
    let content = document.createElement('div');
    content.id = 'sideContent';
    document.getElementById('sidebar').appendChild(content);
    document.getElementById('buildButton').disabled = (button === 'build' ? true : false);
    document.getElementById('tradeButton').disabled = (button === 'trade' ? true : false);
    document.getElementById('chatButton').disabled = (button === 'chat' ? true : false);
}

export function showBuild() {
    setActiveButton('build');
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'left';
    content.style.padding = '0px';

    for (let player of game.players) {
        let playerDiv = document.createElement('div');
        playerDiv.style.padding = '20px';
        playerDiv.style.backgroundColor = (getTurnPlayer().name === player.name ? '#20202080' : '#FFFFFF00');
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
        playerDiv.appendChild(playerTitle);

        if (player.specials["largestArmy"]) {
            let largestArmy = document.createElement('h3');
            largestArmy.textContent = 'Largest Army';
            largestArmy.style.fontWeight = 'bold';
            playerDiv.appendChild(largestArmy);
        }

        if (player.specials["longestRoad"]) {
            let longestRoad = document.createElement('h3');
            longestRoad.textContent = 'Longest Road';
            longestRoad.style.fontWeight = 'bold';
            playerDiv.appendChild(longestRoad);
        }

        let resourcesHeading = document.createElement('h3');
        resourcesHeading.textContent = 'Resources:';
        playerDiv.appendChild(resourcesHeading);
        if (player.name === myPlayer.name) {
            let resources = document.createElement('ul');
            for (let resource in player.resources) {
                resources.appendChild(document.createElement('li')).textContent = `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${player.resources[resource]}`;
            }
            playerDiv.appendChild(resources);
        }
        else {
            resourcesHeading.textContent += ` ${player.resources}`;
        }
        let developmentsHeading = document.createElement('h3');
        developmentsHeading.textContent = `Developments: ${myPlayer.name === player.name ? Object.values(player.developments).reduce((a, b) => a + b) : player.developments}`;
        playerDiv.appendChild(developmentsHeading);

        if (player.army > 0) {
            let knights = document.createElement('h3');
            knights.textContent = `Army: ${player.army}`;
            playerDiv.appendChild(knights);
        }

        content.appendChild(playerDiv);

        if (getTurnPlayer().name === myPlayer.name && player.name === myPlayer.name) {
            let actions = new actionNav();
            actions.appendAction('SETTLEMENT', () => { build('settlement'); }, player.buildings["settlements"], "50%");
            actions.appendAction('CITY', () => { build('city'); }, player.buildings["cities"], "50%");
            actions.appendAction('ROAD', () => { build('road'); }, player.buildings["roads"], "50%");
            actions.appendAction('DEVELOP', () => { develop(); }, -1, "50%");
            actions.appendAction('END TURN', () => { endTurn(); });

            const actionButtons = actions.getElementsByClassName('actionButton');
            for (let i = 0; i < actionButtons.length; i++) {
                if (getRound() < 2 && (actionButtons[i].id === 'developButton' || actionButtons[i].id === 'cityButton')) {
                    actionButtons[i].disabled = true;
                }
                if ((actionButtons[i].id === 'settlementButton' && player.buildings["settlements"] === 0)
                    || (actionButtons[i].id === 'roadButton' && player.buildings["roads"] === 0)
                    || (actionButtons[i].id === 'cityButton' && player.buildings["cities"] === 0)) {
                    actionButtons[i].disabled = true;
                }
            }

            document.getElementById('sidebar').appendChild(actions);

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
                    const textContent = `${capitalize(Object.keys(player.developments)[i])} (${player.developments[Object.keys(player.developments)[i]]})`;
                    if (Object.keys(player.developments)[i] === 'knight') {
                        actions.prependAction(textContent, () => {
                            game.knightPlayed = true;
                            ui.notifications.appendChild(new Notification('Move the robber'));
                        });
                    }
                    else if (Object.keys(player.developments)[i] === 'yearOfPlenty') {
                        actions.prependAction(textContent, () => {
                            ui.notifications.appendChild(new YearOfPlentyInput());
                        });
                    }
                    else if (Object.keys(player.developments)[i] === 'monopoly') {
                        actions.prependAction(textContent, () => {
                            ui.notifications.appendChild(new MonopolyInput());
                        });
                    }
                    else if (Object.keys(player.developments)[i] === 'roadBuilding') {
                        actions.prependAction(textContent, () => {
                            server.send('progress roadBuilding');
                            game.roadBuilding = true;
                            game.roadsBuilt = 0;

                            build('road');
                            ui.notifications.appendChild(new Notification('Build two roads'));
                        });
                    }
                }
            }
        }
    }
}

export function showTrade() {
    setActiveButton('trade');
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'center';
    content.style.padding = '20px';

    let youResourceInput = new ResourceInput(game.players.find(player => player.name === myPlayer.name).resources, 0);
    content.appendChild(youResourceInput);

    let downArrow = document.createElement('h2');
    downArrow.textContent = '↓';
    downArrow.style.margin = '20px';
    downArrow.style.color = '#E0E0E0';
    content.appendChild(downArrow);

    let themResourceInput = new ResourceInput();
    content.appendChild(themResourceInput);

    const sendTrade = (recipients) => {
        let you = removeZeroes(youResourceInput.resources);
        let them = removeZeroes(themResourceInput.resources);
        server.send(`trade domestic ${myPlayer.name} ${JSON.stringify(removeZeroes(you))} ${recipients} ${JSON.stringify(removeZeroes(them))} ${Math.random().toString(36).substring(2, 9)}`);
        showTrade();
    }

    if (getTurnPlayer().name === myPlayer.name) {
        let selectButton = new PlayerSelectButton('DOMESTIC', () => {
            sendTrade(JSON.stringify(selectButton.selectedOptions));
        });
        content.appendChild(selectButton);
    }
    else {
        let button = document.createElement('button');
        button.textContent = 'DOMESTIC';
        button.addEventListener('click', () => {
            sendTrade(JSON.stringify([getTurnPlayer().name]));
        });
        content.appendChild(button);
    }

    let maritime = document.createElement('button');
    maritime.textContent = 'MARITIME';
    maritime.addEventListener('click', () => {
        let you = removeZeroes(youResourceInput.resources);
        let them = removeZeroes(themResourceInput.resources);
        server.send(`trade maritime ${JSON.stringify(removeZeroes(you))} ${JSON.stringify(removeZeroes(them))}`);
        showTrade();
    });
    content.appendChild(maritime);
}

export function showChat() {
    setActiveButton('chat');
    document.getElementById('sideContent').style.padding = '20px';

    document.getElementById('chatButton').textContent = 'CHAT';

    let input = document.createElement('input');
    input.id = 'chatInput';
    input.placeholder = 'Type a message...';
    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && input.value !== '') {
            server.send(`chat ${myPlayer.name} ${input.value}`);
            input.value = '';
        }
    });
    document.getElementById('sidebar').appendChild(input);

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