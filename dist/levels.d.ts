import { ReflectionObjectType, Point, Apartment } from "./rooms.js";
export declare class Level {
    pathPoints: Array<Point>;
    pathControlPoints: Array<Point>;
    maxAvailableReflectionObject: ReflectionObjectType;
    tellyPos: Point;
    minScore: number;
    constructor(pathPoints: Array<Point>, maxAvailableReflectionObject: ReflectionObjectType, tellyPos: Point, pathControlPoints?: Array<Point>, minScore?: number);
    drawCleaningPath(ctx: CanvasRenderingContext2D, apartment: Apartment): void;
    getRaycastPosition(progress: number, apartment: Apartment): Point;
    getFirstPathPoint(): Point;
    getMinimumScore(): number;
}
export declare class LevelManager {
    levels: Array<Level>;
    selectedLevel: number;
    unlockedLevels: number;
    constructor(lvls: Array<Level>);
    getCurrentLevel(): Level | null | undefined;
    getCurrentLevelIdx(): number;
    unlockNextLevel(): void;
    isPrevLevelUnlocked(): boolean;
    isNextLevelUnlocked(): boolean;
    changeCurrentLevel(dir: number): Level | undefined;
}
export declare let levelManager: LevelManager;
//# sourceMappingURL=levels.d.ts.map