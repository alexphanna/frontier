class Map {
    constructor(svg, terrainMap, numberMap) {
        this.terrainMap = terrainMap;
        this.numberMap = numberMap;
        this.robberActive = false;

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

        // edge = { x, y, θ }
        this.edges = [];
        let edges = document.createElementNS("http://www.w3.org/2000/svg", "g");
        edges.setAttribute("id", "edges");
        svg.appendChild(edges);
        edges.setAttribute("visibility", "hidden");

        let buildings = document.createElementNS("http://www.w3.org/2000/svg", "g");
        buildings.setAttribute("id", "buildings");
        svg.appendChild(buildings);

        for (let i = 0; i < this.terrainMap.length; i++) {
            for (let j = 0; j < this.terrainMap[i].length; j++) {
                let tile = createTile(j * this.inradius * 2 + this.inradius * (maxLength + 1 - this.terrainMap[i].length) + this.leftMargin, i * (this.sideLength + Math.sqrt(Math.pow(this.sideLength, 2) - Math.pow(this.inradius, 2))) + this.circumradius + this.topMargin, this.inradius * 2, this.terrainMap[i][j], this.numberMap[i][j]);
                tile.addEventListener('click', function () {
                    ws.send(`robber ${i} ${j}`);
                });
                tiles.appendChild(tile);
            }
        }

        // vertex = { x, y }
        this.settlementVertices = [];
        let settlementVertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        settlementVertices.setAttribute("id", "settlementVertices");
        svg.appendChild(settlementVertices);
        settlementVertices.setAttribute("visibility", "hidden");

        this.cityVertices = [];
        let cityVertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cityVertices.setAttribute("id", "cityVertices");
        svg.appendChild(cityVertices);
        cityVertices.setAttribute("visibility", "hidden");

        this.robber = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.robber.setAttribute("r", (this.inradius * 2) / 5);
        this.robber.setAttribute("fill", "#000000C0");
        svg.appendChild(this.robber);

        ws.send('get points');
        center(svg);
    }
    moveRobber(row, col) {
        this.robber.setAttribute("cx", (this.inradius * 2) * col  + this.inradius * (5 - this.terrainMap[row].length) + this.leftMargin + this.inradius);
        this.robber.setAttribute("cy", row * (this.sideLength + Math.sqrt(Math.pow(this.sideLength, 2) - Math.pow(this.inradius, 2))) + this.circumradius + this.topMargin);
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
    edgeToStandard(x, y) {
        var row = Math.floor((y - this.topMargin) / ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) * 2);
        if (row % 2 == 0) {
            var col = (x - this.leftMargin - this.inradius / 2 - this.inradius * (5 - this.terrainMap[(row < 5 ? row : row - 2) / 2].length)) / this.inradius;
        }
        else {
            var col = (x - this.leftMargin - this.inradius * (5 - this.terrainMap[Math.floor(row / 2)].length)) / (this.inradius * 2);
        }

        return { row, col };
    }
    standardToEdge(row, col) {
        if (row % 2 == 0) {
            var x = col * this.inradius + this.inradius * (5 - this.terrainMap[(row < 5 ? row : row - 2) / 2].length) + this.leftMargin + this.inradius / 2;
            var y = Math.floor(row / 2) * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + ((this.circumradius * 2 - this.sideLength) / 4) + this.topMargin;
            var angle = (row < 5 ? (col % 2 == 0 ? -30 : 30) : (col % 2 == 0 ? 30 : -30));
        }
        else {
            var x = col * (this.inradius * 2) + this.inradius * (5 - this.terrainMap[Math.floor(row / 2)].length) + this.leftMargin;
            var y = Math.floor(row / 2) * (this.circumradius + this.sideLength / 2) + this.topMargin + this.circumradius;
            var angle = 90;
        }
        return { x, y, angle };
    }
}
class Building {
    static shapes = {
        settlement : `0,0 2,-2 4,0 4,4 0,4`,
        city : `0,0 2,-2 4,0 4,2 8,2 8,6 0,6`
    }
    static widths = {
        settlement : 2,
        city : 4
    }
    static heights = {
        settlement : 2,
        city : 3
    }

    static createRoad(x, y, angle, fill, stroke) {
        let road = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        road.class = "road";
        road.setAttribute("fill", fill);
        road.setAttribute("width", "8");
        road.setAttribute("height", "2");
        road.setAttribute("stroke", stroke);
        road.setAttribute("stroke-width", ".5");
        road.setAttribute("x", x - road.getAttribute("width") / 2);
        road.setAttribute("y", y - road.getAttribute("height") / 2);
        road.setAttribute("transform", `rotate(${angle})`);
        return road;
    }

    static createBuilding(x, y, fill, stroke, type) {
        let building = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        building.setAttribute("class", type);
        building.setAttribute("fill", fill);
        building.setAttribute("stroke", stroke);
        building.setAttribute("stroke-width", ".5");
        building.setAttribute("points", Building.pointToShape(x, y, type));
        return building;
    }

    static pointToShape(x, y, type) {
        let oldShape = Building.shapes[type].split(" ")
        let shape = '';
        for (let i = 0; i < oldShape.length; i++) {
            let coords = oldShape[i].split(",");
            shape += `${parseFloat(coords[0]) + x - Building.widths[type]},${parseFloat(coords[1]) + y - Building.heights[type]} `;
        }
        return shape;
    }
    static shapeToPoint(shape, type) {
        let x = parseFloat(String(shape).split(" ")[0].split(",")[0]) + Building.widths[type];
        let y = parseFloat(String(shape).split(" ")[0].split(",")[1]) + Building.heights[type];
        return { x, y };
    }
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
            hexagon.setAttribute("fill", "#008000");
            break;
        case "Mountains":
            hexagon.setAttribute("fill", "#404040");
            break;
        case "Fields":
            hexagon.setAttribute("fill", "#C0C000");
            break;
        case "Forest":
            hexagon.setAttribute("fill", "#004000");
            break;
        case "Desert":
            hexagon.setAttribute("fill", "#c08040");
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
        svg.getElementById('settlementVertices').setAttribute("visibility", "visible");
        svg.getElementById('cityVertices').setAttribute("visibility", "hidden");
        svg.getElementById('edges').setAttribute("visibility", "hidden");
    }
    else if (type == "city") {
        svg.getElementById('cityVertices').setAttribute("visibility", "visible");
        svg.getElementById('settlementVertices').setAttribute("visibility", "hidden");
        svg.getElementById('edges').setAttribute("visibility", "hidden");
    }
    else {
        svg.getElementById('edges').setAttribute("visibility", "visible");
        svg.getElementById('cityVertices').setAttribute("visibility", "hidden");
        svg.getElementById('settlementVertices').setAttribute("visibility", "hidden");
    }
}

function updateUI(players) {
    let leftBar = document.getElementById('leftBar');
    leftBar.innerHTML = '';
    let rightBar = document.getElementById('rightBar');
    rightBar.innerHTML = '';
    for (let player of players) {
        let title = document.createElement('h2');
        title.style.color = player.color;
        title.textContent = `${player.name} `;
        let points = document.createElement('span');
        points.textContent = `(${player.points})`;
        title.appendChild(points);
        let resourcesHeading = document.createElement('h3');
        let developmentsHeading = document.createElement('h3');
        developmentsHeading.textContent = 'Developments:';
        
        if (player.name == name) {
            let buildingsHeading = document.createElement('h3');
            buildingsHeading.textContent = 'Buildings:';
            let buildings = document.createElement('ul');
            for (let building in player.buildings) {
                buildings.appendChild(document.createElement('li')).textContent = `${building.charAt(0).toUpperCase() + building.slice(1)}: ${player.buildings[building]}`;
            }

            resourcesHeading.textContent = 'Resources:';
            let resources = document.createElement('ul');
            for (let resource in player.resources) {
                resources.appendChild(document.createElement('li')).textContent = `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${player.resources[resource]}`;
            }

            leftBar.appendChild(title);
            leftBar.appendChild(document.createElement('br'));
            leftBar.appendChild(buildingsHeading);
            leftBar.appendChild(buildings);
            leftBar.appendChild(document.createElement('br'));
            leftBar.appendChild(resourcesHeading);
            leftBar.appendChild(resources);
            leftBar.appendChild(document.createElement('br'));
            leftBar.appendChild(developmentsHeading);

            if (player.resources['brick'] >= 1 
                && player.resources['lumber'] >= 1 
                && player.resources['wool'] >= 1 
                && player.resources['grain'] >= 1 
                && player.buildings['settlements'] >= 1) {
                document.getElementById('settlementButton').disabled = false;
            }
            else {
                document.getElementById('settlementButton').disabled = true;
            }
            
            if (player.resources['grain'] >= 2 
                && player.resources['ore'] >= 3
                && player.buildings['cities'] >= 1) {
                document.getElementById('cityButton').disabled = false;
            }
            else {
                document.getElementById('cityButton').disabled = true;
            }

            if (player.resources['brick'] >= 1 
                && player.resources['lumber'] >= 1
                && player.buildings['roads'] >= 1) {
                document.getElementById('roadButton').disabled = false;
            }
            else {
                document.getElementById('roadButton').disabled = true;
            }
        }
        else {
            let resourceCount = 0;
            for (let resource in player.resources) {
                resourceCount += player.resources[resource];
            }
            resourcesHeading.textContent = `Resources: ${resourceCount}`;

            rightBar.appendChild(title);
            rightBar.appendChild(document.createElement('br'));
            rightBar.appendChild(resourcesHeading);
            rightBar.appendChild(developmentsHeading);
            rightBar.appendChild(document.createElement('br'));
        }
    }
}

function updateLobby(players) {
    document.getElementById('playersHeading').textContent = `Players (${players.length}/4)`;
    let playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    for (let player of players) {
        playerHeading = playersDiv.appendChild(document.createElement('h2'));
        playerHeading.style.color = player.color;
        playerHeading.textContent = `${player.name}`;
        playersDiv.appendChild(playerHeading);
    }
}

function endTurn() {
    ws.send('end turn');
    document.getElementById('bottomBar').style.visibility = 'hidden';
}

function ready() {
    ws.send('ready');
    readyButton = document.getElementById('readyButton');
    readyButton.textContent = 'Unready';
    readyButton.setAttribute('onclick', 'unready()');
}

function unready() {
    ws.send('unready');
    readyButton = document.getElementById('readyButton');
    readyButton.textContent = 'Ready';
    readyButton.setAttribute('onclick', 'ready()');
}

function notify(message) {
    let notification = document.getElementById('notification');
    notification.innerHTML = '';
    notification.removeAttribute('style');
    let heading = document.createElement('h3');
    heading.textContent = message;
    notification.appendChild(heading);

    setTimeout(function () {
        notification.style.display = 'none';
    }, 3000);
}

function join() {
    name = document.getElementById('name').value;
    address = document.getElementById('address').value;
    
    ws = new WebSocket(`ws://${address}`);
    ws.onerror = function (event) {
        notify("Could not connect to server");
    }
    ws.onopen = function () {
        document.getElementById("menu").style.display = "none";
        document.getElementById("lobby").removeAttribute("style");

        ws.send(`add ${name}`);
    }
    ws.onmessage = function (event) {
        console.log(event.data);

        const args = String(event.data).split(' ');

        if (args[0] === 'players') {
            const players = JSON.parse(args[1]);
            updateLobby(players);
            updateUI(players);
        }
        else if (args[0] === 'build') {
            document.getElementById('placeSound').play();
            if (args[1] === 'settlement') {
                const vertex = map.standardToVertex(parseInt(args[2]), parseInt(args[3]));
                const building = Building.createBuilding(vertex.x, vertex.y, args[4], "black", args[1]);
                document.getElementById('buildings').appendChild(building);
            }
            else if (args[1] == 'city') {
                const vertex = map.standardToVertex(parseInt(args[2]), parseInt(args[3]));
                const building = Building.createBuilding(vertex.x, vertex.y, args[4], "black", args[1]);
                let settlements = document.getElementById('buildings').getElementsByClassName('settlement');
                for (let i = 0; i < settlements.length; i++) {
                    const temp = Building.shapeToPoint(settlements[i].getAttribute('points'), 'settlement');
                    const point = map.vertexToStandard(temp.x, temp.y);
                    if (point.row == parseInt(args[2]) && point.col == parseInt(args[3])) {
                        document.getElementById("buildings").removeChild(settlements[i]);
                        break;
                    }
                }
                buildings.appendChild(building);
            }
            else if (args[1] === 'road') {
                const edge = map.standardToEdge(parseInt(args[2]), parseInt(args[3]));
                const road = Building.createRoad(edge.x, edge.y, args[4], args[5], "black");
                document.getElementById('roads').appendChild(road);
            }
        }
        else if (args[0] === 'map') {
            const maps = JSON.parse(args[1]);
            map = new Map(svg, maps.terrainMap, maps.numberMap);
        }
        else if (args[0] === 'robber') {
            map.moveRobber(parseInt(args[1]), parseInt(args[2]));
        }
        else if (args[0] === 'start') {
            if (args[1] === 'game') {
                document.getElementById('lobby').style.display = 'none';
                document.getElementById('game').removeAttribute('style');
            }
            else if (args[1] === 'turn') {
                notify('Your turn');
                document.getElementById('bottomBar').style.visibility = 'visible';
            }
        }
        else if (args[0] === 'roll') {
            map.highlightTokens(parseInt(args[1]));

            if (args[1] == 7) {
                map.robberActive = true;
            }
        }
        else if (args[0] === 'vertices') {
            var legalVertices = JSON.parse(args[2]);
            var vertices = svg.getElementById(`${args[1]}Vertices`);
            vertices.innerHTML = '';
            for (let i = 0; i < legalVertices.length; i++) {
                for (let j = 0; j < legalVertices[i].length; j++) {
                    if (legalVertices[i][j]) {
                        const vertex = map.standardToVertex(i, j);
                        let settlement = Building.createBuilding(vertex.x, vertex.y, "transparent", "#ffffffc0", "settlement");
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
        else if (args[0] === 'edges') {
            var legalEdges = JSON.parse(args[1]);
            var edges = svg.getElementById('edges');
            edges.innerHTML = '';
            for (let i = 0; i < legalEdges.length; i++) {
                for (let j = 0; j < legalEdges[i].length; j++) {
                    if (legalEdges[i][j]) {
                        const edge = map.standardToEdge(i, j);
                        const temp = map.edgeToStandard(edge.x, edge.y);

                        let road = Building.createRoad(edge.x, edge.y, edge.angle, "transparent", "#ffffffc0");
                        road.addEventListener('click', function () {
                            edges.setAttribute("visibility", "hidden");
                            ws.send(`build road ${i} ${j} ${edge.angle} ${color}`);
                        });
                        road.addEventListener('mouseover', function () {
                            road.setAttribute("stroke", "#ffff00c0");
                        });
                        road.addEventListener('mouseout', function () {
                            road.setAttribute("stroke", "#ffffffc0");
                        });
                        edges.appendChild(road);
                    }
                }
            }
        }
        else if (args[0] === 'color') {
            color = args[1];
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

var name;
var color;
var address;