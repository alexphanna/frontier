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
        hexagon.setAttribute("stroke", "black");
        hexagon.setAttribute("stroke-width", "2");
        hexagon.onmousedown = () => {
            console.log(this.name);
        };
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
            text.setAttribute("font-size", "25");
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
    console.log(map);
    return map;
}

function drawMap(map, svg) {
    const sideLength = 75;
    const inradius = (Math.sqrt(3) / 2) * sideLength;

    let maxLength = 0;
    for (let i = 0; i < map.length; i++) {
        if (map[i].length > maxLength) maxLength = map[i].length;
    }

    let distr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    distr = shuffle(distr);

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            new Tile((map[i][j] == 6 ? "Desert" : resources[map[i][j]]), (map[i][j] == 6 ? "" : distr.pop()), 100 + inradius * 2 * j + (maxLength - map[i].length) * inradius, 100 + sideLength * 1.5 * i, sideLength, svg);
        }
    }
}

function createHexagon(x, y, sideLength) {
    let hexagon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    let points = "";
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i - Math.PI / 2;
        points += `${x + sideLength * Math.cos(angle)},${y + sideLength * Math.sin(angle)} `;
    }
    hexagon.setAttribute("points", points);
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

/*class Robber {
    constructor(svg) {
        this.svg = svg;

        this.draw();
    }
    draw() {
        let robber = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        robber.setAttribute("cx", "100");
        robber.setAttribute("cy", "100");
        robber.setAttribute("r", "15");
        robber.setAttribute("fill", "black");
        robber.setAttribute("filter", "drop-shadow(1px 1px 1px rgb(0 0 0 / 1))");
        dragElement(robber);
        this.svg.appendChild(robber);
    }

}*/

class Building {
    constructor(type, svg) {
        this.type = type;
        this.svg = svg;
        this.shape = `0,0 10,-10 20,0 20,20 0,20`;
        if (this.type == "City") {
            this.shape = `0,0 10,-10 20,0 20,10 40,10 40,30 0,30`;
        }

        this.draw();
    }
    draw() {
        this.polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this.polygon.setAttribute("fill", "red");
        this.polygon.setAttribute("points", this.shape);
        this.move(200, 200)
        this.polygon.setAttribute("stroke", "black");
        this.polygon.setAttribute("stroke-width", "2");
        this.polygon.onmousedown = this.dragMouseDown.bind(this); // Bind the event handler to the instance
        this.svg.appendChild(this.polygon);
    }
    move(x, y) {
        this.polygon.setAttribute("points", this.shape.split(" ").map(point => {
            let coords = point.split(",");
            return `${parseInt(coords[0]) + x},${parseInt(coords[1]) + y}`;
        }).join(" "));
    }

    dragMouseDown(e) {
        e.preventDefault();
        document.onmouseup = this.closeDragElement.bind(this); // Bind the event handler to the instance
        document.onmousemove = this.elementDrag.bind(this); // Bind the event handler to the instance
        console.log("mousedown");
    }

    elementDrag(e) {
        e.preventDefault();
        this.move(e.clientX, e.clientY);
        console.log("mousemove");
    }

    closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "1000");

const resources = ["Brick", "Wool", "Ore", "Grain", "Lumber"];

const map = [
    [1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1],
];

drawMap(generateMap(5), svg);

new Building("Settlement", svg);

new Building("City", svg);

document.body.appendChild(svg);