const TOTAL_ITEMS = 16;
const TIME_LIMIT = 12 * 60;
const NUM_OPTIONS = 8;
const REQUIRED_SELECTIONS = 3;


class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }
    
    nextInt(max) {
        return Math.floor(this.next() * max);
    }
    
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.nextInt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    choice(array) {
        return array[this.nextInt(array.length)];
    }
}


function normalizeShape(cells) {
    if (cells.length === 0) return [];
    
    let minR = Infinity, minC = Infinity;
    for (const [r, c] of cells) {
        minR = Math.min(minR, r);
        minC = Math.min(minC, c);
    }
    
    const normalized = cells.map(([r, c]) => [r - minR, c - minC]);
    
    normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    
    return normalized;
}

function getAllTransformations(cells) {
    const transformations = [];
    
    function rotate90(shape) {
        return shape.map(([r, c]) => [c, -r]);
    }
    
    function reflectH(shape) {
        return shape.map(([r, c]) => [r, -c]);
    }
    
    let current = cells;
    
    for (let i = 0; i < 4; i++) {
        transformations.push(normalizeShape(current));
        transformations.push(normalizeShape(reflectH(current)));
        current = rotate90(current);
    }
    
    return transformations;
}

function getCanonicalShape(cells) {
    const transformations = getAllTransformations(cells);
    
    const strings = transformations.map(t => JSON.stringify(t));
    
    strings.sort();
    return strings[0];
}

function shapesAreEquivalent(shape1, shape2) {
    return getCanonicalShape(shape1) === getCanonicalShape(shape2);
}

function isConnected(cells) {
    if (cells.length <= 1) return true;
    
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
    const visited = new Set();
    const queue = [cells[0]];
    visited.add(`${cells[0][0]},${cells[0][1]}`);
    
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            const key = `${nr},${nc}`;
            
            if (cellSet.has(key) && !visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }
    
    return visited.size === cells.length;
}

function getBoundingBox(cells) {
    if (cells.length === 0) return { width: 0, height: 0 };
    
    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;
    
    for (const [r, c] of cells) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
    }
    
    return {
        width: maxC - minC + 1,
        height: maxR - minR + 1,
        minR, maxR, minC, maxC
    };
}


function canPlace(shape, startR, startC, gridSize, occupied) {
    for (const [r, c] of shape) {
        const nr = startR + r;
        const nc = startC + c;
        
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) {
            return false;
        }
        
        if (occupied.has(`${nr},${nc}`)) {
            return false;
        }
    }
    return true;
}

function placeShape(shape, startR, startC, occupied) {
    const newOccupied = new Set(occupied);
    for (const [r, c] of shape) {
        newOccupied.add(`${startR + r},${startC + c}`);
    }
    return newOccupied;
}

function canTileWith(shapes, gridSize) {
    const totalCells = gridSize * gridSize;
    const totalShapeCells = shapes.reduce((sum, s) => sum + s.length, 0);
    
    if (totalShapeCells !== totalCells) return false;
    
    const originalTransforms = shapes.map(s => {
        const transforms = getAllTransformations(s);
        const unique = new Map();
        for (const t of transforms) {
            unique.set(JSON.stringify(t), t);
        }
        return Array.from(unique.values());
    });
    
    function solve(shapeIdx, occupied, transformsToUse) {
        if (shapeIdx === shapes.length) {
            return occupied.size === totalCells;
        }
        
        let firstEmpty = null;
        for (let r = 0; r < gridSize && !firstEmpty; r++) {
            for (let c = 0; c < gridSize && !firstEmpty; c++) {
                if (!occupied.has(`${r},${c}`)) {
                    firstEmpty = [r, c];
                }
            }
        }
        
        if (!firstEmpty) return shapeIdx === shapes.length;
        
        const [targetR, targetC] = firstEmpty;
        
        for (const transform of transformsToUse[shapeIdx]) {
            for (const [anchorR, anchorC] of transform) {
                const startR = targetR - anchorR;
                const startC = targetC - anchorC;
                
                if (canPlace(transform, startR, startC, gridSize, occupied)) {
                    const newOccupied = placeShape(transform, startR, startC, occupied);
                    if (solve(shapeIdx + 1, newOccupied, transformsToUse)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    const permutations = getPermutations([0, 1, 2]);
    
    for (const perm of permutations) {
        const permutedTransforms = perm.map(i => originalTransforms[i]);
        
        if (solve(0, new Set(), permutedTransforms)) {
            return true;
        }
    }
    
    return false;
}

function getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const perms = getPermutations(rest);
        for (const perm of perms) {
            result.push([arr[i], ...perm]);
        }
    }
    return result;
}


function partitionGrid(rng, gridSize) {
    const totalCells = gridSize * gridSize;
    
    const sizes = generateShapeSizes(rng, totalCells, 3);
    if (!sizes) return null;
    
    const result = placeThreeShapes(rng, gridSize, sizes);
    if (!result) return null;
    
    const canonicalForms = result.map(s => getCanonicalShape(s));
    const uniqueCanonicals = new Set(canonicalForms);
    if (uniqueCanonicals.size !== 3) {
        return null;
    }
    
    return result;
}

function generateShapeSizes(rng, total, numShapes, minSize = 2) {
    if (total < numShapes * minSize) return null;
    
    const sizes = new Array(numShapes).fill(minSize);
    let remaining = total - numShapes * minSize;
    
    while (remaining > 0) {
        const idx = rng.nextInt(numShapes);
        sizes[idx]++;
        remaining--;
    }
    
    return rng.shuffle(sizes);
}

function placeThreeShapes(rng, gridSize, targetSizes) {
    const totalCells = gridSize * gridSize;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(-1));
    const shapes = [[], [], []];
    
    const allCells = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            allCells.push([r, c]);
        }
    }
    const shuffledCells = rng.shuffle(allCells);
    
    let seedIdx = 0;
    for (let i = 0; i < 3; i++) {
        const [r, c] = shuffledCells[seedIdx++];
        grid[r][c] = i;
        shapes[i].push([r, c]);
    }
    
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    let maxIter = totalCells * 20;
    while (maxIter-- > 0) {
        let allDone = true;
        for (let i = 0; i < 3; i++) {
            if (shapes[i].length < targetSizes[i]) {
                allDone = false;
                break;
            }
        }
        if (allDone) break;
        
        const needsGrowth = [];
        for (let i = 0; i < 3; i++) {
            if (shapes[i].length < targetSizes[i]) {
                needsGrowth.push(i);
            }
        }
        
        if (needsGrowth.length === 0) break;
        
        needsGrowth.sort((a, b) => shapes[a].length - shapes[b].length);
        const shapeIdx = needsGrowth[0];
        
        const candidates = [];
        for (const [r, c] of shapes[shapeIdx]) {
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === -1) {
                    candidates.push([nr, nc]);
                }
            }
        }
        
        const uniqueCandidates = [];
        const seen = new Set();
        for (const [r, c] of candidates) {
            const key = `${r},${c}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCandidates.push([r, c]);
            }
        }
        
        if (uniqueCandidates.length > 0) {
            const [nr, nc] = rng.choice(uniqueCandidates);
            grid[nr][nc] = shapeIdx;
            shapes[shapeIdx].push([nr, nc]);
        } else {
            return null;
        }
    }
    
    let filledCount = 0;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] !== -1) filledCount++;
        }
    }
    
    if (filledCount !== totalCells) {
        return null;
    }
    
    for (let i = 0; i < 3; i++) {
        if (shapes[i].length !== targetSizes[i] || !isConnected(shapes[i])) {
            return null;
        }
    }
    
    return shapes.map(s => normalizeShape(s));
}


function getGridSizeForItem(itemIndex) {
    if (itemIndex < 4) return 4;
    if (itemIndex < 8) return 5;
    if (itemIndex < 12) return 6;
    return 7;
}

function generateItem(itemIndex, regenerateAttempt = 0) {
    const maxRegenerateAttempts = 100;
    
    if (regenerateAttempt >= maxRegenerateAttempts) {
        console.warn(`Max regeneration attempts reached for item ${itemIndex}`);
    }
    
    const gridSize = getGridSizeForItem(itemIndex);
    const seed = Math.floor(Math.random() * 1000000) + itemIndex * 1000 + regenerateAttempt * 100;
    const rng = new SeededRandom(seed);
    
    let correctShapes = null;
    let attempts = 0;
    const maxAttempts = 200;
    
    while (!correctShapes && attempts < maxAttempts) {
        attempts++;
        const candidate = partitionGrid(rng, gridSize);
        if (candidate) {
            if (canTileWith(candidate, gridSize)) {
                correctShapes = candidate;
            }
        }
    }
    
    if (!correctShapes) {
        correctShapes = generateFallbackPartition(rng, gridSize);
        
        if (!canTileWith(correctShapes, gridSize)) {
            correctShapes = generateSimpleRowPartition(gridSize);
        }
    }
    
    const distractors = generateDistractors(rng, gridSize, correctShapes);
    
    if (distractors.length !== 5) {
        if (regenerateAttempt < maxRegenerateAttempts) {
            return generateItem(itemIndex, regenerateAttempt + 1);
        }
    }
    
    const allOptions = [...correctShapes, ...distractors];
    
    const allCanonicals = allOptions.map(s => getCanonicalShape(s));
    if (new Set(allCanonicals).size !== 8) {
        if (regenerateAttempt < maxRegenerateAttempts) {
            return generateItem(itemIndex, regenerateAttempt + 1);
        }
    }
    
    const indices = rng.shuffle([...Array(8).keys()]);
    const options = indices.map(i => allOptions[i]);
    
    const optionTransforms = options.map(() => rng.nextInt(8));
    
    const solutions = findAllSolutions(options, gridSize);
    
    if (solutions.length !== 1) {
        if (regenerateAttempt < maxRegenerateAttempts) {
            return generateItem(itemIndex, regenerateAttempt + 1);
        }
        if (solutions.length === 0) {
            console.error(`No solution found for item ${itemIndex}, regenerating with new seed`);
            return generateItem(itemIndex, 0);
        }
    }
    
    return {
        gridSize,
        options,
        optionTransforms,
        correctIndices: solutions[0].sort((a, b) => a - b)
    };
}

function generateSimpleRowPartition(gridSize) {
    const totalCells = gridSize * gridSize;
    
    const size1 = Math.floor(gridSize / 3);
    const size2 = Math.floor(gridSize / 3);
    const size3 = gridSize - size1 - size2;
    
    const shapes = [[], [], []];
    let currentShape = 0;
    let rowsInShape = 0;
    const rowsPerShape = [size1 || 1, size2 || 1, size3 || 1];
    
    if (size1 === 0 || size2 === 0 || size3 === 0) {
        let idx = 0;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                shapes[idx % 3].push([r, c]);
                idx++;
            }
        }
    } else {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                shapes[currentShape].push([r, c]);
            }
            rowsInShape++;
            if (rowsInShape >= rowsPerShape[currentShape] && currentShape < 2) {
                currentShape++;
                rowsInShape = 0;
            }
        }
    }
    
    return shapes.map(s => normalizeShape(s));
}

function generateFallbackPartition(rng, gridSize) {
    const totalCells = gridSize * gridSize;
    const shapes = [[], [], []];
    
    const cells = [];
    for (let r = 0; r < gridSize; r++) {
        if (r % 2 === 0) {
            for (let c = 0; c < gridSize; c++) {
                cells.push([r, c]);
            }
        } else {
            for (let c = gridSize - 1; c >= 0; c--) {
                cells.push([r, c]);
            }
        }
    }
    
    const sizes = [
        Math.floor(totalCells / 3),
        Math.floor(totalCells / 3),
        totalCells - 2 * Math.floor(totalCells / 3)
    ];
    
    let cellIdx = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < sizes[i] && cellIdx < cells.length; j++) {
            shapes[i].push(cells[cellIdx++]);
        }
    }
    
    for (const shape of shapes) {
        if (!isConnected(shape) || shape.length < 2) {
            return generateSimpleRowPartition(gridSize);
        }
    }
    
    return shapes.map(s => normalizeShape(s));
}

function generateDistractors(rng, gridSize, correctShapes) {
    const distractors = [];
    const usedCanonical = new Set(correctShapes.map(s => getCanonicalShape(s)));
    const totalCells = gridSize * gridSize;
    
    function wouldCreateAlternativeSolution(newDistractor) {
        const allShapes = [...correctShapes, ...distractors, newDistractor];
        const n = allShapes.length;
        
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n - 1; j++) {
                const triple = [allShapes[i], allShapes[j], newDistractor];
                
                if (i < 3 && j < 3) continue;
                
                if (canTileWith(triple, gridSize)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    const targetCount = 5;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (distractors.length < targetCount && attempts < maxAttempts) {
        attempts++;
        
        const correctSizes = correctShapes.map(s => s.length);
        const minSize = 2;
        const maxSize = Math.max(...correctSizes) + 2;
        const size = rng.nextInt(maxSize - minSize + 1) + minSize;
        
        const shape = generateRandomPolyomino(rng, gridSize, size);
        
        if (shape && shape.length >= 2) {
            const canonical = getCanonicalShape(shape);
            
            if (!usedCanonical.has(canonical)) {
                if (!wouldCreateAlternativeSolution(normalizeShape(shape))) {
                    usedCanonical.add(canonical);
                    distractors.push(normalizeShape(shape));
                }
            }
        }
    }
    
    attempts = 0;
    while (distractors.length < targetCount && attempts < maxAttempts) {
        attempts++;
        const baseShape = rng.choice(correctShapes);
        const variation = createVariation(rng, baseShape, gridSize);
        
        if (variation && variation.length >= 2) {
            const canonical = getCanonicalShape(variation);
            
            if (!usedCanonical.has(canonical)) {
                if (!wouldCreateAlternativeSolution(normalizeShape(variation))) {
                    usedCanonical.add(canonical);
                    distractors.push(normalizeShape(variation));
                }
            }
        }
    }
    
    attempts = 0;
    while (distractors.length < targetCount && attempts < maxAttempts) {
        attempts++;
        
        const wrongSize = rng.nextInt(Math.floor(totalCells / 4)) + 2;
        const shape = generateRandomPolyomino(rng, gridSize, wrongSize);
        
        if (shape && shape.length >= 2) {
            const canonical = getCanonicalShape(shape);
            
            if (!usedCanonical.has(canonical)) {
                if (!wouldCreateAlternativeSolution(normalizeShape(shape))) {
                    usedCanonical.add(canonical);
                    distractors.push(normalizeShape(shape));
                }
            }
        }
    }
    
    return distractors;
}

function generateRandomPolyomino(rng, gridSize, targetSize) {
    const shape = [[0, 0]];
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    while (shape.length < targetSize) {
        const candidates = [];
        const shapeSet = new Set(shape.map(([r, c]) => `${r},${c}`));
        
        for (const [r, c] of shape) {
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;
                
                if (!shapeSet.has(key)) {
                    const bbox = getBoundingBox([...shape, [nr, nc]]);
                    if (bbox.width <= gridSize && bbox.height <= gridSize) {
                        candidates.push([nr, nc]);
                    }
                }
            }
        }
        
        if (candidates.length === 0) break;
        
        shape.push(rng.choice(candidates));
    }
    
    return normalizeShape(shape);
}

function createVariation(rng, shape, gridSize) {
    const variation = [...shape.map(([r, c]) => [r, c])];
    
    if (rng.next() < 0.5 && variation.length > 2) {
        for (let attempt = 0; attempt < 10; attempt++) {
            const idx = rng.nextInt(variation.length);
            const removed = variation.splice(idx, 1)[0];
            
            if (isConnected(variation)) {
                return normalizeShape(variation);
            }
            
            variation.splice(idx, 0, removed);
        }
    } else {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const shapeSet = new Set(variation.map(([r, c]) => `${r},${c}`));
        const candidates = [];
        
        for (const [r, c] of variation) {
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;
                
                if (!shapeSet.has(key)) {
                    const bbox = getBoundingBox([...variation, [nr, nc]]);
                    if (bbox.width <= gridSize && bbox.height <= gridSize) {
                        candidates.push([nr, nc]);
                    }
                }
            }
        }
        
        if (candidates.length > 0) {
            variation.push(rng.choice(candidates));
            return normalizeShape(variation);
        }
    }
    
    return null;
}


function findAllSolutions(options, gridSize) {
    const solutions = [];
    const n = options.length;
    
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                const triple = [options[i], options[j], options[k]];
                
                if (canTileWith(triple, gridSize)) {
                    solutions.push([i, j, k]);
                }
            }
        }
    }
    
    return solutions;
}


let gameState = {
    items: [],
    currentItem: 0,
    answers: new Array(TOTAL_ITEMS).fill(null),
    timeRemaining: TIME_LIMIT,
    timerInterval: null,
    startTime: null,
    endTime: null
};


const startScreen = document.getElementById('start-screen');
const testScreen = document.getElementById('test-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer');
const progressTracker = document.getElementById('progress-tracker');
const itemCounter = document.getElementById('item-counter');
const targetGrid = document.getElementById('target-grid');
const answersGrid = document.getElementById('answers-grid');
const selectionCount = document.getElementById('selection-count');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const scoreValue = document.getElementById('score-value');
const scoreMax = document.getElementById('score-max');
const timeUsed = document.getElementById('time-used');
const breakdownList = document.getElementById('breakdownList');
const restartBtn = document.getElementById('restart-btn');
const ageGroupSelect = document.getElementById('ageGroup');
const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');


function renderTargetGrid(gridSize) {
    targetGrid.innerHTML = '';
    targetGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'target-cell filled';
            targetGrid.appendChild(cell);
        }
    }
}

function applyRandomTransform(shape, transformIndex) {
    
    let result = shape.map(([r, c]) => [r, c]);
    
    const shouldFlip = transformIndex >= 4;
    const rotations = transformIndex % 4;
    
    if (shouldFlip) {
        result = result.map(([r, c]) => [r, -c]);
    }
    
    for (let i = 0; i < rotations; i++) {
        result = result.map(([r, c]) => [c, -r]);
    }
    
    return normalizeShape(result);
}

function renderShapeOption(shape, index, isSelected, isDisabled, transformIndex) {
    const option = document.createElement('div');
    option.className = 'answer-option';
    
    if (isSelected) option.classList.add('selected');
    if (isDisabled) option.classList.add('disabled');
    
    const number = document.createElement('div');
    number.className = 'option-number';
    number.textContent = index + 1;
    option.appendChild(number);
    
    const transformedShape = applyRandomTransform(shape, transformIndex);
    
    const bbox = getBoundingBox(transformedShape);
    const shapeGrid = document.createElement('div');
    shapeGrid.className = 'shape-grid';
    shapeGrid.style.gridTemplateColumns = `repeat(${bbox.width}, 1fr)`;
    
    const shapeSet = new Set(transformedShape.map(([r, c]) => `${r},${c}`));
    
    for (let r = 0; r < bbox.height; r++) {
        for (let c = 0; c < bbox.width; c++) {
            const cell = document.createElement('div');
            cell.className = 'shape-cell';
            
            if (shapeSet.has(`${r},${c}`)) {
                cell.classList.add('filled');
            }
            
            shapeGrid.appendChild(cell);
        }
    }
    
    option.appendChild(shapeGrid);
    
    if (!isDisabled) {
        option.addEventListener('click', () => toggleSelection(index));
    }
    
    return option;
}

function renderOptions(item) {
    answersGrid.innerHTML = '';
    
    const currentSelections = gameState.answers[gameState.currentItem] || [];
    const atMaxSelections = currentSelections.length >= REQUIRED_SELECTIONS;
    
    item.options.forEach((shape, index) => {
        const isSelected = currentSelections.includes(index);
        const isDisabled = atMaxSelections && !isSelected;
        const transformIndex = item.optionTransforms ? item.optionTransforms[index] : 0;
        
        const optionEl = renderShapeOption(shape, index, isSelected, isDisabled, transformIndex);
        answersGrid.appendChild(optionEl);
    });
    
    selectionCount.textContent = currentSelections.length;
}

function renderProgressTracker() {
    progressTracker.innerHTML = '';
    
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.textContent = i + 1;
        
        if (i === gameState.currentItem) {
            item.classList.add('current');
        } else if (gameState.answers[i] && gameState.answers[i].length === REQUIRED_SELECTIONS) {
            item.classList.add('answered');
        }
        
        item.addEventListener('click', () => goToItem(i));
        progressTracker.appendChild(item);
    }
}

function updateItemCounter() {
    itemCounter.textContent = `Item ${gameState.currentItem + 1} of ${TOTAL_ITEMS}`;
}

function updateNavigationButtons() {
    prevBtn.disabled = gameState.currentItem === 0;
    
    const isLastItem = gameState.currentItem === TOTAL_ITEMS - 1;
    nextBtn.style.display = isLastItem ? 'none' : 'block';
    finishBtn.style.display = isLastItem ? 'block' : 'none';
}

function renderCurrentItem() {
    const item = gameState.items[gameState.currentItem];
    renderTargetGrid(item.gridSize);
    renderOptions(item);
    renderProgressTracker();
    updateItemCounter();
    updateNavigationButtons();
}


function toggleSelection(index) {
    let selections = gameState.answers[gameState.currentItem] || [];
    
    if (selections.includes(index)) {
        selections = selections.filter(i => i !== index);
    } else {
        if (selections.length < REQUIRED_SELECTIONS) {
            selections = [...selections, index];
        }
    }
    
    gameState.answers[gameState.currentItem] = selections;
    renderOptions(gameState.items[gameState.currentItem]);
    renderProgressTracker();
}


function goToItem(index) {
    if (index >= 0 && index < TOTAL_ITEMS) {
        gameState.currentItem = index;
        renderCurrentItem();
    }
}

function nextItem() {
    if (gameState.currentItem < TOTAL_ITEMS - 1) {
        goToItem(gameState.currentItem + 1);
    }
}

function prevItem() {
    if (gameState.currentItem > 0) {
        goToItem(gameState.currentItem - 1);
    }
}


function updateTimer() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerDisplay.classList.remove('warning', 'danger');
    if (gameState.timeRemaining <= 60) {
        timerDisplay.classList.add('danger');
    } else if (gameState.timeRemaining <= 180) {
        timerDisplay.classList.add('warning');
    }
}

function startTimer() {
    gameState.startTime = Date.now();
    updateTimer();
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateTimer();
        
        if (gameState.timeRemaining <= 0) {
            endTest();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    gameState.endTime = Date.now();
}


function calculateScore() {
    let correct = 0;
    
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const answer = gameState.answers[i];
        const item = gameState.items[i];
        
        if (answer && answer.length === REQUIRED_SELECTIONS) {
            const sortedAnswer = [...answer].sort((a, b) => a - b);
            const sortedCorrect = [...item.correctIndices].sort((a, b) => a - b);
            
            if (JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect)) {
                correct++;
            }
        }
    }
    
    return correct;
}


function startTest() {
    gameState = {
        items: [],
        currentItem: 0,
        answers: new Array(TOTAL_ITEMS).fill(null),
        timeRemaining: TIME_LIMIT,
        timerInterval: null,
        startTime: null,
        endTime: null
    };
    
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        gameState.items.push(generateItem(i));
    }
    
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    testScreen.classList.remove('hidden');
    
    startTimer();
    renderCurrentItem();
}

function endTest() {
    stopTimer();
    
    const score = calculateScore();
    const normalizedScore = Math.floor(score * 100) / 100;
    const timeElapsed = Math.round((gameState.endTime - gameState.startTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    
    const unanswered = gameState.answers.filter(a => !a || a.length !== REQUIRED_SELECTIONS).length;
    
    scoreValue.textContent = normalizedScore;
    scoreMax.textContent = `out of ${TOTAL_ITEMS}`;
    timeUsed.textContent = `Time used: ${minutes}:${seconds.toString().padStart(2, '0')}${unanswered > 0 ? ` | ${unanswered} unanswered` : ''}`;
    
    breakdownList.innerHTML = '';
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const answer = gameState.answers[i];
        const item = gameState.items[i];
        const isUnanswered = !answer || answer.length !== REQUIRED_SELECTIONS;
        
        let isCorrect = false;
        if (!isUnanswered) {
            const sortedAnswer = [...answer].sort((a, b) => a - b);
            const sortedCorrect = [...item.correctIndices].sort((a, b) => a - b);
            isCorrect = JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect);
        }
        
        const itemEl = document.createElement('div');
        itemEl.className = `breakdown-item ${isCorrect ? 'solved' : 'failed'}`;
        itemEl.innerHTML = `
            <span class="item-num">${i + 1}</span>
            <span class="status">${isCorrect ? 'O' : 'X'}</span>
        `;
        breakdownList.appendChild(itemEl);
    }
    
    localStorage.setItem('brainScore_visualConstruction', normalizedScore);
    submitTestResult(normalizedScore);
    
    testScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
}

function restartTest() {
    endScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}


startBtn.addEventListener('click', () => {
    if (!ageGroupSelect.value) { ageGroupSelect.focus(); ageGroupSelect.style.border = '2px solid red'; return; }
    if (!genderSelect.value) { genderSelect.focus(); genderSelect.style.border = '2px solid red'; return; }
    if (!nicknameInput.value.trim()) { nicknameInput.focus(); nicknameInput.style.border = '2px solid red'; return; }
    ageGroupSelect.style.border = ''; genderSelect.style.border = ''; nicknameInput.style.border = '';
    startTest();
});
prevBtn.addEventListener('click', prevItem);
nextBtn.addEventListener('click', nextItem);
finishBtn.addEventListener('click', endTest);
restartBtn.addEventListener('click', restartTest);

function submitTestResult(score) {
    const form = document.getElementById('testResultForm');
    if (!form) return;
    document.getElementById('formScore').value = score;
    document.getElementById('formAgeGroup').value = ageGroupSelect?.value || '';
    document.getElementById('formGender').value = genderSelect?.value || '';
        document.getElementById('formNickname').value = nicknameInput?.value.trim() || '';
    document.getElementById('formTimestamp').value = new Date().toISOString();
    const formData = new FormData(form);
    fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
    }).catch(err => console.log('Form submission error:', err));
}

document.addEventListener('keydown', (e) => {
    if (testScreen.classList.contains('hidden')) return;
    
    if (e.key === 'ArrowLeft') {
        prevItem();
    } else if (e.key === 'ArrowRight') {
        nextItem();
    } else if (e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key) - 1;
        toggleSelection(index);
    }
});
