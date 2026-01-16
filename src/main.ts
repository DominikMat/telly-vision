import { apartment, Point } from './rooms.js'

/* Application configuration */
const canvasElement: HTMLCanvasElement | null = document.querySelector('canvas');
const targetFps = 60
const deltaTime_ms = 1000 / targetFps

/* Canvas Variables */
let ctx: CanvasRenderingContext2D | null | undefined = canvasElement?.getContext('2d')
let width = window.innerWidth
let height = window.innerHeight
let renderParamsChanged = true

/* Raycast */
let raycastOriginX = 0
let raycastOriginY = 0

// your init logic here
function init() {
    /* set looping behaviour */
    setInterval(loop, deltaTime_ms)
}

// your loop logic here
function loop() {
    draw()
}

// your render logic here
function draw() {
    if (!ctx || !renderParamsChanged) return
    renderParamsChanged = false

    // clear canvas
    ctx.clearRect(0,0,width,height)

    // draw grey rooms
    apartment.drawRooms(ctx, width, height, true) 

    // make hole with raycast
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out';
    drawRaycast(ctx, raycastOriginX, raycastOriginY)
    ctx.save()

    // fill empty space with coloured rooms
    ctx.restore()
    ctx.globalCompositeOperation = 'destination-over';
    apartment.drawRooms(ctx, width, height, false)
    ctx.restore()

    // draw apartmetn walls
    apartment.drawWalls(ctx)
    
    ctx.beginPath();
    ctx.arc(raycastOriginX, raycastOriginY, 10, 0, 2*Math.PI);
    ctx.fillStyle = 'orange';
    ctx.fill();
}

function drawRaycast(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!ctx) return;
    if (x==0 && y==0) return
    
    // Visualization Settings
    const angularResolution = 720; // Higher res for smoother circles
    const angularStep = (2 * Math.PI) / angularResolution;

    ctx.beginPath();

    for (let angle = 0; angle <= 2 * Math.PI; angle += angularStep) {
        let p = apartment.getRaycastCollisionPoint(x, y, angle);
        ctx.lineTo(p.x, p.y);
    }
    
    let closeShapePoint = apartment.getRaycastCollisionPoint(x, y, 0);
    ctx.lineTo(closeShapePoint.x, closeShapePoint.y);

    
    // Close the shape back to center    
    ctx.fillStyle = 'rgba(255, 255, 2555, 1)' // Nice "light" color
    ctx.fill()
    
    // Optional: Draw the perimeter line
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()
}

function mouseclick(e: PointerEvent) {
    raycastOriginX = e.offsetX
    raycastOriginY = e.offsetY
    renderParamsChanged = true
}

// your resizing logic here
function resize() {
    const dpr = window.devicePixelRatio
    const displayWidth = window.innerWidth
    const displayHeight = window.innerHeight * 0.9 // decrese based on header size

    if (canvasElement) {
        width = canvasElement.width = Math.floor(displayWidth * dpr)
        height = canvasElement.height = Math.floor(displayHeight * dpr)
    }
    if(ctx) ctx.scale(dpr, dpr)
    renderParamsChanged = true
}

window.onload = () => { resize(); init() }
window.onresize = () => { resize() }
window.onclick = (event) => { mouseclick(event) }