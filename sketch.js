// Global state variables
let strokeOption;
let baseSize;
let scale;
let canvas = 800; 
let bgColor = [247, 241, 219];

// HSB Color Constants
const H_BASE = 43;
const S_BASE = 12;
const B_BASE = 97;

let stripes = [];
let currentStripe = 0;
const numGroups = 80; // UPDATED to 80

// Perlin Noise Drivers
let noiseZSeed;
let noiseOpacityTime;
let noiseColorTime = 0;
const noiseScaleFactor = 0.01;

// Erasure Line Variables
let hiddenLines = [];
let hiddenLinesToGenerate;
let hiddenLinesGeneratedCount;

// Animation Intervals
const THICK_LINE_INTERVALS = [20, 50];
let nextThickLineIndex = 0;
let nextHiddenLineTime;

// Helper: Adjust scaling and stroke weights based on window size
function adjustStrokeAndScale() {
    baseSize = (windowWidth + windowHeight) / 2;
    scale = baseSize / canvas;
    
    strokeOption = [0.4, 0.8, 1, 2, 3.5];
    for (let i = 0; i < strokeOption.length; i++) {
        strokeOption[i] *= scale;
    }
}

// Helper: Generates parameters for a single parallel line group
function createLineGroups() {
    let linesData = [];
    
    const lineColor = random() < 0.6 ? color(0, 0, 0, 255) : color(H_BASE, S_BASE, B_BASE, 255);
    
    const x1 = random(-width / 2, width / 2);
    const y1 = random(-height / 2, height / 2);

    const signX = random() > 0.5 ? 1 : -1;
    const signY = random() > 0.5 ? 1 : -1;
    const lineLength = random(120, 280) * scale;

    let hShift, vShift;

    // Set H:V:T ratio to 1:1:3 (20%: 20%: 60%)
    const r = random();

    if (r < 0.2) { // Horizontal
        hShift = lineLength * signX;
        vShift = 0;
    } else if (r < 0.4) { // Vertical
        hShift = 0;
        vShift = lineLength * signY;
    } else { // Tilted
        const angle = tan(30);
        hShift = lineLength * signX;
        vShift = lineLength * angle * signY;
    }

    const x2Base = x1 + hShift;
    const y2Base = y1 + vShift;
    const numLines = floor(random(4, 17));
    const spacing = random(3, 8) * scale; 
    const absH = abs(hShift);
    const absV = abs(vShift);

    for (let i = 0; i < numLines; i++) {
        const offset = i * spacing;

        let X1 = x1;
        let Y1 = y1;
        let X2 = x2Base;
        let Y2 = y2Base;

        // Apply perpendicular offset
        if (absH > absV) {
            Y1 += offset;
            Y2 += offset;
        }
        else {
            X1 += offset;
            X2 += offset;
        }

        linesData.push({
            x1: X1,
            y1: Y1,
            x2: X2,
            y2: Y2,
            weight: random(strokeOption), 
            color: lineColor,
            length: lineLength,
            subgroupId: undefined
        });
    }

    return new LineStripe({
        lines: linesData
    });
}

// Helper: Generates a dynamic erasure line (background color)
function generateRandomHiddenLine() {
    if (hiddenLinesGeneratedCount >= hiddenLinesToGenerate) return;
    
    let linesData = [];
    const lineType = (hiddenLinesGeneratedCount % 2 === 0) ? 'horizontal' : 'vertical';
    
    let baseAngle;
    const angleRange = 30;
    
    if (lineType === 'horizontal') {
        baseAngle = random() < 0.5 ? 0 : 180;
    } else {
        baseAngle = random() < 0.5 ? 90 : 270;
    }
    
    const randomOffset = random(-angleRange, angleRange);
    const fixedAngle = baseAngle + randomOffset;
    
    const padding = height * 1.5;
    const maxDimension = dist(0, 0, width / 2 + padding, height / 2 + padding);
    const halfLength = maxDimension * 1.5;
    
    const x1 = cos(fixedAngle + 180) * halfLength;
    const y1 = sin(fixedAngle + 180) * halfLength;
    
    const x2 = cos(fixedAngle) * halfLength;
    const y2 = sin(fixedAngle) * halfLength;
    
    const lineColor = color(H_BASE, S_BASE, B_BASE, 255);
    
    const baseWeight = random(60, 120) * scale;
    let weight;
    
    if (lineType === 'horizontal') {
        weight = baseWeight / 3;
    } else {
        weight = baseWeight;
    }

    // Double the weight for the first erasure line
    if (hiddenLinesGeneratedCount === 0) {
        weight *= 2;
    }
    
    const lineLength = dist(x1, y1, x2, y2);
    
    linesData.push({
        x1: x1, y1: y1, x2: x2, y2: y2, weight: weight,
        color: lineColor,
        length: lineLength
    });

    const newLineStripe = new LineStripe({ lines: linesData, isErasure: true });
    newLineStripe.isErasure = true;
    newLineStripe.drawSpeed = random(10, 30);
    
    newLineStripe.currentOffset = 0;
    newLineStripe.direction = random() < 0.5 ? 1 : -1;
    newLineStripe.moveSpeed = 0.5 * scale; 
    
    if (lineType === 'horizontal') {
        newLineStripe.isVerticalMover = true;
    } else {
        newLineStripe.isHorizontalMover = true;
    }
    
    hiddenLines.push(newLineStripe);
    
    hiddenLinesGeneratedCount++;
    nextThickLineIndex = hiddenLinesGeneratedCount;

    if (nextThickLineIndex < THICK_LINE_INTERVALS.length) {
        nextHiddenLineTime = THICK_LINE_INTERVALS[nextThickLineIndex];
    } else {
        nextHiddenLineTime = numGroups + 1;
    }
}

// Helper: Resets composition and initializes all line groups
function resetComposition() {
    stripes = [];
    currentStripe = 0;
    
    noiseSeed(random(1000));
    
    hiddenLines = [];
    hiddenLinesToGenerate = THICK_LINE_INTERVALS.length;
    hiddenLinesGeneratedCount = 0;
    nextThickLineIndex = 0;
    
    if (THICK_LINE_INTERVALS.length > 0) {
        nextHiddenLineTime = THICK_LINE_INTERVALS[nextThickLineIndex];
    } else {
        nextHiddenLineTime = numGroups + 1;
    }
    
    for (let g = 0; g < numGroups; g++) {
        stripes.push(createLineGroups());
    }
}
 
// Class: Manages line group properties and animation
class LineStripe {
    constructor(groupData) {
        this.data = groupData.lines; 
        this.done = false;
        this.currentLen = 0;
        this.maxLen = groupData.lines[0].length;
        this.drawSpeed = 15; 
        
        this.isErasure = groupData.isErasure || false;
        this.subgroups = []; 
        
        this.noiseTimeSeed = 0;
        this.noiseMagnitude = 0;
        this.isVerticalMover = false;
        this.isHorizontalMover = false;

        this.currentOffset = 0;
        this.direction = 1;      
        this.moveSpeed = 0;
        
        if (!this.isErasure) {
            this.setupSubgroups();
        }
    }
    
    // Defines subgroups for Perlin length perturbation
    setupSubgroups() {
        const totalLines = this.data.length;
        let numSubgroupsToCreate;

        if (totalLines <= 10) {
            numSubgroupsToCreate = 1;
        } else {
            numSubgroupsToCreate = floor(random(2, 4));
        }
        
        let usedIndices = new Array(totalLines).fill(false);
        
        for (let s = 0; s < numSubgroupsToCreate; s++) {
            const groupSize = floor(random(3, 7));
            let startIndex = -1;
            let attempts = 0;

            while (attempts < totalLines * 2) {
                const potentialStart = floor(random(totalLines - groupSize + 1));
                let isFree = true;
                
                for (let i = 0; i < groupSize; i++) {
                    if (potentialStart + i >= totalLines || usedIndices[potentialStart + i]) {
                        isFree = false;
                        break;
                    }
                }
                
                if (isFree) {
                    startIndex = potentialStart;
                    break;
                }
                attempts++;
            }
            
            if (startIndex !== -1) {
                const endIndex = startIndex + groupSize;
                
                this.subgroups.push({
                    noiseZ: random(100),
                });
                
                const currentSubgroupIndex = this.subgroups.length - 1;
                
                for (let i = startIndex; i < endIndex; i++) {
                    usedIndices[i] = true;
                    this.data[i].subgroupId = currentSubgroupIndex; 
                }
            }
        }
    }
    
    // Draws the line group with Perlin perturbation and growth animation
    displayStep(fullDraw = false) {
        push();
        noFill();
        
        for (let l of this.data) {
            
            const spacedX1 = l.x1;
            const spacedY1 = l.y1;
            const spacedX2 = l.x2;
            const spacedY2 = l.y2;
            const lineAngle = atan2(spacedY2 - spacedY1, spacedX2 - spacedX1);
            
            let perturbation = 0;
            let animatedX1 = spacedX1;
            let animatedY1 = spacedY1;
            let finalWeight = l.weight;
            
            if (!this.isErasure) {
                const subgroupId = l.subgroupId;
                
                if (subgroupId !== undefined) {
                    const subgroup = this.subgroups[subgroupId];
                    const RELATIVE_MAX_RATE = 0.4;

                    // Perlin noise for length perturbation
                    const noiseValue = noise(noiseZSeed + subgroup.noiseZ);
                    
                    const totalPerturbation = map(
                        noiseValue,
                        0, 1,
                        -RELATIVE_MAX_RATE * l.length,
                        RELATIVE_MAX_RATE * l.length
                    );

                    const halfPerturbation = totalPerturbation / 2;
                    perturbation = totalPerturbation; 

                    const p1OffsetComponentX = cos(lineAngle + 180) * halfPerturbation;
                    const p1OffsetComponentY = sin(lineAngle + 180) * halfPerturbation;

                    animatedX1 = spacedX1 + p1OffsetComponentX;
                    animatedY1 = spacedY1 + p1OffsetComponentY;
                    
                }
                
                stroke(l.color);
                strokeWeight(finalWeight);
                
            } else {
                // Perlin noise for erasure line weight fluctuation
                
                const strokeColor = color(H_BASE, S_BASE, B_BASE, 255);
                
                const initialBaseWeight = l.weight;
                const weightNoiseVal = noise(l.x1 * noiseScaleFactor * 0.05, l.y1 * noiseScaleFactor * 0.05, noiseZSeed * 0.8);
                const minWeightFactor = 0.7;
                const maxWeightFactor = 1.3;
                
                finalWeight = map(weightNoiseVal, 0, 1, initialBaseWeight * minWeightFactor, initialBaseWeight * maxWeightFactor);

                stroke(strokeColor);
                strokeWeight(finalWeight);
            }
            
            // Drawing logic for growth or full display
            let drawP1X, drawP1Y, drawP2X, drawP2Y;
            
            const perturbedLength = l.length + perturbation;
            
            if (fullDraw || this.done) {
                drawP1X = animatedX1;
                drawP1Y = animatedY1;
                drawP2X = animatedX1 + cos(lineAngle) * perturbedLength;
                drawP2Y = animatedY1 + sin(lineAngle) * perturbedLength;
                
            } else {
                const currentGrowthRatio = this.currentLen / this.maxLen;
                const lengthToDraw = perturbedLength * currentGrowthRatio;

                drawP1X = animatedX1;
                drawP1Y = animatedY1;

                drawP2X = animatedX1 + cos(lineAngle) * lengthToDraw;
                drawP2Y = animatedY1 + sin(lineAngle) * lengthToDraw;
            }
            
            line(drawP1X, drawP1Y, drawP2X, drawP2Y);
        }

        // Line growth logic
        if (!fullDraw && !this.done) {
            this.currentLen += this.drawSpeed;
            if (this.currentLen >= this.maxLen) {
                this.currentLen = this.maxLen;
                this.done = true;
            }
        }

        pop();
    }
}

// Helper: Draws and manages boundary movement for a single erasure line
function drawMovingErasureLine(hiddenLineIndex) {
    if (hiddenLines.length > hiddenLineIndex) {
        let hiddenLine = hiddenLines[hiddenLineIndex];
        const boundaryLimit = 0.6;
        
        hiddenLine.currentOffset += hiddenLine.direction * hiddenLine.moveSpeed;
        
        let boundaryMax = 0;
        let offsetX = 0;
        let offsetY = 0;

        if (hiddenLine.isHorizontalMover) {
            boundaryMax = width * boundaryLimit / 2;
            offsetX = hiddenLine.currentOffset;
        } else if (hiddenLine.isVerticalMover) {
            boundaryMax = height * boundaryLimit / 2;
            offsetY = hiddenLine.currentOffset;
        }
        
        // Boundary Check and Reversal
        if (hiddenLine.currentOffset > boundaryMax) {
            hiddenLine.direction = -1;
            hiddenLine.currentOffset = boundaryMax;
        } else if (hiddenLine.currentOffset < -boundaryMax) {
            hiddenLine.direction = 1;
            hiddenLine.currentOffset = -boundaryMax;
        }
        
        push();
        translate(offsetX, offsetY); 
        hiddenLine.displayStep(true); 
        pop();
    }
}
 
// p5.js setup function
function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    colorMode(HSB, 360, 100, 100, 255); 
    adjustStrokeAndScale();
    
    noiseZSeed = random(10000);
    noiseOpacityTime = random(10000); 
    noiseColorTime = random(10000); 

    resetComposition();
    loop(); 
}

// p5.js draw loop: handles animation updates, noise drivers, and drawing order
function draw() {
    // Global Animation Drivers
    noiseZSeed += 0.005; 
    noiseOpacityTime += 0.005;
    noiseColorTime += 0.001;
    
    background(H_BASE, S_BASE, B_BASE, 255);
    
    push();
    translate(width / 2, height / 2);

    // Dynamic Hidden Line Generation check
    if (currentStripe < numGroups && hiddenLinesGeneratedCount < hiddenLinesToGenerate && currentStripe >= nextHiddenLineTime) {
          generateRandomHiddenLine();
    }
    
    const split1 = THICK_LINE_INTERVALS[0];
    const split2 = THICK_LINE_INTERVALS[1];
    
    // Sequential Drawing Layers: Lines (1, 3, 5) interspersed with Erasure Lines (2, 4)
   
    // Draw Layer 1 Small Stripes (0 to 19)
    for (let i = 0; i < min(currentStripe, split1); i++) {
        stripes[i].displayStep(true);
    }
    if (currentStripe < split1 && stripes[currentStripe]) {
        stripes[currentStripe].displayStep();
    }

    // Draw Layer 2 (First Erasure Line)
    drawMovingErasureLine(0);

    // Draw Layer 3 Small Stripes (20 to 49)
    for (let i = split1; i < min(currentStripe, split2); i++) {
        stripes[i].displayStep(true);
    }
    if (currentStripe >= split1 && currentStripe < split2 && stripes[currentStripe]) {
        stripes[currentStripe].displayStep();
    }

    // Draw Layer 4 (Second Erasure Line)
    drawMovingErasureLine(1);

    // Draw Layer 5 Small Stripes (50 to 79)
    for (let i = split2; i < min(currentStripe, numGroups); i++) {
        stripes[i].displayStep(true);
    }
    if (currentStripe >= split2 && currentStripe < numGroups && stripes[currentStripe]) {
        stripes[currentStripe].displayStep();
    }
    
    // Increment Stripe Index (Manages the initial growth phase)
    if (currentStripe < numGroups && stripes[currentStripe] && stripes[currentStripe].done) {
        currentStripe++;
    }

    pop();
}

// Handle window resize event
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    adjustStrokeAndScale();
    resetComposition();
}
