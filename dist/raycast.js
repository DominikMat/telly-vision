import { Apartment, Point } from './rooms.js';
const raycastAngularResolution = 720;
const raycastAngularStep = (2 * Math.PI / raycastAngularResolution);
let raycastVisibilityData = new Array(raycastAngularResolution);
let raycastOriginX = -100;
let raycastOriginY = -100;
export function raycastFromPosition(x, y, apartment) {
    raycastVisibilityData = new Array(raycastAngularResolution);
    apartment.resetVisibilityData();
    if (!apartment.positionWithinApartmentBounds(x, y))
        return;
    for (let i = 0; i <= raycastAngularResolution; i++) {
        let angle = i * raycastAngularStep;
        raycastVisibilityData[i] = apartment.getRaycastCollisionPoint(x, y, angle);
    }
    raycastOriginX = x;
    raycastOriginY = y;
}
export function drawRaycast(ctx) {
    if (!ctx)
        return;
    ctx.beginPath();
    raycastVisibilityData.forEach(collisionPoints => {
        collisionPoints.forEach((p, i) => { ctx.lineTo(p.x, p.y); });
        ctx.moveTo(raycastOriginX, raycastOriginY);
    });
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
    // let closeShapePoint = apartment.getRaycastCollisionPoint(x, y, 0);
    // ctx.lineTo(closeShapePoint.x, closeShapePoint.y);
    // Close the shape back to center    
    // ctx.fillStyle = 'rgba(255, 255, 2555, 1)' // Nice "light" color
    // ctx.fill()
}
export function drawRaycastOrigin(ctx) {
    if (!ctx)
        return;
    // draw raycast origin point
    ctx.beginPath();
    ctx.arc(raycastOriginX, raycastOriginY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
}
//# sourceMappingURL=raycast.js.map