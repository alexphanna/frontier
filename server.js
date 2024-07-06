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

function broadcast(message) {
    for (const player of players) {
        player.ws.send(message);
    }
}

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let players = new Set();

wss.on('connection', (ws) => {
    console.log('connected');

    ws.on('message', (message) => {
        console.log(`${message}`);

        const args = String(message).split(' ');

        if (args[0] === 'add') {
            players.add(new Player(args[1], args[2], ws));
            broadcast('players ' + JSON.stringify(Array.from(players)));
        }
        else if (args[0] === 'build') {
            // Check legality on server
            broadcast(String(message));
        }
        else if (args[0] === 'get') {
            // get stuff
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