export declare enum Rooms {
    None = 0,
    Livi = 1,
    Kitc = 2,
    Corr = 3,
    Loo1 = 4,
    Loo2 = 5,
    Bed1 = 6,
    Bed2 = 7,
    Bed3 = 8
}
export declare const roomSize = 125;
export declare enum ObjectType {
    Mirror = 0
}
export declare class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
}
declare class Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    constructor(x1?: number, y1?: number, x2?: number, y2?: number);
    getIntersection(rayOriginX: number, rayOriginY: number, rayDirX: number, rayDirY: number): {
        t: number;
        x: number;
        y: number;
    } | null;
}
declare class ReflectionObject {
    type: ObjectType;
    x: number;
    y: number;
    rotation: number;
    size: number;
    collider: Line;
    leftExtent: Point;
    rightExtent: Point;
    normalExtent: Point;
    mouseTrackingRotation: boolean;
    mouseTrackingMovement: boolean;
    onRtHandleHover: boolean;
    onMoveHandleHover: boolean;
    constructor(type: ObjectType, x: number, y: number);
    draw(ctx: CanvasRenderingContext2D): void;
    setRotation(rt: number): void;
    setRotationFromPos(pos: Point): void;
    setPosition(pos: Point): void;
    private updateRelativePositions;
    getBounceAngle(inAngle: number): number;
    onMouseMove(pos: Point): void;
    onMouseDown(pos: Point): void;
    onMouseUp(pos: Point): boolean;
    private posOnRotationHandle;
    private posOnMovementHandle;
}
export declare class Apartment {
    roomPlan: Array<Array<Rooms>>;
    doorsHorizontal: Array<Array<number>>;
    doorsVertical: Array<Array<number>>;
    apartHeight: number;
    apartWidth: number;
    positionOriginX: number;
    positionOriginY: number;
    walls: Array<Line>;
    reflectionObjects: Array<ReflectionObject>;
    screenWidth: number;
    screenHeight: number;
    constructor(roomPlan: Array<Array<Rooms>>, doorsHorz: Array<Array<number>>, doorsVert: Array<Array<number>>);
    getRaycastCollisionPoint(originX: number, originY: number, angle: number, bounceDepth?: number): Array<Point>;
    placeObject(objType: ObjectType, x: number, y: number): boolean;
    generateWallLines(): void;
    private addNewWall;
    drawRooms(ctx: CanvasRenderingContext2D, greyscale: boolean): void;
    drawWalls(ctx: CanvasRenderingContext2D): void;
    positionWithinApartmentBounds(x: number, y: number): boolean;
    getRoomAtPos(x: number, y: number): Rooms;
    updateScreenSize(w: number, h: number): void;
    onMouseDown(e: MouseEvent): void;
    onMouseUp(e: MouseEvent): boolean;
    onMouseMove(e: MouseEvent): void;
}
export declare let apartment: Apartment;
export {};
//# sourceMappingURL=rooms.d.ts.map