const apartmentMaxScreenSizePercent = 0.65;
export class Point {
    x = 0;
    y = 0;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}
export var Rooms;
(function (Rooms) {
    Rooms[Rooms["None"] = 0] = "None";
    Rooms[Rooms["Livi"] = 1] = "Livi";
    Rooms[Rooms["Kitc"] = 2] = "Kitc";
    Rooms[Rooms["Corr"] = 3] = "Corr";
    Rooms[Rooms["Loo1"] = 4] = "Loo1";
    Rooms[Rooms["Loo2"] = 5] = "Loo2";
    Rooms[Rooms["Bed1"] = 6] = "Bed1";
    Rooms[Rooms["Bed2"] = 7] = "Bed2";
    Rooms[Rooms["Bed3"] = 8] = "Bed3";
    Rooms[Rooms["Prep"] = 9] = "Prep";
})(Rooms || (Rooms = {}));
const doorSize = 0.5;
const doorPosition = 0.5;
const wallWidth = 5;
const maximumBounceDepth = 3;
const reflectionObjectSize = 100;
const degToRad = 2 * Math.PI / 360;
const rotationHandleArcSpan = 45 * degToRad;
const rotaionHandleDistMult = 0.67;
const objectHandleInteractionDistance = rotaionHandleDistMult * reflectionObjectSize / 3;
export var ReflectionObjectType;
(function (ReflectionObjectType) {
    ReflectionObjectType[ReflectionObjectType["Mirror"] = 0] = "Mirror";
})(ReflectionObjectType || (ReflectionObjectType = {}));
export var HouseObjectType;
(function (HouseObjectType) {
    HouseObjectType[HouseObjectType["Telly"] = 0] = "Telly";
    HouseObjectType[HouseObjectType["Sofa"] = 1] = "Sofa";
})(HouseObjectType || (HouseObjectType = {}));
const roomColours = [
    /* None */ 'transparent',
    /* Living Room */ 'orange',
    /* Kitchen */ 'blue',
    /* Corridor  */ 'yellow',
    /* Loo 1*/ 'skyblue',
    /* Loo 2*/ 'skyblue',
    /* Bedroom 1 */ 'red',
    /* Bedroom 2 */ 'purple',
    /* Bedroom 3 */ 'pink',
    /* Prep room (at entrance) */ 'purple',
];
const houseObjectsSizes = [
    /* Telly */ new Point(75, 75),
    /* Sofa */ new Point(250, 135),
];
class Line {
    x1;
    y1;
    x2;
    y2;
    dy;
    dx;
    C;
    dist;
    constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.dy = y1 - y2;
        this.dx = x2 - x1;
        this.C = x1 * y2 - x2 * y1;
        this.dist = Math.sqrt(this.dy * this.dy + this.dx * this.dx);
    }
    // Returns the distance 't' if hit, or null if miss
    getRayIntersection(rayOriginX, rayOriginY, rayDirX, rayDirY) {
        // Wall Vector
        const v1x = this.x1;
        const v1y = this.y1;
        const v2x = this.x2;
        const v2y = this.y2;
        const wallDirX = v2x - v1x;
        const wallDirY = v2y - v1y;
        // Denominator (Cross product of Ray Direction and Wall Direction)
        const den = rayDirX * wallDirY - rayDirY * wallDirX;
        // If den is 0, lines are parallel
        if (den === 0)
            return null;
        const diffX = v1x - rayOriginX;
        const diffY = v1y - rayOriginY;
        // t = distance along the ray to the intersection
        const t = (diffX * wallDirY - diffY * wallDirX) / den;
        // u = position along the wall (0 to 1) where intersection occurs
        const u = (diffX * rayDirY - diffY * rayDirX) / den;
        // CHECK 1: t > 0 means the wall is in front of the ray
        // CHECK 2: u >= 0 && u <= 1 means we hit the actual segment, not the infinite line
        if (t > 0 && u >= 0 && u <= 1) {
            return {
                t: t,
                x: rayOriginX + t * rayDirX,
                y: rayOriginY + t * rayDirY
            };
        }
        return null;
    }
}
class ReflectionObject {
    type;
    x;
    y;
    rotation = 0 * degToRad;
    size = reflectionObjectSize;
    collider = new Line();
    leftExtent = new Point();
    rightExtent = new Point();
    normalExtent = new Point();
    mouseTrackingRotation = false;
    mouseTrackingMovement = false;
    onRtHandleHover = false;
    onMoveHandleHover = false;
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.updateRelativePositions();
    }
    draw(ctx) {
        if (!ctx)
            return;
        ctx.beginPath();
        switch (this.type) {
            default:
                ctx.moveTo(this.leftExtent.x, this.leftExtent.y);
                ctx.lineTo(this.rightExtent.x, this.rightExtent.y);
        }
        ctx.strokeStyle = 'white';
        ctx.lineWidth = this.onMoveHandleHover ? 6 : 3;
        ctx.stroke();
        /* rotation handle */
        let normalRotation = this.rotation - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.normalExtent.x, this.normalExtent.y);
        ctx.strokeStyle = 'black'; //this.onRtHandleHover ? 'black' : 'grey'
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = this.onRtHandleHover ? 4 : 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.lineWidth = this.onRtHandleHover ? 6 : 2;
        ctx.arc(this.x, this.y, rotaionHandleDistMult * this.size, normalRotation - rotationHandleArcSpan / 2, normalRotation + rotationHandleArcSpan / 2);
        ctx.stroke();
    }
    setRotation(rt) {
        if (rt != this.rotation) {
            this.rotation = rt;
            this.updateRelativePositions();
        }
    }
    setRotationFromPos(pos) {
        let newRt = Math.atan2(this.y - pos.y, this.x - pos.x) - Math.PI / 2;
        this.setRotation(newRt);
    }
    setPosition(pos) {
        this.x = pos.x;
        this.y = pos.y;
        this.updateRelativePositions();
    }
    updateRelativePositions() {
        this.leftExtent = new Point(this.x + Math.cos(this.rotation) * this.size / 2, this.y + Math.sin(this.rotation) * this.size / 2);
        this.rightExtent = new Point(this.x - Math.cos(this.rotation) * this.size / 2, this.y - Math.sin(this.rotation) * this.size / 2);
        let normalRotation = this.rotation - Math.PI / 2;
        this.normalExtent = new Point(this.x + Math.cos(normalRotation) * rotaionHandleDistMult * this.size, this.y + Math.sin(normalRotation) * rotaionHandleDistMult * this.size);
        this.collider = new Line(this.leftExtent.x, this.leftExtent.y, this.rightExtent.x, this.rightExtent.y);
    }
    getBounceAngle(inAngle) {
        switch (this.type) {
            case ReflectionObjectType.Mirror:
            default:
                return 2 * (this.rotation + Math.PI / 2) - inAngle + Math.PI;
        }
    }
    /* Mouse interactions */
    onMouseMove(pos) {
        if (this.mouseTrackingRotation)
            this.setRotationFromPos(pos);
        else
            this.onRtHandleHover = this.posOnRotationHandle(pos);
        if (this.mouseTrackingMovement)
            this.setPosition(pos);
        else
            this.onMoveHandleHover = this.posOnMovementHandle(pos);
        return this.mouseTrackingMovement || this.mouseTrackingRotation;
    }
    onMouseDown(pos) {
        this.mouseTrackingRotation = this.posOnRotationHandle(pos);
        this.mouseTrackingMovement = this.posOnMovementHandle(pos);
    }
    onMouseUp(pos) {
        if (this.mouseTrackingRotation) {
            this.setRotationFromPos(pos);
            this.mouseTrackingRotation = false;
            return true;
        }
        if (this.mouseTrackingMovement) {
            this.setPosition(pos);
            this.mouseTrackingMovement = false;
            return true;
        }
        return false;
    }
    posOnRotationHandle(pos) {
        let dx = this.normalExtent.x - pos.x;
        let dy = this.normalExtent.y - pos.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        return dist < objectHandleInteractionDistance;
    }
    posOnMovementHandle(pos) {
        let dx = this.x - pos.x;
        let dy = this.y - pos.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        return dist < objectHandleInteractionDistance;
    }
}
class HouseObject {
    name;
    type;
    uv = new Point();
    pos = new Point();
    size = new Point(100, 100);
    colourImg;
    loadedColour = false;
    greyImg = null;
    loadedGrey = false;
    constructor(_name, _colourPath, _type, houseUV, _greyPath = '') {
        this.name = _name;
        this.type = _type;
        this.uv = houseUV;
        this.size = houseObjectsSizes[_type] ? houseObjectsSizes[_type] : new Point(100, 100);
        this.colourImg = new Image();
        this.colourImg.src = _colourPath;
        this.colourImg.onload = () => { this.loadedColour = true; };
        this.colourImg.onerror = (e) => { console.error(this.name, ' Icon loading error: ', e); };
        if (_greyPath != '') {
            this.greyImg = new Image();
            this.greyImg.src = _greyPath;
            this.greyImg.onload = () => { this.loadedGrey = true; };
            this.greyImg.onerror = (e) => { console.error(this.name, ' Icon loading error: ', e); };
        }
    }
    updateHousePosition(newPos) {
        this.pos = newPos;
        this.pos.x -= this.size.x / 2;
        this.pos.y -= this.size.y / 2;
    }
}
export class Apartment {
    /* Variables */
    roomPlan;
    doorsHorizontal;
    doorsVertical;
    apartHeight = 0;
    apartWidth = 0;
    positionOriginX = 0;
    positionOriginY = 0;
    walls = [];
    reflectionObjects = [];
    telly = null;
    tellyVisible = false;
    houseObjects;
    screenWidth = -1;
    screenHeight = -1;
    roomSize = 100;
    /* Constructor */
    constructor(roomPlan, doorsHorz, doorsVert, houseObjects) {
        this.roomPlan = roomPlan;
        this.doorsHorizontal = doorsHorz;
        this.doorsVertical = doorsVert;
        this.apartHeight = roomPlan.length;
        this.apartWidth = roomPlan[0]?.length ? roomPlan[0]?.length : 0;
        this.houseObjects = houseObjects;
        houseObjects.forEach(ho => { if (ho.type == HouseObjectType.Telly)
            this.telly = ho; });
    }
    /* Ray casting */
    getRaycastCollisionPoint(originX, originY, angle, bounceDepth = 0) {
        // 1. Calculate Unit Vector for the Ray
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        let closestT = Infinity;
        let closestPoint = new Point(originX + rayDirX * 10000, originY + rayDirY * 10000); // Default far away
        // 2. Check every wall
        for (const wall of this.walls) {
            const hit = wall.getRayIntersection(originX, originY, rayDirX, rayDirY);
            // 3. Keep the smallest 't' (closest distance)
            if (hit && hit.t < closestT && hit.t > 0.01) {
                closestT = hit.t;
                closestPoint.x = hit.x;
                closestPoint.y = hit.y;
            }
        }
        for (const obj of this.reflectionObjects) {
            const hit = obj.collider.getRayIntersection(originX, originY, rayDirX, rayDirY);
            if (hit && hit.t < closestT && hit.t > 0.01 && bounceDepth < maximumBounceDepth) {
                let currentCollisionPoint = [new Point(hit.x, hit.y)];
                let furtherCollisionPoints = this.getRaycastCollisionPoint(hit.x, hit.y, obj.getBounceAngle(angle), bounceDepth + 1);
                return currentCollisionPoint.concat(furtherCollisionPoints);
            }
        }
        if (!this.tellyVisible && this.telly && this.isTellyVisibleFromRay(new Point(originX, originY), closestPoint, this.telly.size.x / 3))
            this.tellyVisible = true;
        return [closestPoint];
    }
    resetVisibilityData() {
        this.tellyVisible = false;
    }
    isTellyVisibleFromRay(lineStart, lineEnd, minDist) {
        if (!this.telly)
            return false;
        let tellyCentre = new Point(this.telly.pos.x + this.telly.size.x / 2, this.telly.pos.y + this.telly.size.y / 2);
        // check line points are within point bounding box 
        if (lineStart.x > tellyCentre.x + minDist && lineEnd.x > tellyCentre.x + minDist)
            return false;
        if (lineStart.y > tellyCentre.y + minDist && lineEnd.y > tellyCentre.y + minDist)
            return false;
        if (lineStart.x < tellyCentre.x - minDist && lineEnd.x < tellyCentre.x - minDist)
            return false;
        if (lineStart.y < tellyCentre.y - minDist && lineEnd.y < tellyCentre.y - minDist)
            return false;
        let dy = lineStart.y - lineEnd.y;
        let dx = lineEnd.x - lineStart.x;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let C = lineStart.x * lineEnd.y - lineEnd.x * lineStart.y;
        let minDistToPoint = Math.abs(dy * tellyCentre.x + dx * tellyCentre.y + C) / dist;
        return minDistToPoint <= minDist;
    }
    /* Object placing */
    placeObject(objType, x, y) {
        if (!this.positionWithinApartmentBounds(x, y))
            return false;
        this.reflectionObjects.push(new ReflectionObject(objType, x, y));
        return true;
    }
    /* Wall generation */
    generateWallLines() {
        if (this.roomPlan === undefined || this.roomPlan.length == 0)
            return;
        this.walls = [];
        for (let x = 0; x < this.apartWidth; x++) {
            for (let y = 0; y < this.apartHeight; y++) {
                let roomX = this.positionOriginX + x * this.roomSize;
                let roomY = this.positionOriginY + y * this.roomSize;
                let currentRoom = this.roomPlan[y]?.[x];
                if (currentRoom !== undefined && currentRoom != Rooms.None) {
                    if (x == 0 || this.roomPlan[y]?.[x - 1] != currentRoom) {
                        this.addNewWall(roomX, roomY, roomX, roomY + this.roomSize, this.doorsVertical[y]?.[x]);
                    }
                    if (x == this.apartWidth - 1 || this.roomPlan[y]?.[x + 1] != currentRoom) {
                        this.addNewWall(roomX + this.roomSize, roomY, roomX + this.roomSize, roomY + this.roomSize, this.doorsVertical[y]?.[x + 1]);
                    }
                    if (y == 0 || this.roomPlan[y - 1]?.[x] != currentRoom) {
                        this.addNewWall(roomX, roomY, roomX + this.roomSize, roomY, this.doorsHorizontal[y]?.[x]);
                    }
                    if (y == this.apartHeight - 1 || this.roomPlan[y + 1]?.[x] != currentRoom) {
                        this.addNewWall(roomX, roomY + this.roomSize, roomX + this.roomSize, roomY + this.roomSize, this.doorsHorizontal[y + 1]?.[x]);
                    }
                }
            }
        }
    }
    addNewWall(x1, y1, x2, y2, hasDoor) {
        const doorStart = Math.max(doorPosition - doorSize / 2, 0);
        const doorEnd = Math.min(doorPosition + doorSize / 2, 1.0);
        if (hasDoor ? hasDoor == 1 : false) {
            this.walls.push(new Line(x1, y1, x1 * (1 - doorStart) + x2 * doorStart, y1 * (1 - doorStart) + y2 * doorStart));
            this.walls.push(new Line(x1 * (1 - doorEnd) + x2 * doorEnd, y1 * (1 - doorEnd) + y2 * doorEnd, x2, y2));
        }
        else {
            this.walls.push(new Line(x1, y1, x2, y2));
        }
    }
    /* Render functions */
    draw(ctx, greyscale) {
        if (!greyscale)
            this.drawObjects(ctx, greyscale);
        this.drawRooms(ctx, greyscale);
        if (greyscale)
            this.drawObjects(ctx, greyscale);
    }
    drawRooms(ctx, greyscale) {
        if (!ctx)
            return;
        if (this.roomPlan === undefined || this.roomPlan.length == 0)
            return;
        for (let x = 0; x < this.apartWidth; x++) {
            for (let y = 0; y < this.apartHeight; y++) {
                /* Draw floor */
                let roomX = this.positionOriginX + x * this.roomSize;
                let roomY = this.positionOriginY + y * this.roomSize;
                ctx.beginPath();
                ctx.rect(roomX, roomY, this.roomSize * 1.01, this.roomSize * 1.01);
                let currentRoom = this.roomPlan[y]?.[x];
                let colour = 'pink';
                if (currentRoom == undefined || currentRoom == Rooms.None)
                    colour = 'transparent';
                else if (greyscale)
                    colour = 'grey';
                else if (roomColours[currentRoom])
                    colour = roomColours[currentRoom];
                ctx.fillStyle = colour;
                ctx.fill();
            }
        }
    }
    drawObjects(ctx, greyscale = false) {
        if (!ctx)
            return;
        if (this.walls.length == 0)
            this.generateWallLines();
        /* Draw Walls */
        ctx.lineWidth = wallWidth;
        ctx.strokeStyle = 'black';
        this.walls.forEach(line => {
            // fix wall corners
            let x1 = line.x1;
            let y1 = line.y1;
            let x2 = line.x2;
            let y2 = line.y2;
            if (y1 == y2) {
                x1 -= wallWidth / 2;
                x2 += wallWidth / 2;
            }
            if (x1 == x2) {
                y1 -= wallWidth / 2;
                y2 += wallWidth / 2;
            }
            // draw line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
        /* Draw House Objects */
        this.houseObjects.forEach(obj => {
            if (greyscale ? obj.loadedGrey : obj.loadedColour)
                ctx.drawImage(greyscale && obj.greyImg ? obj.greyImg : obj.colourImg, obj.pos.x, obj.pos.y, obj.size.x, obj.size.y);
        });
        /* Draw Reflection Objects */
        this.reflectionObjects.forEach(obj => {
            obj.draw(ctx);
        });
    }
    /* Util */
    positionWithinApartmentBounds(x, y) {
        if (x < this.positionOriginX || x > this.positionOriginX + this.apartWidth * this.roomSize)
            return false;
        if (y < this.positionOriginY || y > this.positionOriginY + this.apartHeight * this.roomSize)
            return false;
        return this.getRoomAtPos(x, y) != Rooms.None;
    }
    getRoomAtPos(x, y) {
        let roomX = Math.floor((x - this.positionOriginX) / this.roomSize);
        let roomY = Math.floor((y - this.positionOriginY) / this.roomSize);
        if (roomX < 0 || roomX >= this.apartWidth || roomY < 0 || roomY >= this.apartHeight)
            return Rooms.None;
        let targetRoom = this.roomPlan[roomY]?.[roomX];
        return targetRoom ? targetRoom : Rooms.None;
    }
    updateScreenSize(w, h) {
        if (this.screenWidth != w || this.screenHeight != h) {
            this.screenWidth = w;
            this.screenHeight = h;
            this.roomSize = Math.min(apartmentMaxScreenSizePercent * w / this.apartWidth, apartmentMaxScreenSizePercent * h / this.apartHeight);
            this.positionOriginX = this.screenWidth / 2 - (this.apartWidth / 2) * this.roomSize;
            this.positionOriginY = this.screenHeight / 2 - (this.apartHeight / 2) * this.roomSize;
            this.generateWallLines();
            this.houseObjects.forEach(ho => { ho.updateHousePosition(this.uvToWorld(ho.uv)); });
        }
    }
    isTellyVisible() { return this.tellyVisible; }
    uvToWorld(uv) {
        return new Point(this.positionOriginX + uv.x * this.roomSize * this.apartWidth, this.positionOriginY + uv.y * this.roomSize * this.apartHeight);
    }
    /* Mouse interactions */
    onMouseDown(e) {
        let mousePos = new Point(e.offsetX, e.offsetY);
        this.reflectionObjects.forEach(ro => { ro.onMouseDown(mousePos); });
    }
    onMouseUp(e) {
        let anyObjMoved = false;
        let mousePos = new Point(e.offsetX, e.offsetY);
        let removeIdx = -1; // there should only be max 1 object to remove
        this.reflectionObjects.forEach((ro, i) => {
            anyObjMoved = ro.onMouseUp(mousePos) || anyObjMoved;
            if (!this.positionWithinApartmentBounds(ro.x, ro.y))
                removeIdx = i;
        });
        if (removeIdx != -1)
            this.reflectionObjects.splice(removeIdx, 1);
        return anyObjMoved;
    }
    onMouseMove(e) {
        let objMoved = false;
        let mousePos = new Point(e.offsetX, e.offsetY);
        this.reflectionObjects.forEach(ro => { objMoved ||= ro.onMouseMove(mousePos); });
        return objMoved;
    }
}
/* Apartment 1 configuration */
const apartmentRoomPlan1 = [
    [Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi],
    [Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi],
    [Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi],
    [Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Bed1, Rooms.Bed1],
    [Rooms.Loo2, Rooms.Loo2, Rooms.Livi, Rooms.Bed1, Rooms.Bed1],
    [Rooms.Loo2, Rooms.Loo2, Rooms.Prep, Rooms.Loo1, Rooms.Loo1],
];
const apartmentDoorsH1 = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 1],
    [0, 0, 1, 0, 0],
];
const apartmentDoorsV1 = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
];
export const defaultTellyPos = new Point(0.8, 1 / 16);
let houseObjects = [
    new HouseObject('tv', './images/telly_col.png', HouseObjectType.Telly, defaultTellyPos, './images/telly_grey.png'),
    new HouseObject('sofa', './images/sofa_col.png', HouseObjectType.Sofa, new Point(0.8, .3), './images/sofa_grey.png')
];
export let apartment = new Apartment(apartmentRoomPlan1, apartmentDoorsH1, apartmentDoorsV1, houseObjects);
//# sourceMappingURL=rooms.js.map