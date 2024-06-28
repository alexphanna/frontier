/**
 * Shuffles the elements in the given array using the Fisher-Yates algorithm.
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} - The shuffled array.
 */
function shuffle(array) {
    let currentIndex = array.length;
    
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Terrain generation
const terrainCounts = {
    "Hills" : 3,
    "Forest" : 4,
    "Mountains" : 3,
    "Fields" : 4,
    "Pasture" : 4,
    "Desert" : 1
}
const terrains = Object.keys(terrainCounts);
var terrainDistr = terrains.flatMap(terrain => Array(terrainCounts[terrain]).fill(terrains.indexOf(terrain)));
shuffle(terrainDistr)

// Number generation
var numberDistr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
shuffle(numberDistr);
numberDistr.splice(terrainDistr.indexOf(5), 0, 0) // Desert

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);
    console.log(ws);

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);

        if (message == "generate") {
            broadcast(`terrains: ${JSON.stringify(terrainDistr)}`);
            broadcast(`numbers: ${JSON.stringify(numberDistr)}`);
            
            broadcast("generated")
        }

        if (message == "rollDice") {
            var roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1
            broadcast(`dice: ${roll}`);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

console.log('WebSocket server started');

function broadcast(message) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}
