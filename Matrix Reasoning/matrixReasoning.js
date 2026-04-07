const TOTAL_ITEMS = 20;
const TIME_LIMIT = 20 * 60;
const COLORS = ['red', 'blue', 'yellow'];
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


let gameState = {
    items: [],
    currentItem: 0,
    answers: new Array(TOTAL_ITEMS).fill(null),
    itemStates: new Array(TOTAL_ITEMS).fill('unseen'),
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
const matrixContainer = document.getElementById('matrix');
const answersGrid = document.getElementById('answers-grid');
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


function getDifficultyForItem(itemIndex) {
    return Math.floor((itemIndex + 1) / 2);
}


const SYMBOL_WEIGHTS = { 0: 0, 1: 1, 2: 2 };
const COLOR_WEIGHTS = { 0: 0, 1: 1, 2: 2 };


function generateSymbolConfig0(rng) {
    return Array(9).fill(true);
}

function generateSymbolConfig1(rng) {
    const row = rng.nextInt(3);
    const col = rng.nextInt(3);
    
    const pattern = Array(9).fill(false);
    for (let cellIdx = 0; cellIdx < 9; cellIdx++) {
        const cellRow = Math.floor(cellIdx / 3);
        const cellCol = cellIdx % 3;
        if (cellRow === row || cellCol === col) {
            pattern[cellIdx] = true;
        }
    }
    return pattern;
}

function generateSymbolConfig2(rng) {
    
    const offColumns = rng.shuffle([0, 1, 2]);
    
    const pattern = Array(9).fill(true);
    for (let row = 0; row < 3; row++) {
        const offCol = offColumns[row];
        const cellIdx = row * 3 + offCol;
        pattern[cellIdx] = false;
    }
    
    return pattern;
}


function generateColorConfig0(rng, symbolPattern) {
    const color = rng.choice(COLORS);
    return symbolPattern.map(isOn => isOn ? color : null);
}

function generateColorConfig1(rng, symbolPattern) {
    const isRowBased = rng.next() > 0.5;
    const rowColors = rng.shuffle([...COLORS]);
    const colColors = rng.shuffle([...COLORS]);
    
    return symbolPattern.map((isOn, cellIdx) => {
        if (!isOn) return null;
        const cellRow = Math.floor(cellIdx / 3);
        const cellCol = cellIdx % 3;
        return isRowBased ? rowColors[cellRow] : colColors[cellCol];
    });
}

function generateColorConfig2(rng, symbolPattern) {
    
    const shuffledColors = rng.shuffle([...COLORS]);
    const offset = rng.nextInt(3);
    
    const latinSquare = [
        [shuffledColors[(0 + offset) % 3], shuffledColors[(1 + offset) % 3], shuffledColors[(2 + offset) % 3]],
        [shuffledColors[(1 + offset) % 3], shuffledColors[(2 + offset) % 3], shuffledColors[(0 + offset) % 3]],
        [shuffledColors[(2 + offset) % 3], shuffledColors[(0 + offset) % 3], shuffledColors[(1 + offset) % 3]]
    ];
    
    const rowOrder = rng.shuffle([0, 1, 2]);
    const colOrder = rng.shuffle([0, 1, 2]);
    
    return symbolPattern.map((isOn, cellIdx) => {
        if (!isOn) return null;
        const cellRow = Math.floor(cellIdx / 3);
        const cellCol = cellIdx % 3;
        return latinSquare[rowOrder[cellRow]][colOrder[cellCol]];
    });
}


function generateItem(itemIndex) {
    const seed = Math.floor(Math.random() * 1000000) + itemIndex;
    const rng = new SeededRandom(seed);
    
    const targetDifficulty = getDifficultyForItem(itemIndex);
    
    const subcellConfigs = selectSubcellConfigs(rng, targetDifficulty);
    
    const matrix = Array(9).fill(null).map(() => Array(9).fill(null));
    
    for (const config of subcellConfigs) {
        const { subcellPos, symbolConfig, colorConfig } = config;
        
        let symbolPattern;
        switch (symbolConfig) {
            case 0: symbolPattern = generateSymbolConfig0(rng); break;
            case 1: symbolPattern = generateSymbolConfig1(rng); break;
            case 2: symbolPattern = generateSymbolConfig2(rng); break;
        }
        
        let colorPattern;
        switch (colorConfig) {
            case 0: colorPattern = generateColorConfig0(rng, symbolPattern); break;
            case 1: colorPattern = generateColorConfig1(rng, symbolPattern); break;
            case 2: colorPattern = generateColorConfig2(rng, symbolPattern); break;
        }
        
        for (let bigCellIdx = 0; bigCellIdx < 9; bigCellIdx++) {
            matrix[bigCellIdx][subcellPos] = colorPattern[bigCellIdx];
        }
    }
    
    ensureContent(rng, matrix);
    
    const correctAnswer = matrix[8].slice();
    
    const distractors = generateDistractors(rng, matrix, correctAnswer, subcellConfigs);
    
    const correctIndex = rng.nextInt(NUM_OPTIONS);
    const options = [...distractors];
    options.splice(correctIndex, 0, correctAnswer);
    
    while (options.length > NUM_OPTIONS) options.pop();
    
    const usedSerialized = new Set(options.map(o => JSON.stringify(o)));
    let fallbackAttempts = 0;
    while (options.length < NUM_OPTIONS && fallbackAttempts < 100) {
        fallbackAttempts++;
        const fallback = [...correctAnswer];
        const idx = rng.nextInt(9);
        
        if (fallback[idx] === null) {
            fallback[idx] = rng.choice(COLORS);
        } else {
            if (rng.next() < 0.5) {
                fallback[idx] = null;
            } else {
                const otherColors = COLORS.filter(c => c !== fallback[idx]);
                fallback[idx] = rng.choice(otherColors);
            }
        }
        
        const serialized = JSON.stringify(fallback);
        const diffCount = countDifferences(correctAnswer, fallback);
        
        if (diffCount === 1 && !usedSerialized.has(serialized) && hasVisibleContent(fallback)) {
            usedSerialized.add(serialized);
            options.push(fallback);
        }
    }
    
    return {
        matrix,
        options,
        correctIndex,
        difficulty: targetDifficulty,
        subcellConfigs
    };
}

function selectSubcellConfigs(rng, targetDifficulty) {
    const configs = [];
    let currentWeight = 0;
    
    const positions = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    let posIdx = 0;
    
    while (currentWeight < targetDifficulty && posIdx < 9) {
        const remaining = targetDifficulty - currentWeight;
        
        let symbolConfig, colorConfig;
        
        if (remaining >= 4) {
            symbolConfig = rng.nextInt(3);
            colorConfig = rng.nextInt(3);
        } else if (remaining >= 2) {
            symbolConfig = rng.nextInt(2);
            colorConfig = rng.nextInt(2);
        } else {
            symbolConfig = remaining > 0 ? 1 : 0;
            colorConfig = 0;
        }
        
        const weight = SYMBOL_WEIGHTS[symbolConfig] + COLOR_WEIGHTS[colorConfig];
        
        if (currentWeight + weight <= targetDifficulty + 1) {
            configs.push({
                subcellPos: positions[posIdx],
                symbolConfig,
                colorConfig
            });
            currentWeight += weight;
            posIdx++;
        } else {
            symbolConfig = 0;
            colorConfig = 0;
            configs.push({
                subcellPos: positions[posIdx],
                symbolConfig,
                colorConfig
            });
            posIdx++;
        }
        
        if (configs.length >= Math.min(targetDifficulty + 1, 6)) break;
    }
    
    if (configs.length === 0) {
        configs.push({
            subcellPos: positions[0],
            symbolConfig: 0,
            colorConfig: 0
        });
    }
    
    return configs;
}

function ensureContent(rng, matrix) {
    let hasContent = false;
    for (let i = 0; i < 8; i++) {
        if (matrix[i].some(c => c !== null)) {
            hasContent = true;
            break;
        }
    }
    
    if (!hasContent) {
        const pos = rng.nextInt(9);
        const color = rng.choice(COLORS);
        for (let i = 0; i < 9; i++) {
            matrix[i][pos] = color;
        }
    }
}


function hasVisibleContent(cell) {
    return cell.some(c => c !== null);
}

function countDifferences(cell1, cell2) {
    let diff = 0;
    for (let i = 0; i < 9; i++) {
        const a = cell1[i];
        const b = cell2[i];
        
        if ((a === null) !== (b === null)) {
            diff++;
        } else if (a !== null && b !== null && a !== b) {
            diff++;
        }
    }
    return diff;
}

function generateDistractors(rng, matrix, correctAnswer, subcellConfigs) {
    const distractors = [];
    const usedSerialized = new Set([JSON.stringify(correctAnswer)]);
    
    
    const allPossible = [];
    
    for (let idx = 0; idx < 9; idx++) {
        const current = correctAnswer[idx];
        
        if (current === null) {
            for (const color of COLORS) {
                const d = [...correctAnswer];
                d[idx] = color;
                allPossible.push(d);
            }
        } else {
            const dOff = [...correctAnswer];
            dOff[idx] = null;
            allPossible.push(dOff);
            
            for (const color of COLORS) {
                if (color !== current) {
                    const d = [...correctAnswer];
                    d[idx] = color;
                    allPossible.push(d);
                }
            }
        }
    }
    
    const shuffled = rng.shuffle(allPossible);
    
    for (const distractor of shuffled) {
        if (distractors.length >= NUM_OPTIONS - 1) break;
        
        const serialized = JSON.stringify(distractor);
        if (!usedSerialized.has(serialized) && hasVisibleContent(distractor)) {
            const diffCount = countDifferences(correctAnswer, distractor);
            if (diffCount === 1) {
                usedSerialized.add(serialized);
                distractors.push(distractor);
            }
        }
    }
    
    return distractors;
}


function renderMatrix(item) {
    matrixContainer.innerHTML = '';
    
    for (let cellIdx = 0; cellIdx < 9; cellIdx++) {
        const bigCell = document.createElement('div');
        
        if (cellIdx === 8) {
            bigCell.className = 'big-cell missing';
            bigCell.textContent = '?';
        } else {
            bigCell.className = 'big-cell';
            
            for (let subcellIdx = 0; subcellIdx < 9; subcellIdx++) {
                const subcell = document.createElement('div');
                subcell.className = 'subcell';
                
                const color = item.matrix[cellIdx][subcellIdx];
                if (color) {
                    subcell.classList.add(color);
                }
                
                bigCell.appendChild(subcell);
            }
        }
        
        matrixContainer.appendChild(bigCell);
    }
}

function renderAnswerOption(cell) {
    const option = document.createElement('div');
    option.className = 'answer-option';
    
    for (let subcellIdx = 0; subcellIdx < 9; subcellIdx++) {
        const subcell = document.createElement('div');
        subcell.className = 'subcell';
        
        const color = cell[subcellIdx];
        if (color) {
            subcell.classList.add(color);
        }
        
        option.appendChild(subcell);
    }
    
    return option;
}

function renderAnswers(options, selectedIndex) {
    answersGrid.innerHTML = '';
    
    options.forEach((option, index) => {
        const optionElement = renderAnswerOption(option);
        
        if (selectedIndex === index) {
            optionElement.classList.add('selected');
        }
        
        optionElement.addEventListener('click', () => selectAnswer(index));
        answersGrid.appendChild(optionElement);
    });
}

function renderProgressTracker() {
    progressTracker.innerHTML = '';
    
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.textContent = i + 1;
        
        if (i === gameState.currentItem) {
            item.classList.add('current');
        } else if (gameState.answers[i] !== null) {
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


function selectAnswer(index) {
    gameState.answers[gameState.currentItem] = index;
    gameState.itemStates[gameState.currentItem] = 'answered';
    renderAnswers(gameState.items[gameState.currentItem].options, index);
    renderProgressTracker();
}

function goToItem(index) {
    if (index >= 0 && index < TOTAL_ITEMS) {
        gameState.currentItem = index;
        renderCurrentItem();
    }
}

function renderCurrentItem() {
    const item = gameState.items[gameState.currentItem];
    renderMatrix(item);
    renderAnswers(item.options, gameState.answers[gameState.currentItem]);
    renderProgressTracker();
    updateItemCounter();
    updateNavigationButtons();
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
        if (answer !== null && answer === gameState.items[i].correctIndex) {
            correct++;
        }
    }
    
    return correct;
}


function startTest() {
    gameState = {
        items: [],
        currentItem: 0,
        answers: new Array(TOTAL_ITEMS).fill(null),
        itemStates: new Array(TOTAL_ITEMS).fill('unseen'),
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
    
    const unanswered = gameState.answers.filter(a => a === null).length;
    
    scoreValue.textContent = normalizedScore;
    scoreMax.textContent = `out of ${TOTAL_ITEMS}`;
    timeUsed.textContent = `Time used: ${minutes}:${seconds.toString().padStart(2, '0')}${unanswered > 0 ? ` | ${unanswered} unanswered` : ''}`;
    
    breakdownList.innerHTML = '';
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        const answer = gameState.answers[i];
        const correctIndex = gameState.items[i].correctIndex;
        const isCorrect = answer !== null && answer === correctIndex;
        
        const itemEl = document.createElement('div');
        itemEl.className = `breakdown-item ${isCorrect ? 'solved' : 'failed'}`;
        itemEl.innerHTML = `
            <span class="item-num">${i + 1}</span>
            <span class="status">${isCorrect ? 'O' : 'X'}</span>
        `;
        breakdownList.appendChild(itemEl);
    }
    
    localStorage.setItem('brainScore_matrixReasoning', normalizedScore);
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
        selectAnswer(index);
    }
});
