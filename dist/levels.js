import { ReflectionObjectType, Point, Apartment, defaultTellyPos, apartment } from "./rooms.js";
export class Level {
    pathPoints;
    pathControlPoints;
    maxAvailableReflectionObject = ReflectionObjectType.Mirror;
    tellyPos;
    constructor(pathPoints, maxAvailableReflectionObject, tellyPos, pathControlPoints = []) {
        this.pathPoints = pathPoints;
        this.maxAvailableReflectionObject = maxAvailableReflectionObject;
        this.tellyPos = tellyPos;
        this.pathControlPoints = pathControlPoints;
    }
    drawCleaningPath(ctx, apartment) {
        if (!ctx || this.pathPoints.length == 0)
            return;
        /* Draw poitns */
        ctx.beginPath();
        this.pathPoints.forEach(uv => {
            let p = apartment.uvToWorld(uv);
            ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
        });
        ctx.fillStyle = 'orange';
        ctx.fill();
        /* Draw line */
        ctx.beginPath();
        if (this.pathPoints[0]) {
            let initP = apartment.uvToWorld(this.pathPoints[0]);
            ctx.moveTo(initP.x, initP.y);
        }
        for (let i = 1; i < this.pathPoints.length; i++) {
            let p = this.pathPoints[i];
            if (!p)
                continue;
            p = apartment.uvToWorld(p);
            if ((i - 1) < this.pathControlPoints.length) {
                let cp = this.pathControlPoints[i - 1];
                if (!cp)
                    continue;
                cp = apartment.uvToWorld(cp);
                ctx.quadraticCurveTo(cp.x, cp.y, p.x, p.y);
            }
            else
                ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'orange';
        //ctx.strokeStyle = 'dashed'
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    getRaycastPosition(progress, apartment) {
        progress = Math.max(0, Math.min(1, progress)); // clamp t 0-1
        let pathIdx = Math.floor(progress * (this.pathPoints.length - 1));
        if (pathIdx == this.pathPoints.length - 1)
            return this.pathPoints[pathIdx] ? this.pathPoints[pathIdx] : new Point();
        // get left and right points
        let p1 = this.pathPoints[pathIdx];
        let p2 = this.pathPoints[pathIdx + 1];
        if (!p1 || !p2)
            return new Point();
        p1 = apartment.uvToWorld(p1);
        p2 = apartment.uvToWorld(p2);
        let t = progress * (this.pathPoints.length - 1) - pathIdx; // find progress btw points
        let invT = (1 - t);
        // if no controls return lerp
        if (pathIdx >= this.pathControlPoints.length) {
            return new Point(p1.x * invT + p2.x * t, p1.y * invT + p2.y * t);
        }
        // quadratic curve - triple lerp
        else {
            let cp = this.pathControlPoints[pathIdx];
            if (!cp)
                return new Point();
            cp = apartment.uvToWorld(cp);
            let lerpL = new Point(p1.x * invT + cp.x * t, p1.y * invT + cp.y * t);
            let lertR = new Point(cp.x * invT + p2.x * t, cp.y * invT + p2.y * t);
            return new Point(lerpL.x * invT + lertR.x * t, lerpL.y * invT + lertR.y * t);
        }
    }
    getFirstPathPoint() {
        if (!this.pathPoints || this.pathPoints.length == 0)
            return new Point();
        let p = this.pathPoints[0];
        return p ? p : new Point();
    }
}
export class LevelManager {
    levels;
    selectedLevel = 0;
    unlockedLevels = 1;
    constructor(lvls) {
        this.levels = lvls;
    }
    getFirst() {
        if (this.levels.length > 0)
            return this.levels[0] ? this.levels[0] : null;
        else
            return null;
    }
    getCurrentLevel() {
        if (this.selectedLevel < this.levels.length)
            return this.levels[this.selectedLevel];
        else
            return null;
    }
    getCurrentLevelIdx() { return this.selectedLevel; }
    getPrevLevel() {
        this.selectedLevel = (this.selectedLevel + this.levels.length - 1) % this.levels.length;
        return this.levels[this.selectedLevel];
    }
    getNextLevel() {
        this.selectedLevel = (this.selectedLevel + 1) % this.levels.length;
        return this.levels[this.selectedLevel];
    }
    unlockNextLevel() {
        this.unlockedLevels = Math.min(this.unlockedLevels + 1, this.levels.length);
    }
    isPrevLevelUnlocked() {
        return this.selectedLevel - 1 >= 0;
    }
    isNextLevelUnlocked() {
        return this.unlockedLevels > (this.selectedLevel + 1);
    }
    changeCurrentLevel(dir) {
        if (dir == 1 && this.isNextLevelUnlocked())
            this.selectedLevel += 1;
        if (dir == -1 && this.selectedLevel > 0)
            this.selectedLevel -= 1;
        return this.levels[this.selectedLevel];
    }
}
/* cleaning paths */
let corridorPath = [new Point(0.6, 0.9), new Point(0.6, 0.4)];
let leftToCorridorPath = [new Point(0.3, 0.95), new Point(0.6, 0.4)];
let leftToCorridorPathControl = [new Point(0.6, 0.95)];
/* Level Data */
let createdLevels = [
    new Level(corridorPath, ReflectionObjectType.Mirror, defaultTellyPos),
    new Level(leftToCorridorPath, ReflectionObjectType.Mirror, defaultTellyPos, leftToCorridorPathControl),
];
export let levelManager = new LevelManager(createdLevels);
//# sourceMappingURL=levels.js.map