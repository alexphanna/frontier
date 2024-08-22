import { game, myPlayer, server, connect, ui } from '../main.js';
import Building from './building.js';
import Map from "./map.js"
import { showBuild, showChat } from './sidebar.js';
import { Notification, ErrorNotification, TradeNotification, DiscardInput } from './ui/notifications.js';
import { RobberInput } from './ui/robber.js';

export function build(type) {
    let svg = document.getElementById('map');
    game.currentType = type;
    svg.getElementById('settlementVertices').style.visibility = "hidden";
    svg.getElementById('cityVertices').style.visibility = "hidden";
    if (!game.roadBuilding) svg.getElementById('edges').style.visibility = "hidden";
    if (type == "settlement" || type == "city") {
        // check if road building is active
        if (game.roadBuilding) {
            new Notification('Build two roads');
            return;
        }

        if (type == "settlement") svg.getElementById('settlementVertices').style.visibility = "visible";
        else if (type == "city") svg.getElementById('cityVertices').style.visibility = "visible";
    }   
    else if (type == "road") {
        svg.getElementById('edges').style.visibility = "visible";
    }
}

export function develop() {
    server.send('develop');
}

export function endTurn() {
    // check if this can just be document
    let svg = document.getElementById('map');
    svg.getElementById('settlementVertices').style.visibility = "hidden";
    svg.getElementById('cityVertices').style.visibility = "hidden";
    svg.getElementById('edges').style.visibility = "hidden";
    server.send('end turn');
    // document.getElementById('actions').style.visibility = 'hidden';
}

export function ready() {
    server.send('ready');
    let readyButton = document.getElementById('readyButton');
    readyButton.textContent = 'UNREADY';
    readyButton.onclick = unready;
}

export function unready() {
    server.send('unready');
    let readyButton = document.getElementById('readyButton');
    readyButton.textContent = 'READY';
    readyButton.onclick = ready;
}

function updateLobby(players) {
    document.getElementById('playersHeading').textContent = `PLAYERS `;

    let playerCount = document.createElement('span');
    playerCount.textContent = ` (${players.length}/4)`;
    playerCount.style.color = '#C0C0C0C0';
    document.getElementById('playersHeading').appendChild(playerCount);

    let colorButtons = document.getElementsByClassName('colorButton');
    
    for (let colorButton of colorButtons) {
        document.getElementById(`${colorButton.id}-container`).style.removeProperty('border-color');
        colorButton.disabled = false;
        colorButton.style.backgroundColor = colorButton.id;
    }

    let playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    for (let player of players) {
        let playerHeading = playersDiv.appendChild(document.createElement('h2'));
        playerHeading.style.color = player.color;
        playerHeading.style.fontWeight = 'bold';
        playerHeading.textContent = `${player.name}`;
        playersDiv.appendChild(playerHeading);

        for (let colorButton of colorButtons) {
            if (colorButton.id === player.color) {
                colorButton.disabled = true;
                colorButton.style.backgroundColor = colorButton.id.replace(/80/g, '40').replace(/FF/g, '80');
                if (player.name === myPlayer.name) document.getElementById(`${colorButton.id}-container`).style.borderColor = "#FFFF00C0";
                else document.getElementById(`${colorButton.id}-container`).style.borderColor = "#80808080"
            }
        }
    }
}

export function setColor(color) {
    document.getElementById(`${color}-container`).style.borderColor = "#FFFF00C0";
    server.send(`color ${color}`);
}

export function join() {
    myPlayer.name = document.getElementById('name').value;
    let address = document.getElementById('address').value;

    let svg = document.getElementById('map');

    if(myPlayer.name === '') return;
    // Check if name contains spaces
    if (myPlayer.name.indexOf(' ') !== -1) {
        ui.notifications.appendChild(new ErrorNotification("Name cannot contain spaces"));
        return;
    }

    connect(address);
    server.onerror = function () {
        ui.notifications.appendChild(new ErrorNotification("Could not connect to server"));
    }
    server.onopen = function () {
        document.getElementById("menu").style.display = "none";
        document.getElementById("lobby").removeAttribute("style");

        server.send(`add ${myPlayer.name}`);
    }
    server.onmessage = function (event) {
        console.log(event.data);

        const args = String(event.data).split(' ');

        if (args[0] === 'players') {
            game.players = JSON.parse(args[1]);
            updateLobby(game.players);
            if (document.getElementById('buildButton').disabled) {
                showBuild();
            }
        }
        else if (args[0] === 'trade') {
            if (args[1] === 'domestic') {
                ui.notifications.appendChild(new TradeNotification(args[2], args[3], args[5], args[6]));
            }
            else if (args[1] === 'unoffer') {
                if (document.getElementById(args[2]) !== null) {
                    document.getElementById(args[2]).remove();
                }
            }
        }
        else if (args[0] === 'build') {
            document.getElementById('placeSound').play();
            if (args[1] === 'settlement') {
                const vertex = game.map.standardToVertex(parseInt(args[2]), parseInt(args[3]));
                const building = Building.createBuilding(vertex.x, vertex.y, args[4], "black", args[1]);
                document.getElementById('buildings').appendChild(building);
            }
            else if (args[1] == 'city') {
                const vertex = game.map.standardToVertex(parseInt(args[2]), parseInt(args[3]));
                const building = Building.createBuilding(vertex.x, vertex.y, args[4], "black", args[1]);
                let settlements = document.getElementById('buildings').getElementsByClassName('settlement');
                for (let i = 0; i < settlements.length; i++) {
                    const temp = Building.shapeToPoint(settlements[i].getAttribute('points'), 'settlement');
                    const point = game.map.vertexToStandard(temp.x, temp.y);
                    console.log(point.row, point.col);
                    if (point.row == parseInt(args[2]) && point.col == parseInt(args[3])) {
                        document.getElementById("buildings").removeChild(settlements[i]);
                        break;
                    }
                }
                document.getElementById('buildings').appendChild(building);
            }
            else if (args[1] === 'road') {
                if (game.roadBuilding) {
                    game.roadsBuilt++;
                    if (game.roadsBuilt == 2) {
                        game.roadBuilding = false;
                        game.roadsBuilt = 0;
                        document.getElementById('edges').style.visibility = "hidden";
                    }
                }
                const edge = game.map.standardToEdge(parseInt(args[2]), parseInt(args[3]));
                const road = Building.createRoad(edge.x, edge.y, args[4], args[5], "black");
                document.getElementById('roads').appendChild(road);
            }
        }
        else if (args[0] === 'map') {
            const maps = JSON.parse(args[1]);
            game.map = new Map(svg, maps.terrainMap, maps.numberMap, maps.harborMap);
        }
        else if (args[0] === 'robber') {
            game.map.moveRobber(parseInt(args[1]), parseInt(args[2]));
        }
        else if (args[0] === 'rob') {
            if (JSON.parse(args.slice(1)).length === 0) {
                return;
            }   
            else if (JSON.parse(args.slice(1)).length === 1) {
                server.send(`rob ${JSON.parse(args.slice(1))[0]}`);
            }
            else {
                ui.notifications.appendChild(new RobberInput(JSON.parse(args.slice(1))));
            }
        }
        else if (args[0] === 'chat' || args[0] === 'log') {
            game.chat.push(args[0] === 'chat' ? [args[1], args.slice(2).join(' ')] : [args.slice(1).join(' ')]);
            if (document.getElementById('chatButton').disabled) {
                showChat();
            }
            else {
                document.getElementById('chatButton').textContent = `⬤ CHAT`;
            }
        }
        else if (args[0] === 'error') {
            ui.notifications.appendChild(new ErrorNotification(args.slice(1).join(' ')));
        }
        else if (args[0] === 'notification') {
            ui.notifications.appendChild(new Notification(args.slice(1).join(' ')));
        }
        else if (args[0] === 'start') {
            if (args[1] === 'game') {
                document.getElementById('lobby').style.display = 'none';
                document.getElementById('navbar').style.display = 'none';
                document.getElementById('game').style.visibility = 'visible';
                showBuild();
            }
        }
        else if (args[0] === 'roll') {
            game.map.highlightTokens(parseInt(args[1]));
        }
        else if (args[0] === 'vertices') {
            var legalVertices = JSON.parse(args[2]);
            var vertices = svg.getElementById(`${args[1]}Vertices`);
            vertices.innerHTML = '';
            for (let i = 0; i < legalVertices.length; i++) {
                for (let j = 0; j < legalVertices[i].length; j++) {
                    if (legalVertices[i][j]) {
                        const vertex = game.map.standardToVertex(i, j);
                        let settlement = Building.createBuilding(vertex.x, vertex.y, "transparent", "#ffffffc0", "settlement");
                        settlement.addEventListener('click', function () {
                            vertices.style.visibility = "hidden";
                            server.send(`build ${game.currentType} ${i} ${j} ${myPlayer.color}`);
                        });
                        settlement.addEventListener('mouseover', function () {
                            settlement.setAttribute("stroke", "#ffff00c0");
                        });
                        settlement.addEventListener('mouseout', function () {
                            settlement.setAttribute("stroke", "#ffffffc0");
                        });
                        vertices.appendChild(settlement);
                    }
                }
            }
        }
        else if (args[0] === 'edges') {
            var legalEdges = JSON.parse(args[1]);
            var edges = svg.getElementById('edges');
            edges.innerHTML = '';
            for (let i = 0; i < legalEdges.length; i++) {
                for (let j = 0; j < legalEdges[i].length; j++) {
                    if (legalEdges[i][j]) {
                        const edge = game.map.standardToEdge(i, j);

                        let road = Building.createRoad(edge.x, edge.y, edge.angle, "transparent", "#ffffffc0");
                        road.addEventListener('click', function () {
                            if (game.roadBuilding) {
                                game.roadBuilt++;
                                if (game.roadBuilt == 2) {
                                    game.roadBuilding = false;
                                    game.roadsBuilt = 0;
                                    edges.style.visibility = "hidden";
                                }
                            }
                            else edges.style.visibility = "hidden";
                            server.send(`build road ${i} ${j} ${edge.angle} ${myPlayer.color}`);
                        });
                        road.addEventListener('mouseover', function () {
                            road.setAttribute("stroke", "#ffff00c0");
                        });
                        road.addEventListener('mouseout', function () {
                            road.setAttribute("stroke", "#ffffffc0");
                        });
                        edges.appendChild(road);
                    }
                }
            }
        }
        else if (args[0] === 'color') {
            myPlayer.color = args[1];
        }
        else if (args[0] === 'turn') {
            game.turn = parseInt(args[1]);
            if (document.getElementById('buildButton').disabled) {
                showBuild();
            }
        }
        else if (args[0] === 'discard') {
            ui.notifications.appendChild(new DiscardInput(JSON.parse(args[1])));
        }
    }
}