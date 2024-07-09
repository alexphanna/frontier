class Player {
    constructor(name, color, ws) {
        this.name = name;
        this.color = color;
        this.ws = ws;
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

function generateMap() {
    let terrainCounts = {
        "Hills": 3,
        "Forest": 4,
        "Mountains": 3,
        "Fields": 4,
        "Pasture": 4,
        "Desert": 1
    }
    const terrains = Object.keys(terrainCounts);
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
    for (const player of players) {
        player.ws.send(message);
    }
}

function broadcastVertices() {
    broadcast('vertices settlement ' + JSON.stringify(settlementVertices));
    for (let i = 0; i < players.size; i++) {
        const vertices = [];
        for (let j = 0; j < cityVertices.length; j++) {
            vertices.push([]);
            for (let k = 0; k < cityVertices[j].length; k++) {
                vertices[j].push(cityVertices[j][k] == i);
            }
        }   
        const playerEdges = [];
        for (let j = 0; j < edges.length; j++) {
            playerEdges.push([]);
            for (let k = 0; k < edges[j].length; k++) {
                playerEdges[j].push(edges[j][k] == i);
            }
        }
        Array.from(players)[i].ws.send('vertices city ' + JSON.stringify(vertices));
        Array.from(players)[i].ws.send('edges ' + JSON.stringify(playerEdges));
    }
}

function addEdge(row, col) {
    if (isNaN(edges[row][col])) {
        edges[row][col] = turn % players.size;
    }
}

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let players = new Set();
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
for (let i = Math.ceil(map.terrainMap.length / 2) - 1; i >= 0; i--) {
    let temp1 = [];
    let temp2 = [];
    for (let j = 0; j < map.terrainMap[i].length * 2 + 1; j++) {
        temp1.push(true);
        temp2.push(NaN);
    }
    settlementVertices.unshift(Array.from(temp1));
    settlementVertices.push(Array.from(temp1));
    cityVertices.unshift(Array.from(temp2));
    cityVertices.push(Array.from(temp2));
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

console.log(edges);

wss.on('connection', (ws) => {
    console.log('connected');

    ws.on('message', (message) => {
        console.log(`${message}`);

        const args = String(message).split(' ');

        if (args[0] === 'add') {
            players.add(new Player(args[1], args[2], ws));
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
                settlementVertices[row][col] = false;
                cityVertices[row][col] = turn % players.size;
                for (let i = (col == 0 ? 0 : -1); i <= (col == settlementVertices[row].length - 1 ? 0 : 1); i++) {
                    settlementVertices[row][col + i] = false;
                    edges[row * 2][col + (i > 0 ? 0 : -1)] = turn % players.size;
                }

                if (((row <= 2 && col % 2) || (row >= 3 && !(col % 2))) && row > 0) {
                    if (settlementVertices[row].length != settlementVertices[row - 1].length) {
                        settlementVertices[row - 1][col + (row >= Math.floor(settlementVertices.length / 2) ? 1 : -1)] = false;
                    }
                    else {
                        settlementVertices[row - 1][col] = false;
                    }
                }
                else if (row < settlementVertices.length - 1) {
                    if (settlementVertices[row].length != settlementVertices[row + 1].length) {
                        settlementVertices[row + 1][col + (row >= Math.floor(settlementVertices.length / 2) ? -1 : 1)] = false; 
                    }
                    else {
                        settlementVertices[row + 1][col] = false;
                    }
                }

                if (row <= 2 && row > 0) {
                    edges[row * 2 + (col % 2 == 1 ? -1 : 1)][Math.floor(col / 2)] = turn % players.size;
                }
                else if (row >= 3 && row < settlementVertices.length - 1) {
                    edges[row * 2 + (col % 2 == 1 ? 1 : -1)][Math.floor(col / 2)] = turn % players.size;
                }
            }
            else if (args[1] === 'city' && cityVertices[row][col] === turn % players.size && player.buildings["cities"] > 0) {
                broadcast(String(message));
                player.points++;
                player.buildings["cities"]--;
                player.buildings["settlements"]++;
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
                console.log(edges);
            }
                
            broadcastVertices();
            broadcast('players ' + JSON.stringify(Array.from(players)));
        }
        else if (args[0] === 'get') {
            if (args[1] === 'map') {
                ws.send('map ' + JSON.stringify(map));
            }
            else if (args[1] === 'vertices') {
                if (args[2] === "settlement") {
                    ws.send('vertices settlement ' + JSON.stringify(settlementVertices));
                }
                else if (args[2] === "city") {
                    ws.send('vertices city ' + JSON.stringify(cityVertices));
                }
            }
            else if (args[1] === 'edges') {
                ws.send('edges ' + JSON.stringify(edges));
            }
        }
        else if (args[0] === 'end') {
            turn++;
            if (turn < players.size * 2) {
                if (turn < players.size) {
                    Array.from(players)[turn].ws.send('start');
                }
                else {
                    Array.from(players)[players.size - 1 - (turn % players.size)].ws.send('start');
                }
            }
            else {
                // roll dice
                Array.from(players)[turn % players.size].ws.send('start');
                broadcast('roll ' + Math.floor(Math.random() * 6 + 1));

                // distribute resources
            }
        }
    });

    ws.on('close', () => {
        console.log('disconnected');
        players.forEach((player) => {
            if (player.ws === ws) {
                players.delete(player);
            }
        });
        broadcast('players ' + JSON.stringify(Array.from(players)));
    });
});