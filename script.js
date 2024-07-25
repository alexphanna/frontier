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
        tiles.id = "tiles";
        svg.appendChild(tiles);

        let roads = document.createElementNS("http://www.w3.org/2000/svg", "g");
        roads.id = "roads";
        svg.appendChild(roads);

        // edge = { x, y, θ }
        this.edges = [];
        let edges = document.createElementNS("http://www.w3.org/2000/svg", "g");
        edges.id = "edges";
        svg.appendChild(edges);
        edges.style.visibility = "hidden";

        let buildings = document.createElementNS("http://www.w3.org/2000/svg", "g");
        buildings.id = "buildings";
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
        settlementVertices.id = "settlementVertices";
        svg.appendChild(settlementVertices);
        settlementVertices.style.visibility = "hidden";

        this.cityVertices = [];
        let cityVertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cityVertices.id = "cityVertices";
        svg.appendChild(cityVertices);
        cityVertices.style.visibility = "hidden";

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

        if (row < 2) var col = Math.floor((x - this.inradius * ((this.terrainMap[row].length / 2) - row)) / this.inradius);
        else if (row > 3) var col = Math.floor((x + this.inradius * (this.terrainMap[row].length - row)) / this.inradius);
        else var col = x / this.inradius;

        return { row, col };
    }
    standardToVertex(row, col) {
        if (row <= 2) var y = row * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + this.topMargin + ((1 - col % 2) * ((this.circumradius * 2 - this.sideLength) / 2));
        else var y = row * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + this.topMargin + ((col % 2) * ((this.circumradius * 2 - this.sideLength) / 2));

        if (row < 2) var x = col * this.inradius + this.inradius * (5 - this.terrainMap[row].length) + this.leftMargin;
        else if (row > 3) var x = col * this.inradius + this.inradius * (5 - this.terrainMap[row - 1].length) + this.leftMargin;
        else var x = col * this.inradius;

        return { x, y };
    }
    edgeToStandard(x, y) {
        let row = Math.floor((y - this.topMargin) / ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) * 2);

        if (row % 2 == 0)  var col = (x - this.leftMargin - this.inradius / 2 - this.inradius * (5 - this.terrainMap[(row < 5 ? row : row - 2) / 2].length)) / this.inradius;
        else var col = (x - this.leftMargin - this.inradius * (5 - this.terrainMap[Math.floor(row / 2)].length)) / (this.inradius * 2);

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
        road.classList.add("road");
        road.setAttribute("fill", fill)
        road.setAttribute("stroke", stroke);
        road.setAttribute("x", x - 4);
        road.setAttribute("y", y - 1);
        road.setAttribute("transform", `rotate(${angle})`);

        return road;
    }

    static createBuilding(x, y, fill, stroke, type) {
        let building = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        building.setAttribute("class", type);
        building.setAttribute("fill", fill);
        building.setAttribute("stroke", stroke);
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
    tile.id = `${terrain} ${number}`;
    tile.setAttribute("class", "tile")
    let hexagon = createHexagon(x, y, width);
    hexagon.classList.add("hexagon");
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
    svg.getElementById('settlementVertices').style.visibility = "hidden";
    svg.getElementById('cityVertices').style.visibility = "hidden";
    svg.getElementById('edges').style.visibility = "hidden";
    if (type == "settlement") {
        svg.getElementById('settlementVertices').style.visibility = "visible";
    }
    else if (type == "city") {
        svg.getElementById('cityVertices').style.visibility = "visible";
    }
    else {
        svg.getElementById('edges').style.visibility = "visible";
    }
}

function develop() {
    ws.send('develop');
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
    readyButton.textContent = 'UNREADY';
    readyButton.onclick = unready;
}

function unready() {
    ws.send('unready');
    readyButton = document.getElementById('readyButton');
    readyButton.textContent = 'READY';
    readyButton.onclick = ready;
}

const createButton = (text) => {
    let button = document.createElement('button');
    button.textContent = text;
    button.style.margin = '10px';
    return button;
};

class Notification {
    constructor(message, isError = false, duration = 5000) {
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
            let countdown = document.createElement('div');
            countdown.classList.add('countdown');
            let elapsedTime = 0;
            notification.appendChild(countdown);
            let interval = setInterval(() => {
                elapsedTime += 10;
                countdown.style.width = `${((duration - elapsedTime) / duration) * 100}%`;
                if (elapsedTime >= duration) {
                    removeNotification();
                    clearInterval(interval);
                }
            }, 10);
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

class resourceInput {
    constructor(limits = {}, limit = 0) {
        this.resources = {
            "brick": 0,
            "grain": 0,
            "lumber": 0,
            "ore": 0,
            "wool": 0
        }
        this.input = document.createElement('div');
        for (let resource of Object.keys(this.resources)) {
            let resourceDiv = document.createElement('div');
            resourceDiv.style.display = 'flex';
            resourceDiv.style.alignItems = 'center';
            resourceDiv.style.justifyContent = 'space-between';

            let resourceHeading = document.createElement('h3');
            resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + this.resources[resource];
            resourceDiv.appendChild(resourceHeading);

            let resourceButtons = document.createElement('div');
            resourceButtons.style.display = 'flex';

            let minusButton = document.createElement('button');
            minusButton.classList.add('smallButton');
            minusButton.textContent = '-';
            minusButton.disabled = true;
            minusButton.addEventListener('click', () => {
                this.resources[resource]--;
                minusButton.disabled = this.resources[resource] === 0;
                resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + this.resources[resource];
                if (limit != 0) {
                    for (let button of this.input.getElementsByClassName('plusButton')) {
                        button.disabled = false;
                    }
                }
                else if (limits != {}) {
                    plusButton.disabled = false;
                }
            });
            resourceButtons.appendChild(minusButton);

            let plusButton = document.createElement('button');
            plusButton.classList.add('smallButton', 'plusButton');
            plusButton.textContent = '+';
            plusButton.disabled = (limits != {} && this.resources[resource] === limits[resource]);
            plusButton.addEventListener('click', () => {
                this.resources[resource]++;
                minusButton.disabled = this.resources[resource] === 0;
                resourceHeading.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ': ' + this.resources[resource];
                if (limit != 0) {
                    for (let button of this.input.getElementsByClassName('plusButton')) {
                        button.disabled = Object.values(this.resources).reduce((a, b) => a + b) === limit;
                    }
                }
                else if (limits != {}) {
                    plusButton.disabled = this.resources[resource] === limits[resource];
                }
            });
            resourceButtons.appendChild(plusButton);

            resourceDiv.appendChild(resourceButtons);
            this.input.appendChild(resourceDiv);
        }
    }
}

const removeZeroes = (obj) => {
    for (let key in obj) {
        if (obj[key] === 0) {
            delete obj[key];
        }
    }
    return obj;
}

class yearOfPlenty {
    constructor() {
        let yearOfPlenty = document.createElement('div');
        yearOfPlenty.classList.add('interface', 'notification');

        let heading = document.createElement('h3');
        heading.textContent = 'Year of Plenty';
        heading.style.fontWeight = 'bold';
        heading.style.margin = '10px';
        yearOfPlenty.appendChild(heading);

        let notifications = document.getElementById('notifications');
        notifications.appendChild(yearOfPlenty);

        let selector = new resourceInput({}, 2);
        selector.input.style.margin = '10px';
        yearOfPlenty.appendChild(selector.input);


        let confirmButton = createButton('CONFIRM');
        confirmButton.addEventListener('click', () => {
            ws.send(`progress yearOfPlenty ${JSON.stringify(removeZeroes(selector.resources))}`);
            notifications.removeChild(yearOfPlenty);
        });

        yearOfPlenty.appendChild(confirmButton);
    }
}

class monopoly {
    constructor() {
        let monopoly = document.createElement('div');
        monopoly.classList.add('interface', 'notification');

        let heading = document.createElement('h3');
        heading.textContent = 'Monopoly';
        heading.style.fontWeight = 'bold';
        heading.style.margin = '10px';
        monopoly.appendChild(heading);

        let notifications = document.getElementById('notifications');
        notifications.appendChild(monopoly);

        const resources = ['brick', 'grain', 'lumber', 'ore', 'wool'];
        for (let resource of resources) {
            let button = createButton(resource.toUpperCase());
            button.addEventListener('click', () => {
                ws.send(`progress monopoly ${resource}`);
                notifications.removeChild(monopoly);
            });
            monopoly.appendChild(button);
        }

        notifications.appendChild(monopoly);
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
            updateLobby(players);
            if (document.getElementById('buildButton').disabled) {
                showBuild();
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
                for (let i = 0; i < settleINFOments.length; i++) {
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
        else if (args[0] === 'chat' || args[0] === 'log') {
            chat.push(args[0] === 'chat' ? [args[1], args.slice(2).join(' ')] : [args.slice(1).join(' ')]);
            if (document.getElementById('chatButton').disabled) {
                showChat();
            }
        }
        else if (args[0] === 'error') {
            new Notification(args.slice(1).join(' '), true);
        }
        else if (args[0] === 'start') {
            if (args[1] === 'game') {
                document.getElementById('lobby').style.display = 'none';
                document.getElementById('navbar').style.display = 'none';
                document.getElementById('game').style.visibility = 'visible';
                showBuild();
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
                            vertices.style.visibility = "hidden";
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
                            edges.style.visibility = "hidden";
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
    document.getElementById('buildButton').disabled = (button === 'build' ? true : false);
    document.getElementById('tradeButton').disabled = (button === 'trade' ? true : false);
    document.getElementById('chatButton').disabled = (button === 'chat' ? true : false);
}

function showBuild() {
    setActiveButton('build');
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
        playerPoints.textContent = ` (${player.points}`;
        if (player.developments['victoryPoint'] > 0) {
            playerPoints.textContent += (` + ${player.developments['victoryPoint']}`);
        }
        playerPoints.textContent += ')';
        playerTitle.appendChild(playerPoints);
        content.appendChild(playerTitle);
        let resourcesHeading = document.createElement('h3');
        resourcesHeading.textContent = 'Resources:';
        content.appendChild(resourcesHeading);
        if (player.name === playerName) {
            let resources = document.createElement('ul');
            for (let resource in player.resources) {
                resources.appendChild(document.createElement('li')).textContent = `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${player.resources[resource]}`;
            }
            content.appendChild(resources);
            let actionButtons = document.getElementById('actions').getElementsByTagName('button');
            for (let button of actionButtons) {
                if (button.id === 'settlementButton') {
                    button.disabled = player.resources["brick"] < 1 || player.resources["lumber"] < 1 || player.resources["wool"] < 1 || player.resources["grain"] < 1;
                    button.textContent = `SETTLEMENT (${player.buildings["settlements"]})`;
                }
                else if (button.id === 'cityButton') {
                    button.disabled = (player.resources["grain"] < 2 || player.resources["ore"] < 3);
                    button.textContent = `CITY (${player.buildings["cities"]})`;
                }
                else if (button.id === 'roadButton') {
                    button.disabled = player.resources["brick"] < 1 || player.resources["lumber"] < 1;
                    button.textContent = `ROAD (${player.buildings["roads"]})`;
                }
                else if (button.id === 'developButton') {
                    button.disabled = player.resources["grain"] < 1 || player.resources["wool"] < 1 || player.resources["ore"] < 1;
                }
            }
        }
        else {
            resourcesHeading.textContent += ` ${player.resources}`;
        }
        let developmentsHeading = document.createElement('h3');
        developmentsHeading.textContent = `Developments: ${playerName === player.name ? Object.values(player.developments).reduce((a, b) => a + b) : player.developments}`;
        content.appendChild(developmentsHeading);
        content.appendChild(document.createElement('br'));
        if (player.name === playerName) {
            let developments = document.getElementById('developments');
            developments.innerHTML = '';
            const capitalize = (string) => {
                for (let i = 0; i < string.length; i++) {
                    if (string.charAt(i) === string.charAt(i).toUpperCase()) {
                        string = string.slice(0, i) + ' ' + string.charAt(i).toLowerCase() + string.slice(i + 1);
                    }
                }
                return string.toUpperCase();
            }
            for (let i = 0; i < Object.keys(player.developments).length; i++) {
                if (player.developments[Object.keys(player.developments)[i]] > 0
                    && Object.keys(player.developments)[i] !== 'victoryPoint') {
                    let developmentButton = document.createElement('button');
                    developmentButton.classList.add('developmentButton');
                    developmentButton.id = `${Object.keys(player.developments)[i]}Button`;
                    developmentButton.textContent = `${capitalize(Object.keys(player.developments)[i])} (${player.developments[Object.keys(player.developments)[i]]})`;
                    if (developmentButton.id === 'knightButton') {
                        developmentButton.addEventListener('click', () => {
                            new Notification('Move the robber', false, 0);
                        });
                    }
                    else if (developmentButton.id === 'yearOfPlentyButton') {
                        developmentButton.addEventListener('click', () => {
                            new yearOfPlenty();
                        });
                    }
                    else if (developmentButton.id === 'monopolyButton') {
                        developmentButton.addEventListener('click', () => {
                            new monopoly();
                        });
                    }
                    developments.appendChild(developmentButton);
                }
            }
        }

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

    let youResourceInput = new resourceInput(players.find(player => player.name === playerName).resources, 0);
    content.appendChild(youResourceInput.input);

    let downArrow = document.createElement('h2');
    downArrow.textContent = '↓';
    downArrow.style.color = '#E0E0E0';
    content.appendChild(downArrow);

    let themResourceInput = new resourceInput();
    content.appendChild(themResourceInput.input);

    offerButton = document.createElement('button');
    offerButton.textContent = 'OFFER';

    offerButton.addEventListener('click', () => {
        you = removeZeroes(youResourceInput.resources);
        them = removeZeroes(themResourceInput.resources);
        if (Object.keys(you).length === 0 || Object.keys(them).length === 0) {
            new Notification('Trade offer must include at least one resource from each player', true);
        }
        else if (you == them) {
            // does not work, need more robust comparison
            new Notification('Trade offer cannot be a one-to-one trade', true);
        }
        else {
            ws.send(`trade offer ${playerName} ${JSON.stringify(removeZeroes(you))} ${JSON.stringify(removeZeroes(them))} ${Math.random().toString(36).substring(2, 9)}`);
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
    if (event.key === 'Enter' && input.value !== '') {
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