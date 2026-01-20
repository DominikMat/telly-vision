import { ReflectionObjectType, Point, Apartment } from "./rooms.js";
export declare class Level {
    pathPoints: Array<Point>;
    pathControlPoints: Array<Point>;
    maxAvailableReflectionObject: ReflectionObjectType;
    tellyPos: Point;
    constructor(pathPoints: Array<Point>, maxAvailableReflectionObject: ReflectionObjectType, tellyPos: Point, pathControlPoints?: Array<Point>);
    drawCleaningPath(ctx: CanvasRenderingContext2D, apartment: Apartment): void;
    getRaycastPosition(progress: number, apartment: Apartment): Point;
}
export declare class LevelManager {
    levels: Array<Level>;
    selectedLevel: number;
    unlockedLevels: number;
    constructor(lvls: Array<Level>);
    getFirst(): Level | null;
    getCurrentLevel(): Level | null | undefined;
    getCurrentLevelIdx(): number;
    getPrevLevel(): Level | undefined;
    getNextLevel(): Level | undefined;
    unlockNextLevel(): void;
    isPrevLevelUnlocked(): boolean;
    isNextLevelUnlocked(): boolean;
    changeCurrentLevel(dir: number): Level | undefined;
}
export declare let levelManager: LevelManager;
//# sourceMappingURL=levels.d.ts.map