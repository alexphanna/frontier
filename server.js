class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.points = 0;
        this.buildings = {
            settlements: 5,
            cities: 4,
            roads: 15
        }
        this.resources = {
            brick: 0,
            grain: 0,
            lumber: 0,
            ore: 0,
            wool: 0
        };
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
            if (row < 5) {
                vertices.push([Math.floor(row / 2), col * 2]);
                vertices.push([Math.ceil(row / 2), col * 2 + 1]);
            }
            else if (row == 5) {
                vertices.push([Math.floor(row / 2), col * 2]);
                vertices.push([Math.ceil(row / 2), col * 2]);
            }
            else if (row > 5) {
                vertices.push([Math.floor(row / 2), col * 2 + 1]);
                vertices.push([Math.ceil(row / 2), col * 2]);
            }
        }

        console.log(vertices);

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

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

function broadcast(message) {
    for (const client of clients) {
        client.send(message);
    }
}

function broadcastPoints() {
    if (turn < players.size * 2) {
        broadcast('vertices settlement ' + JSON.stringify(settlementVertices));
    }
    for (let i = 0; i < players.size; i++) {
        const playerCityVertices = [];
        for (let j = 0; j < cityVertices.length; j++) {
            playerCityVertices.push([]);
            for (let k = 0; k < cityVertices[j].length; k++) {
                playerCityVertices[j].push(cityVertices[j][k] == i);
            }
        }   
        const playerEdges = [];
        for (let j = 0; j < edges.length; j++) {
            playerEdges.push([]);
            for (let k = 0; k < edges[j].length; k++) {
                playerEdges[j].push(edges[j][k] == i);
            }
        }
        if (turn >= players.size * 2) {
            const playerSettlementVertices = [];
            for (let j = 0; j < settlementVertices.length; j++) {
                playerSettlementVertices.push([]);
                for (let k = 0; k < settlementVertices[j].length; k++) {
                    playerSettlementVertices[j].push(settlementVertices[j][k] == i);
                }
            }
            Array.from(clients)[i].send('vertices settlement ' + JSON.stringify(playerSettlementVertices));
        }
        Array.from(clients)[i].send('vertices city ' + JSON.stringify(playerCityVertices));
        Array.from(clients)[i].send('edges ' + JSON.stringify(playerEdges));
    }
}

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let players = new Set();
let clients = new Set();
let ready = new Set();
let colors = ["red", "blue", "green", "yellow"];
let map = generateMap();
let turn = 0;

let settlementVertices = [];
let cityVertices = [];
let settlements = [];
let cities = [];
for (let i = Math.ceil(map.terrainMap.length / 2) - 1; i >= 0; i--) {
    let temp1 = [];
    let temp2 = [];
    for (let j = 0; j < map.terrainMap[i].length * 2 + 1; j++) {
        temp1.push(1);
        temp2.push(NaN);
    }
    settlementVertices.unshift(Array.from(temp1));
    settlementVertices.push(Array.from(temp1));
    cityVertices.unshift(Array.from(temp2));
    cityVertices.push(Array.from(temp2));
    settlements.unshift(Array.from(temp2));
    settlements.push(Array.from(temp2));
    cities.unshift(Array.from(temp2));
    cities.push(Array.from(temp2));
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


wss.on('connection', (ws) => {
    console.log('connected');

    ws.on('message', (message) => {
        console.log(`${message}`);

        const args = String(message).split(' ');

        if (args[0] === 'add') {
            ws.send('color ' + colors[players.size]);
            players.add(new Player(args[1], colors[players.size]));
            clients.add(ws);
            broadcast('players ' + JSON.stringify(Array.from(players)));
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
        else if (args[0] === 'build') {
            let player = Array.from(players)[turn % players.size];
            const row = parseInt(args[2]);
            const col = parseInt(args[3]);
            if (args[1] === 'settlement' && settlementVertices[row][col] && player.buildings["settlements"] > 0) {
                if (turn < players.size * 2) {
                    broadcast(String(message));
                    player.points++;
                    player.buildings["settlements"]--;
                    settlementVertices[row][col] = 0;
                    settlements[row][col] = turn % players.size;
                    cityVertices[row][col] = turn % players.size;
                    for (let i = (col == 0 ? 0 : -1); i <= (col == settlementVertices[row].length - 1 ? 0 : 1); i++) {
                        settlementVertices[row][col + i] = 0;
                        //addEdge(row * 2, col + (i > 0 ? 0 : -1));
                    }

                    if (((row <= 2 && col % 2) || (row >= 3 && !(col % 2))) && row > 0) {
                        if (settlementVertices[row].length != settlementVertices[row - 1].length) {
                            settlementVertices[row - 1][col + (row >= Math.floor(settlementVertices.length / 2) ? 1 : -1)] = 0;
                        }
                        else {
                            settlementVertices[row - 1][col] = 0;
                        }
                    }
                    else if (row < settlementVertices.length - 1) {
                        if (settlementVertices[row].length != settlementVertices[row + 1].length) {
                            settlementVertices[row + 1][col + (row >= Math.floor(settlementVertices.length / 2) ? -1 : 1)] = 0; 
                        }
                        else {
                            settlementVertices[row + 1][col] = 0;
                        }
                    }
                    
                    let adjacentEdges = Vertex.adjacentEdges(row, col);
                    for (let j = 0; j < adjacentEdges.length; j++) {
                        const edge = adjacentEdges[j];
                        if (isNaN(edges[edge[0]][edge[1]])) {
                            edges[edge[0]][edge[1]] = turn % players.size;
                        }
                    }
                }
            }
            else if (args[1] === 'city' && cityVertices[row][col] === turn % players.size && player.buildings["cities"] > 0) {
                broadcast(String(message));
                player.points++;
                player.buildings["cities"]--;
                player.buildings["settlements"]++;
                cities[row][col] = turn % players.size;
                settlements[row][col] = NaN;
                cityVertices[row][col] = NaN;
            } 
            else if (args[1] === 'road' && edges[row][col] == turn % players.size && player.buildings["roads"] > 0) {
                broadcast(String(message));
                player.buildings["roads"]--;
                edges[row][col] = players.size;

                let adjacentVertices = Edge.adjacentVertices(row, col);
                let available = true;
                for (let i = 0; i < adjacentVertices.length; i++) {
                    const vertex = adjacentVertices[i];
                    let adjacentEdges = Vertex.adjacentEdges(vertex[0], vertex[1]);
                    for (let j = 0; j < adjacentEdges.length; j++) {
                        const edge = adjacentEdges[j];
                        if (isNaN(edges[edge[0]][edge[1]])) {
                            edges[edge[0]][edge[1]] = turn % players.size;
                        }
                        let tempVertices = Edge.adjacentVertices(edge[0], edge[1]);
                        for (let k = 0; k < tempVertices.length; k++) {
                            const tempVertex = tempVertices[k];
                            if (tempVertices != vertex && !isNaN(settlementVertices[tempVertex[0]][tempVertex[1]])) {
                                available = false;
                            }
                        }
                    }

                    if (available) {
                        settlementVertices[vertex[0]][vertex[1]] = turn % players.size;
                    }
                }
            }
                
            broadcastPoints();
            broadcast('players ' + JSON.stringify(Array.from(players)));
        }
        else if (args[0] === 'get') {
            if (args[1] === 'map') {
                ws.send('map ' + JSON.stringify(map));
            }
            else if (args[1] === 'points') {
                broadcastPoints();
            }
        }
        else if (args[0] === 'end' && args[1] === 'turn') {
            turn++;
            if (turn < players.size * 2) {
                if (turn < players.size) {
                    Array.from(clients)[turn].send('start turn');
                }
                else {
                    Array.from(clients)[players.size - 1 - (turn % players.size)].send('start turn');
                }
            }
            else {
                // Erase all settlement vertices and switch to numbered system
                if (turn == players.size * 2) {
                    for (let i = 0; i < settlementVertices.length; i++) {
                        for (let j = 0; j < settlementVertices[i].length; j++) {
                            settlementVertices[i][j] = NaN;
                        }
                    }
                    broadcastPoints();
                }
                // roll dice
                Array.from(clients)[turn % players.size].send('start turn');
                const roll = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
                broadcast('roll ' + roll);

                // Simplified resource distribution
                const playersArray = Array.from(players); // Convert players to array once
                
                function updateResources(position, i, j, multiplier) {
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
                                updateResources(settlements[i][baseIndex],i , j, 1);
                                updateResources(settlements[i + 1][baseIndex + (i >= map.terrainMap.length / 2 ? -1 : 1)], i, j, 1);
                                updateResources(cities[i][baseIndex], i, j, 2);
                                updateResources(cities[i + 1][baseIndex + (i >= map.terrainMap.length / 2 ? -1 : 1)], i, j, 2);
                            }
                        }
                    }
                }

                broadcast('players ' + JSON.stringify(Array.from(players)));
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
        broadcast('players ' + JSON.stringify(Array.from(players)));
    });
});