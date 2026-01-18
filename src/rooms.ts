
export enum Rooms { None, Livi, Kitc, Corr, Loo1, Loo2, Bed1, Bed2, Bed3 }
export const roomSize = 125;

const doorSize = 0.2
const doorPosition = 0.5
const wallWidth = 5

const maximumBounceDepth = 3

const degToRad = 2*Math.PI/360

const rotationHandleArcSpan = 45 * degToRad
const rotaionHandleDistMult = 0.67

export enum ObjectType { Mirror }

const roomColours: Array<string> = [
    /* None */ 'transparent',
    /* Living Room */ 'pink',
    /* Kitchen */ 'blue',
    /* Corridor  */ 'yellow',
    /* Loo 1*/ 'skyblue',
    /* Loo 2*/ 'skyblue',
    /* Bedroom 1 */ 'red',
    /* Bedroom 2 */ 'purple',
    /* Bedroom 3 */ 'orange',
]

export class Point {
    x: number = 0
    y: number = 0
    constructor( x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }
}

class Line {
    x1: number; y1: number; x2: number; y2: number;

    constructor(x1: number=0, y1: number=0, x2: number=0, y2: number=0) {
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
    }

    // Returns the distance 't' if hit, or null if miss
    getIntersection(rayOriginX: number, rayOriginY: number, rayDirX: number, rayDirY: number): { t: number, x: number, y: number } | null {
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
    type: ObjectType
    x: number
    y: number
    rotation: number = 0 * degToRad
    size: number = 100
    collider: Line = new Line()
    leftExtent: Point = new Point()
    rightExtent: Point = new Point()
    normalExtent: Point = new Point()
    
    constructor (type: ObjectType, x: number, y: number) {
        this.type = type
        this.x = x
        this.y = y
        this.updatePositions()
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
        ctx.lineWidth = 5
        ctx.stroke()

        /* rotation handle */
        let normalRotation = this.rotation-Math.PI/2
        ctx.beginPath()
        ctx.moveTo(this.x,this.y)
        ctx.lineTo(this.normalExtent.x, this.normalExtent.y)
        ctx.strokeStyle = 'grey'
        ctx.globalAlpha = 0.35
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.globalAlpha = 1.0
        
        ctx.beginPath()
        ctx.lineWidth = 4
        ctx.arc(this.x,this.y, rotaionHandleDistMult*this.size, normalRotation-rotationHandleArcSpan/2, normalRotation+rotationHandleArcSpan/2)
        ctx.stroke()
    }
    setRotation(rt: number) {
        this.rotation = rt
        this.updatePositions()
    }

    private updatePositions() {
        this.leftExtent= new Point(this.x + Math.cos(this.rotation)*this.size/2, this.y + Math.sin(this.rotation)*this.size/2)
        this.rightExtent= new Point(this.x - Math.cos(this.rotation)*this.size/2, this.y - Math.sin(this.rotation)*this.size/2)
        let normalRotation = this.rotation-Math.PI/2
        this.normalExtent = new Point(this.x + Math.cos(normalRotation)*rotaionHandleDistMult*this.size, this.y + Math.sin(normalRotation)*rotaionHandleDistMult*this.size)
        this.collider = new Line(this.leftExtent.x, this.leftExtent.y, this.rightExtent.x, this.rightExtent.y)
    }
    getBounceAngle(inAngle: number) {
        switch (this.type) {
            case ObjectType.Mirror:
            default:
                return 2*(this.rotation+Math.PI/2) - inAngle + Math.PI
        }
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
    
    /* Constructor */
    constructor (roomPlan: Array<Array<Rooms>>, doorsHorz: Array<Array<number>>, doorsVert: Array<Array<number>>) {
        this.roomPlan = roomPlan
        this.doorsHorizontal = doorsHorz
        this.doorsVertical = doorsVert

        this.apartHeight = roomPlan.length;
        this.apartWidth = roomPlan[0]?.length ? roomPlan[0]?.length : 0;
    }

    /* Wall collision */
    getRaycastCollisionPoint(originX: number, originY: number, angle: number, bounceDepth:number=0): Array<Point> {
        // 1. Calculate Unit Vector for the Ray
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);

        let closestT = Infinity;
        let closestPoint = new Point(originX + rayDirX * 10000, originY + rayDirY * 10000); // Default far away

        // 2. Check every wall
        for (const wall of this.walls) {
            const hit = wall.getIntersection(originX, originY, rayDirX, rayDirY);
            
            // 3. Keep the smallest 't' (closest distance)
            if (hit && hit.t < closestT && hit.t > 0.01) {
                closestT = hit.t;
                closestPoint.x = hit.x;
                closestPoint.y = hit.y;
            }
        }
        for (const obj of this.reflectionObjects) {
            const hit = obj.collider.getIntersection(originX, originY, rayDirX, rayDirY)
            if (hit && hit.t < closestT && hit.t > 0.01 && bounceDepth < maximumBounceDepth) {
                let currentCollisionPoint: Array<Point> = [new Point(hit.x, hit.y)]
                let furtherCollisionPoints = this.getRaycastCollisionPoint(hit.x, hit.y, obj.getBounceAngle(angle), bounceDepth+1)
                return currentCollisionPoint.concat(furtherCollisionPoints)
            }
        }

        return [closestPoint];
    }

    /* Object placing */
    placeObject(objType: ObjectType, x:number, y:number): boolean {
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
                let roomX = this.positionOriginX+x*roomSize
                let roomY = this.positionOriginY+y*roomSize
                let currentRoom = this.roomPlan[y]?.[x]
                
                if (currentRoom !== undefined && currentRoom != Rooms.None) {
                    if (x == 0 || this.roomPlan[y]?.[x-1] != currentRoom){
                        this.addNewWall( roomX,roomY,roomX, roomY+roomSize, this.doorsVertical[y]?.[x])
                    }
                    if (x == this.apartWidth-1 || this.roomPlan[y]?.[x+1] != currentRoom){
                        this.addNewWall( roomX+roomSize,roomY,roomX+roomSize, roomY+roomSize, this.doorsVertical[y]?.[x+1])
                    }
                    if (y == 0 || this.roomPlan[y-1]?.[x] != currentRoom){
                        this.addNewWall( roomX,roomY,roomX+roomSize, roomY, this.doorsHorizontal[y]?.[x])
                    }
                    if (y == this.apartHeight-1 || this.roomPlan[y+1]?.[x] != currentRoom){
                        this.addNewWall( roomX,roomY+roomSize,roomX+roomSize, roomY+roomSize, this.doorsHorizontal[y+1]?.[x])
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
    drawRooms(ctx: CanvasRenderingContext2D, width:number, height:number, greyscale: boolean) {
        if (!ctx) return;
        if (this.roomPlan === undefined|| this.roomPlan.length == 0) return; 

        
        this.positionOriginX = width/2 - (this.apartWidth/2)*roomSize
        this.positionOriginY = height/2 - (this.apartHeight/2)*roomSize
        
        for (let x=0; x<this.apartWidth; x++) {
            for (let y=0; y<this.apartHeight; y++) {
                
                /* Draw floor */
                let roomX = this.positionOriginX+x*roomSize
                let roomY = this.positionOriginY+y*roomSize
                ctx.beginPath();
                ctx.rect(roomX, roomY, roomSize * 1.01, roomSize * 1.01)
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
    drawWalls(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;
        if (this.walls.length == 0) this.generateWallLines()
        
        ctx.lineWidth = wallWidth
        ctx.strokeStyle = 'black'

        /* Draw Walls */
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

        /* Draw Objects */
        this.reflectionObjects.forEach(obj => {
            obj.draw(ctx)
        });
    }

    /* Util */
    positionWithinApartmentBounds(x:number, y:number): boolean {
        if (x < this.positionOriginX || x > this.positionOriginX + this.apartWidth * roomSize) return false
        if (y < this.positionOriginY || y > this.positionOriginY + this.apartHeight * roomSize) return false
        return this.getRoomAtPos(x,y) != Rooms.None
    }
    getRoomAtPos(x:number,y:number): Rooms {
        let roomX = Math.floor((x-this.positionOriginX) / roomSize)
        let roomY = Math.floor((y-this.positionOriginY) / roomSize)
        if (roomX < 0 || roomX >= this.apartWidth || roomY < 0 || roomY >= this.apartHeight) return Rooms.None;
        let targetRoom = this.roomPlan[roomY]?.[roomX]
        return targetRoom ? targetRoom : Rooms.None
    }
}

/* Apartment 1 configuration */
const apartmentRoomPlan1: Array<Array<Rooms>> = [
    [ Rooms.Kitc, Rooms.Kitc, Rooms.Corr, Rooms.None ],
    [ Rooms.Bed1, Rooms.Bed1, Rooms.Corr, Rooms.None ],
    [ Rooms.Livi, Rooms.Livi, Rooms.Corr, Rooms.Loo1 ],
    [ Rooms.Livi, Rooms.Livi, Rooms.Corr, Rooms.Loo1 ],
]
const apartmentDoorsH1: Array<Array<number>> = [
    [ 0,0,0,0 ],
    [ 0,0,0,0 ],
    [ 0,0,0,0 ],
    [ 0,0,0,0 ],
    [ 0,0,1,0 ],
]
const apartmentDoorsV1: Array<Array<number>> = [
    [ 0,0,1,0,0 ],
    [ 0,0,1,0,0 ],
    [ 0,0,0,1,0 ],
    [ 0,0,1,0,0 ],
]
export let apartment = new Apartment(apartmentRoomPlan1,apartmentDoorsH1,apartmentDoorsV1)
