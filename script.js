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

class Map {
    constructor(svg, players) {
        this.players = players;
        let terrainCounts = {
            "Hills": 3,
            "Forest": 4,
            "Mountains": 3,
            "Fields": 4,
            "Pasture": 4,
            "Desert": 1
        }
        const terrains = Object.keys(terrainCounts);
        if (players == 3 || players == 4) {
            var terrainDistr = terrains.flatMap(terrain => Array(terrainCounts[terrain]).fill(terrain));
            var numberDistr = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
            shuffle(terrainDistr);
            shuffle(numberDistr);
            numberDistr.splice(terrainDistr.indexOf("Desert"), 0, 0);
            this.terrainMap =[];
            this.numberMap = [];
            for (let i = 0; i < 5; i++) {
                this.terrainMap.push([]);
                this.numberMap.push([]);
            }
            for (let i = 3; i <= 5; i++) {
                for (let j = 0; j < i; j++) {
                    this.terrainMap[i - 3].push(terrainDistr.shift());
                    this.numberMap[i - 3].push(numberDistr.shift());
                    if (i != 5) {
                        this.terrainMap[7 - i].push(terrainDistr.shift());
                        this.numberMap[7 - i].push(numberDistr.shift());
                    }
                }
            }
            console.log(this.terrainMap)
        }
        else if (players == 5 || players == 6) {  } // Not implemented

        // Draw the map
        const maxLength = Math.max(...this.terrainMap.map(row => row.length));

        if (maxLength > this.terrainMap.length * (Math.sqrt(3) / 2)) {
            var inradius = 100 / (maxLength * 2);
            var sideLength = inradius * 2 / Math.sqrt(3)
            var circumradius = sideLength;
            var topMargin = (100 - (circumradius * ((this.terrainMap.length - 1) * 2 - 1))) / 4;
            var leftMargin = 0;
        }
        else {
            var circumradius = 100 / ((this.terrainMap.length - 1) * 2 - 1);
            var sideLength = circumradius;
            var inradius = sideLength * Math.sqrt(3) / 2;
            var topMargin = 0;
            var leftMargin = (100 - (maxLength * 2 * inradius)) / 2;
        }
        
        for (let i = 0; i < this.terrainMap.length; i++) {
            for (let j = 0; j < this.terrainMap[i].length; j++) {
                let tile = createTile(j * inradius * 2 + inradius * (maxLength + 1 - this.terrainMap[i].length) + leftMargin, i * (sideLength + Math.sqrt(Math.pow(sideLength, 2) - Math.pow(inradius, 2))) + circumradius + topMargin, inradius * 2, this.terrainMap[i][j], this.numberMap[i][j]);
                svg.appendChild(tile);
            }
        }
        
        // vertex = { x, y }
        this.vertices = [];
        let vertices = document.createElementNS("http://www.w3.org/2000/svg", "g");
        vertices.setAttribute("id", "vertices");
        for (let tile of svg.getElementsByClassName("tile")) {
            for(let hexagon of tile.getElementsByTagName("polygon")) {
                let points = hexagon.getAttribute("points").trim().split(" ");
                for (let point of points) {
                    let [x, y] = point.split(",");
                    let vertex = { x: parseFloat(x), y: parseFloat(y) };
                    
                    if (!this.vertices.some(v => Math.round(v.x) == Math.round(vertex.x) && Math.round(v.y) == Math.round(vertex.y))) {
                        this.vertices.push(vertex);
                    
                        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        circle.setAttribute("cx", vertex.x);
                        circle.setAttribute("cy", vertex.y);
                        circle.setAttribute("r", 1.5);
                        circle.setAttribute("fill", "transparent");
                        circle.setAttribute("stroke", "#ffffffc0");
                        circle.setAttribute("stroke-width", ".5");
                        circle.addEventListener('mouseover', function() {
                            circle.setAttribute("stroke", "#ffff00c0");
                        });
                        circle.addEventListener('mouseout', function() {
                            circle.setAttribute("stroke", "#ffffffc0");
                        });
                        circle.addEventListener('click', function() {
                            vertices.setAttribute("visibility", "hidden");
                            let building = createBuilding(vertex.x, vertex.y, "white", "settlement");
                            svg.appendChild(building);
                        });
                        vertices.appendChild(circle);
                    }
                }
            }
        }
        vertices.setAttribute("visibility", "hidden");
        svg.appendChild(vertices);
    }
}

function createBuilding(x, y, color, type) {
    switch (type) {
        case "settlement":
            var shape = `0,0 2,-2 4,0 4,4 0,4`;
            var width = 2;
            var height = 2;
            break;
        case "city":
            var shape = `0,0 10,-10 20,0 20,10 40,10 40,30 0,30`;
            break;
    }

    var building = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    building.setAttribute("class", type);
    building.setAttribute("fill", color);
    building.setAttribute("stroke", "black");
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
            hexagon.setAttribute("fill", "#ffff00");
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

function shuffle(array) {
    let currentIndex = array.length;
    
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

function build(type) {
    if (type == "settlement" || type == "city") {
        let svg = document.getElementById('map');
        let vertices = svg.getElementById('vertices');
        vertices.setAttribute("visibility", "visible");
    }
}

let svg = document.getElementById('map');

let map = new Map(svg, 4);
center(svg);