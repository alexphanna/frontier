class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.points = 0;
        this.prevVertex = null;
        this.buildings = {
            settlements: 5,
            cities: 4,
            roads: 15
        }
        this.resources = {
            brick: 10,
            grain: 10,
            lumber: 10,
            ore: 0,
            wool: 10
        };
        this.developments = {
            knight: 1,
            monopoly: 0,
            yearOfPlenty: 0,
            roadBuilding: 1,
            victoryPoint: 0
        };
    }
    substractResources(resources) {
        for (const [key, value] of Object.entries(resources)) {
            this.resources[key] -= value;
        }
    }
    hasResources(resources) {
        for (const [key, value] of Object.entries(resources)) {
            if (this.resources[key] < value) {
                return false;
            }
        }
        return true;
    }
}
class publicPlayer {
    constructor(player) {
        this.name = player.name;
        this.color = player.color;
        this.points = player.points;
        this.resources = Object.values(player.resources).reduce((a, b) => a + b, 0);
        this.developments = Object.values(player.developments).reduce((a, b) => a + b, 0);
    }
}

class Vertex {
    static adjacentEdges(row, col) {
        let edges = [];

        // left and right
        for (let i = (col == 0 ? 0 : -1); i <= (col == settlementVertices[row].length - 1 ? 0 : 1); i++) {
            edges.push([row * 2, col + (i > 0 ? 0 : -1)]);
        }

        // top and bottom
        if (row <= 2 && row > 0) {
            edges.push([row * 2 + (col % 2 == 1 ? -1 : 1), Math.floor(col / 2)]);
        }
        else if (row >= 3 && row < settlementVertices.length - 1) {
            edges.push([row * 2 + (col % 2 == 1 ? 1 : -1), Math.floor(col / 2)]);
        }

        return edges;
    }
    static adjacentVertices(row, col) {
        let adjacentVertices = [];

        const edges = Vertex.adjacentEdges(row, col);
        for (let i = 0; i < edges.length; i++) {
            const vertices = Edge.adjacentVertices(edges[i][0], edges[i][1]);
            for (let j = 0; j < vertices.length; j++) {
                if (vertices[j][0] != row || vertices[j][1] != col) {
                    adjacentVertices.push(vertices[j]);
                }
            }
        }

        return adjacentVertices;
    }
}
class Edge {
    // always returns 2 vertices
    static adjacentVertices(row, col) {
        let vertices = [];

        if (row % 2 == 0) {
            // horizontal row
            vertices.push([Math.floor(row / 2), col]);
            vertices.push([Math.floor(row / 2), col + 1]);
        }
        else {
            // vertical row
            vertices.push([Math.floor(row / 2), col * 2 + (row > 5 ? 1 : 0)]);
            vertices.push([Math.ceil(row / 2), col * 2 + (row < 5 ? 1 : 0)]);
        }

        return vertices;
    }
}

let terrainCounts = {
    "Hills": 3,
    "Forest": 4,
    "Mountains": 3,
    "Fields": 4,
    "Pasture": 4,
    "Desert": 1
}
const terrains = Object.keys(terrainCounts);

let resources = {
    "Hills": "brick",
    "Forest": "lumber",
    "Mountains": "ore",
    "Fields": "grain",
    "Pasture": "wool",
}

/**
 * Generates a map.
 * 
 * @returns {Object} An object containing the generated terrain map and number map.
 */
function generateMap() {
    var terrainDistr = terrains.flatMap(terrain => Array(terrainCounts[terrain]).fill(terrain));
    var numberDistr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    shuffle(terrainDistr);
    shuffle(numberDistr);
    numberDistr.splice(terrainDistr.indexOf("Desert"), 0, 0);
    let terrainMap = [];
    let numberMap = [];
    for (let i = 0; i < 5; i++) {
        terrainMap.push([]);
        numberMap.push([]);
    }
    for (let i = 3; i <= 5; i++) {
        for (let j = 0; j < i; j++) {
            terrainMap[i - 3].push(terrainDistr.shift());
            numberMap[i - 3].push(numberDistr.shift());
            if (i != 5) {
                terrainMap[7 - i].push(terrainDistr.shift());
                numberMap[7 - i].push(numberDistr.shift());
            }
        }
    }
    return { terrainMap, numberMap };
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} - The shuffled array.
 */
function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

/**
 * Broadcasts a message to all connected clients.
 * @param {string} message - The message to be sent.
 */
function broadcast(message) {
    for (const client of clients) {
        client.send(message);
    }
}

function broadcastPoints() {
    for (let i = 0; i < players.size; i++) {
        const playerArray = Array.from(players);
        if (turn >= players.size && round < 2 && playerArray[i].prevVertex != null) {
            var playerEdges = [];
            for (let j = 0; j < edges.length; j++) {
                playerEdges.push([]);
                for (let k = 0; k < edges[j].length; k++) {
                    playerEdges[j].push(false);
                }
            }
            let temp = Vertex.adjacentEdges(playerArray[i].prevVertex[0], playerArray[i].prevVertex[1]);
            for (let j = 0; j < temp.length; j++) {
                playerEdges[temp[j][0]][temp[j][1]] = true;
            }
        }
        else {
            var playerEdges = [];
            for (let j = 0; j < edges.length; j++) {
                playerEdges.push([]);
                for (let k = 0; k < edges[j].length; k++) {
                    playerEdges[j].push(edges[j][k] == i);
                }
            }
        }
        const playerCityVertices = [];
        for (let j = 0; j < cityVertices.length; j++) {
            playerCityVertices.push([]);
            for (let k = 0; k < cityVertices[j].length; k++) {
                playerCityVertices[j].push(cityVertices[j][k] == i);
            }
        }
        const playerSettlementVertices = [];
        for (let j = 0; j < settlementVertices.length; j++) {
            playerSettlementVertices.push([]);
            for (let k = 0; k < settlementVertices[j].length; k++) {
                if (round < 2) {
                    playerSettlementVertices[j].push(isNaN(settlementVertices[j][k]));
                }
                else {
                    playerSettlementVertices[j].push(settlementVertices[j][k] == i);
                }
            }
        }
        Array.from(clients)[i].send('vertices settlement ' + JSON.stringify(playerSettlementVertices));
        Array.from(clients)[i].send('vertices city ' + JSON.stringify(playerCityVertices));
        Array.from(clients)[i].send('edges ' + JSON.stringify(playerEdges));
    }
}

/**
 * Logs a message and broadcasts it to all clients.
 * @param {string} message - The message to be logged.
 */
function log(message) {
    broadcast(`log ${message}`);
}

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let players = new Set();
let playerArray = Array.from(players);
let clients = new Set();
let ready = new Set();
let colors = shuffle(["red", "orange", "yellow", "lime", "blue", "magenta"]);
let map = generateMap();
for (let i = 0; i < map.terrainMap.length; i++) {
    for (let j = 0; j < map.terrainMap[i].length; j++) {
        if (map.terrainMap[i][j] === "Desert") {
            var robber = [i, j];
            break;
        }
    }
}
let turn = 0;
let round = 0;
let roll = 0;
let developmentDistr = {
    knight: 14,
    monopoly: 2,
    yearOfPlenty: 2,
    roadBuilding: 2,
    victoryPoint: 5
}
let developments = shuffle(Object.keys(developmentDistr).map(development => Array(developmentDistr[development]).fill(development)).flat());
let builtSettlement = false;
let builtRoad = false;

let settlementVertices = [];
let cityVertices = [];
let settlements = [];
let cities = [];
for (let i = Math.ceil(map.terrainMap.length / 2) - 1; i >= 0; i--) {
    let temp = [];
    for (let j = 0; j < map.terrainMap[i].length * 2 + 1; j++) {
        temp.push(NaN);
    }
    settlementVertices.unshift(Array.from(temp));
    settlementVertices.push(Array.from(temp));
    cityVertices.unshift(Array.from(temp));
    cityVertices.push(Array.from(temp));
    settlements.unshift(Array.from(temp));
    settlements.push(Array.from(temp));
    cities.unshift(Array.from(temp));
    cities.push(Array.from(temp));
}

let edges = [];
for (let i = Math.ceil(map.terrainMap.length / 2) - 1; i >= 0; i--) {
    let temp1 = [];
    let temp2 = [];
    for (let j = 0; j < map.terrainMap[i].length * 2; j++) {
        if (j < map.terrainMap[i].length + 1) {
            temp1.push(NaN);
        }
        temp2.push(NaN);
    }
    edges.push(Array.from(temp1));
    if (i != Math.ceil(map.terrainMap.length / 2) - 1) {
        edges.unshift(Array.from(temp1));
    }
    edges.push(Array.from(temp2));
    edges.unshift(Array.from(temp2));
}

function broadcastPlayers() {
    for (let i = 0; i < players.size; i++) {
        const newPlayers = [];
        for (let j = 0; j < playerArray.length; j++) {
            if (j === i) {
                newPlayers.push(playerArray[j]);
            }
            else {
                newPlayers.push(new publicPlayer(playerArray[j]));
            }
        }
        Array.from(clients)[i].send('players ' + JSON.stringify(newPlayers));
    }
}

wss.on('connection', (ws) => {
    console.log('connected');

    ws.on('message', (message) => {
        console.log(`${message}`);

        const args = String(message).split(' ');

        if (round === 1) {
            var player = Array.from(players)[players.size - 1 - (turn % players.size)];
        }
        else {
            var player = Array.from(players)[turn % players.size];
        }

        if (args[0] === 'add') {
            ws.send('color ' + colors[players.size]);
            players.add(new Player(args[1], colors[players.size]));
            playerArray = Array.from(players);
            clients.add(ws);
            ws.send('map ' + JSON.stringify(map));
            broadcastPlayers();
            broadcastPoints();
        }
        else if (args[0] === 'ready') {
            ready.add(ws);
            if (ready.size === players.size) {
                broadcast('start game')
                Array.from(clients)[0].send('start turn');
            }
        }
        else if (args[0] === 'unready') {
            ready.delete(ws);
        }
        else if (args[0] === 'get') {
            if (args[1] === 'robber') {
                ws.send('robber ' + JSON.stringify(robber[0]) + ' ' + JSON.stringify(robber[1]));
            }
        }
        else if (args[0] === 'trade') {
            if (args[1] === 'offer') {
                // check if it is past the initial phase
                // if (round < 2) return; UNCOMMENT LATER
                // check if trade is legal
                const you = JSON.parse(args[3]);
                const them = JSON.parse(args[4]);
                if (player.name !== args[2]) {
                    ws.send('error You may only offer trades on your turn');
                    return;
                }
                if (!player.hasResources(you)) {
                    ws.send('error Insufficient resources');
                    return;
                }
                if (Object.keys(you).length === 0 || Object.keys(them).length === 0) {
                    ws.send('error You must include at least one resource from each player', true);
                    return;
                }
                equal = false;
                for (let key of Object.keys(you)) {
                    if (key in them) {
                        equal = true;
                    }
                }
                if (equal) {
                    ws.send('error You may not trade like resources (e.g., 2 brick → 1 brick)', true);
                    return;
                }

                broadcast(String(message));
            }
            else if (args[1] === 'accept') {
                let you = Array.from(players).find(player => player.name === args[2]);
                let them = Array.from(players).find(player => player.name === args[4]);
                for (const [key, value] of Object.entries(JSON.parse(args[3]))) {
                    you.resources[key] = you.resources[key] - value;
                    them.resources[key] = them.resources[key] + value;
                }
                for (const [key, value] of Object.entries(JSON.parse(args[5]))) {
                    you.resources[key] = you.resources[key] + value;
                    them.resources[key] = them.resources[key] - value;
                }
                broadcastPlayers();
                broadcast(`trade unoffer ${args[6]}`)
            }
        }
        else if (args[0] === 'develop') {
            const costs = {
                grain: 1,
                ore: 1,
                wool: 1
            }
            // check if it is past the initial phase
            if (round < 2) return;
            // check if player has resources
            if (!player.hasResources(costs)) {
                ws.send('error Insufficient resources');
                return;
            }
            player.developments[developments.shift()]++;
            player.substractResources(costs);
            broadcastPlayers();
        }
        else if (args[0] === 'progress') {
            if (args[1] === 'monopoly') {
                // check if player has monopoly card
                if (player.developments["monopoly"] === 0) {
                    ws.send('error No monopoly cards left');
                    return;
                }
                player.developments["monopoly"]--;
                for (let i = 0; i < playerArray.length; i++) {
                    if (i === turn % playerArray.length) {
                        continue;
                    }
                    player.resources[args[2]] += playerArray[i].resources[args[2]];
                    playerArray[i].resources[args[2]] = 0;
                }
            }
            else if (args[1] === 'yearOfPlenty') {
                // check if player has year of plenty card
                if (player.developments["yearOfPlenty"] === 0) {
                    ws.send('error No year of plenty cards left');
                    return;
                }
                // check if player took 2 resources
                let totalResources = Object.values(JSON.parse(args[2])).reduce((a, b) => a + b, 0);
                if (totalResources != 2) {
                    ws.send('error Must take 2 resources');
                    return;
                }
                player.developments["yearOfPlenty"]--;
                let resources = JSON.parse(args[2]);
                for (let resource of Object.keys(resources)) {
                    player.resources[resource] += resources[resource];
                }
            }
            broadcastPlayers();
        }
        else if (args[0] === 'build') {
            const row = parseInt(args[2]);
            const col = parseInt(args[3]);
            if (args[1] === 'settlement') {
                const costs = {
                    brick: 1,
                    grain: 1,
                    lumber: 1,
                    wool: 1
                }

                if (round < 2) {
                    // check if settlement is legal
                    if (!isNaN(settlementVertices[row][col])) {
                        ws.send('error Illegal settlement placement');
                        return;
                    }
                    // check if player already built a settlement this round
                    if (round < 2 && player.buildings["settlements"] < 5 - round) {
                        ws.send(`error You may only build one settlement during round ${["one", "two"][round]}`);
                        return;
                    }
                    player.prevVertex = [row, col];

                    let adjacentEdges = Vertex.adjacentEdges(row, col);
                    for (let j = 0; j < adjacentEdges.length; j++) {
                        const edge = adjacentEdges[j];
                        if (isNaN(edges[edge[0]][edge[1]])) {
                            if (turn >= players.size) {
                                edges[edge[0]][edge[1]] = players.size - 1 - (turn % players.size)
                            }
                            else {
                                edges[edge[0]][edge[1]] = turn % players.size;
                            }
                        }
                    }

                    // give player resources on round two
                }
                else if (turn >= players.size * 2) {
                    // check if player has resources
                    if (!player.hasResources(costs)) {
                        ws.send('error Insufficient resources');
                        return;
                    }
                    // check if player has settlements
                    if (player.buildings["settlements"] == 0) {
                        ws.send('error No settlements left');
                        return;
                    }
                    // check if settlement is legal
                    if (settlementVertices[row][col] != turn % players.size) {
                        ws.send('error Illegal settlement placement');
                        return;
                    }
                    player.substractResources(costs);
                }
                broadcast(String(message));
                log(player.name + ' built a settlement');
                player.points++;
                player.buildings["settlements"]--;
                settlementVertices[row][col] = players.size;
                settlements[row][col] = turn % players.size;
                cityVertices[row][col] = turn % players.size;

                const adjacentVertices = Vertex.adjacentVertices(row, col);
                for (let i = 0; i < adjacentVertices.length; i++) {
                    settlementVertices[adjacentVertices[i][0]][adjacentVertices[i][1]] = players.size + 1;
                }
            }
            else if (args[1] === 'city') {               
                const costs = {
                    grain: 2,
                    ore: 3
                }
                // check if it is past the initial phase
                if (round < 2) return;
                // check if player has resources
                if (!player.hasResources(costs)) {
                    ws.send('error Insufficient resources');
                    return;
                }
                // check if player has cities
                if (player.buildings["cities"] == 0) {
                    ws.send('error No cities left');
                    return;
                }
                // check if city is legal
                if (cityVertices[row][col] != turn % players.size) {
                    ws.send('error Illegal city placement');
                    return;
                }

                broadcast(String(message));
                log(player.name + ' built a city');
                player.points++;
                player.buildings["cities"]--;
                player.buildings["settlements"]++;
                player.substractResources(costs);
                cities[row][col] = turn % players.size;
                settlements[row][col] = NaN;
                cityVertices[row][col] = NaN;
            }
            else if (args[1] === 'road') {
                const costs = {
                    brick: 1,
                    lumber: 1
                }
                // check if road is legal
                if (round < 2) {
                    if (player.buildings["settlements"] > 4 - round) {
                        ws.send('error You must build a settlement first');
                        return;
                    }
                    if (player.buildings["roads"] < 15 - round) {
                        ws.send(`error You may only build one road during round ${["one", "two"][round]}`);
                        return;
                    }
                }
                if (round === 1) {
                    let playerEdges = Vertex.adjacentEdges(player.prevVertex[0], player.prevVertex[1]);
                    console.log(playerEdges);
                    if (playerEdges.find(edge => edge[0] === row && edge[1] === col) === undefined) {
                        ws.send('error Illegal road placement');
                        return;
                    }
                }
                else {
                    if (edges[row][col] != turn % players.size) {
                        ws.send('error Illegal road placement');
                        return;
                    }
                }
                if (turn >= players.size * 2) {
                    // check if player has resources
                    if (!player.hasResources(costs)) {
                        ws.send('error Insufficient resources');
                        return;
                    }
                    // check if player has roads
                    if (player.buildings["roads"] == 0) {
                        ws.send('error No roads left');
                        return;
                    }

                    player.substractResources(costs);
                }

                broadcast(String(message));
                log(player.name + ' built a road');
                player.buildings["roads"]--;
                edges[row][col] = players.size;

                const adjacentVertices = Edge.adjacentVertices(row, col);
                for (let i = 0; i < adjacentVertices.length; i++) {
                    const adjacentEdges = Vertex.adjacentEdges(adjacentVertices[i][0], adjacentVertices[i][1]);
                    for (let j = 0; j < adjacentEdges.length; j++) {
                        if (isNaN(edges[adjacentEdges[j][0]][adjacentEdges[j][1]])) {
                            if (round === 1) {
                                edges[adjacentEdges[j][0]][adjacentEdges[j][1]] = players.size - 1 - (turn % players.size)
                            }
                            else {
                                edges[adjacentEdges[j][0]][adjacentEdges[j][1]] = turn % players.size;
                            }
                        }
                    }
                    if (settlementVertices[adjacentVertices[i][0]][adjacentVertices[i][1]] == players.size) {
                        continue;
                    }
                    const vertices = Vertex.adjacentVertices(adjacentVertices[i][0], adjacentVertices[i][1]);
                    let available = true;
                    for (let j = 0; j < vertices.length; j++) {
                        if (settlementVertices[vertices[j][0]][vertices[j][1]] == players.size) {
                            available = false;
                        }
                    }
                    if (available) {
                        if (round === 1) {
                            settlementVertices[adjacentVertices[i][0]][adjacentVertices[i][1]] = players.size - 1 - (turn % players.size)
                        }
                        else {
                            settlementVertices[adjacentVertices[i][0]][adjacentVertices[i][1]] = turn % players.size;
                        }
                    }
                }

            }

            broadcastPoints();
            broadcastPlayers();
        }
        else if (args[0] === 'get') {
            if (args[1] === 'map') {
                ws.send('map ' + JSON.stringify(map));
            }
            else if (args[1] === 'points') {
                broadcastPoints();
            }
            else if (args[1] === 'robber') {
                ws.send('robber ' + JSON.stringify(robber));
            }
        }
        else if (args[0] === 'robber') {
            if (roll === 7) {
                broadcast(String(message));
            }
        }
        else if (args[0] === 'chat') {
            // check if message is empty
            if (args.slice(2).join(' ') === '') return;
            // check if player exists
            if (playerArray.find(player => player.name === args[1]) === undefined) return;

            broadcast(String(message));
        }
        else if (args[0] === 'end' && args[1] === 'turn') {
            if (round < 2) {
                if (player.buildings["settlements"] > 4 - round) {
                    ws.send(`error You must build a settlement and a road during round ${["one", "two"][round]}`);
                }
                else if (player.buildings["roads"] > 14 - round) {
                    ws.send(`error You must build a road during round ${["one", "two"][round]}`);
                }
                else {
                    turn++;
                    round = Math.floor(turn / players.size);
                }

                Array.from(clients)[round === 0 ? turn : players.size - 1 - (turn % players.size)].send('start turn');
            }
            if (turn >= players.size * 2) {
                turn++;
                round = Math.floor(turn / players.size);
                // roll dice
                Array.from(clients)[turn % players.size].send('start turn');
                roll = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
                broadcast('roll ' + roll);
                
                function updateResources(position, i, j, multiplier) {
                    const playersArray = Array.from(players);
                    if (!isNaN(position)) {
                        const player = playersArray[position];
                        player.resources[resources[map.terrainMap[i][j]]] += 1 * multiplier;
                    }
                }

                for (let i = 0; i < map.terrainMap.length; i++) {
                    for (let j = 0; j < map.terrainMap[i].length; j++) {
                        if (map.numberMap[i][j] === roll) {
                            for (let k = -1; k <= 1; k++) {
                                const baseIndex = j * 2 + k + 1 + (i < map.terrainMap.length / 2 ? 0 : 1);
                                updateResources(settlements[i][baseIndex], i, j, 1);
                                updateResources(settlements[i + 1][baseIndex + (i >= map.terrainMap.length / 2 ? -1 : 1)], i, j, 1);
                                updateResources(cities[i][baseIndex], i, j, 2);
                                updateResources(cities[i + 1][baseIndex + (i >= map.terrainMap.length / 2 ? -1 : 1)], i, j, 2);
                            }
                        }
                    }
                }

                broadcastPlayers();
                broadcastPoints();
            }
        }
    });

    ws.on('close', () => {
        console.log('disconnected');
        for (let i = 0; i < players.size; i++) {
            if (Array.from(clients)[i] === ws) {
                players.delete(Array.from(players)[i]);
                clients.delete(ws);
            }
        }
        broadcastPlayers();
    });
});