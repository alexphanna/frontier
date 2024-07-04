let object = document.getElementById('test');
let svgNS = "http://www.w3.org/2000/svg";

for (let i = 0; i < 5; i++) {
    let rect = document.createElementNS(svgNS, 'rect');
    rect.setAttributeNS(null, 'x', i / 5 * 100 + "%");
    rect.setAttributeNS(null, 'y', "40%");
    rect.setAttributeNS(null, 'width', '20%');
    rect.setAttributeNS(null, 'height', '20%');
    rect.setAttributeNS(null, 'fill', 'red' );
    rect.setAttributeNS(null, 'stroke', 'black');
    rect.setAttributeNS(null, 'stroke-width', '2');
    object.appendChild(rect);
}

document.addEventListener('wheel', function (event) {
    if (event.deltaY > 0) {
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

function resize(object, percent) {
    const rect = object.getBoundingClientRect(); // Get the most accurate position and size
    const width = object.width.baseVal.value;
    const newWidth = width * percent;
    const height = object.height.baseVal.value;
    const newHeight = height * percent;

    object.setAttribute('width', newWidth);
    object.setAttribute('height', newHeight);

    // Recalculate left and top based on the bounding rectangle
    const deltaX = (newWidth - width) / 2;
    const deltaY = (newHeight - height) / 2;
    const newLeft = rect.left - deltaX;
    const newTop = rect.top - deltaY;

    move(object, newLeft, newTop);
}

function move(object, left, top) {
    object.style.left = left + 'px';
    object.style.top = top + 'px';
}