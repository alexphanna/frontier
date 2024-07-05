let object = document.getElementById('test');
let svgNS = "http://www.w3.org/2000/svg";

/*const map = [
    [1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1]
];*/
const map = [
    [1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1]
];

const maxLength = Math.max(...map.map(row => row.length));

if (maxLength > map.length * (Math.sqrt(3) / 2)) {
    var inradius = 100 / (maxLength * 2);
    var sideLength = inradius * 2 / Math.sqrt(3)
    var circumradius = sideLength;
    var topMargin = (100 - (circumradius * ((map.length - 1) * 2 - 1))) / 4;
    var leftMargin = 0;

}
else {
    var circumradius = 100 / ((map.length - 1) * 2 - 1);
    var sideLength = circumradius;
    var inradius = sideLength * Math.sqrt(3) / 2;
    var topMargin = 0;
    var leftMargin = (100 - (maxLength * 2 * inradius)) / 2;
}

for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
        let hexagon = createHexagon(j * inradius * 2 + inradius * (maxLength + 1 - map[i].length) + leftMargin, i * (sideLength + Math.sqrt(Math.pow(sideLength, 2) - Math.pow(inradius, 2))) + circumradius + topMargin, inradius * 2) ;
        hexagon.setAttribute("fill", "#f0c000");
        hexagon.setAttribute("stroke", "black");
        hexagon.setAttribute("stroke-width", ".25");
        object.appendChild(hexagon);
    }
}

document.addEventListener('wheel', function (event) {
    function resize(object, percent) {
        const rect = object.getBoundingClientRect();
        const width = object.width.baseVal.value;
        const newWidth = width * percent;
        const height = object.height.baseVal.value;
        const newHeight = height * percent;
    
        object.setAttribute('width', newWidth);
        object.setAttribute('height', newHeight);
    
        const deltaX = (newWidth - width) / 2;
        const deltaY = (newHeight - height) / 2;
        const newLeft = rect.left - deltaX;
        const newTop = rect.top - deltaY;
    
        move(object, newLeft, newTop);
    }

    if (event.deltaY > 0 && object.width.baseVal.value > 300) {
        resize(object, .9);
    } else if (event.deltaY < 0) {
        resize(object, 1.1);
    }
});

document.addEventListener('mousedown', function (event) {
    let x = event.clientX;
    let y = event.clientY;
    let left = parseInt(object.style.left);
    let top = parseInt(object.style.top);

    function mouseMove(event) {
        left += event.clientX - x;
        top += event.clientY - y;
        move(object, left, top);
        x = event.clientX;
        y = event.clientY;
    }

    document.addEventListener('mousemove', mouseMove);

    document.addEventListener('mouseup', function (event) {
        document.removeEventListener('mousemove', mouseMove);
    });
});

function move(object, left, top) {
    object.style.left = left + 'px';
    object.style.top = top + 'px';
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
    hexagon.setAttribute("x", x);
    hexagon.setAttribute("y", y);
    return hexagon;
}