import { Point, Apartment, ReflectionObjectType } from "./rooms.js";
/* icons */
const iconPanelWidth = 100;
const iconPanelHeightPercent = 0.5;
const iconSize = iconPanelWidth * 0.8;
const cursorIconPreviewAlpha = 0.33;
export class Icon {
    name;
    path;
    loaded;
    displayImg;
    tag;
    constructor(_name, _path, _tag) {
        this.name = _name;
        this.path = _path;
        this.tag = _tag;
        this.loaded = false;
        this.displayImg = new Image();
        this.displayImg.src = _path;
        this.displayImg.onload = () => { this.loaded = true; };
        this.displayImg.onerror = (e) => { console.error(this.name, ' Icon loading error: ', e); };
    }
}
export class IconPanel {
    screenWidth = 0;
    screenHeight = 0;
    xPosMiddle = 0;
    selectedIcon = -1;
    icons;
    constructor(icons) {
        this.icons = icons;
    }
    /* Interaction */
    processClick(x, y, apartment) {
        /* unclick and place obj on map */
        if (this.selectedIcon != -1) {
            const icon = this.icons[this.selectedIcon];
            this.selectedIcon = -1; // deselect obj even if placing unsuccessful
            if (icon && apartment.placeObject(icon.tag, x, y)) {
                return true;
            }
        }
        /* check if new obj click */
        else {
            let iconAtPos = this.getIconAtPos(x, y);
            if (iconAtPos != -1) {
                this.selectedIcon = iconAtPos;
                return true;
            }
        }
        return false;
    }
    processMouseMove(x, y, canvasElement) {
        let iconAtPos = this.getIconAtPos(x, y);
        if (canvasElement)
            canvasElement.style.cursor = iconAtPos != -1 ? 'pointer' : 'default';
    }
    /* Drawing functions */
    drawPanel(ctx) {
        if (!ctx)
            return;
        /* Icon Panel */
        ctx.beginPath();
        ctx.arc(this.xPosMiddle, iconPanelHeightPercent / 2 * this.screenHeight, iconPanelWidth / 2, Math.PI, 2 * Math.PI);
        ctx.lineTo(this.xPosMiddle + iconPanelWidth / 2, (1 - iconPanelHeightPercent / 2) * this.screenHeight);
        ctx.arc(this.xPosMiddle, (1 - iconPanelHeightPercent / 2) * this.screenHeight, iconPanelWidth / 2, 0, Math.PI);
        ctx.lineTo(this.xPosMiddle - iconPanelWidth / 2, iconPanelHeightPercent / 2 * this.screenHeight);
        ctx.fillStyle = '#00000069';
        ctx.fill();
        /* draw icons */
        this.icons.forEach((icon, i) => {
            if (icon.loaded) {
                let iconPos = this.getIconPos(i);
                ctx.drawImage(icon.displayImg, iconPos.x, iconPos.y, iconSize, iconSize);
                // draw outline if selected
                if (i == this.selectedIcon) {
                    ctx.beginPath();
                    ctx.rect(iconPos.x, iconPos.y, iconSize, iconSize);
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });
    }
    drawMousePreview(ctx, x, y) {
        if (!ctx)
            return;
        /* draw mouse icon preview */
        if (this.selectedIcon != -1) {
            const icon = this.icons[this.selectedIcon];
            if (icon && icon.loaded) {
                ctx.globalAlpha = cursorIconPreviewAlpha;
                ctx.drawImage(icon.displayImg, x, y, iconSize, iconSize);
                ctx.globalAlpha = 1.0;
            }
        }
    }
    /* Util */
    updateIconPanelPosition(apartment) {
        this.xPosMiddle = apartment.positionOriginX - iconPanelWidth;
    }
    updateScreenSize(w, h) {
        this.screenWidth = w;
        this.screenHeight = h;
    }
    getIconPos(i) {
        return new Point(this.xPosMiddle - iconSize / 2, this.screenHeight * iconPanelHeightPercent / 2 + i * iconSize);
    }
    getIconAtPos(x, y) {
        if (x < this.xPosMiddle - iconPanelWidth / 2 || x > this.xPosMiddle + iconPanelWidth / 2)
            return -1;
        let yStart = (1 - iconPanelHeightPercent) / 2 * this.screenHeight;
        if (y < (1 - iconPanelHeightPercent) / 2 * this.screenHeight || y > yStart + this.icons.length * iconSize)
            return -1;
        return Math.floor((y - yStart) / iconSize);
    }
}
//# sourceMappingURL=iconPanel.js.map