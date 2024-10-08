import { game, server } from '../main.js';
import { createRobber } from './ui/robber.js';

export default class Map {
    constructor(svg, terrainMap, numberMap, harborMap) {
        this.terrainMap = terrainMap;
        this.numberMap = numberMap;
        this.harborMap = harborMap;

        // Draw the map
        this.maxLength = Math.max(...this.terrainMap.map(row => row.length));

        if (this.maxLength > this.terrainMap.length * (Math.sqrt(3) / 2)) {
            this.inradius = 100 / (this.maxLength * 2);
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
            this.leftMargin = (100 - (this.maxLength * 2 * this.inradius)) / 2;
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
                let tile = Map.createTile(j * this.inradius * 2 + this.inradius * (this.maxLength + 1 - this.terrainMap[i].length) + this.leftMargin, i * (this.sideLength + Math.sqrt(Math.pow(this.sideLength, 2) - Math.pow(this.inradius, 2))) + this.circumradius + this.topMargin, this.inradius * 2, this.terrainMap[i][j], this.numberMap[i][j]);
                tile.addEventListener('click', function () {
                    if (game.knightPlayed) {
                        game.knightPlayed = false;
                        server.send(`knight`);
                    }
                    server.send(`robber ${i} ${j}`);
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

        for (let i = 0; i < this.harborMap.length; i++) {
            for (let j = 0; j < this.harborMap[i].length; j++) {
                if (this.harborMap[i][j] != 0) {
                    let ratio = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    let position = this.standardToEdge(i, j);
                    let offset = 3;

                    // Calculate new x and y based on the angle and offset
                    let newX = position.x + offset * Math.sin(position.angle * Math.PI / 180) * (i > this.harborMap.length / 2 && Math.abs(position.angle) == 30  ? -1 : 1);
                    let newY = position.y - offset * Math.cos(position.angle * Math.PI / 180) * (i > this.harborMap.length / 2 && Math.abs(position.angle) == 30 ? -1 : 1);

                    ratio.setAttribute("x", newX);
                    ratio.setAttribute("y", newY);
                    ratio.setAttribute("transform", `rotate(${position.angle})`);
                    ratio.setAttribute("font-size", "3");

                    if (this.harborMap[i][j] === "generic") {
                        ratio.textContent = "3:1";
                    }
                    else {
                        ratio.textContent = "2:1";

                        let resource = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        resource.setAttribute("x", newX + offset * Math.sin(position.angle * Math.PI / 180) * (i > this.harborMap.length / 2 && Math.abs(position.angle) == 30  ? -1 : 1));
                        resource.setAttribute("y", newY - offset * Math.cos(position.angle * Math.PI / 180) * (i > this.harborMap.length / 2 && Math.abs(position.angle) == 30 ? -1 : 1));
                        resource.setAttribute("transform", `rotate(${position.angle})`);
                        resource.setAttribute("font-size", "3");
                        resource.textContent = this.harborMap[i][j].charAt(0).toUpperCase() + this.harborMap[i][j].slice(1);
                        svg.appendChild(resource);
                    }

                    svg.appendChild(ratio);
                }
            }
        }

        this.cityVertices = [];
        let cityVertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cityVertices.id = "cityVertices";
        svg.appendChild(cityVertices);
        cityVertices.style.visibility = "hidden";

        this.robber = createRobber(this.inradius / 2);
        svg.appendChild(this.robber);

        server.send('get points');
        server.send('get robber');
        Map.center(svg);

        svg.addEventListener('mousedown', function (event) {
            let x = event.clientX;
            let y = event.clientY;
            let left = parseInt(svg.style.left);
            let top = parseInt(svg.style.top);
        
            function mouseMove(event) {
                left += event.clientX - x;
                top += event.clientY - y;
                Map.move(svg, left, top);
                x = event.clientX;
                y = event.clientY;
            }
        
            svg.addEventListener('mousemove', mouseMove);
        
            svg.addEventListener('mouseup', function () {
                svg.removeEventListener('mousemove', mouseMove);
            });
        });

        let scale = 1;
        const deafultWidth = svg.width.baseVal.value;
        const defaultHeight = svg.height.baseVal.value;

        svg.addEventListener('wheel', function (event) {
            event.preventDefault();
            
            function resize(svg, percent, event) {
                const oldRect = svg.getBoundingClientRect();
                const oldX = event.clientX - oldRect.left;
                const oldY = event.clientY - oldRect.top;
                
                svg.style.width = `${deafultWidth * percent}px`;
                svg.style.height = `${defaultHeight * percent}px`;

                const x = oldX / oldRect.width * parseInt(svg.style.width);
                const y = oldY / oldRect.height * parseInt(svg.style.height);
                const left = oldRect.left + (oldX - x);
                const top = oldRect.top + (oldY - y);
                
                Map.move(svg, left, top);
            }

            if (event.deltaY > 0 && scale > .5) {
                resize(svg, scale -= .1, event);
            } else if (event.deltaY < 0 && scale < 3) {
                resize(svg, scale += .1, event);
            }
        });
    }

    static center(svg) {
        const rect = svg.getBoundingClientRect();
        const left = (window.innerWidth - rect.width) / 2;
        const top = (window.innerHeight - rect.height) / 2;
        Map.move(svg, left, top);
    }
    
    static move(svg, left, top) {
        svg.style.left = left + 'px';
        svg.style.top = top + 'px';
    }
    moveRobber(row, col) {
        this.robber.setAttribute("cx", (this.inradius * 2) * col + this.inradius * (5 - this.terrainMap[row].length) + this.leftMargin + this.inradius);
        this.robber.setAttribute("cy", row * (this.sideLength + Math.sqrt(Math.pow(this.sideLength, 2) - Math.pow(this.inradius, 2))) + this.circumradius + this.topMargin);
    }
    highlightTokens(number) {
        let svg = document.getElementById("map");
        for (let tile of svg.getElementsByClassName("tile")) {
            if (tile.id.startsWith("Desert")) {
                continue;
            }
            if (number == 7) {
                tile.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")[0].setAttribute("fill", "#FF4040");
            }
            else {
                if (tile.id.endsWith(number)) {
                    tile.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")[0].setAttribute("fill", "#FFFFFF");
                }
                else {
                    tile.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")[0].setAttribute("fill", "#FFFFFF80");
                }
            }
        }
    }
    vertexToStandard(x, y) {
        let row = Math.floor((y - this.topMargin) / (this.circumradius * 2 - (this.circumradius * 2 - this.sideLength) / 2));

        if (row < 2) var col = Math.floor((x - this.inradius * ((this.terrainMap[row].length / 2) - row)) / this.inradius);
        else if (row > 3) col = Math.floor((x + this.inradius * (this.terrainMap[row !== this.terrainMap.length ? row : row - 1].length - row)) / this.inradius);
        else col = x / this.inradius;

        return { row, col };
    }
    standardToVertex(row, col) {
        if (row <= 2) var y = row * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + this.topMargin + ((1 - col % 2) * ((this.circumradius * 2 - this.sideLength) / 2));
        else y = row * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + this.topMargin + ((col % 2) * ((this.circumradius * 2 - this.sideLength) / 2));

        if (row < 2) var x = col * this.inradius + this.inradius * (5 - this.terrainMap[row].length) + this.leftMargin;
        else if (row > 3) x = col * this.inradius + this.inradius * (5 - this.terrainMap[row - 1].length) + this.leftMargin;
        else x = col * this.inradius;

        return { x, y };
    }
    edgeToStandard(x, y) {
        let row = Math.floor((y - this.topMargin) / ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) * 2);

        if (row % 2 == 0)  var col = (x - this.leftMargin - this.inradius / 2 - this.inradius * (5 - this.terrainMap[(row < 5 ? row : row - 2) / 2].length)) / this.inradius;
        else col = (x - this.leftMargin - this.inradius * (5 - this.terrainMap[Math.floor(row / 2)].length)) / (this.inradius * 2);

        return { row, col };
    }
    standardToEdge(row, col) {
        if (row % 2 == 0) {
            var x = col * this.inradius + this.inradius * (5 - this.terrainMap[(row < 5 ? row : row - 2) / 2].length) + this.leftMargin + this.inradius / 2;
            var y = Math.floor(row / 2) * ((this.circumradius * 2 - this.sideLength) / 2 + this.sideLength) + ((this.circumradius * 2 - this.sideLength) / 4) + this.topMargin;
            var angle = (row < 5 ? (col % 2 == 0 ? -30 : 30) : (col % 2 == 0 ? 30 : -30));
        }
        else {
            x = col * (this.inradius * 2) + this.inradius * (5 - this.terrainMap[Math.floor(row / 2)].length) + this.leftMargin;
            y = Math.floor(row / 2) * (this.circumradius + this.sideLength / 2) + this.topMargin + this.circumradius;
            angle = (col == 0 ? -90 : 90);
        }

        return { x, y, angle };
    }
    static createTile(x, y, width, terrain, number) {
        let tile = document.createElementNS("http://www.w3.org/2000/svg", "g");
        tile.id = `${terrain} ${number}`;
        tile.setAttribute("class", "tile")
        let hexagon = createHexagon(x, y, width);
        hexagon.classList.add("hexagon");
        const terrainColors = {
            "Hill": "#800000",
            "Pasture": "#008000",
            "Mountain": "#404040",
            "Field": "#C0C000",
            "Forest": "#004000",
            "Desert": "#C08040"
        }
        hexagon.setAttribute("fill", terrainColors[terrain]);
        hexagon.setAttribute("stroke", "black");
        hexagon.setAttribute("stroke-width", ".5");
        tile.appendChild(hexagon);
        if (terrain != "Desert") {
            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.classList.add("tokenText");
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("fill", "#FFFFFF80");
            text.setAttribute("font-size", "6");
            text.textContent = number;
            tile.appendChild(text);
        }
        return tile;
    }
}
export function createHexagon(x, y, width) {
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