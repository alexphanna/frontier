class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.resources = {
            "Brick": 5,
            "Wool": 5,
            "Ore": 0,
            "Grain": 5,
            "Lumber": 5
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

        let hexagon = createHexagon(this.x, this.y, this.sideLength);

        for (let point of hexagon.getAttribute("points").split(" ")) {
            if (vertices.filter(vertex => vertex.join(",") == point).length == 0) {
                vertices.push(point.split(","));
            }
        }
        switch (this.name) {
            case "Brick":
                hexagon.setAttribute("fill", "#800000");
                break;
            case "Wool":
                hexagon.setAttribute("fill", "#00C000");
                break;
            case "Ore":
                hexagon.setAttribute("fill", "#808080");
                break;
            case "Grain":
                hexagon.setAttribute("fill", "#ffff00");
                break;
            case "Lumber":
                hexagon.setAttribute("fill", "#004000");
                break;
            case "Desert":
                hexagon.setAttribute("fill", "#ffd080");
                break;
        }
        group.appendChild(hexagon);

        if (this.name != "Desert") {
            let token = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            token.setAttribute("cx", this.x);
            token.setAttribute("cy", this.y);
            token.setAttribute("r", this.sideLength / 2.5);
            token.setAttribute("fill", "#ffd080");
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

function generateMap(width) {
    const resourceCounts = {
        "Brick": 3,
        "Wool": 4,
        "Ore": 3,
        "Grain": 4,
        "Lumber": 4
    };
    const resources = Object.keys(resourceCounts);
    const distr = resources.flatMap(resource => Array(resourceCounts[resource]).fill(resources.indexOf(resource)));
    distr.push(6);
    shuffle(distr);

    const map = [];
    for (let i = 3; i <= width; i++) {
        const row = [];
        for (let j = 0; j < i; j++) {
            row.push(distr.pop());
        }
        map.push(row);
    }
    for (let i = width - 1; i >= 3; i--) {
        const row = [];
        for (let j = 0; j < i; j++) {
            row.push(distr.pop());
        }
        map.push(row);
    }
    return map;
}

function drawMap(map, svg) {
    const sideLength = 75;
    const inradius = (Math.sqrt(3) / 2) * sideLength;
    let tiles = [];

    let maxLength = 0;
    for (let i = 0; i < map.length; i++) {
        if (map[i].length > maxLength) maxLength = map[i].length;
    }

    let distr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    distr = shuffle(distr);

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            tiles.push(new Tile((map[i][j] == 6 ? "Desert" : resources[map[i][j]]), (map[i][j] == 6 ? "" : distr.pop()), 100 + inradius * 2 * j + (maxLength - map[i].length) * inradius, 100 + sideLength * 1.5 * i, sideLength, svg));
        }
    }
    return tiles;
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

/*class Robber extends draggableElement {
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
}*/

class Building extends draggableElement {
    constructor(x, y, color, type, svg) {
        super(vertices);
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
}

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "650");

const resources = ["Brick", "Wool", "Ore", "Grain", "Lumber"];

const map = [
    [1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1],
];

const vertices = [];
const tiles = drawMap(generateMap(5), svg);

let player = new Player("Alex", "red");

document.body.insertBefore(svg, document.body.firstChild);