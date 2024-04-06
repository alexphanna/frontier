class Tile {
    constructor(name, x, y, sideLength, svg) {
        this.name = name;
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
        let hexagon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        switch (this.name) {
            case "Brick":
                hexagon.setAttribute("fill", "brown");
                break;
            case "Wool":
                hexagon.setAttribute("fill", "white");
                break;
            case "Ore":
                hexagon.setAttribute("fill", "gray");
                break;
            case "Grain":
                hexagon.setAttribute("fill", "yellow");
                break;
            case "Lumber":
                hexagon.setAttribute("fill", "green");
                break;
            case "Desert":
                hexagon.setAttribute("fill", "tan");
                break;
        }
        hexagon.setAttribute("stroke", "black");
        hexagon.setAttribute("stroke-width", "2");
        let points = "";
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i - Math.PI / 2;
            const x = this.x + this.sideLength * Math.cos(angle);
            const y = this.y + this.sideLength * Math.sin(angle);
            points += `${x},${y} `;
        }
        hexagon.setAttribute("points", points);
        this.svg.appendChild(hexagon);

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", this.x);
        text.setAttribute("y", this.y + this.sideLength / 2);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "12.5");
        text.textContent = this.name;
        this.svg.appendChild(text);

        text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", this.x);
        text.setAttribute("y", this.y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "30");
        text.textContent = Math.floor(Math.random() * 11 + 2);
        this.svg.appendChild(text);
    }
}

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "1000");
svg.setAttribute("height", "1000");

const resources = ["Brick", "Wool", "Ore", "Grain", "Lumber"];

drawMap(5, svg);

/**
 * Draws a map of tiles with the given width.
 * 
 * @param {number} width - The width of the map.
 * @param {SVGElement} svg - The SVG element to draw the map on.
 */
function drawMap(width, svg) {
    const sideLength = 50;
    const inradius = (Math.sqrt(3) / 2) * sideLength;
    const resourceDistribution = distributeResources();
    let n = 0;
    
    for (let i = 3; i <= width; i++) {
        for (let j = 0; j < i; j++) {
            new Tile(resourceDistribution[n], 100 + inradius * 2 * j + (inradius * (width - i)), 100 + sideLength * (i - 3) * 1.5, sideLength, svg);
            n++;
            if (i < width) {
                new Tile(resourceDistribution[n], 100 + inradius * 2 * j + (inradius * (width - i)), 100 + 75 * width + sideLength * (width - i - 3) * 1.5, sideLength, svg);
                n++;
            }
        }
    }
}

function distributeResources() {
    let distribution = [];
    for (let resource of resources) {
        let n = 4;
        if (resource == "Brick" || resource == "Ore") {
            n = 3;
        }
        for (let j = 0; j < n; j++) {
            distribution.push(resource);
        }
    }
    distribution.push("Desert");

    return shuffle(distribution);
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

document.body.appendChild(svg);