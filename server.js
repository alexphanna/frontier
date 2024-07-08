class Player {
    constructor(name, color, ws) {
        this.name = name;
        this.color = color;
        this.ws = ws;
        this.points = 0;
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

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let players = new Set();
let map = generateMap();
let turn = 0;

/*  x  x [0, 0, 0, 0, 0, 0, 0] x  x
 *  x [0, 0, 0, 0, 0, 0, 0, 0, 0] x
 * [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
 * [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
 *  x [0, 0, 0, 0, 0, 0, 0, 0, 0] x
 *  x  x [0, 0, 0, 0, 0, 0, 0] x  x
 */
let vertices = [];
for (let i = Math.ceil(map.terrainMap.length / 2) - 1; i >= 0; i--) {
    let temp = [];
    for (let j = 0; j < map.terrainMap[i].length * 2 + 1; j++) {
        temp.push(true);
    }
    vertices.unshift(Array.from(temp));
    vertices.push(Array.from(temp));
}

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
            const row = parseInt(args[2]);
            const col = parseInt(args[3]);
            if (vertices[row][col]) {
                broadcast(String(message));
                vertices[row][col] = false;
                for (let i = (col == 0 ? 0 : -1); i <= (col == vertices[row].length - 1 ? 0 : 1); i++) {
                    vertices[row][col + i] = false;
                }
                if (((row <= 2 && col % 2) || (row >= 3 && !(col % 2))) && row < vertices.length - 1) {
                    vertices[row - 1][col] = false;
                }
                else if (row > 0) {
                    vertices[row + 1][col + Math.floor(vertices.length / 2 - (row + 1))] = false;
                }
                ws.send('vertices ' + JSON.stringify(vertices));
            }
        }
        else if (args[0] === 'get') {
            if (args[1] === 'map') {
                ws.send('map ' + JSON.stringify(map));
            }
            else if (args[1] === 'vertices') {
                ws.send('vertices ' + JSON.stringify(vertices));
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