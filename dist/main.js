import { apartment, ObjectType, Point } from './rooms.js';
/* Application configuration */
const canvasElement = document.querySelector('canvas');
const targetFps = 60;
const deltaTime_ms = 1000 / targetFps;
/* Canvas Variables */
let ctx = canvasElement?.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
let raycastParamsChanged = true;
/* Raycast */
let raycastOriginX = 0;
let raycastOriginY = 0;
/* Mouse */
let mouseX = 0;
let mouseY = 0;
/* icons */
const iconPanelWidth = 100;
const iconPanelHeightPercent = 0.5;
const iconSize = iconPanelWidth * 0.8;
let iconPanelXMiddle = 0;
function updateIconPanelPosition() { iconPanelXMiddle = apartment.positionOriginX - iconPanelWidth; }
function getIconPos(i) { return new Point(iconPanelXMiddle - iconSize / 2, height * iconPanelHeightPercent / 2 + i * iconSize); }
function getIconAtPos(x, y) {
    if (x < iconPanelXMiddle - iconPanelWidth / 2 || x > iconPanelXMiddle + iconPanelWidth / 2)
        return -1;
    let yStart = (1 - iconPanelHeightPercent) / 2 * height;
    if (y < (1 - iconPanelHeightPercent) / 2 * height || y > yStart + icons.length * iconSize)
        return -1;
    return Math.floor((y - yStart) / iconSize);
}
const cursorIconPreviewAlpha = 0.33;
class Icon {
    name;
    path;
    loaded;
    displayImg;
    tag;
    constructor(_name, _path, _tag) {
        this.name = _name;
        this.path = _path;
        this.tag = _tag;
        this.loaded = false;
        this.displayImg = new Image();
        this.displayImg.src = _path;
        this.displayImg.onload = () => { this.loaded = true; };
        this.displayImg.onerror = (e) => { console.error(this.name, ' Icon loading error: ', e); };
    }
}
const icons = [
    new Icon('Mirror', './icons/mirrorIcon.png', ObjectType.Mirror)
];
let selectedIcon = -1;
// your init logic here
function init() {
    /* set looping behaviour */
    setInterval(loop, deltaTime_ms);
}
// your loop logic here
function loop() {
    draw();
}
// your render logic here
function draw() {
    if (!ctx)
        return;
    // clear canvas
    //if (raycastParamsChanged) {
    ctx.clearRect(0, 0, width, height);
    // draw grey rooms
    apartment.updateScreenSize(width, height);
    apartment.drawRooms(ctx, true);
    // make hole with raycast
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    drawRaycast(ctx, raycastOriginX, raycastOriginY);
    ctx.save();
    // fill empty space with coloured rooms
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-over';
    apartment.drawRooms(ctx, false);
    ctx.restore();
    // raycast on top of all
    // ctx.save()
    // // ctx.globalCompositeOperation = 'destination-out';
    // drawRaycast(ctx, raycastOriginX, raycastOriginY)
    // ctx.save()
    // draw apartmetn walls
    apartment.drawWalls(ctx);
    ctx.beginPath();
    ctx.arc(raycastOriginX, raycastOriginY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'orange';
    ctx.fill();
    //}
    /* Icon Panel */
    //ctx.clearRect(0,0,iconPanelXMiddle+iconPanelWidth/2,height)
    updateIconPanelPosition();
    ctx.beginPath();
    ctx.arc(iconPanelXMiddle, iconPanelHeightPercent / 2 * height, iconPanelWidth / 2, Math.PI, 2 * Math.PI);
    ctx.lineTo(iconPanelXMiddle + iconPanelWidth / 2, (1 - iconPanelHeightPercent / 2) * height);
    ctx.arc(iconPanelXMiddle, (1 - iconPanelHeightPercent / 2) * height, iconPanelWidth / 2, 0, Math.PI);
    ctx.lineTo(iconPanelXMiddle - iconPanelWidth / 2, iconPanelHeightPercent / 2 * height);
    ctx.fillStyle = '#00000069';
    ctx.fill();
    /* draw icons */
    icons.forEach((icon, i) => {
        if (icon.loaded) {
            let iconPos = getIconPos(i);
            ctx.drawImage(icon.displayImg, iconPos.x, iconPos.y, iconSize, iconSize);
            // draw outline if selected
            if (i == selectedIcon) {
                ctx.beginPath();
                ctx.rect(iconPos.x, iconPos.y, iconSize, iconSize);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    });
    /* draw mouse icon preview */
    if (selectedIcon != -1) {
        const icon = icons[selectedIcon];
        if (icon && icon.loaded) {
            ctx.globalAlpha = cursorIconPreviewAlpha;
            ctx.drawImage(icon.displayImg, mouseX, mouseY, iconSize, iconSize);
            ctx.globalAlpha = 1.0;
        }
    }
    raycastParamsChanged = false;
}
function drawRaycast(ctx, x, y) {
    if (!ctx)
        return;
    if (x == 0 && y == 0)
        return;
    // Visualization Settings
    const angularResolution = 720; // Higher res for smoother circles
    const angularStep = (2 * Math.PI) / angularResolution;
    ctx.beginPath();
    for (let angle = 0; angle <= 2 * Math.PI; angle += angularStep) {
        let collisionPoints = apartment.getRaycastCollisionPoint(x, y, angle);
        collisionPoints.forEach((p, i) => {
            ctx.lineTo(p.x, p.y);
        });
        if (collisionPoints.length > 1) {
            console.log("Multiple collisioon points!");
        }
        //if (collisionPoints.length > 1 && collisionPoints[0]) 
        ctx.moveTo(x, y);
    }
    // ctx.fillStyle = 'lightblue'
    // ctx.fill()        
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
    // let closeShapePoint = apartment.getRaycastCollisionPoint(x, y, 0);
    // ctx.lineTo(closeShapePoint.x, closeShapePoint.y);
    // Close the shape back to center    
    // ctx.fillStyle = 'rgba(255, 255, 2555, 1)' // Nice "light" color
    // ctx.fill()
    // Optional: Draw the perimeter line
    // ctx.strokeStyle = 'white'
    // ctx.lineWidth = 3
    // ctx.stroke()
}
function mouseClick(e) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    let iconAtPos = getIconAtPos(mouseX, mouseY);
    if (iconAtPos != -1) {
        selectedIcon = iconAtPos;
        return;
    }
    if (selectedIcon == -1) {
        raycastOriginX = mouseX;
        raycastOriginY = mouseY;
        raycastParamsChanged = true;
    }
    else {
        const icon = icons[selectedIcon];
        if (icon && apartment.placeObject(icon.tag, mouseX, mouseY))
            selectedIcon = -1; // place object
    }
    if (selectedIcon != -1 && !apartment.positionWithinApartmentBounds(mouseX, mouseY))
        selectedIcon = -1;
}
function mouseMove(e) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    let iconAtPos = getIconAtPos(mouseX, mouseY);
    if (canvasElement)
        canvasElement.style.cursor = iconAtPos != -1 ? 'pointer' : 'default';
}
// your resizing logic here
function resize() {
    const dpr = window.devicePixelRatio;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight * 0.9; // decrese based on header size
    if (canvasElement) {
        width = canvasElement.width = Math.floor(displayWidth * dpr);
        height = canvasElement.height = Math.floor(displayHeight * dpr);
    }
    if (ctx)
        ctx.scale(dpr, dpr);
    raycastParamsChanged = true;
}
window.onload = () => { resize(); init(); };
window.onresize = () => { resize(); };
window.onmousemove = (e) => { mouseMove(e); apartment.onMouseMove(e); };
window.onmouseup = (e) => { let objMoved = apartment.onMouseUp(e); if (!objMoved)
    mouseClick(e); };
window.onmousedown = (e) => { apartment.onMouseDown(e); };
//# sourceMappingURL=main.js.map