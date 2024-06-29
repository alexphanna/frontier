class Player {
    constructor(name, color, client) {
        this.name = name;
        this.color = color;
        this.client = client;
        this.resources = {
            "Brick": 50,
            "Wool": 50,
            "Ore": 50,
            "Grain": 50,
            "Lumber": 50
        };
        this.settlements = 5;
        this.cities = 4;
        this.roads = 15;
        this.victoryPoints = 0;
        this.buildings = [];

        //this.updateInfo();
    }
    get canBuildSettlement() {
        return this.resources["Brick"] >= 1 && this.resources["Wool"] >= 1 && this.resources["Grain"] >= 1 && this.resources["Lumber"] >= 1 && this.settlements > 0;
    }
    get canBuildCity() {
        return this.resources["Ore"] >= 3 && this.resources["Grain"] >= 2 && this.cities > 0;
    }
    /*updateInfo() {
        document.getElementById("resourcesInfo").innerHTML = `Brick: ${this.resources["Brick"]}<br>Wool: ${this.resources["Wool"]}<br>Ore: ${this.resources["Ore"]}<br>Grain: ${this.resources["Grain"]}<br>Lumber: ${this.resources["Lumber"]}`;
        document.getElementById("buildingsInfo").innerHTML = `Settlements: ${this.settlements}<br>Cities: ${this.cities}<br>Roads: ${this.roads}`;
        if (!this.canBuildSettlement) {
            document.getElementById("buildSettlement").disabled = true;
        }
        if (!this.canBuildCity) {
            document.getElementById("buildCity").disabled = true;
        }
    }*/
    buildSettlement() {
        if (this.canBuildSettlement) {
            this.resources["Brick"]--;
            this.resources["Wool"]--;
            this.resources["Grain"]--;
            this.resources["Lumber"]--;
            this.settlements--;
            this.victoryPoints++;
            this.updateInfo();
            this.buildings.push(new Building(100, 100, this.color, "settlement"));
        }
    }
    buildCity() {
        if (this.canBuildCity) {
            this.resources["Ore"] -= 3;
            this.resources["Grain"] -= 2;
            this.cities--;
            this.victoryPoints++;
            this.updateInfo();
            this.buildings.push(new Building(100, 100, this.color, "city"));
        }
    }
    buildRoad() {
        this.roads--;
        this.resources["Brick"]--;
        this.resources["Lumber"]--;
        this.updateInfo();
        new Road(100, 100, this.color);
    }
}

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

function generateTerrain() {
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
    return terrainDistr;
}

function generateNumbers(terrainDistr) {
    var numberDistr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    shuffle(numberDistr);
    numberDistr.splice(terrainDistr.indexOf(5), 0, 0) // Desert
    return numberDistr;
}

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const players = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);

        if (message == "start") {
            broadcast("started");
        }
        if (message == "generate") {
            var terrains = generateTerrain();
            var numbers = generateNumbers(terrains);
            broadcast(`terrains: ${JSON.stringify(terrains)}`);
            broadcast(`numbers: ${JSON.stringify(numbers)}`);
            
            broadcast("generated")
        }
        if (message == "rollDice") {
            var roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1
            broadcast(`dice: ${roll}`);
        }
        // gets the list of players
        if (message == "players") {
            broadcast(`players: ${JSON.stringify(Array.from(players).map(player => player.name))}`);
        }
        // adds a player to the list of players
        if (String(message).startsWith("addPlayer")) {
            var name = String(message).split(" ")[1];
            var color = String(message).split(" ")[2];
            players.add(new Player(name, color, ws));
            broadcast(`players: ${JSON.stringify(Array.from(players).map(player => player.name))}`);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        for (const player of players) {
            if (player.client == ws) {
                players.delete(player);
            }
        }
        broadcast(`players: ${JSON.stringify(Array.from(players).map(player => player.name))}`);
    });
});

console.log('WebSocket server started');

function broadcast(message) {
    for (const player of players) {
        if (player.client.readyState === WebSocket.OPEN) {
            player.client.send(message);
        }
    }
}
