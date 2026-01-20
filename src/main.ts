import { apartment, ReflectionObjectType } from './rooms.js'
import { raycastFromPosition, drawRaycast, drawRaycastOrigin } from './raycast.js'
import { IconPanel, Icon } from './iconPanel.js'
import { levelManager } from './levels.js'

/* Application configuration */
const headerSize = 0.1
const noHeaderSize = (1-headerSize)
const canvasElement: HTMLCanvasElement | null = document.querySelector('canvas');
const targetFps = 60
const deltaTime_ms = 1000 / targetFps

/* Level select ui */
const currentLevelDisplay = document.getElementById('levelDisplay')
function setCurrentLevelDisplay(timeMinutes:number, lvl:number) {
    if (!currentLevelDisplay) return;
    let hour = timeMinutes >= 60 ? 6 : 5
    timeMinutes %= 60
    let scoreStr = `<b> Time: ${hour}:${timeMinutes<10?'0':''}${timeMinutes} </b>`
    let minScoreStr = `<span class='lesserText'> (Level ${lvl}) </span>`
    currentLevelDisplay.innerHTML = scoreStr + minScoreStr
}
const prevLevelButton = document.getElementById('lvlSelectArrowPrev') as HTMLButtonElement
const nextLevelButton = document.getElementById('lvlSelectArrowNext') as HTMLButtonElement
if (prevLevelButton) prevLevelButton.onclick = () => { levelSelectUIUpdate(-1) }
if (nextLevelButton) nextLevelButton.onclick = () => { levelSelectUIUpdate(1) }

/* user message element */
const userMessage: HTMLElement | null = document.getElementById('userMessage')
function setUserMessage(text: string, err: boolean = false) { 
    if (!userMessage) return;
    userMessage.style.color = err ? 'red' : 'white';
    userMessage.innerText = text 
}

/* start hoover button element */
const startHooverButton: HTMLButtonElement | null = document.getElementById('startHooverButton') as HTMLButtonElement
if (startHooverButton) startHooverButton.onclick = () => { onStartHooverClicked() }

/* score display element */
const minimumScore = 0.5
const scoreDisplay: HTMLElement | null = document.getElementById('scoreDisplay')
function setScoreDisplay(value: number) { 
    if (scoreDisplay) {
        let scoreStr = `<b> ${Math.round(value*1000)/10}% </b>`
        let minScoreStr = `<span class='lesserText'> (>${minimumScore*100}%) </span>`
        scoreDisplay.innerHTML = scoreStr + minScoreStr
    }
}
const bottomUIPosition = 0.87 / noHeaderSize

/* Canvas Variables */
let ctx: CanvasRenderingContext2D | null | undefined = canvasElement?.getContext('2d')
let width = window.innerWidth
let height = window.innerHeight
let raycastParamsChanged = true

/* Raycast */
let raycastOriginX = -100
let raycastOriginY = -100
let tellyVisible: boolean = false

/* Icon Panel */
const icons: Array<Icon> = [ // has to match orcer in rooms.ts enum ObjectType
    new Icon('Mirror', './icons/mirrorIcon.png', ReflectionObjectType.Mirror)
]
let iconPanel = new IconPanel(icons)

/* Mouse */
let mouseX = 0
let mouseY = 0

/* Level Data */
let currentLevel = levelManager.getFirst()

/* BASIC CONTROL FUNCITONS */
function init() {
    resize()
    setScoreDisplay(0)
    levelSelectUIUpdate()
    setInterval(loop, deltaTime_ms)
}
function loop() {
    if (raycastParamsChanged) {
        raycastFromPosition(raycastOriginX, raycastOriginY, apartment)
        tellyVisible = apartment.isTellyVisible()
        setUserMessage(`\n\nTelly is ${tellyVisible ? "" : "NOT "} visible ${tellyVisible ? ':)' : ':('}`)
    }

    draw() 
}
function draw() {
    if (!ctx) return

    ctx.clearRect(0,0,width,height)

    // draw grey rooms
    apartment.draw(ctx, true) 

    // make hole with raycast
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out';
    drawRaycast(ctx)
    ctx.save()

    // fill empty space with coloured rooms
    ctx.restore()
    ctx.globalCompositeOperation = 'destination-over';
    apartment.draw(ctx, false)
    ctx.restore()

    // draw apartmetn objects (walls, furniture)
    // apartment.drawObjects(ctx)

    /* Icon Panel */
    iconPanel.updateIconPanelPosition(apartment)
    iconPanel.drawPanel(ctx)
    iconPanel.drawMousePreview(ctx, mouseX, mouseY)

    /* Level ui */
    if (currentLevel) {
        currentLevel.drawCleaningPath(ctx, apartment)
    }
    drawRaycastOrigin(ctx)
    drawHooveringProgress(ctx)

    raycastParamsChanged = false
}

/* HOOVER LOGIC */
const hooverTimeSeconds = 3.0 
const hooveringStepNumber = 100
const hooveringSingleStep = 1.0 / hooveringStepNumber
let lastHooveringStep: number = 0
let isHoovering: boolean = false
let hooveringStartTime: number = 0
let hooveringStepsDone = 0
let tellyVisibleInStepCount: number = 0
let hooverScore: number = 0
let hooverProgress: number = 0
function onStartHooverClicked() {
    if (isHoovering || !startHooverButton) return;
    isHoovering = true
    startHooverButton.innerText = 'hoovering ...'
    hooveringStartTime = performance.now()
    tellyVisibleInStepCount = 0
    lastHooveringStep = 0
    hooveringStepsDone = 0
    setTimeout(onHooverEnd, hooverTimeSeconds*1000)
    hoovering()
}
function hoovering() {
    if (!isHoovering || !currentLevel) return; 

    hooverProgress = Math.min(1, (performance.now()-hooveringStartTime)/(hooverTimeSeconds*1000)) 
    if (hooverProgress > lastHooveringStep+hooveringSingleStep) {
        let rayPos = currentLevel.getRaycastPosition(hooverProgress, apartment)
        raycastFromPosition(rayPos.x, rayPos.y, apartment)
        tellyVisible = apartment.isTellyVisible()
        tellyVisibleInStepCount += tellyVisible ? 1 : 0
        hooveringStepsDone += 1
        lastHooveringStep = hooverProgress
        setScoreDisplay(tellyVisibleInStepCount/hooveringStepNumber)
        setUserMessage(`\n\nTelly is ${tellyVisible ? "" : "NOT "} visible ${tellyVisible ? ':)' : ':('}`)
    }
    requestAnimationFrame(hoovering)
}
function onHooverEnd() {
    if (isHoovering && startHooverButton) {
        isHoovering = false
        startHooverButton.innerText = 'Start hoovering'
        hooverScore = tellyVisibleInStepCount/hooveringStepsDone
        hooverProgress = 1.0
        setScoreDisplay(hooverScore)

        if (hooverScore < minimumScore) {
            setUserMessage(
                `You probably missed ${Math.round(Math.random()*10000)} amazing goals, 
                now your wife doesn't love you,
                and your life is ruined :[
                (you also have lung cancer)`, true
            )
        } else {
            setUserMessage("Level cleared! :)")
            levelManager.unlockNextLevel()
            levelSelectUIUpdate()
        }
    }
}
function drawHooveringProgress(ctx: CanvasRenderingContext2D) {
    if (!ctx) return;

    let xStart = apartment.positionOriginX
    let w = apartment.roomSize*apartment.apartWidth
    let h = 35
    let yStart = bottomUIPosition * height * 0.9235

    ctx.beginPath()
    ctx.fillStyle = '#2ba407'
    ctx.fillRect(xStart, yStart-h/2, w*hooverProgress, h);
}

/* Level selection */
function levelSelectUIUpdate(dir: number = 0) {
    if (dir != 1 && dir != -1 && dir != 0) return;
    
    /* Change to different level if possible */
    if (dir != 0 && levelManager.changeCurrentLevel(dir)) {
        let lvl = levelManager.getCurrentLevel()
        if (lvl) currentLevel = lvl

        /* set new level number ui */
        let currLvlIdx = levelManager.getCurrentLevelIdx()
        setCurrentLevelDisplay(currLvlIdx*15, currLvlIdx+1)

        /* update raycast data for new level */
        if (currentLevel){
            let firstPathPoint = apartment.uvToWorld(currentLevel.getFirstPathPoint())
            raycastOriginX = firstPathPoint.x; raycastOriginY = firstPathPoint.y
            raycastParamsChanged = true
        }
    } 
    
    /* Update level select arrows */
    if (!prevLevelButton || !nextLevelButton) return;
    prevLevelButton.style.opacity = `${levelManager.isPrevLevelUnlocked() ? 1 : 0}`
    nextLevelButton.style.opacity = `${levelManager.isNextLevelUnlocked() ? 1 : 0}`
}

/* MOUSE AND WINDOW INTERACTIONS */
function mouseClick(e: MouseEvent) {
    mouseX = e.offsetX
    mouseY = e.offsetY
    
    if (iconPanel.selectedIcon == -1 && apartment.positionWithinApartmentBounds(mouseX,mouseY)) {
        raycastOriginX = mouseX
        raycastOriginY = mouseY
        raycastParamsChanged = true
    }
    raycastParamsChanged ||= iconPanel.processClick(mouseX, mouseY, apartment)
}
function mouseMove(e: MouseEvent) {
    mouseX = e.offsetX
    mouseY = e.offsetY
    if (canvasElement) iconPanel.processMouseMove(mouseX, mouseY, canvasElement)
}
function resize() {
    const dpr = window.devicePixelRatio
    const displayWidth = window.innerWidth
    const displayHeight = window.innerHeight * noHeaderSize // decrese based on header size

    if (canvasElement) {
        width = canvasElement.width = Math.floor(displayWidth * dpr)
        height = canvasElement.height = Math.floor(displayHeight * dpr)
    }
    if(ctx) ctx.scale(dpr, dpr)
    raycastParamsChanged = true

    /* other updates */
    apartment.updateScreenSize(width, height)
    iconPanel.updateScreenSize(width, height)

    /* set element posiitons */
    if (scoreDisplay) {
        scoreDisplay.style.left = `${apartment.positionOriginX+apartment.roomSize*apartment.apartWidth}px`
        scoreDisplay.style.top = `${height * bottomUIPosition}px`
    }
    if (startHooverButton) {
        startHooverButton.style.left = `${width * 0.5}px`
        startHooverButton.style.top = `${height * bottomUIPosition + 20}px`
    }
}

window.onload = () => { resize(); init() }
window.onresize = () => { resize() }
window.onmousemove = (e) => { mouseMove(e); let objMove = apartment.onMouseMove(e); if(objMove) raycastParamsChanged = true}
window.onmouseup = (e) => { let objMoved = apartment.onMouseUp(e); if (!objMoved) mouseClick(e); else raycastParamsChanged = true }
window.onmousedown = (e) => { apartment.onMouseDown(e); }

// 💡😜📺⚽👀🪞🪞🪞