import { Point, Apartment, ReflectionObjectType } from "./rooms.js";
export declare class Icon {
    name: string;
    path: string;
    loaded: boolean;
    displayImg: CanvasImageSource;
    tag: ReflectionObjectType;
    constructor(_name: string, _path: string, _tag: ReflectionObjectType);
}
export declare class IconPanel {
    screenWidth: number;
    screenHeight: number;
    xPosMiddle: number;
    selectedIcon: number;
    icons: Array<Icon>;
    constructor(icons: Array<Icon>);
    processClick(x: number, y: number, apartment: Apartment): boolean;
    processMouseMove(x: number, y: number, canvasElement: HTMLCanvasElement): void;
    drawPanel(ctx: CanvasRenderingContext2D): void;
    drawMousePreview(ctx: CanvasRenderingContext2D, x: number, y: number): void;
    updateIconPanelPosition(apartment: Apartment): void;
    updateScreenSize(w: number, h: number): void;
    getIconPos(i: number): Point;
    getIconAtPos(x: number, y: number): number;
}
//# sourceMappingURL=iconPanel.d.ts.map