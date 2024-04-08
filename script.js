class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;
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

        this.updateInfo();
    }
    get canBuildSettlement() {
        return this.resources["Brick"] >= 1 && this.resources["Wool"] >= 1 && this.resources["Grain"] >= 1 && this.resources["Lumber"] >= 1 && this.settlements > 0;
    }
    get canBuildCity() {
        return this.resources["Ore"] >= 3 && this.resources["Grain"] >= 2 && this.cities > 0;
    }
    updateInfo() {
        document.getElementById("resourcesInfo").innerHTML = `Brick: ${this.resources["Brick"]}<br>Wool: ${this.resources["Wool"]}<br>Ore: ${this.resources["Ore"]}<br>Grain: ${this.resources["Grain"]}<br>Lumber: ${this.resources["Lumber"]}`;
        document.getElementById("buildingsInfo").innerHTML = `Settlements: ${this.settlements}<br>Cities: ${this.cities}<br>Roads: ${this.roads}`;
        if (!this.canBuildSettlement) {
            document.getElementById("buildSettlement").disabled = true;
        }
        if (!this.canBuildCity) {
            document.getElementById("buildCity").disabled = true;
        }
    }
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
        this.resources["Brick"] -= 1;
        this.resources["Lumber"] -= 1;
        this.updateInfo();
        new Road(100, 100, this.color);
    }
}

class Dice {
    roll() {
        const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
        document.getElementById("roll").innerHTML = `roll: ${roll}`;
        for (let tile of map.tiles) {
            if (tile.name == "Desert") {
                continue;
            }
            if (roll == 7) {
                tile.token.setAttribute("fill", "#ff4040");
            }
            else {
                if (tile.number == roll) {
                    tile.token.setAttribute("fill", "#00c0ff");
                }
                else {
                    tile.token.setAttribute("fill", "#ffe0a0");
                }
            }
        }
        for (let player of players) {
            for (let building of player.buildings) {
                for (let tile of building.nearbyTiles) {
                    if (tile.number == roll) {
                        if (building.polygon.id == "settlement") {
                            player.resources[tile.name]++;
                        }
                        else if (building.polygon.id == "city") {
                            player.resources[tile.name] += 2;
                        }
                    }
                }
            }
            player.updateInfo();
        }
    }
}

class Map {
    constructor (width) {
        // Resource allocation
        const resourceCounts = {
            "Brick": 3,
            "Wool": 4,
            "Ore": 3,
            "Grain": 4,
            "Lumber": 4
        };
        const resources = Object.keys(resourceCounts);
        const resourceDistr = resources.flatMap(resource => Array(resourceCounts[resource]).fill(resources.indexOf(resource)));
        shuffle(resourceDistr);
        this.resourceMap = [];
    
        // Number allocation
        const numberDistr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        shuffle(numberDistr);
        this.numberMap = [];

        // Desert
        const random = Math.floor(Math.random() * resourceDistr.length);
        resourceDistr.splice(random, 0, 6);
        numberDistr.splice(random, 0, 7);
    
        for (let i = 3; i <= width; i++) {
            const resourceRow = [];
            const numberRow = [];
            for (let j = 0; j < i; j++) {
                resourceRow.push(resourceDistr.pop());
                numberRow.push(numberDistr.pop());
            }
            this.resourceMap.push(resourceRow);
            this.numberMap.push(numberRow);
        }
        for (let i = width - 1; i >= 3; i--) {
            const resourceRow = [];
            const numberRow = [];
            for (let j = 0; j < i; j++) {
                resourceRow.push(resourceDistr.pop());
                numberRow.push(numberDistr.pop());
            }
            this.resourceMap.push(resourceRow);
            this.numberMap.push(numberRow);
        }

        const sideLength = 75;
        const inradius = (Math.sqrt(3) / 2) * sideLength;
        this.tiles = [];
        this.tilesPoints = [];
    
        let maxLength = 0;
        for (let i = 0; i < this.resourceMap.length; i++) {
            if (this.resourceMap[i].length > maxLength) maxLength = this.resourceMap[i].length;
        }
    
        for (let i = 0; i < this.resourceMap.length; i++) {
            for (let j = 0; j < this.resourceMap[i].length; j++) {
                if (this.resourceMap[i][j] == 6) {
                    this.tiles.push(new Tile("Desert", 7, 100 + inradius * 2 * j + (maxLength - this.resourceMap[i].length) * inradius, 100 + sideLength * 1.5 * i, sideLength));
                }
                else {
                    this.tiles.push(new Tile(resources[this.resourceMap[i][j]], this.numberMap[i][j], 100 + inradius * 2 * j + (maxLength - this.resourceMap[i].length) * inradius, 100 + sideLength * 1.5 * i, sideLength));
                }
                this.tilesPoints.push([100 + inradius * 2 * j + (maxLength - this.resourceMap[i].length) * inradius, 100 + sideLength * 1.5 * i]);
            }
        }

        // vertex = { x, y }
        this.vertices = [];
        for (let tile of this.tiles) {
            for (let point of tile.hexagon.getAttribute("points").split(" ")) {
                if (this.vertices.filter(vertex => vertex.join(",") == point).length == 0) {
                    this.vertices.push(point.split(","));
                }
            }
        }

        // edge = { x, y, θ }
        this.edges = [];
        for (let tile of this.tiles) {
            const hexagonPoints = tile.hexagon.getAttribute("points").split(" ");
            for (let i = 0; i < hexagonPoints.length; i++) {
                const vertex1 = hexagonPoints[i].split(",");
                const vertex2 = hexagonPoints[(i + 1) % (hexagonPoints.length - 1)].split(",");
                let edge = [Math.min(vertex1[0], vertex2[0]) + Math.abs(vertex1[0] - vertex2[0]) / 2, Math.min(vertex1[1], vertex2[1]) + Math.abs(vertex1[1] - vertex2[1]) / 2];
                edge.push(Math.atan2(vertex1[1] - vertex2[1], vertex1[0] - vertex2[0]) * 180 / Math.PI);
                if (this.edges.filter(e => e.join(",") == edge.join(",")).length == 0) {
                    this.edges.push(edge);
                }
            }
        }
    }
}

class Tile {
    constructor(name, number, x, y, sideLength) {
        this.name = name;
        this.number = number;
        this.x = x;
        this.y = y;
        this.sideLength = sideLength;

        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.id = "tile";

        this.hexagon = createHexagon(this.x, this.y, this.sideLength);

        switch (this.name) {
            case "Brick":
                this.hexagon.setAttribute("fill", "#800000");
                break;
            case "Wool":
                this.hexagon.setAttribute("fill", "#00C000");
                break;
            case "Ore":
                this.hexagon.setAttribute("fill", "#808080");
                break;
            case "Grain":
                this.hexagon.setAttribute("fill", "#ffff00");
                break;
            case "Lumber":
                this.hexagon.setAttribute("fill", "#004000");
                break;
            case "Desert":
                this.hexagon.setAttribute("fill", "#ffd080");
                break;
        }
        group.appendChild(this.hexagon);

        if (this.name != "Desert") {
            this.token = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            this.token.setAttribute("cx", this.x);
            this.token.setAttribute("cy", this.y);
            this.token.setAttribute("r", this.sideLength / 3);
            this.token.setAttribute("fill", "#ffe0a0");
            this.token.setAttribute("stroke", "black");
            this.token.setAttribute("stroke-width", "2");
            group.appendChild(this.token);
    
            this.text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            this.text.setAttribute("x", this.x);
            this.text.setAttribute("y", this.y);
            this.text.setAttribute("fill", (this.number == 6 || this.number == 8 ? "red" : "black"));
            this.text.setAttribute("font-size", "30");
            this.text.textContent = this.number;
            group.appendChild(this.text);
        }

        document.getElementById("tiles").appendChild(group);
    }

    get inradius() {
        return (Math.sqrt(3) / 2) * this.sideLength;
    }

    toString() {
        return `${this.name} ${this.number}`;
    }
}

class draggableElement {
    dragMouseDown(e) {
        e.preventDefault();
        document.onmouseup = this.closeDragElement.bind(this);
        document.onmousemove = this.elementDrag.bind(this)
        this.raise();
    }

    elementDrag(e) {
        e.preventDefault();
        this.move(e.clientX, e.clientY);
    }

    closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        this.lower();
        this.snap();
    }
}

class Robber extends draggableElement {
    constructor(radius) {
        super();
        this.snapPoints = map.tilesPoints;
        this.radius = radius;

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.element.id = "robber";
        this.element.setAttribute("cx", "100");
        this.element.setAttribute("cy", "100");
        this.element.setAttribute("r", this.radius);
        this.element.setAttribute("fill", "black");
        this.element.onmousedown = this.dragMouseDown.bind(this);
        document.getElementById("board").appendChild(this.element);
    }

    move(x, y) {
        this.element.setAttribute("cx", x);
        this.element.setAttribute("cy", y);
    }
    
    snap() {
        let closestPoint = null;
        let closestDistance = Infinity;
        for (let point of this.snapPoints) {
            if (Math.sqrt((this.element.getAttribute("cx") - point[0]) ** 2 + (this.element.getAttribute("cy") - point[1]) ** 2) < closestDistance) {
                closestPoint = point;
                closestDistance = Math.sqrt((this.element.getAttribute("cx") - point[0]) ** 2 + (this.element.getAttribute("cy") - point[1]) ** 2);
            }
        }
        this.move(closestPoint[0] - this.element.getAttribute("radius"), closestPoint[1] - this.element.getAttribute("radius"));
    }

    // robber does not raise or lower
    raise() { }
    lower() { }
}

class Building extends draggableElement {
    constructor(x, y, color, id) {
        super();
        this.snapPoints = map.vertices;
        this.x = x;
        this.y = y;
        this.color = color;
        this.nearbyTiles = [];

        switch (id) {
            case "settlement":
                this.shape = `0,0 10,-10 20,0 20,20 0,20`;
                break;
            case "city":
                this.shape = `0,0 10,-10 20,0 20,10 40,10 40,30 0,30`;
                break;
        }

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this.element.setAttribute("id", id);
        this.element.setAttribute("fill", this.color);
        this.element.setAttribute("points", this.shape);
        this.move(this.x, this.y);
        this.element.onmousedown = this.dragMouseDown.bind(this); // Bind the event handler to the instance
        document.getElementById("buildings").appendChild(this.element);
    }

    move(x, y) {
        this.element.setAttribute("points", this.shape.split(" ").map(point => {
            let coords = point.split(",");
            return `${parseInt(coords[0]) + x},${parseInt(coords[1]) + y}`;
        }).join(" "));
    }

    snap() {
        let closestPoint = null;
        let closestDistance = Infinity;
        for (let point of this.snapPoints) {
            if (Math.sqrt((this.element.getAttribute("points").split(" ")[0].split(",")[0] - point[0]) ** 2 + (this.element.getAttribute("points").split(" ")[0].split(",")[1] - point[1]) ** 2) < closestDistance) {
                closestPoint = point;
                closestDistance = Math.sqrt((this.element.getAttribute("points").split(" ")[0].split(",")[0] - point[0]) ** 2 + (this.element.getAttribute("points").split(" ")[0].split(",")[1] - point[1]) ** 2);
            }
        }
        this.move(closestPoint[0] - this.element.getBBox().width / 2, closestPoint[1] - this.element.getBBox().width / 2);
        
        // when snapped record what resources the settlement is next to
        this.nearbyTiles = [];
        for (let tile of map.tiles) {
            for (let point of tile.hexagon.getAttribute("points").split(" ")) {
                if (Math.abs(point.split(",")[0] - closestPoint[0]) < 0.01 
                    && Math.abs(point.split(",")[1] - closestPoint[1]) < 0.01) {
                    this.nearbyTiles.push(tile);
                }
            }
        }
        document.getElementById("nearbyTiles").innerHTML = this.nearbyTiles.toString();
    }

    raise() {
        document.getElementById("buildings").removeChild(this.element);
        document.getElementById("board").appendChild(this.element);
    }

    lower() {
        document.getElementById("board").removeChild(this.element);
        document.getElementById("buildings").appendChild(this.element);
    }
}

class Road extends draggableElement {
    constructor(x, y, color) {
        super();
        this.snapPoints = map.edges;
        this.x = x;
        this.y = y;
        this.color = color;

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.element.id = "road";
        this.element.setAttribute("fill", this.color);
        this.element.setAttribute("width", "40");
        this.element.setAttribute("height", "10");
        this.move(this.x, this.y);
        this.element.onmousedown = this.dragMouseDown.bind(this);
        document.getElementById("roads").appendChild(this.element);
    }

    move(x, y) {
        this.element.setAttribute("x", x);
        this.element.setAttribute("y", y);
    }

    snap() {
        let closestPoint = null;
        let closestDistance = Infinity;
        for (let point of this.snapPoints) {
            if (Math.sqrt((this.element.getAttribute("x") - point[0]) ** 2 + (this.element.getAttribute("y") - point[1]) ** 2) < closestDistance) {
                closestPoint = point;
                closestDistance = Math.sqrt((this.element.getAttribute("x") - point[0]) ** 2 + (this.element.getAttribute("y") - point[1]) ** 2);
            }
        }
        this.element.setAttribute("transform", `rotate(${closestPoint[2]})`);
        this.move(closestPoint[0] - this.element.getAttribute("width") / 2, closestPoint[1] - this.element.getAttribute("height") / 2);
    }

    raise() {
        document.getElementById("roads").removeChild(this.element);
        document.getElementById("board").appendChild(this.element);
        this.element.setAttribute("transform", `rotate(0)`);
    }

    lower() {
        document.getElementById("board").removeChild(this.element);
        document.getElementById("roads").appendChild(this.element);
    }
}

function createHexagon(x, y, sideLength) {
    let hexagon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    let vertices = "";
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i - Math.PI / 2;
        vertices += `${x + sideLength * Math.cos(angle)},${y + sideLength * Math.sin(angle)} `;
    }
    hexagon.setAttribute("points", vertices);
    return hexagon;
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

let map = new Map(5);

let player = new Player("Alex", "blue");

let players = [player];

let dice = new Dice();

new Robber(20);