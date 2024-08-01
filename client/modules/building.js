export default class Building {
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