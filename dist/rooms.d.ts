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
    constructor(x1: number, y1: number, x2: number, y2: number);
    getIntersection(rayOriginX: number, rayOriginY: number, rayDirX: number, rayDirY: number): {
        t: number;
        x: number;
        y: number;
    } | null;
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
    constructor(roomPlan: Array<Array<Rooms>>, doorsHorz: Array<Array<number>>, doorsVert: Array<Array<number>>);
    getRaycastCollisionPoint(originX: number, originY: number, angle: number): Point;
    generateWallLines(): void;
    private addNewWall;
    drawRooms(ctx: CanvasRenderingContext2D, width: number, height: number, greyscale: boolean): void;
    drawWalls(ctx: CanvasRenderingContext2D): void;
}
export declare let apartment: Apartment;
export {};
//# sourceMappingURL=rooms.d.ts.map