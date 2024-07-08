class Map {
    constructor(svg, terrainMap, numberMap) {
        this.terrainMap = terrainMap;
        this.numberMap = numberMap;

        // Draw the map
        const maxLength = Math.max(...this.terrainMap.map(row => row.length));

        if (maxLength > this.terrainMap.length * (Math.sqrt(3) / 2)) {
            this.inradius = 100 / (maxLength * 2);
            this.sideLength = this.inradius * 2 / Math.sqrt(3)
            this.circumradius = this.sideLength;
            this.topMargin = (100 - (this.circumradius * ((this.terrainMap.length - 1) * 2 - 1))) / 4;
            this.leftMargin = 0;
        }
        else {
            this.circumradius = 100 / ((this.terrainMap.length - 1) * 2 - 1);
            this.sideLength = this.circumradius;
            this.inradius = this.sideLength * Math.sqrt(3) / 2;
            this.topMargin = 0;
            this.leftMargin = (100 - (maxLength * 2 * this.inradius)) / 2;
        }

        let tiles = document.createElementNS("http://www.w3.org/2000/svg", "g");
        tiles.setAttribute("id", "tiles");
        svg.appendChild(tiles);

        let roads = document.createElementNS("http://www.w3.org/2000/svg", "g");
        roads.setAttribute("id", "roads");
        svg.appendChild(roads);

        let buildings = document.createElementNS("http://www.w3.org/2000/svg", "g");
        buildings.setAttribute("id", "buildings");
        svg.appendChild(buildings);

        for (let i = 0; i < this.terrainMap.length; i++) {
            for (let j = 0; j < this.terrainMap[i].length; j++) {
                let tile = createTile(j * this.inradius * 2 + this.inradius * (maxLength + 1 - this.terrainMap[i].length) + this.leftMargin, i * (this.sideLength + Math.sqrt(Math.pow(this.sideLength, 2) - Math.pow(this.inradius, 2))) + this.circumradius + this.topMargin, this.inradius * 2, this.terrainMap[i][j], this.numberMap[i][j]);
                tiles.appendChild(tile);
            }
        }

        // vertex = { x, y }
        this.settlementVertices = [];
        ws.send('get vertices settlement');
        let settlementVertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        settlementVertices.setAttribute("id", "settlementVertices");
        svg.appendChild(settlementVertices);
        settlementVertices.setAttribute("visibility", "hidden");

        this.cityVertices = [];
        ws.send('get vertices city');
        let cityVertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cityVertices.setAttribute("id", "cityVertices");
        svg.appendChild(cityVertices);
        cityVertices.setAttribute("visibility", "hidden");

        // edge = { x, y, θ }
        this.edges = [];
        let legalEdges = document.createElementNS("http://www.w3.org/2000/svg", "g");
        legalEdges.setAttribute("id", "legalEdges");
        let edges = document.createElementNS("http://www.w3.org/2000/svg", "g");
        edges.setAttribute("id", "edges");
        for (let tile of svg.getElementsByClassName("tile")) {
            for (let hexagon of tile.getElementsByTagName("polygon")) {
                let points = hexagon.getAttribute("points").trim().split(" ");
                for (let i = 0; i < points.length; i++) {
                    const vertex1 = points[i].split(",");
                    const vertex2 = points[(i + 1) % points.length].split(",");
                    let edge = [Math.min(vertex1[0], vertex2[0]) + Math.abs(vertex1[0] - vertex2[0]) / 2, Math.min(vertex1[1], vertex2[1]) + Math.abs(vertex1[1] - vertex2[1]) / 2];
                    edge.push(Math.atan2(vertex1[1] - vertex2[1], vertex1[0] - vertex2[0]) * 180 / Math.PI);
                    if (this.edges.filter(e => e.join(",") == edge.join(",")).length == 0) {
                        this.edges.push(edge);

                        let circle = createCircle(edge[0], edge[1]);
                        circle.addEventListener('click', function () {
                            legalEdges.setAttribute("visibility", "hidden");
                            ws.send(`build road ${edge[0]} ${edge[1]} ${edge[2]} ${color}`);

                            // add new legal edges
                            for (let i = 0; i < edges.children.length; i++) {
                                let circle = edges.children[i];
                                let x = parseFloat(circle.getAttribute("cx"));
                                let y = parseFloat(circle.getAttribute("cy"));
                                if (Math.sqrt(Math.pow(x - edge[0], 2) + Math.pow(y - edge[1], 2)) <= this.sideLength * 1 && !legalEdges.contains(circle)) {
                                    legalEdges.appendChild(circle);
                                }
                            }
                            legalEdges.removeChild(circle);
                        });
                        edges.appendChild(circle);
                    }
                }
            }
        }
        svg.appendChild(edges);
        edges.setAttribute("visibility", "hidden");
        svg.appendChild(legalEdges);
        legalEdges.setAttribute("visibility", "hidden");

        center(svg);
    }
    highlightTokens(number) {
        for (let tile of svg.getElementsByClassName("tile")) {
            if (tile.id.startsWith("Desert")) {
                continue;
            }
            if (number == 7) {
                tile.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle")[0].setAttribute("fill", "#ff4040");
            }
            else {
                if (tile.id.endsWith(number)) {
                    tile.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle")[0].setAttribute("fill", "#00c0ff");
                }
                else {
                    tile.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle")[0].setAttribute("fill", "#ffe0a0");
                }
            }
        }
    }
    vertexToStandard(x, y) {
        let row = Math.floor((y - this.topMargin) / (this.circumradius * 2 - (this.circumradius * 2 - this.sideLength) / 2));

        if (row < 2) {
            var col = Math.floor((x - this.inradius * ((this.terrainMap[row].length / 2) - row)) / this.inradius);
        }
        else if (row > 3) {
            var col = Math.floor((x + this.inradius * (this.terrainMap[row].length - row)) / this.inradius);
        }
        else {
            var col = x / this.inradius;
        }

        return { row, col };
    }
    standardToVertex(row, col) {
        if (row <= 2) {
            var y = row * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + this.topMargin + ((1 - col % 2) * ((this.circumradius * 2 - this.sideLength) / 2));
        }
        else {
            var y = row * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + this.topMargin + ((col % 2) * ((this.circumradius * 2 - this.sideLength) / 2));
        }
        if (row < 2) {
            var x = col * this.inradius + this.inradius * (5 - this.terrainMap[row].length) + this.leftMargin;
        }
        else if (row > 3) {
            var x = col * this.inradius + this.inradius * (5 - this.terrainMap[row - 1].length) + this.leftMargin;
        }
        else {
            var x = col * this.inradius;
        }

        return { x, y };
    }
}
function createCircle(x, y) {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 1.5);
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", "#ffffffc0");
    circle.setAttribute("stroke-width", ".5");
    circle.addEventListener('mouseover', function () {
        circle.setAttribute("stroke", "#ffff00c0");
    });
    circle.addEventListener('mouseout', function () {
        circle.setAttribute("stroke", "#ffffffc0");
    });
    return circle;
}

function createRoad(x, y, angle, color) {
    let road = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    road.class = "road";
    road.setAttribute("fill", color);
    road.setAttribute("width", "8");
    road.setAttribute("height", "2");
    road.setAttribute("x", x - road.getAttribute("width") / 2);
    road.setAttribute("y", y - road.getAttribute("height") / 2);
    road.setAttribute("transform", `rotate(${angle})`);
    return road;
}

function createBuilding(x, y, fill, stroke, type) {
    switch (type) {
        case "settlement":
            var shape = `0,0 2,-2 4,0 4,4 0,4`;
            var width = 2;
            var height = 2;
            break;
        case "city":
            var shape = `0,0 2,-2 4,0 4,2 8,2 8,6 0,6`;
            var width = 4;
            var height = 3;
            break;
    }

    let building = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    building.setAttribute("class", type);
    building.setAttribute("fill", fill);
    building.setAttribute("stroke", stroke);
    building.setAttribute("stroke-width", ".5");
    building.setAttribute("points", shape);
    building.setAttribute("points", shape.split(" ").map(point => {
        let coords = point.split(",");
        return `${parseInt(coords[0]) + x - width},${parseInt(coords[1]) + y - height}`;
    }).join(" "));
    return building;
}

function createTile(x, y, width, terrain, number) {
    let tile = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tile.setAttribute("id", `${terrain} ${number}`);
    tile.setAttribute("class", "tile")
    let hexagon = createHexagon(x, y, width);
    hexagon.setAttribute("id", "hexagon")
    switch (terrain) {
        case "Hills":
            hexagon.setAttribute("fill", "#800000");
            break;
        case "Pasture":
            hexagon.setAttribute("fill", "#00C000");
            break;
        case "Mountains":
            hexagon.setAttribute("fill", "#808080");
            break;
        case "Fields":
            hexagon.setAttribute("fill", "#C0C000");
            break;
        case "Forest":
            hexagon.setAttribute("fill", "#004000");
            break;
        case "Desert":
            hexagon.setAttribute("fill", "#ffd080");
            break;
    }
    hexagon.setAttribute("stroke", "black");
    hexagon.setAttribute("stroke-width", ".5");
    tile.appendChild(hexagon);
    if (terrain != "Desert") {
        let token = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        token.setAttribute("cx", x);
        token.setAttribute("cy", y);
        token.setAttribute("r", width / 5);
        token.setAttribute("fill", "#ffe0a0");
        token.setAttribute("stroke", "black");
        token.setAttribute("stroke-width", ".5");
        tile.appendChild(token);

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("fill", (number == 6 || number == 8 ? "red" : "black"));
        text.setAttribute("font-size", "5");
        text.textContent = number;
        tile.appendChild(text);
    }
    return tile;
}

function createHexagon(x, y, width) {
    let hexagon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    let vertices = "";
    let sideLength = width / 2 * (2 / Math.sqrt(3));
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i - Math.PI / 2;
        vertices += `${x + sideLength * Math.cos(angle)},${y + sideLength * Math.sin(angle)} `;
    }
    hexagon.setAttribute("points", vertices);
    return hexagon;
}

function center(svg) {
    const rect = svg.getBoundingClientRect();
    const left = (window.innerWidth - rect.width) / 2;
    const top = (window.innerHeight - rect.height) / 2;
    move(svg, left, top);
}

function move(svg, left, top) {
    svg.style.left = left + 'px';
    svg.style.top = top + 'px';
}

function build(type) {
    let svg = document.getElementById('map');
    currentType = type;
    if (type == "settlement") {
        let vertices = svg.getElementById('settlementVertices');
        vertices.setAttribute("visibility", "visible");
    }
    else if (type == "city") {
        let vertices = svg.getElementById('cityVertices');
        vertices.setAttribute("visibility", "visible");
    }
    else {
        let edges = svg.getElementById('legalEdges');
        edges.setAttribute("visibility", "visible");
    }
}

function update(players) {
    let leftBar = document.getElementById('leftBar');
    leftBar.innerHTML = '';
    let rightBar = document.getElementById('rightBar');
    rightBar.innerHTML = '';
    for (let player of players) {
        let header = document.createElement('h2');
        header.style.color = color;
        header.textContent = `${player.name} (${player.points})`;
        if (player.name == name) {
            leftBar.appendChild(header);
        }
        else {
            rightBar.appendChild(header);
        }
    }

}

function endTurn() {
    ws.send('end');
    document.getElementById('bottomBar').style.visibility = 'hidden';
}

function joinServer() {
    ws = new WebSocket('ws://localhost:8080');
    ws.onopen = function () {
        ws.send(`add ${name} ${color}`);
        ws.send('get map');
    }
    ws.onmessage = function (event) {
        console.log(event.data);

        const args = String(event.data).split(' ');

        if (args[0] === 'players') {
            const players = JSON.parse(args[1]);
            update(players);
        }
        else if (args[0] === 'build') {
            const vertex = map.standardToVertex(parseInt(args[2]), parseInt(args[3]));
            if (args[1] === 'settlement' || args[1] === 'city') {
                const building = createBuilding(vertex.x, vertex.y, args[4], "black", args[1]);
                document.getElementById('buildings').appendChild(building);
            }
            else if (args[1] == 'city') {
                const building = createBuilding(vertex.x, vertex.y, args[4], "black", args[1]);
                let buildings = document.getElementById('buildings');
                buildings.appendChild(building);
            }
            if (args[1] === 'road') {
                const road = createRoad(vertex.x, vertex.y, parseFloat(args[4]), args[5]);
                document.getElementById('roads').appendChild(road);
            }
        }
        else if (args[0] === 'map') {
            const maps = JSON.parse(args[1]);
            map = new Map(svg, maps.terrainMap, maps.numberMap);
        }
        else if (args[0] === 'start') {
            document.getElementById('bottomBar').style.visibility = 'visible';
        }
        else if (args[0] === 'roll') {
            map.highlightTokens(parseInt(args[1]));
        }
        else if (args[0] === 'vertices') {
            var legalVertices = JSON.parse(args[2]);
            var vertices = svg.getElementById(`${args[1]}Vertices`);
            vertices.innerHTML = '';
            for (let i = 0; i < legalVertices.length; i++) {
                for (let j = 0; j < legalVertices[i].length; j++) {
                    if (legalVertices[i][j]) {
                        const vertex = map.standardToVertex(i, j);
                        /*let circle = createCircle(parseInt(vertex.x), parseInt(vertex.y));
                        circle.addEventListener('click', function () {
                            vertices.setAttribute("visibility", "hidden");
                            ws.send(`build ${currentType} ${i} ${j} ${color}`);
                        });
                        vertices.appendChild(circle);*/
                        let settlement = createBuilding(vertex.x, vertex.y, "transparent", "#ffffffc0", "settlement");
                        settlement.addEventListener('click', function () {
                            vertices.setAttribute("visibility", "hidden");
                            ws.send(`build ${currentType} ${i} ${j} ${color}`);
                        });
                        settlement.addEventListener('mouseover', function () {
                            settlement.setAttribute("stroke", "#ffff00c0");
                        });
                        settlement.addEventListener('mouseout', function () {
                            settlement.setAttribute("stroke", "#ffffffc0");
                        });
                        vertices.appendChild(settlement);
                    }
                }
            }
        }
    }
}

document.addEventListener('wheel', function (event) {
    function resize(svg, percent) {
        const rect = svg.getBoundingClientRect();
        const width = svg.width.baseVal.value;
        const newWidth = width * percent;
        const height = svg.height.baseVal.value;
        const newHeight = height * percent;

        svg.setAttribute('width', newWidth);
        svg.setAttribute('height', newHeight);

        const deltaX = (newWidth - width) / 2;
        const deltaY = (newHeight - height) / 2;
        const newLeft = rect.left - deltaX;
        const newTop = rect.top - deltaY;

        move(svg, newLeft, newTop);
    }

    if (event.deltaY > 0 && svg.width.baseVal.value > 300) {
        resize(svg, .9);
    } else if (event.deltaY < 0) {
        resize(svg, 1.1);
    }
});

document.addEventListener('mousedown', function (event) {
    let x = event.clientX;
    let y = event.clientY;
    let left = parseInt(svg.style.left);
    let top = parseInt(svg.style.top);

    function mouseMove(event) {
        left += event.clientX - x;
        top += event.clientY - y;
        move(svg, left, top);
        x = event.clientX;
        y = event.clientY;
    }

    document.addEventListener('mousemove', mouseMove);

    document.addEventListener('mouseup', function (event) {
        document.removeEventListener('mousemove', mouseMove);
    });
});

let svg = document.getElementById('map');
let currentType = "settlement";
let map;

const name = prompt("Enter your name:");
const color = prompt("Enter your color:");

joinServer();