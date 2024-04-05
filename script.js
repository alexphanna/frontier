class Tile {
    constructor(x, y, sideLength, svg) {
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
        hexagon.setAttribute("fill", "none");
        hexagon.setAttribute("stroke", "black");
        let points = "";
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i - Math.PI / 2;
            const x = this.x + this.sideLength * Math.cos(angle);
            const y = this.y + this.sideLength * Math.sin(angle);
            points += `${x},${y} `;
        }
        hexagon.setAttribute("points", points);
        this.svg.appendChild(hexagon);
    }
}

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "1000");
svg.setAttribute("height", "1000");

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
    
    for (let i = 3; i <= width; i++) {
        for (let j = 0; j < i; j++) {
            new Tile(100 + inradius * 2 * j + (inradius * (width - i)), 100 + sideLength * (i - 3) * 1.5, sideLength, svg);
            if (i < width) {
                new Tile(100 + inradius * 2 * j + (inradius * (width - i)), 100 + 75 * width + sideLength * (width - i - 3) * 1.5, sideLength, svg);
            }
        }
    }
}

document.body.appendChild(svg);