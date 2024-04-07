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

        this.updateInfo();
    }
    get canBuildSettlement() {
        return this.resources["Brick"] >= 1 && this.resources["Wool"] >= 1 && this.resources["Grain"] >= 1 && this.resources["Lumber"] >= 1 && this.settlements > 0;
    }
    get canBuildCity() {
        return this.resources["Ore"] >= 3 && this.resources["Grain"] >= 2 && this.cities > 0;
    }
    updateInfo() {
        document.getElementById("resources").innerHTML = `Brick: ${this.resources["Brick"]}<br>Wool: ${this.resources["Wool"]}<br>Ore: ${this.resources["Ore"]}<br>Grain: ${this.resources["Grain"]}<br>Lumber: ${this.resources["Lumber"]}`;
        document.getElementById("buildings").innerHTML = `Settlements: ${this.settlements}<br>Cities: ${this.cities}<br>Roads: ${this.roads}`;
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
            new Building(100, 100, this.color, "Settlement", svg);
        }
    }
    buildCity() {
        if (this.canBuildCity) {
            this.resources["Ore"] -= 3;
            this.resources["Grain"] -= 2;
            this.cities--;
            this.victoryPoints++;
            this.updateInfo();
            new Building(100, 100, this.color, "City", svg);
        }
    }
    buildRoad() {
        this.roads--;
        this.resources["Brick"] -= 1;
        this.resources["Lumber"] -= 1;
        this.updateInfo();
        new Road(100, 100, this.color, svg);
    }
}

class Dice {
    roll() {
        return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    }
}

class Map {
    // Map:
    // Jagged Array of integers representing resources
    // Jagged Array of integers representing numbers
    // Array of vertices
    // Array of edges
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

        this.draw(svg, resources);
    }
    draw(svg, resources) {
        const sideLength = 75;
        const inradius = (Math.sqrt(3) / 2) * sideLength;
        const tiles = [];
    
        let maxLength = 0;
        for (let i = 0; i < this.resourceMap.length; i++) {
            if (this.resourceMap[i].length > maxLength) maxLength = this.resourceMap[i].length;
        }
    
        for (let i = 0; i < this.resourceMap.length; i++) {
            for (let j = 0; j < this.resourceMap[i].length; j++) {
                if (this.resourceMap[i][j] == 6) {
                    tiles.push(new Tile("Desert", "", 100 + inradius * 2 * j + (maxLength - this.resourceMap[i].length) * inradius, 100 + sideLength * 1.5 * i, sideLength, svg));
                }
                else {
                    tiles.push(new Tile(resources[this.resourceMap[i][j]], this.numberMap[i][j], 100 + inradius * 2 * j + (maxLength - this.resourceMap[i].length) * inradius, 100 + sideLength * 1.5 * i, sideLength, svg));
                }
            }
        }

        this.vertices = [];
        for (let tile of tiles) {
            for (let point of tile.hexagon.getAttribute("points").split(" ")) {
                if (this.vertices.filter(vertex => vertex.join(",") == point).length == 0) {
                    this.vertices.push(point.split(","));
                }
            }
        }

        this.edges = [];
        for (let tile of tiles) {
            const hexagonPoints = tile.hexagon.getAttribute("points").split(" ");
            for (let i = 0; i < hexagonPoints.length; i++) {
                const vertex1 = hexagonPoints[i].split(",");
                const vertex2 = hexagonPoints[(i + 1) % (hexagonPoints.length - 1)].split(",");
                let edge = [Math.min(vertex1[0], vertex2[0]) + Math.abs(vertex1[0] - vertex2[0]) / 2, Math.min(vertex1[1], vertex2[1]) + Math.abs(vertex1[1] - vertex2[1]) / 2];
                if (this.edges.filter(e => e.join(",") == edge.join(",")).length == 0) {
                    this.edges.push(edge);
                }
            }
        }
    }
}

class Tile {
    constructor(name, number, x, y, sideLength, svg) {
        this.name = name;
        this.number = number;
        this.x = x;
        this.y = y;
        this.sideLength = sideLength;
        this.svg = svg;

        this.draw();
    }

    get inradius() {
        return (Math.sqrt(3) / 2) * this.sideLength;
    }

    draw() {
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.id = "Tile";

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
            let token = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            token.setAttribute("cx", this.x);
            token.setAttribute("cy", this.y);
            token.setAttribute("r", this.sideLength / 3);
            token.setAttribute("fill", "#ffe0a0");
            token.setAttribute("stroke", "black");
            token.setAttribute("stroke-width", "2");
            group.appendChild(token);
    
            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", this.x);
            text.setAttribute("y", this.y);
            text.setAttribute("fill", (this.number == 6 || this.number == 8 ? "red" : "black"));
            text.setAttribute("font-size", "30");
            text.textContent = this.number;
            group.appendChild(text);
        }

        this.svg.appendChild(group);
    }
}

class draggableElement {
    constructor(snapPoints) {
        this.snapPoints = snapPoints;
    }

    dragMouseDown(e) {
        e.preventDefault();
        document.onmouseup = this.closeDragElement.bind(this);
        document.onmousemove = this.elementDrag.bind(this)
    }

    elementDrag(e) {
        e.preventDefault();
        this.move(e.clientX, e.clientY);
    }

    closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        this.snap();
    }
}

class Robber extends draggableElement {
    constructor(radius, svg) {
        super(tiles);
        this.svg = svg;
        this.radius = radius;

        this.draw();
    }
    draw() {
        this.robber = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.robber.setAttribute("cx", "100");
        this.robber.setAttribute("cy", "100");
        this.robber.setAttribute("r", this.radius);
        this.robber.setAttribute("fill", "black");
        this.robber.onmousedown = this.dragMouseDown.bind(this);
        this.svg.appendChild(this.robber);
    }
    move(x, y) {
        this.robber.setAttribute("cx", x);
        this.robber.setAttribute("cy", y);
    }
}

class Building extends draggableElement {
    constructor(x, y, color, type, svg) {
        super();
        this.snapPoints = map.vertices;
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.svg = svg;

        switch (this.type) {
            case "Settlement":
                this.shape = `0,0 10,-10 20,0 20,20 0,20`;
                break;
            case "City":
                this.shape = `0,0 10,-10 20,0 20,10 40,10 40,30 0,30`;
                break;
        }

        this.draw();
    }

    draw() {
        this.polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this.polygon.setAttribute("fill", this.color);
        this.polygon.setAttribute("points", this.shape);
        this.move(this.x, this.y);
        this.polygon.onmousedown = this.dragMouseDown.bind(this); // Bind the event handler to the instance
        this.svg.appendChild(this.polygon);
    }

    move(x, y) {
        this.polygon.setAttribute("points", this.shape.split(" ").map(point => {
            let coords = point.split(",");
            return `${parseInt(coords[0]) + x},${parseInt(coords[1]) + y}`;
        }).join(" "));
    }

    snap() {
        let closestPoint = null;
        let closestDistance = Infinity;
        for (let point of this.snapPoints) {
            if (Math.sqrt((this.polygon.getAttribute("points").split(" ")[0].split(",")[0] - point[0]) ** 2 + (this.polygon.getAttribute("points").split(" ")[0].split(",")[1] - point[1]) ** 2) < closestDistance) {
                closestPoint = point;
                closestDistance = Math.sqrt((this.polygon.getAttribute("points").split(" ")[0].split(",")[0] - point[0]) ** 2 + (this.polygon.getAttribute("points").split(" ")[0].split(",")[1] - point[1]) ** 2);
            }
        }
        this.move(parseInt(closestPoint[0]) - this.polygon.getBBox().width / 2, parseInt(closestPoint[1]) - this.polygon.getBBox().width / 2);
    }
}

class Road extends draggableElement {
    constructor(x, y, color, svg) {
        super();
        this.snapPoints = map.edges;
        this.x = x;
        this.y = y;
        this.color = color;
        this.svg = svg;

        this.draw();
    }

    draw() {
        this.rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.rect.setAttribute("fill", this.color);
        this.rect.setAttribute("width", "10");
        this.rect.setAttribute("height", "40");
        this.move(this.x, this.y);
        this.rect.onmousedown = this.dragMouseDown.bind(this);
        this.svg.appendChild(this.rect);
    }

    move(x, y) {
        this.rect.setAttribute("x", x);
        this.rect.setAttribute("y", y);
    }

    snap() {
        let closestPoint = null;
        let closestDistance = Infinity;
        for (let point of this.snapPoints) {
            if (Math.sqrt((this.rect.getAttribute("x") - point[0]) ** 2 + (this.rect.getAttribute("y") - point[1]) ** 2) < closestDistance) {
                closestPoint = point;
                closestDistance = Math.sqrt((this.rect.getAttribute("x") - point[0]) ** 2 + (this.rect.getAttribute("y") - point[1]) ** 2);
            }
        }
        this.move(parseInt(closestPoint[0]) - this.rect.getAttribute("width") / 2, parseInt(closestPoint[1]) - this.rect.getAttribute("height") / 2);
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

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "650");

let map = new Map(5);

let player = new Player("Alex", "red");

let dice1 = new Dice();
let dice2 = new Dice();

document.body.insertBefore(svg, document.body.firstChild);