const TOTAL_ITEMS = 20;
const TIME_LIMIT = 15 * 60;
const NUM_OPTIONS = 8;


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


function createEmptyGrid(n) {
    return Array.from({ length: n }, () => Array(n).fill(false));
}

function cloneGrid(grid) {
    return grid.map(row => [...row]);
}

function isValidPos(grid, r, c) {
    const n = grid.length;
    return r >= 0 && r < n && c >= 0 && c < n;
}

function getNeighbors(r, c) {
    return [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
}

function isContiguous(grid) {
    const n = grid.length;
    const filledCells = [];
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c]) {
                filledCells.push([r, c]);
            }
        }
    }
    
    if (filledCells.length === 0) return true;
    
    const visited = new Set();
    const queue = [filledCells[0]];
    visited.add(`${filledCells[0][0]},${filledCells[0][1]}`);
    
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        
        for (const [nr, nc] of getNeighbors(r, c)) {
            const key = `${nr},${nc}`;
            if (isValidPos(grid, nr, nc) && grid[nr][nc] && !visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }
    
    return visited.size === filledCells.length;
}

function countFilled(grid) {
    let count = 0;
    for (const row of grid) {
        for (const cell of row) {
            if (cell) count++;
        }
    }
    return count;
}

function generateContiguousFigure(n, minFilled, rng) {
    const grid = createEmptyGrid(n);
    
    const startR = rng.nextInt(n);
    const startC = rng.nextInt(n);
    grid[startR][startC] = true;
    
    const filledSet = new Set([`${startR},${startC}`]);
    const frontier = [];
    
    function addToFrontier(r, c) {
        for (const [nr, nc] of getNeighbors(r, c)) {
            const key = `${nr},${nc}`;
            if (isValidPos(grid, nr, nc) && !grid[nr][nc] && !frontier.some(([fr, fc]) => fr === nr && fc === nc)) {
                frontier.push([nr, nc]);
            }
        }
    }
    
    addToFrontier(startR, startC);
    
    while (filledSet.size < minFilled && frontier.length > 0) {
        const idx = rng.nextInt(frontier.length);
        const [r, c] = frontier.splice(idx, 1)[0];
        
        if (!grid[r][c]) {
            grid[r][c] = true;
            filledSet.add(`${r},${c}`);
            addToFrontier(r, c);
        }
    }
    
    const maxFilled = Math.floor(n * n * 0.7);
    const extraCells = rng.nextInt(Math.min(maxFilled - filledSet.size, n * 2) + 1);
    
    for (let i = 0; i < extraCells && frontier.length > 0; i++) {
        const idx = rng.nextInt(frontier.length);
        const [r, c] = frontier.splice(idx, 1)[0];
        
        if (!grid[r][c]) {
            grid[r][c] = true;
            filledSet.add(`${r},${c}`);
            addToFrontier(r, c);
        }
    }
    
    return grid;
}

function getOutlineCells(grid) {
    const n = grid.length;
    const outline = [];
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c]) {
                let isOutline = r === 0 || r === n-1 || c === 0 || c === n-1;
                
                if (!isOutline) {
                    for (const [nr, nc] of getNeighbors(r, c)) {
                        if (isValidPos(grid, nr, nc) && !grid[nr][nc]) {
                            isOutline = true;
                            break;
                        }
                    }
                }
                
                if (isOutline) {
                    outline.push([r, c]);
                }
            }
        }
    }
    
    return outline;
}

function getAdjacentEmptyCells(grid) {
    const n = grid.length;
    const adjacent = [];
    const seen = new Set();
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c]) {
                for (const [nr, nc] of getNeighbors(r, c)) {
                    const key = `${nr},${nc}`;
                    if (isValidPos(grid, nr, nc) && !grid[nr][nc] && !seen.has(key)) {
                        seen.add(key);
                        adjacent.push([nr, nc]);
                    }
                }
            }
        }
    }
    
    return adjacent;
}

function rotateGrid90(grid) {
    const n = grid.length;
    const rotated = createEmptyGrid(n);
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            rotated[c][n - 1 - r] = grid[r][c];
        }
    }
    
    return rotated;
}

function mirrorGridH(grid) {
    const n = grid.length;
    const mirrored = createEmptyGrid(n);
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            mirrored[r][n - 1 - c] = grid[r][c];
        }
    }
    
    return mirrored;
}

function mirrorGridV(grid) {
    const n = grid.length;
    const mirrored = createEmptyGrid(n);
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            mirrored[n - 1 - r][c] = grid[r][c];
        }
    }
    
    return mirrored;
}

function applyRandomTransform(grid, rng) {
    let result = cloneGrid(grid);
    
    const rotations = rng.nextInt(4);
    for (let i = 0; i < rotations; i++) {
        result = rotateGrid90(result);
    }
    
    const mirrorType = rng.nextInt(4);
    if (mirrorType === 1 || mirrorType === 3) {
        result = mirrorGridH(result);
    }
    if (mirrorType === 2 || mirrorType === 3) {
        result = mirrorGridV(result);
    }
    
    return result;
}

function createOddVersion(grid, rng) {
    const oddGrid = cloneGrid(grid);
    
    const outlineCells = getOutlineCells(grid);
    const adjacentEmpty = getAdjacentEmptyCells(grid);
    
    const removable = outlineCells.filter(([r, c]) => {
        const testGrid = cloneGrid(grid);
        testGrid[r][c] = false;
        return isContiguous(testGrid) && countFilled(testGrid) >= Math.floor(grid.length * grid.length / 2) - 1;
    });
    
    const canRemove = removable.length > 0;
    const canAdd = adjacentEmpty.length > 0;
    
    if (canRemove && canAdd) {
        if (rng.next() < 0.5) {
            const [r, c] = rng.choice(removable);
            oddGrid[r][c] = false;
        } else {
            const [r, c] = rng.choice(adjacentEmpty);
            oddGrid[r][c] = true;
        }
    } else if (canRemove) {
        const [r, c] = rng.choice(removable);
        oddGrid[r][c] = false;
    } else if (canAdd) {
        const [r, c] = rng.choice(adjacentEmpty);
        oddGrid[r][c] = true;
    }
    
    return oddGrid;
}

function gridsEqual(grid1, grid2) {
    const n = grid1.length;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid1[r][c] !== grid2[r][c]) return false;
        }
    }
    return true;
}

function generateItem(itemIndex, rng) {
    const n = 4 + itemIndex;
    const minFilled = Math.floor((n * n) / 2);
    
    const baseFigure = generateContiguousFigure(n, minFilled, rng);
    
    const oddFigure = createOddVersion(baseFigure, rng);
    
    const options = [];
    
    const oddPosition = rng.nextInt(NUM_OPTIONS);
    
    for (let i = 0; i < NUM_OPTIONS; i++) {
        if (i === oddPosition) {
            const transformed = applyRandomTransform(oddFigure, rng);
            options.push({ grid: transformed, isOdd: true });
        } else {
            const transformed = applyRandomTransform(baseFigure, rng);
            options.push({ grid: transformed, isOdd: false });
        }
    }
    
    const displayFigure = applyRandomTransform(baseFigure, rng);
    
    return {
        n,
        displayFigure,
        options,
        correctAnswer: oddPosition
    };
}


let items = [];
let currentItem = 0;
let userAnswers = [];
let timeRemaining = TIME_LIMIT;
let timerInterval = null;
let testStarted = false;
let startTime = null;

const startScreen = document.getElementById('start-screen');
const testScreen = document.getElementById('test-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer');
const progressTracker = document.getElementById('progress-tracker');
const itemCounter = document.getElementById('item-counter');
const answersGrid = document.getElementById('answers-grid');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreValue = document.getElementById('score-value');
const timeUsed = document.getElementById('time-used');
const breakdownList = document.getElementById('breakdownList');
const ageGroupSelect = document.getElementById('ageGroup');
const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');


function initializeGame() {
    const seed = Date.now() % 1000000;
    const rng = new SeededRandom(seed);
    
    items = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        items.push(generateItem(i, rng));
    }
    
    userAnswers = Array(TOTAL_ITEMS).fill(null);
    currentItem = 0;
    timeRemaining = TIME_LIMIT;
    testStarted = false;
    
    createProgressTracker();
    updateDisplay();
}

function createProgressTracker() {
    progressTracker.innerHTML = '';
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.textContent = i + 1;
        item.addEventListener('click', () => goToItem(i));
        progressTracker.appendChild(item);
    }
}


const TARGET_GRID_SIZE = 140;
const OPTION_GRID_SIZE = 160;

function renderGrid(container, grid, cellClass = 'target-cell', gridSize = TARGET_GRID_SIZE) {
    const n = grid.length;
    container.innerHTML = '';
    
    const cellSize = Math.floor(gridSize / n);
    
    container.style.gridTemplateColumns = `repeat(${n}, ${cellSize}px)`;
    container.style.width = `${cellSize * n}px`;
    container.style.height = `${cellSize * n}px`;
    
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = cellClass;
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            if (grid[r][c]) {
                cell.classList.add('filled');
            }
            container.appendChild(cell);
        }
    }
}

function updateDisplay() {
    const item = items[currentItem];
    
    itemCounter.textContent = `Item ${currentItem + 1} of ${TOTAL_ITEMS}`;
    
    document.querySelectorAll('.progress-item').forEach((el, i) => {
        el.className = 'progress-item';
        if (i === currentItem) {
            el.classList.add('current');
        } else if (userAnswers[i] !== null) {
            el.classList.add('answered');
        }
    });
    
    answersGrid.innerHTML = '';
    item.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        if (userAnswers[currentItem] === index) {
            optionDiv.classList.add('selected');
        }
        
        const numberLabel = document.createElement('div');
        numberLabel.className = 'option-number';
        numberLabel.textContent = `Option ${index + 1}`;
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'shape-grid';
        renderGrid(gridDiv, option.grid, 'shape-cell', OPTION_GRID_SIZE);
        
        optionDiv.appendChild(numberLabel);
        optionDiv.appendChild(gridDiv);
        
        optionDiv.addEventListener('click', () => selectAnswer(index));
        answersGrid.appendChild(optionDiv);
    });
    
    prevBtn.disabled = currentItem === 0;
    
    if (currentItem === TOTAL_ITEMS - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        finishBtn.style.display = 'none';
    }
}

function selectAnswer(index) {
    if (userAnswers[currentItem] === index) {
        userAnswers[currentItem] = null;
    } else {
        userAnswers[currentItem] = index;
    }
    updateDisplay();
}


function goToItem(index) {
    if (index >= 0 && index < TOTAL_ITEMS) {
        currentItem = index;
        updateDisplay();
    }
}

function nextItem() {
    if (currentItem < TOTAL_ITEMS - 1) {
        currentItem++;
        updateDisplay();
    }
}

function prevItem() {
    if (currentItem > 0) {
        currentItem--;
        updateDisplay();
    }
}


function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            endTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerDisplay.classList.remove('warning', 'danger');
    if (timeRemaining <= 60) {
        timerDisplay.classList.add('danger');
    } else if (timeRemaining <= 180) {
        timerDisplay.classList.add('warning');
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


function startTest() {
    testStarted = true;
    
    startScreen.classList.add('hidden');
    testScreen.classList.remove('hidden');
    
    initializeGame();
    startTimer();
}

function endTest() {
    stopTimer();
    
    testScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    
    calculateAndDisplayResults();
}

function calculateAndDisplayResults() {
    let score = 0;
    const results = [];
    
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const isCorrect = userAnswers[i] === items[i].correctAnswer;
        if (isCorrect) score++;
        results.push({ itemNum: i + 1, correct: isCorrect });
    }
    
    scoreValue.textContent = score;
    
    const totalTime = TIME_LIMIT - timeRemaining;
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    timeUsed.textContent = `Time used: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    breakdownList.innerHTML = '';
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = `breakdown-item ${result.correct ? 'solved' : 'failed'}`;
        item.innerHTML = `
            <span class="item-num">#${result.itemNum}</span>
            <span class="status">${result.correct ? '✓' : '✗'}</span>
        `;
        breakdownList.appendChild(item);
    });
    
    localStorage.setItem('brainScore_figureRotation', score);
    submitTestResult(score);
}

function restartTest() {
    endScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    timerDisplay.textContent = '20:00';
    timerDisplay.classList.remove('warning', 'danger');
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
    if (!testStarted || testScreen.classList.contains('hidden')) return;
    
    if (e.key === 'ArrowLeft') {
        prevItem();
    } else if (e.key === 'ArrowRight') {
        nextItem();
    } else if (e.key >= '1' && e.key <= '8') {
        selectAnswer(parseInt(e.key) - 1);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const seed = Date.now() % 1000000;
    const rng = new SeededRandom(seed);
    items = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        items.push(generateItem(i, rng));
    }
});
