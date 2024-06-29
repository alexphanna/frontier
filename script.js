class Map {
    constructor(terrainDistr, numberDistr) {
        let width = 5

        this.terrainMap = []
        this.numberMap = []

        for (let i = 3; i <= width; i++) {
            const terrainRow = [];
            const numberRow = [];
            for (let j = 0; j < i; j++) {
                terrainRow.push(terrainDistr.pop());
                numberRow.push(numberDistr.pop());
            }
            this.terrainMap.push(terrainRow);
            this.numberMap.push(numberRow);
        }
        for (let i = width - 1; i >= 3; i--) {
            const terrainRow = [];
            const numberRow = [];
            for (let j = 0; j < i; j++) {
                terrainRow.push(terrainDistr.pop());
                numberRow.push(numberDistr.pop());
            }
            this.terrainMap.push(terrainRow);
            this.numberMap.push(numberRow);
        }

        const sideLength = 75;
        const inradius = (Math.sqrt(3) / 2) * sideLength;
        this.tiles = []

        const svg = document.getElementById("board");

        const terrainCounts = {
            "Hills": 3,
            "Forest": 4,
            "Mountains": 3,
            "Fields": 4,
            "Pasture": 4,
            "Desert": 1
        }
        const terrains = Object.keys(terrainCounts);
        var maxLength = 5;

        for (let i = 0; i < this.terrainMap.length; i++) {
            for (let j = 0; j < this.terrainMap[i].length; j++) {
                this.tiles.push(new Tile(terrains[this.terrainMap[i][j]], this.numberMap[i][j], 100 + inradius * 2 * j + (maxLength - this.terrainMap[i].length) * inradius + (window.innerWidth - (maxLength + .5) * inradius * 2) / 2 - svg.getAttribute("margin-left"), 100 + sideLength * 1.5 * i - svg.getAttribute("margin-top"), sideLength));
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
    highlightTokens(roll) {
        for (let tile of this.tiles) {
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
            case "Hills":
                this.hexagon.setAttribute("fill", "#800000");
                break;
            case "Pasture":
                this.hexagon.setAttribute("fill", "#00C000");
                break;
            case "Mountains":
                this.hexagon.setAttribute("fill", "#808080");
                break;
            case "Fields":
                this.hexagon.setAttribute("fill", "#ffff00");
                break;
            case "Forest":
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
            this.text.setAttribute("y", this.y - 2.5);
            this.text.setAttribute("fill", (this.number == 6 || this.number == 8 ? "red" : "black"));
            this.text.setAttribute("font-size", "30");
            this.text.textContent = this.number;
            group.appendChild(this.text);

            let odds = 0;
            switch (Number(this.number)) {
                case 2:
                case 12:
                    odds = 1;
                    break;
                case 3:
                case 11:
                    odds = 2;
                    break;
                case 4:
                case 10:
                    odds = 3;
                    break;
                case 5:
                case 9:
                    odds = 4;
                    break;
                case 6:
                case 8:
                    odds = 5;
                    break;
            }
            for (let i = 0; i < odds; i++) {
                let prob = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                prob.setAttribute("cx", this.x + 5 * i - 5 * (odds - 1) / 2);
                prob.setAttribute("cy", this.y + 12.5);
                prob.setAttribute("r", 2);
                prob.setAttribute("fill", (this.number == 6 || this.number == 8 ? "red" : "black"));
                group.appendChild(prob);
            }
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
        this.move(e.clientX, e.clientY - 100); // make num exact
    }

    closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        this.lower();
        this.snap();
    }
}

class Robber extends draggableElement {
    constructor(x, y, radius) {
        super();
        this.snapPoints = map.tiles.map(tile => [tile.x, tile.y]);
        this.radius = radius;

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.element.id = "robber";
        this.element.setAttribute("cx", x);
        this.element.setAttribute("cy", y);
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

    // robber is always on top
    raise() { }
    lower() { }
}

class Building extends draggableElement {
    constructor(x, y, color, id) {
        super();
        this.snapPoints = map.vertices;
        this.x = x;
        this.y = y;
        this.id = id;
        this.color = color;
        this.nearbyTiles = [];

        switch (this.id) {
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
        this.move(Math.round(closestPoint[0]) - this.element.getBBox().width / 2, Math.round(closestPoint[1]) - this.element.getBBox().width / 2);

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
        ws.send(`build: ${this.id} ${Math.round(closestPoint[0]) - this.element.getBBox().width / 2} ${Math.round(closestPoint[1]) - this.element.getBBox().width / 2} ${this.color}`);
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
        this.move(Math.round(closestPoint[0]) - this.element.getAttribute("width") / 2, Math.round(closestPoint[1]) - this.element.getAttribute("height") / 2);
        ws.send(`build: road ${Math.round(closestPoint[0]) - this.element.getAttribute("width") / 2} ${Math.round(closestPoint[1]) - this.element.getAttribute("height") / 2} ${closestPoint[2]} ${this.color}`);
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

function join() {
    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    color = document.getElementById("color").value;
    ws = new WebSocket(`ws://${address}`);

    ws.onopen = function() {
        ws.send("addPlayer " + name + " " + color); 
        document.getElementById("menu").setAttribute("style", "display: none")
        document.getElementById("lobby").setAttribute("style", "display: block")
        ws.send("generate");
        ws.send("players");
    };

    let terrains = [];
    let numbers = [];

    ws.onmessage = function (event) {
        console.log(`Received message: ${event.data}`);

        const data = String(event.data).split(": ");
        if (data[0] == "terrains") {
            terrains = data[1].substring(1, data[1].length - 1).split(",")
        }
        else if (data[0] == "numbers") {
            numbers = data[1].substring(1, data[1].length - 1).split(",")
        }
        else if (data[0] == "generated") {
            map = new Map(terrains, numbers);
        }
        else if (data[0] == "dice") {
            map.highlightTokens(data[1]);
        }
        else if (data[0] == "players") {
            document.getElementById("players").innerHTML = "";
            for (let player of data[1].substring(2, data[1].length - 2).split("\",\"")) {
                document.getElementById("players").innerHTML += `<li>${player}</li>`;
            }
        }
        else if (data[0] == "started") {
            document.getElementById("lobby").setAttribute("style", "display: none");
            document.getElementById("game").setAttribute("style", "display: block");
        }
        else if (data[0] == "build") {
            const args = data[1].split(" ");
            if (args[0] == "settlement") {
                buildSettlement(args[1], args[2], args[3]);
            }
            else if (args[0] == "city") {
                buildCity(args[1], args[2], args[3]);
            }
            else if (args[0] == "road") {
                buildRoad(args[1], args[2], args[3], args[4]);
            }
        }
    };
}
function buildSettlement(x, y, color) {
    new Building(parseInt(x), parseInt(y), color, "settlement");
}
function buildCity(x, y, color) {
    new Building(parseInt(x), parseInt(y), color, "city");
}
function buildRoad(x, y, theta, color) {
    let road = new Road(parseInt(x), parseInt(y), color);
    road.element.setAttribute("transform", `rotate(${theta})`);
}

var color;
var map;

/* to be synced:
 * buildings
 * player info
 * robber
 * 
 * synced:
 * dice roll
 * map
 */

/* server-side:
 * - players
 * - turn logic
 * client-side:
 * - graphics
 * 
 */