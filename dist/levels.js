import { ReflectionObjectType, Point, Apartment, defaultTellyPos, apartment } from "./rooms.js";
const defaultMinimumScore = 0.85;
export class Level {
    pathPoints;
    pathControlPoints;
    maxAvailableReflectionObject = ReflectionObjectType.Mirror;
    tellyPos;
    minScore;
    constructor(pathPoints, maxAvailableReflectionObject, tellyPos, pathControlPoints = [], minScore = defaultMinimumScore) {
        this.pathPoints = pathPoints;
        this.maxAvailableReflectionObject = maxAvailableReflectionObject;
        this.tellyPos = tellyPos;
        this.pathControlPoints = pathControlPoints;
        this.minScore = minScore;
    }
    drawCleaningPath(ctx, apartment) {
        if (!ctx || this.pathPoints.length == 0)
            return;
        /* Draw poitns */
        ctx.fillStyle = 'white';
        this.pathPoints.forEach(uv => {
            let p = apartment.uvToWorld(uv);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
            ctx.fill();
        });
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
        ctx.strokeStyle = 'white';
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
    getMinimumScore() { return this.minScore; }
}
export class LevelManager {
    levels;
    selectedLevel = 0;
    unlockedLevels = 1;
    constructor(lvls) {
        this.levels = lvls;
    }
    getCurrentLevel() {
        if (this.selectedLevel < this.levels.length)
            return this.levels[this.selectedLevel];
        else
            return null;
    }
    getCurrentLevelIdx() { return this.selectedLevel; }
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
// level 1
const lvl1Path = [
    new Point(0.8515456506110712, 0.293314162473041),
    new Point(0.7264557872034508, 0.15672178289000718),
    new Point(0.49352983465133, 0.45419122933141624),
    new Point(0.20452911574406904, 0.1621135873472322),
];
const lvl1Ctrl = [
    new Point(0.8968368080517614, 0.1585190510424155),
    new Point(0.58862688713156, 0.17828900071890724),
    new Point(0.2304097771387491, 0.34184040258806614),
];
// level 2
const lvl2Path = [
    new Point(0.20452911574406904, 0.1621135873472322),
    new Point(0.49352983465133, 0.45419122933141624),
    new Point(0.5025555839509328, 0.9482920180594598),
];
const lvl2Ctrl = [
    new Point(0.4361104012266803, 0.21995059204361533),
    new Point(0.5715563506261181, 0.699122582843513),
];
// level 3
const lvl3Path = [
    new Point(0.5025555839509328, 0.9482920180594598),
    new Point(0.27255302836698186, 0.7544935684470568),
    new Point(0.27255302836698186, 0.92699548513502),
];
const lvl3Ctrl = [
    new Point(.5434449271658573, 0.6820853565039612),
    new Point(0.12432915921288015, 0.8545872731919243),
];
// level 4
const lvl4Path = [
    new Point(0.27255302836698186, 0.92699548513502),
    new Point(0.5025555839509328, 0.6948632762586251),
    new Point(0.6664226031527263, 0.6231802911534154),
    new Point(0.8066700741119345, 0.7800494079563847),
    new Point(0.6967799642218246, 0.9120879120879121),
];
const lvl4Ctrl = [
    new Point(0.2597751086123179, 0.7331970355226168),
    new Point(0.5281114234602606, 0.5393985859102138),
    new Point(0.6431127012522362, 0.7864383678337167),
    new Point(0.9651162790697674, 0.9631995911065678),
];
// halftime
const halftime1Path = [
    new Point(0.6967799642218246, 0.9120879120879121),
    new Point(0.8066700741119345, 0.7800494079563847),
    new Point(0.6664226031527263, 0.6231802911534154),
    new Point(0.6507794531050345, 0.42439730811823834),
    new Point(1.1465627395859954, 0.40948973507113046),
];
const halftime1Ctrl = [
    new Point(0.9651162790697674, 0.9631995911065678),
    new Point(0.6431127012522362, 0.7864383678337167),
    new Point(0.36710963455149503, 0.48615725359911405),
    new Point(0.8271147457193968, 0.435045574580458),
];
/* Level Data */
let createdLevels = [
    new Level(lvl1Path, ReflectionObjectType.Mirror, defaultTellyPos, lvl1Ctrl),
    new Level(lvl2Path, ReflectionObjectType.Mirror, defaultTellyPos, lvl2Ctrl),
    new Level(lvl3Path, ReflectionObjectType.Mirror, defaultTellyPos, lvl3Ctrl),
    new Level(lvl4Path, ReflectionObjectType.Mirror, defaultTellyPos, lvl4Ctrl),
    new Level(halftime1Path, ReflectionObjectType.Mirror, defaultTellyPos, halftime1Ctrl),
];
export let levelManager = new LevelManager(createdLevels);
//# sourceMappingURL=levels.js.map