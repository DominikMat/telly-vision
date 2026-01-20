export declare class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
}
export declare enum Rooms {
    None = 0,
    Livi = 1,
    Kitc = 2,
    Corr = 3,
    Loo1 = 4,
    Loo2 = 5,
    Bed1 = 6,
    Bed2 = 7,
    Bed3 = 8,
    Prep = 9
}
export declare enum ReflectionObjectType {
    Mirror = 0
}
export declare enum HouseObjectType {
    Telly = 0,
    Sofa = 1
}
declare class Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dy: number;
    dx: number;
    C: number;
    dist: number;
    constructor(x1?: number, y1?: number, x2?: number, y2?: number);
    getRayIntersection(rayOriginX: number, rayOriginY: number, rayDirX: number, rayDirY: number): {
        t: number;
        x: number;
        y: number;
    } | null;
}
declare class ReflectionObject {
    type: ReflectionObjectType;
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
    constructor(type: ReflectionObjectType, x: number, y: number);
    draw(ctx: CanvasRenderingContext2D): void;
    setRotation(rt: number): void;
    setRotationFromPos(pos: Point): void;
    setPosition(pos: Point): void;
    private updateRelativePositions;
    getBounceAngle(inAngle: number): number;
    onMouseMove(pos: Point): boolean;
    onMouseDown(pos: Point): void;
    onMouseUp(pos: Point): boolean;
    private posOnRotationHandle;
    private posOnMovementHandle;
}
declare class HouseObject {
    name: string;
    type: HouseObjectType;
    uv: Point;
    pos: Point;
    size: Point;
    colourImg: CanvasImageSource;
    loadedColour: boolean;
    greyImg: CanvasImageSource | null;
    loadedGrey: boolean;
    constructor(_name: string, _colourPath: string, _type: HouseObjectType, houseUV: Point, _greyPath?: string);
    updateHousePosition(newPos: Point): void;
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
    telly: HouseObject | null;
    tellyVisible: boolean;
    houseObjects: Array<HouseObject>;
    screenWidth: number;
    screenHeight: number;
    roomSize: number;
    constructor(roomPlan: Array<Array<Rooms>>, doorsHorz: Array<Array<number>>, doorsVert: Array<Array<number>>, houseObjects: Array<HouseObject>);
    getRaycastCollisionPoint(originX: number, originY: number, angle: number, bounceDepth?: number): Array<Point>;
    resetVisibilityData(): void;
    isTellyVisibleFromRay(lineStart: Point, lineEnd: Point, minDist: number): boolean;
    placeObject(objType: ReflectionObjectType, x: number, y: number): boolean;
    generateWallLines(): void;
    private addNewWall;
    draw(ctx: CanvasRenderingContext2D, greyscale: boolean): void;
    drawRooms(ctx: CanvasRenderingContext2D, greyscale: boolean): void;
    drawObjects(ctx: CanvasRenderingContext2D, greyscale?: boolean): void;
    positionWithinApartmentBounds(x: number, y: number): boolean;
    getRoomAtPos(x: number, y: number): Rooms;
    updateScreenSize(w: number, h: number): void;
    isTellyVisible(): boolean;
    uvToWorld(uv: Point): Point;
    onMouseDown(e: MouseEvent): void;
    onMouseUp(e: MouseEvent): boolean;
    onMouseMove(e: MouseEvent): boolean;
}
export declare const defaultTellyPos: Point;
export declare let apartment: Apartment;
export {};
//# sourceMappingURL=rooms.d.ts.map