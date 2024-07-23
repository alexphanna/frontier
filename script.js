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
        ws.send('get robber');
        center(svg);
    }
    moveRobber(row, col) {
        this.robber.setAttribute("cx", (this.inradius * 2) * col + this.inradius * (5 - this.terrainMap[row].length) + this.leftMargin + this.inradius);
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
        settlement: `0,0 2,-2 4,0 4,4 0,4`,
        city: `0,0 2,-2 4,0 4,2 8,2 8,6 0,6`
    }
    static widths = {
        settlement: 2,
        city: 4
    }
    static heights = {
        settlement: 2,
        city: 3
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
    svg.getElementById('settlementVertices').setAttribute("visibility", "hidden");
    svg.getElementById('cityVertices').setAttribute("visibility", "hidden");
    svg.getElementById('edges').setAttribute("visibility", "hidden");
    if (type == "settlement") {
        svg.getElementById('settlementVertices').setAttribute("visibility", "visible");
    }
    else if (type == "city") {
        svg.getElementById('cityVertices').setAttribute("visibility", "visible");
    }
    else {
        svg.getElementById('edges').setAttribute("visibility", "visible");
    }
}

function updateLobby(players) {
    document.getElementById('playersHeading').textContent = `Players (${players.length}/4)`;
    let playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    for (let player of players) {
        playerHeading = playersDiv.appendChild(document.createElement('h2'));
        playerHeading.style.color = player.color;
        playerHeading.style.fontWeight = 'bold';
        playerHeading.textContent = `${player.name}`;
        playersDiv.appendChild(playerHeading);
    }
}

function endTurn() {
    ws.send('end turn');
    document.getElementById('actions').style.visibility = 'hidden';
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

const createButton = (text) => {
    let button = document.createElement('button');
    button.textContent = text;
    button.style.margin = '10px';
    return button;
};

class Notification {
    constructor(message, isError = false, duration = 3000) {
        let notification = document.createElement('div');
        notification.classList.add('interface', 'notification');

        let heading = document.createElement('h3');
        heading.textContent = message;
        heading.style.color = isError ? 'red' : '';
        heading.style.margin = '10px';
        notification.appendChild(heading);

        let notifications = document.getElementById('notifications');
        notifications.appendChild(notification);

        const removeNotification = () => notifications.removeChild(notification);

        if (duration === 0) {
            let buttons = document.createElement('div');
            buttons.style.display = 'flex';
            buttons.style.flexDirection = 'row-reverse';
            let closeButton = createButton('Close');
            closeButton.addEventListener('click', removeNotification);
            buttons.appendChild(closeButton);
            notification.appendChild(buttons);
        } else {
            notification.style.textAlign = 'center';
            setTimeout(removeNotification, duration);
        }
    }
}
class tradeOffer {
    constructor(name, you, them, id) {
        let tradeOffer = document.createElement('div');
        tradeOffer.classList.add('interface', 'notification');
        tradeOffer.id = id;

        const stringify = (obj) => {
            let string = '';
            for (let resource in obj) {
                string += `${obj[resource]} ${resource}`;
                if (Object.keys(obj).length == 2) {
                    if (Object.keys(obj).indexOf(resource) == 0) {
                        string += ' and ';
                    }
                }
                else if (Object.keys(obj).indexOf(resource) != Object.keys(obj).length - 1) {
                    if (Object.keys(obj).indexOf(resource) == Object.keys(obj).length - 2) {
                        string += ' and ';
                    }
                    else {
                        string += ', ';
                    }
                }
            }
            return string;
        }

        let heading = document.createElement('h3');
        heading.textContent = name;
        heading.style.fontWeight = 'bold';
        heading.style.color = players.find(player => player.name === name).color;
        let span = document.createElement('span');
        span.textContent = `: ${stringify(JSON.parse(them))} → ${stringify(JSON.parse(you))}`;
        heading.appendChild(span);
        
        heading.style.margin = '10px';

        tradeOffer.appendChild(heading);
        
        let notifications = document.getElementById('notifications');
        notifications.appendChild(tradeOffer);

        const removeTradeOffer = () => notifications.removeChild(tradeOffer);

        let buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.flexDirection = 'row-reverse';
        let acceptButton = createButton('ACCEPT');
        acceptButton.addEventListener('click', () => {
            ws.send(`trade accept ${name} ${you} ${playerName} ${them} ${id}`);
            removeTradeOffer();
        });
        buttons.appendChild(acceptButton);
        let declineButton = createButton('DECLINE');
        declineButton.addEventListener('click', removeTradeOffer);
        buttons.appendChild(declineButton);
        tradeOffer.appendChild(buttons);
    }
}

function join() {
    playerName = document.getElementById('name').value;
    address = document.getElementById('address').value;

    ws = new WebSocket(`ws://${address}`);
    ws.onerror = function (event) {
        new Notification("Could not connect to server", true);
    }
    ws.onopen = function () {
        document.getElementById("menu").style.display = "none";
        document.getElementById("lobby").removeAttribute("style");

        ws.send(`add ${playerName}`);
    }
    ws.onmessage = function (event) {
        console.log(event.data);

        const args = String(event.data).split(' ');

        if (args[0] === 'players') {
            players = JSON.parse(args[1]);
            playerResources = players.find(player => player.name === playerName).resources;
            updateLobby(players);
            if (document.getElementById('infoButton').disabled) {
                showInfo();
            }
        }
        else if (args[0] === 'trade') {
            if (args[1] === 'offer' && args[2] != playerName) {
                new tradeOffer(args[2], args[3], args[4], args[5]);
            }
            else if (args[1] === 'unoffer') {
                document.getElementById(args[2]).remove();
            }
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
        else if (args[0] === 'chat') {
            chat.push([args[1], args.slice(2).join(' ')]);
            if (document.getElementById('chatButton').disabled) {
                showChat();
            }
        }
        else if (args[0] === 'log') {
            chat.push([args.slice(1).join(' ')]);
            if (document.getElementById('chatButton').disabled) {
                showChat();
            }
        }
        else if (args[0] === 'start') {
            if (args[1] === 'game') {
                document.getElementById('lobby').style.display = 'none';
                document.getElementById('navbar').style.display = 'none';
                document.getElementById('game').style.visibility = 'visible';
                showInfo();
            }
            else if (args[1] === 'turn') {
                document.getElementById('actions').style.visibility = 'visible';
            }
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

function setActiveButton(button) {
    document.getElementById('infoButton').disabled = (button === 'info' ? true : false);
    document.getElementById('tradeButton').disabled = (button === 'trade' ? true : false);
    document.getElementById('chatButton').disabled = (button === 'chat' ? true : false);
}

function showInfo() {
    setActiveButton('info');
    document.getElementById('actions').style.removeProperty('display');
    document.getElementById('chatInput').style.display = 'none';
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'left';
    for (let player of players) {
        let playerTitle = document.createElement('h2');
        playerTitle.textContent = player.name;
        playerTitle.style.color = player.color;
        playerTitle.style.fontWeight = 'bold';
        let playerPoints = document.createElement('span');
        playerPoints.textContent = ` (${player.points})`;
        playerTitle.appendChild(playerPoints);
        content.appendChild(playerTitle);
        let playerResources = document.createElement('h3');
        playerResources.textContent = 'Resources:';
        content.appendChild(playerResources);
        if (player.name === playerName) {
            let resources = document.createElement('ul');
            for (let resource in player.resources) {
                resources.appendChild(document.createElement('li')).textContent = `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${player.resources[resource]}`;
            }
            content.appendChild(resources);
        }
        else {
            playerResources.textContent += ` ${Object.values(player.resources).reduce((a, b) => a + b)}`;
        }
        let developments = document.createElement('h3');
        developments.textContent = `Developments: 0`;
        content.appendChild(developments);
        content.appendChild(document.createElement('br'));
    }
}

function showTrade() {
    setActiveButton('trade');
    document.getElementById('actions').style.display = 'none';
    document.getElementById('chatInput').style.display = 'none';
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'center';

    let you = {
        "brick": 0,
        "lumber": 0,
        "wool": 0,
        "grain": 0,
        "ore": 0
    }
    let them = {
        "brick": 0,
        "lumber": 0,
        "wool": 0,
        "grain": 0,
        "ore": 0
    }
    let resources = ['brick', 'lumber', 'wool', 'grain', 'ore'];
    let playerResources = players.find(player => player.name === playerName).resources;
    for (let i = 0; i < 2; i++) {

        for (let resource of resources) {
            let resourceDiv = document.createElement('div');
            resourceDiv.style.display = 'flex';
            resourceDiv.style.alignItems = 'center';
            resourceDiv.style.justifyContent = 'space-between';

            let resourceHeading = document.createElement('h3');
            resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + (i === 0 ? you[resource] : them[resource]);
            resourceDiv.appendChild(resourceHeading);

            let resourceButtons = document.createElement('div');
            resourceButtons.style.display = 'flex';

            let minusButton = document.createElement('button');
            minusButton.classList.add('smallButton');
            minusButton.textContent = '-';
            minusButton.disabled = true;
            minusButton.addEventListener('click', () => {
                if (i === 0) {
                    you[resource]--;
                    minusButton.disabled = you[resource] === 0;
                    plusButton.disabled = you[resource] === playerResources[resource];
                }
                else {
                    them[resource]--;
                    minusButton.disabled = them[resource] === 0;
                }
                resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + (i === 0 ? you[resource] : them[resource]);
            });
            resourceButtons.appendChild(minusButton);

            let plusButton = document.createElement('button');
            plusButton.classList.add('smallButton');
            plusButton.textContent = '+';
            plusButton.disabled = false;
            plusButton.addEventListener('click', () => {
                if (i === 0) {
                    you[resource]++;
                    minusButton.disabled = you[resource] === 0;
                    plusButton.disabled = you[resource] === playerResources[resource];
                }
                else {
                    them[resource]++;
                    minusButton.disabled = them[resource] === 0;
                }
                resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + (i === 0 ? you[resource] : them[resource]);
            });
            resourceButtons.appendChild(plusButton);

            resourceDiv.appendChild(resourceButtons);
            content.appendChild(resourceDiv);
        }
        if (i === 0) {
            let downArrow = document.createElement('h2');
            downArrow.textContent = '↓';
            downArrow.style.color = '#E0E0E0';
            content.appendChild(downArrow);
        }
    }
    offerButton = document.createElement('button');
    offerButton.textContent = 'OFFER';

    const removeZeroes = (obj) => {
        for (let key in obj) {
            if (obj[key] === 0) {
                delete obj[key];
            }
        }
        return obj;
    }

    offerButton.addEventListener('click', () => {
        you = removeZeroes(you);
        them = removeZeroes(them);
        if (Object.keys(you).length === 0 || Object.keys(them).length === 0) {
            new Notification('Trade offer must include at least one resource from each player', true);
        }
        else if (you == them) {
            // does not work, need more robust comparison
            new Notification('Trade offer cannot be a one-to-one trade', true);
        }
        else {
            ws.send(`trade offer ${playerName} ${JSON.stringify(removeZeroes(you))} ${JSON.stringify(removeZeroes(them))} ${Math.random().toString(36).substring(2, 9)}`);
            you = {
                "brick": 0,
                "lumber": 0,
                "wool": 0,
                "grain": 0,
                "ore": 0
            }
        }
        showTrade();
    });
    content.appendChild(offerButton);
}

function showChat() {
    setActiveButton('chat');
    document.getElementById('actions').style.display = 'none';
    document.getElementById('chatInput').style.removeProperty('display');
    let content = document.getElementById('sideContent');
    content.innerHTML = '';
    content.style.textAlign = 'left';
    for (let message of chat) {
        if (message.length === 1) {
            let messageDiv = document.createElement("div");
            messageDiv.textContent = message[0];
            messageDiv.style.color = "#C0C0C0";
            messageDiv.style.fontStyle = "italic";
            content.appendChild(messageDiv);
        }
        else {
            let messageDiv = document.createElement("div");
            messageDiv.textContent = message[0];
            messageDiv.style.color = players.find(player => player.name === message[0]).color;
            messageDiv.style.fontWeight = "bold";
            let span = document.createElement("span");
            span.textContent = `: ${message[1]}`;
            messageDiv.appendChild(span);
            content.appendChild(messageDiv);
        }
    }
    content.scrollTop = content.scrollHeight;
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
let input = document.getElementById('chatInput');
input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        ws.send(`chat ${playerName} ${input.value}`);
        input.value = '';
    }
});

let svg = document.getElementById('map');
let currentType = "settlement";
let map;

var chat = []; // array of chat messages
var playerName;
var color;
var address;
var players;