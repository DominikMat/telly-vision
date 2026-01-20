const apartmentMaxScreenSizePercent = 0.65

export class Point {
    x: number = 0
    y: number = 0
    constructor( x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }
}

export enum Rooms { None, Livi, Kitc, Corr, Loo1, Loo2, Bed1, Bed2, Bed3, Prep }

const doorSize = 0.5
const doorPosition = 0.5
const wallWidth = 5

const maximumBounceDepth = 3

const reflectionObjectSize = 100
const degToRad = 2*Math.PI/360
const rotationHandleArcSpan = 45 * degToRad
const rotaionHandleDistMult = 0.67
const objectHandleInteractionDistance = rotaionHandleDistMult*reflectionObjectSize / 3

export enum ReflectionObjectType { Mirror }
export enum HouseObjectType { Telly, Sofa, Carpet, Kitchen, Bed, Toilet, Faucet, Bath, Stairs, Table }

const roomColours: Array<string> = [
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
]
const houseObjectsSizes: Array<Point> = [
    /* Telly */ new Point(0.75,0.75),
    /* Sofa */ new Point(2.5,1.35),
    /* Carpet */ new Point(1.8, 1.5),
    /* Kitchen */ new Point(1.87, 2.5),
    /* Bed */ new Point(1.5,1),
    /* Toilet */ new Point(0.75,0.75),
    /* Faucet */ new Point(0.6,0.6),
    /* Bath */ new Point(1.25, 1.7),
    /* Stairs */ new Point(1.5,1.5),
    /* Table */ new Point(1.25,1.8),
]

class Line {
    x1: number; y1: number; x2: number; y2: number;
    dy: number; dx:number; C:number; dist:number;

    constructor(x1: number=0, y1: number=0, x2: number=0, y2: number=0) {
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;

        this.dy = y1-y2
        this.dx = x2-x1
        this.C = x1*y2 - x2*y1
        this.dist = Math.sqrt(this.dy*this.dy + this.dx*this.dx)
    }

    // Returns the distance 't' if hit, or null if miss
    getRayIntersection(rayOriginX: number, rayOriginY: number, rayDirX: number, rayDirY: number): { t: number, x: number, y: number } | null {
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
        if (den === 0) return null;

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
    type: ReflectionObjectType
    x: number
    y: number
    rotation: number = 0 * degToRad
    size: number = reflectionObjectSize
    collider: Line = new Line()
    leftExtent: Point = new Point()
    rightExtent: Point = new Point()
    normalExtent: Point = new Point()
    mouseTrackingRotation: boolean = false
    mouseTrackingMovement: boolean = false
    onRtHandleHover:boolean = false
    onMoveHandleHover:boolean = false
    
    constructor (type: ReflectionObjectType, x: number, y: number) {
        this.type = type
        this.x = x
        this.y = y
        this.updateRelativePositions()
    }
    draw(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;

        ctx.beginPath()
        switch (this.type) {
            default:    
                ctx.moveTo(this.leftExtent.x, this.leftExtent.y)
                ctx.lineTo(this.rightExtent.x, this.rightExtent.y)
        }
        ctx.strokeStyle = 'white'
        ctx.lineWidth = this.onMoveHandleHover ? 6 : 3
        ctx.stroke()

        /* rotation handle */
        let normalRotation = this.rotation-Math.PI/2
        ctx.beginPath()
        ctx.moveTo(this.x,this.y)
        ctx.lineTo(this.normalExtent.x, this.normalExtent.y)
        ctx.strokeStyle = 'black' //this.onRtHandleHover ? 'black' : 'grey'
        ctx.globalAlpha = 0.35
        ctx.lineWidth = this.onRtHandleHover ? 4 : 1
        ctx.stroke()
        ctx.globalAlpha = 1.0
        
        ctx.beginPath()
        ctx.lineWidth = this.onRtHandleHover ? 6 : 2
        ctx.arc(this.x,this.y, rotaionHandleDistMult*this.size, normalRotation-rotationHandleArcSpan/2, normalRotation+rotationHandleArcSpan/2)
        ctx.stroke()
    }
    setRotation(rt: number) {
        if (rt != this.rotation) {
            this.rotation = rt
            this.updateRelativePositions()
        }
    }
    setRotationFromPos(pos: Point) {
        let newRt = Math.atan2(this.y -pos.y, this.x - pos.x) - Math.PI/2
        this.setRotation(newRt)
    }
    setPosition(pos: Point) {
        this.x = pos.x
        this.y = pos.y
        this.updateRelativePositions()
    }
    private updateRelativePositions() {
        this.leftExtent= new Point(this.x + Math.cos(this.rotation)*this.size/2, this.y + Math.sin(this.rotation)*this.size/2)
        this.rightExtent= new Point(this.x - Math.cos(this.rotation)*this.size/2, this.y - Math.sin(this.rotation)*this.size/2)
        let normalRotation = this.rotation-Math.PI/2
        this.normalExtent = new Point(this.x + Math.cos(normalRotation)*rotaionHandleDistMult*this.size, this.y + Math.sin(normalRotation)*rotaionHandleDistMult*this.size)
        this.collider = new Line(this.leftExtent.x, this.leftExtent.y, this.rightExtent.x, this.rightExtent.y)
    }
    getBounceAngle(inAngle: number) {
        switch (this.type) {
            case ReflectionObjectType.Mirror:
            default:
                return 2*(this.rotation+Math.PI/2) - inAngle + Math.PI
        }
    }

    /* Mouse interactions */
    onMouseMove(pos: Point): boolean {
        if(this.mouseTrackingRotation) this.setRotationFromPos(pos)
        else this.onRtHandleHover = this.posOnRotationHandle(pos)

        if (this.mouseTrackingMovement) this.setPosition(pos)
        else this.onMoveHandleHover = this.posOnMovementHandle(pos)

        return this.mouseTrackingMovement || this.mouseTrackingRotation
    }
    onMouseDown(pos: Point) {
        this.mouseTrackingRotation = this.posOnRotationHandle(pos)
        this.mouseTrackingMovement = this.posOnMovementHandle(pos)
    }
    onMouseUp(pos: Point): boolean {
        if (this.mouseTrackingRotation) { 
            this.setRotationFromPos(pos)
            this.mouseTrackingRotation = false
            return true
        }
        if (this.mouseTrackingMovement) { 
            this.setPosition(pos)
            this.mouseTrackingMovement = false
            return true
        }
        return false
    }
    private posOnRotationHandle(pos: Point) {
        let dx = this.normalExtent.x - pos.x
        let dy = this.normalExtent.y - pos.y
        let dist =  Math.sqrt(dx*dx + dy*dy)
        return dist < objectHandleInteractionDistance
    }
    private posOnMovementHandle(pos: Point) {
        let dx = this.x - pos.x
        let dy = this.y - pos.y
        let dist =  Math.sqrt(dx*dx + dy*dy)
        return dist < objectHandleInteractionDistance
    }
}

class HouseObject {
    name: string
    type: HouseObjectType
    uv: Point = new Point()
    pos: Point = new Point()
    size: Point = new Point(100,100)
    centered: boolean

    colourImg: CanvasImageSource
    loadedColour: boolean = false
    greyImg: CanvasImageSource | null = null
    loadedGrey: boolean = false

    constructor(_name:string, _colourPath:string, _type:HouseObjectType, houseUV: Point, _greyPath:string='', _cenetered:boolean = false) {
        this.name = _name
        this.type = _type
        this.uv = houseUV
        this.size = houseObjectsSizes[_type] ? houseObjectsSizes[_type] : new Point(100,100)
        this.centered = _cenetered
        
        this.colourImg = new Image()
        this.colourImg.src = _colourPath
        this.colourImg.onload = () => { this.loadedColour = true; };
        this.colourImg.onerror = (e) => { console.error(this.name, ' Icon loading error: ', e); };

        if (_greyPath != '') {
            this.greyImg = new Image()
            this.greyImg.src = _greyPath
            this.greyImg.onload = () => { this.loadedGrey = true; };
            this.greyImg.onerror = (e) => { console.error(this.name, ' Icon loading error: ', e); };
        }
    }
    updateHousePosition(newPos: Point, roomSize: number) {
        this.pos = newPos
        if (this.centered){
            this.pos.x -= this.size.x/2*roomSize
            this.pos.y -= this.size.y/2*roomSize
        }
    }
    getCentrePos(roomSize:number = 100): Point {
        return this.centered ? new Point(this.pos.x+this.size.x/2*roomSize, this.pos.y+this.size.y/2*roomSize) : this.pos
    }
}  

export class Apartment {
    /* Variables */
    roomPlan: Array<Array<Rooms>>
    doorsHorizontal: Array<Array<number>>
    doorsVertical: Array<Array<number>>
    
    apartHeight: number = 0
    apartWidth: number = 0

    positionOriginX: number = 0
    positionOriginY: number = 0

    walls: Array<Line> = []
    reflectionObjects: Array<ReflectionObject> = []
    telly: HouseObject | null = null
    tellyVisible: boolean = false
    houseObjects: Array<HouseObject>

    screenWidth: number = -1
    screenHeight: number = -1

    roomSize: number = 100
    
    /* Constructor */
    constructor (roomPlan: Array<Array<Rooms>>, doorsHorz: Array<Array<number>>, doorsVert: Array<Array<number>>, houseObjects: Array<HouseObject>) {
        this.roomPlan = roomPlan
        this.doorsHorizontal = doorsHorz
        this.doorsVertical = doorsVert

        this.apartHeight = roomPlan.length;
        this.apartWidth = roomPlan[0]?.length ? roomPlan[0]?.length : 0;

        this.houseObjects = houseObjects;
        houseObjects.forEach(ho => { if (ho.type == HouseObjectType.Telly) this.telly = ho });
    }

    /* Ray casting */
    getRaycastCollisionPoint(originX: number, originY: number, angle: number, bounceDepth:number=0): Array<Point> {
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
            const hit = obj.collider.getRayIntersection(originX, originY, rayDirX, rayDirY)
            if (hit && hit.t < closestT && hit.t > 0.01 && bounceDepth < maximumBounceDepth) {
                let currentCollisionPoint: Array<Point> = [new Point(hit.x, hit.y)]
                let furtherCollisionPoints = this.getRaycastCollisionPoint(hit.x, hit.y, obj.getBounceAngle(angle), bounceDepth+1)
                return currentCollisionPoint.concat(furtherCollisionPoints)
            }
        }

        if (!this.tellyVisible && this.telly && this.isTellyVisibleFromRay(new Point(originX,originY), closestPoint, this.telly.size.x/3*this.roomSize)) this.tellyVisible = true
        return [closestPoint];
    }
    resetVisibilityData() {
        this.tellyVisible = false
    }
    isTellyVisibleFromRay(lineStart:Point, lineEnd:Point, minDist: number): boolean {
        if (!this.telly) return false;
        let tellyCentre = this.telly.getCentrePos(this.roomSize)

        // check line points are within point bounding box 
        if (lineStart.x > tellyCentre.x+minDist && lineEnd.x > tellyCentre.x+minDist) return false
        if (lineStart.y > tellyCentre.y+minDist && lineEnd.y > tellyCentre.y+minDist) return false
        if (lineStart.x < tellyCentre.x-minDist && lineEnd.x < tellyCentre.x-minDist) return false
        if (lineStart.y < tellyCentre.y-minDist && lineEnd.y < tellyCentre.y-minDist) return false

        // use equasion to find smallest distance of point to line
        let dy = lineStart.y - lineEnd.y
        let dx = lineEnd.x - lineStart.x
        let dist = Math.sqrt(dx*dx + dy*dy)
        let C = lineStart.x*lineEnd.y - lineEnd.x*lineStart.y
        let minDistToPoint = Math.abs(dy*tellyCentre.x + dx*tellyCentre.y + C) / dist
        return minDistToPoint <= minDist
    }

    /* Object placing */
    placeObject(objType: ReflectionObjectType, x:number, y:number): boolean {
        if (!this.positionWithinApartmentBounds(x,y)) return false
        this.reflectionObjects.push(new ReflectionObject(objType, x, y))
        return true
    }

    /* Wall generation */
    generateWallLines() {
        if (this.roomPlan === undefined|| this.roomPlan.length == 0) return; 
        this.walls = []

        for (let x=0; x<this.apartWidth; x++) {
            for (let y=0; y<this.apartHeight; y++) {
                let roomX = this.positionOriginX+x*this.roomSize
                let roomY = this.positionOriginY+y*this.roomSize
                let currentRoom = this.roomPlan[y]?.[x]
                
                if (currentRoom !== undefined && currentRoom != Rooms.None) {
                    if (x == 0 || this.roomPlan[y]?.[x-1] != currentRoom){
                        this.addNewWall( roomX,roomY,roomX, roomY+this.roomSize, this.doorsVertical[y]?.[x])
                    }
                    if (x == this.apartWidth-1 || this.roomPlan[y]?.[x+1] != currentRoom){
                        this.addNewWall( roomX+this.roomSize,roomY,roomX+this.roomSize, roomY+this.roomSize, this.doorsVertical[y]?.[x+1])
                    }
                    if (y == 0 || this.roomPlan[y-1]?.[x] != currentRoom){
                        this.addNewWall( roomX,roomY,roomX+this.roomSize, roomY, this.doorsHorizontal[y]?.[x])
                    }
                    if (y == this.apartHeight-1 || this.roomPlan[y+1]?.[x] != currentRoom){
                        this.addNewWall( roomX,roomY+this.roomSize,roomX+this.roomSize, roomY+this.roomSize, this.doorsHorizontal[y+1]?.[x])
                    }
                }
            }
        }
    }
    private addNewWall(x1: number, y1: number, x2: number, y2: number, hasDoor: number | undefined) {
        const doorStart = Math.max(doorPosition - doorSize/2, 0)
        const doorEnd = Math.min(doorPosition + doorSize/2, 1.0)

        if (hasDoor ? hasDoor == 1 : false) {
            this.walls.push( new Line(x1, y1, x1*(1-doorStart)+x2*doorStart, y1*(1-doorStart)+y2*doorStart) )
            this.walls.push( new Line(x1*(1-doorEnd)+x2*doorEnd, y1*(1-doorEnd)+y2*doorEnd, x2, y2) )
        } else {
            this.walls.push( new Line(x1,y1,x2,y2) )
        }
    }

    /* Render functions */
    draw(ctx: CanvasRenderingContext2D, greyscale: boolean) {
        if (!greyscale) this.drawObjects(ctx, greyscale)
        this.drawRooms(ctx, greyscale);
        if (greyscale) this.drawObjects(ctx, greyscale)
    }
    drawRooms(ctx: CanvasRenderingContext2D, greyscale: boolean) {
        if (!ctx) return;
        if (this.roomPlan === undefined|| this.roomPlan.length == 0) return; 
        
        for (let x=0; x<this.apartWidth; x++) {
            for (let y=0; y<this.apartHeight; y++) {
                
                /* Draw floor */
                let roomX = this.positionOriginX+x*this.roomSize
                let roomY = this.positionOriginY+y*this.roomSize
                ctx.beginPath();
                ctx.rect(roomX, roomY, this.roomSize * 1.01, this.roomSize * 1.01)
                let currentRoom = this.roomPlan[y]?.[x]

                let colour = 'pink'
                if (currentRoom == undefined || currentRoom == Rooms.None) colour = 'transparent'
                else if (greyscale) colour = 'grey'
                else if (roomColours[currentRoom]) colour = roomColours[currentRoom] 
                ctx.fillStyle = colour
                ctx.fill()
            }
        }
    }
    drawObjects(ctx: CanvasRenderingContext2D, greyscale: boolean = false) {
        if (!ctx) return;
        if (this.walls.length == 0) this.generateWallLines()
        
        /* Draw Reflection Objects */
        if (!greyscale) {
            this.reflectionObjects.forEach(obj => {
                obj.draw(ctx)
            });
        }
            
        /* Draw Walls */
        ctx.lineWidth = wallWidth
        ctx.strokeStyle = 'black'
        this.walls.forEach(line => {
            
            // fix wall corners
            let x1 = line.x1; let y1 = line.y1; let x2 = line.x2;let y2 = line.y2
            if (y1 == y2) { x1 -= wallWidth/2; x2 += wallWidth/2 }
            if (x1 == x2) { y1 -= wallWidth/2; y2 += wallWidth/2 }

            // draw line
            ctx.beginPath()
            ctx.moveTo(x1,y1)
            ctx.lineTo(x2,y2)
            ctx.stroke()
        });

        /* Draw House Objects */
        if (greyscale) {
            this.houseObjects.forEach(obj => {
                if (obj.loadedGrey && obj.greyImg) ctx.drawImage(obj.greyImg, obj.pos.x, obj.pos.y, obj.size.x*this.roomSize, obj.size.y*this.roomSize)
            });
        } else { // going in reverse order of array (for object on object keep ordering)
            for (let i=this.houseObjects.length-1; i>=0; i--) {
                let obj = this.houseObjects[i]
                if (obj && obj.loadedColour) {
                    ctx.drawImage(obj.colourImg, obj.pos.x, obj.pos.y, obj.size.x*this.roomSize, obj.size.y*this.roomSize)
                }
            }
        }

        /* Draw Reflection Objects */
        if (greyscale) {
            this.reflectionObjects.forEach(obj => {
                obj.draw(ctx)
            });
        }
    }

    /* Util */
    positionWithinApartmentBounds(x:number, y:number): boolean {
        if (x < this.positionOriginX || x > this.positionOriginX + this.apartWidth * this.roomSize) return false
        if (y < this.positionOriginY || y > this.positionOriginY + this.apartHeight * this.roomSize) return false
        return this.getRoomAtPos(x,y) != Rooms.None
    }
    getRoomAtPos(x:number,y:number): Rooms {
        let roomX = Math.floor((x-this.positionOriginX) / this.roomSize)
        let roomY = Math.floor((y-this.positionOriginY) / this.roomSize)
        if (roomX < 0 || roomX >= this.apartWidth || roomY < 0 || roomY >= this.apartHeight) return Rooms.None;
        let targetRoom = this.roomPlan[roomY]?.[roomX]
        return targetRoom ? targetRoom : Rooms.None
    }
    updateScreenSize(w: number, h:number) {
        if (this.screenWidth != w || this.screenHeight != h) {
            this.screenWidth = w
            this.screenHeight = h
            this.roomSize = Math.min(apartmentMaxScreenSizePercent*w / this.apartWidth, apartmentMaxScreenSizePercent*h / this.apartHeight)
            this.positionOriginX = this.screenWidth/2 - (this.apartWidth/2)*this.roomSize
            this.positionOriginY = this.screenHeight/2 - (this.apartHeight/2)*this.roomSize
            this.generateWallLines()
            this.houseObjects.forEach(ho => { ho.updateHousePosition(this.uvToWorld(ho.uv), this.roomSize) });
        }
    }
    isTellyVisible():boolean { return this.tellyVisible }
    uvToWorld(uv: Point): Point {
        return new Point(
            this.positionOriginX + uv.x*this.roomSize*this.apartWidth,
            this.positionOriginY + uv.y*this.roomSize*this.apartHeight
        )
    }

    /* Mouse interactions */
    onMouseDown(e: MouseEvent) {
        let mousePos = new Point(e.offsetX, e.offsetY)
        this.reflectionObjects.forEach(ro => { ro.onMouseDown(mousePos) });
    }
    onMouseUp(e: MouseEvent): boolean {
        let anyObjMoved = false
        let mousePos = new Point(e.offsetX, e.offsetY)
        let removeIdx = -1 // there should only be max 1 object to remove
        this.reflectionObjects.forEach((ro,i) => { 
            anyObjMoved = ro.onMouseUp(mousePos) || anyObjMoved;
            if (!this.positionWithinApartmentBounds(ro.x, ro.y)) removeIdx = i
        });
        if (removeIdx != -1) this.reflectionObjects.splice(removeIdx,1)
        return anyObjMoved
    }
    onMouseMove(e: MouseEvent): boolean {
        let objMoved = false
        let mousePos = new Point(e.offsetX, e.offsetY)
        this.reflectionObjects.forEach(ro => { objMoved ||= ro.onMouseMove(mousePos) });
        return objMoved
    }
}

/* Apartment 1 configuration */
const apartmentRoomPlan1: Array<Array<Rooms>> = [
    [ Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi ],
    [ Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi ],
    [ Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Livi ],
    [ Rooms.Livi, Rooms.Livi, Rooms.Livi, Rooms.Bed1, Rooms.Bed1 ],
    [ Rooms.Loo2, Rooms.Loo2, Rooms.Livi, Rooms.Bed1, Rooms.Bed1 ],
    [ Rooms.Loo2, Rooms.Loo2, Rooms.Prep, Rooms.Loo1, Rooms.Loo1 ],
]
const apartmentDoorsH1: Array<Array<number>> = [
    [ 0,0,0,0,0 ],
    [ 0,0,0,0,0 ],
    [ 0,0,0,0,0 ],
    [ 0,0,0,0,0 ],
    [ 0,0,0,0,0 ],
    [ 0,0,1,0,1 ],
    [ 0,0,1,0,0 ],
]
const apartmentDoorsV1: Array<Array<number>> = [
    [ 0,0,0,0,0,0 ],
    [ 0,0,0,0,0,0 ],
    [ 0,0,0,0,0,0 ],
    [ 0,0,0,1,0,0 ],
    [ 0,0,1,0,0,0 ],
    [ 0,0,0,0,0,0 ],
]

export const defaultTellyPos = new Point(0.8, 1/16)
let houseObjects: Array<HouseObject> = [
    new HouseObject('carpet', './images/carpet_col.png', HouseObjectType.Carpet, new Point(0.8,.2), './images/carpet_grey.png', true),
    new HouseObject('tv', './images/telly_col.png', HouseObjectType.Telly, defaultTellyPos, './images/telly_grey.png', true),
    new HouseObject('sofa', './images/sofa_col.png', HouseObjectType.Sofa, new Point(0.8,.3), './images/sofa_grey.png', true),
    new HouseObject('kitchen', './images/kitchen_col.png', HouseObjectType.Kitchen, new Point(0,0), './images/kitchen_grey.png'),
    new HouseObject('stairs', './images/stairs_col.png', HouseObjectType.Stairs, new Point(0,2.5/6), './images/stairs_grey.png'),
    new HouseObject('table', './images/table_col.png', HouseObjectType.Table, new Point(4.25/12,0), './images/table_grey.png'),
    new HouseObject('bed', './images/bed_col.png', HouseObjectType.Bed, new Point(1-1.75/6,.57), './images/bed_grey.png'),
    new HouseObject('bath', './images/bath_col.png', HouseObjectType.Bath, new Point(0,4.25/6), './images/bath_grey.png'),
    // new HouseObject('toilet', './images/toilet_col.png', HouseObjectType.Toilet, new Point(0.8,.3), './images/toilet_grey.png'),
    // new HouseObject('faucet', './images/faucet_col.png', HouseObjectType.Faucet, new Point(0.8,.3), './images/faucet_grey.png'),
    // new HouseObject('toilet2', './images/toilet_col_rt.png', HouseObjectType.Toilet, new Point(0.8,.3), './images/toilet_grey_rt.png'),
    // new HouseObject('faucet2', './images/faucet_col_rt.png', HouseObjectType.Faucet, new Point(0.8,.3), './images/faucet_grey_rt.png'),
]
export let apartment = new Apartment(apartmentRoomPlan1,apartmentDoorsH1,apartmentDoorsV1,houseObjects)
