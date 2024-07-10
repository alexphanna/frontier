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
    broadcast('vertices settlement ' + JSON.stringify(settlementVertices));
    for (let i = 0; i < players.size; i++) {
        const playerVertices = [];
        for (let j = 0; j < cityVertices.length; j++) {
            playerVertices.push([]);
            for (let k = 0; k < cityVertices[j].length; k++) {
                playerVertices[j].push(cityVertices[j][k] == i);
            }
        }   
        const playerEdges = [];
        for (let j = 0; j < edges.length; j++) {
            playerEdges.push([]);
            for (let k = 0; k < edges[j].length; k++) {
                playerEdges[j].push(edges[j][k] == i);
            }
        }
        Array.from(clients)[i].send('vertices city ' + JSON.stringify(playerVertices));
        Array.from(clients)[i].send('edges ' + JSON.stringify(playerEdges));
    }
}

function addEdge(row, col) {
    if (row < 0 || row >= edges.length || col < 0 || col >= edges[row].length) {
        return;
    }
    if (isNaN(edges[row][col])) {
        edges[row][col] = turn % players.size;
    }
}

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let players = new Set();
let clients = new Set();
let map = generateMap();
let turn = 0;

// vertices
/*  x  x [0, 0, 0, 0, 0, 0, 0] x  x
 *  x [0, 0, 0, 0, 0, 0, 0, 0, 0] x
 * [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
 * [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
 *  x [0, 0, 0, 0, 0, 0, 0, 0, 0] x
 *  x  x [0, 0, 0, 0, 0, 0, 0] x  x
 */
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

// edges
/* 0:  [0, 0, 0, 0, 0, 0]
 * 1:  [0, 0, 0, 0]
 * 2:  [0, 0, 0, 0, 0, 0, 0, 0]
 * 3:  [0, 0, 0, 0, 0]
 * 4:  [0, 0, 0, r, r, 0, 0, 0, 0, 0]
 * 5:  [0, 0, X, 0, 0, 0]
 * 6:  [0, 0, 0, r, r, 0, 0, 0, 0, 0]
 * 7:  [0, 0, 0, 0, 0]
 * 8:  [0, 0, 0, 0, 0, 0, 0, 0]
 * 9:  [0, 0, 0, 0]
/* 10: [0, 0, 0, 0, 0, 0]
 */

/* NaN = no road
 * 0 = player 0... able to build
 * player.size = road
 */

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
            players.add(new Player(args[1], args[2]));
            clients.add(ws);
            broadcast('players ' + JSON.stringify(Array.from(players)));
            if (players.size == 1) {
                ws.send('start');
            }
        }
        else if (args[0] === 'build') {
            let player = Array.from(players)[turn % players.size];
            const row = parseInt(args[2]);
            const col = parseInt(args[3]);
            if ((args[1] === 'settlement' && settlementVertices[row][col] && player.buildings["settlements"] > 0)) {
                broadcast(String(message));
                player.points++;
                player.buildings["settlements"]--;
                settlementVertices[row][col] = 0;
                settlements[row][col] = turn % players.size;
                cityVertices[row][col] = turn % players.size;
                for (let i = (col == 0 ? 0 : -1); i <= (col == settlementVertices[row].length - 1 ? 0 : 1); i++) {
                    settlementVertices[row][col + i] = 0;
                    addEdge(row * 2, col + (i > 0 ? 0 : -1));
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

                if (row <= 2 && row > 0) {
                    addEdge(row * 2 + (col % 2 == 1 ? -1 : 1), Math.floor(col / 2));
                }
                else if (row >= 3 && row < settlementVertices.length - 1) {
                    addEdge(row * 2 + (col % 2 == 1 ? 1 : -1), Math.floor(col / 2));
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
                if (row % 2 == 0) {
                    for (let i = (col == 0 ? 0 : -1); i <= (col == edges[row].length - 1 ? 0 : 1); i++) {
                        if (isNaN(edges[row][col + i])) {
                            edges[row][col + i] = turn % players.size;
                        }
                    }
                    
                    addEdge(row + (col % 2 == 0 ? 1 : -1), row < 5 ? Math.floor(col / 2) : Math.ceil(col / 2));
                    addEdge(row + (col % 2 == 0 ? -1 : 1), row < 5 ? Math.ceil(col / 2) : Math.floor(col / 2))
                }
                else {
                    for (let i = -1; i <= 1; i+= 2) {
                        if (row < 5) {
                            addEdge(row + i, col * 2);
                            addEdge(row + i, col * 2 + i);
                        }
                        else if (row == 5) {
                            addEdge(row + i, col * 2 - 1);
                            addEdge(row + i, col * 2);
                        }
                        else  if (row > 5) {
                            addEdge(row + i, col * 2);
                            addEdge(row + i, col * 2 - i);
                        }
                    }
                }
                edges[row][col] = players.size;
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
        else if (args[0] === 'end') {
            turn++;
            if (turn < players.size * 2) {
                if (turn < players.size) {
                    Array.from(clients)[turn].send('start');
                }
                else {
                    Array.from(clients)[players.size - 1 - (turn % players.size)].send('start');
                }
            }
            else {
                // roll dice
                Array.from(clients)[turn % players.size].send('start');
                const roll = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
                broadcast('roll ' + roll);

                // Distribute resources
                for (let i = 0; i < map.terrainMap.length; i++) {
                    for (let j = 0; j < map.terrainMap[i].length; j++) {
                        if (map.numberMap[i][j] === roll) {
                            for (let k = -1; k <= 1; k++) {
                                if (!isNaN(settlements[i][j * 2 + k + 1 + (i < map.terrainMap.length / 2 ? 0 : 1)])) {
                                    const player = Array.from(players)[settlements[i][j * 2 + k + 1 + (i < map.terrainMap.length / 2 ? 0 : 1)]];
                                    player.resources[resources[map.terrainMap[i][j]]]++;
                                }
                                if (!isNaN(settlements[i + 1][j * 2 + k + 1 + (i > map.terrainMap.length / 2 ? 0 : 1)])) {
                                    const player = Array.from(players)[settlements[i + 1][j * 2 + k + 1 + (i > map.terrainMap.length / 2 ? 0 : 1)]];
                                    player.resources[resources[map.terrainMap[i][j]]]++;
                                }
                                if (!isNaN(cities[i][j * 2 + k + 1 + (i < map.terrainMap.length / 2 ? 0 : 1)])) {
                                    const player = Array.from(players)[cities[i][j * 2 + k + 1 + (i < map.terrainMap.length / 2 ? 0 : 1)]];
                                    player.resources[resources[map.terrainMap[i][j]]] += 2;
                                }
                                if (!isNaN(cities[i + 1][j * 2 + k + 1 + (i > map.terrainMap.length / 2 ? 0 : 1)])) {
                                    const player = Array.from(players)[cities[i + 1][j * 2 + k + 1 + (i > map.terrainMap.length / 2 ? 0 : 1)]];
                                    player.resources[resources[map.terrainMap[i][j]]] += 2;
                                }
                            }
                        }
                    }
                }

                broadcast('players ' + JSON.stringify(Array.from(players)));
            }
        }
    });

    /* x  x [0, 0, 0, 0, 0, 0, 0] x  x
    *  x [0, X, X, X, 0, 0, 0, 0, 0] x
    * [0, 0, X, X, X, 0, 0, 0, 0, 0, 0]
    * [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    *  x [0, 0, 0, 0, 0, 0, 0, 0, 0] x
    *  x  x [0, 0, 0, 0, 0, 0, 0] x  x
    */

    /*                  0, 1, 2, 3, 4, 5, 6
     *  round(x / 3)    0, 0, 1, 1, 1, 2, 2
     *
     *  floor(x / 3)    0, 0, 0, 1, 1, 1, 2
     *  ceil(x / 3)     0, 1, 1, 1, 2, 2, 2
     */

    /* [1, 0, 0]
     * [0, 0, 0, 0]
     * [0, 0, 0, 0, 0]
     * [0, 0, 0, 0]
     * [0, 0, 0]
     */

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