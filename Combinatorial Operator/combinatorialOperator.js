document.addEventListener('DOMContentLoaded', function() {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const retryBtn = document.getElementById('retryBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    const currentItemEl = document.getElementById('currentItem');
    const progressFill = document.getElementById('progressFill');
    const numberBoxesEl = document.getElementById('numberBoxes');
    const swapButtonsEl = document.getElementById('swapButtons');
    const finalScoreEl = document.getElementById('finalScore');
    const breakdownList = document.getElementById('breakdownList');
    const timerValueEl = document.getElementById('timerValue');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    let currentItem = 1;
    let totalScore = 0;
    let itemResults = [];
    let currentNumbers = [];
    let currentSwapPairs = [];
    let timerInterval = null;
    let timeRemaining = 45;
    const TOTAL_ITEMS = 20;
    const ITEM_TIME = 45;
    
    const ITEM_CONFIG = [
        3, 3,
        4, 4, 4, 4,
        5, 5, 5, 5, 5, 5,
        6, 6, 6, 6, 6, 6, 6, 6
    ];
    
    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    function isSorted(arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== i + 1) return false;
        }
        return true;
    }
    
    function generateShuffledNumbers(size) {
        const sorted = Array.from({ length: size }, (_, i) => i + 1);
        let shuffled;
        do {
            shuffled = shuffleArray(sorted);
        } while (isSorted(shuffled));
        return shuffled;
    }
    
    function renderNumbers() {
        numberBoxesEl.innerHTML = '';
        currentNumbers.forEach((num, index) => {
            const box = document.createElement('div');
            box.className = 'number-box';
            box.textContent = num;
            box.dataset.index = index;
            
            numberBoxesEl.appendChild(box);
        });
    }
    
    function generateSwapPairs(size) {
        const numButtons = size - 1;
        
        const positions = Array.from({ length: size }, (_, i) => i);
        const shuffledPositions = shuffleArray(positions);
        
        const pairs = [];
        for (let i = 0; i < numButtons; i++) {
            const pos1 = shuffledPositions[i];
            const pos2 = shuffledPositions[i + 1];
            pairs.push([Math.min(pos1, pos2), Math.max(pos1, pos2)]);
        }
        
        return shuffleArray(pairs);
    }
    
    function renderSwapButtons(size) {
        swapButtonsEl.innerHTML = '';
        currentSwapPairs = generateSwapPairs(size);
        
        for (let i = 0; i < currentSwapPairs.length; i++) {
            const [pos1, pos2] = currentSwapPairs[i];
            const btn = document.createElement('button');
            btn.className = 'swap-btn';
            btn.innerHTML = `${pos1 + 1} &#8644; ${pos2 + 1}`;
            btn.dataset.pos1 = pos1;
            btn.dataset.pos2 = pos2;
            btn.addEventListener('click', () => performSwap(pos1, pos2));
            swapButtonsEl.appendChild(btn);
        }
    }
    
    function performSwap(pos1, pos2) {
        [currentNumbers[pos1], currentNumbers[pos2]] = [currentNumbers[pos2], currentNumbers[pos1]];
        
        const boxes = numberBoxesEl.querySelectorAll('.number-box');
        boxes[pos1].classList.add('swapping');
        boxes[pos2].classList.add('swapping');
        
        setTimeout(() => {
            renderNumbers();
            
            if (isSorted(currentNumbers)) {
                solveItem(true);
            }
        }, 150);
    }
    
    function startItem() {
        const size = ITEM_CONFIG[currentItem - 1];
        
        currentNumbers = generateShuffledNumbers(size);
        
        renderNumbers();
        renderSwapButtons(size);
        
        currentItemEl.textContent = currentItem;
        progressFill.style.width = ((currentItem - 1) / TOTAL_ITEMS * 100) + '%';
        
        startTimer();
    }
    
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timeRemaining = ITEM_TIME;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                solveItem(false);
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        timerValueEl.textContent = timeRemaining;
        timerValueEl.classList.remove('warning', 'critical');
        
        if (timeRemaining <= 5) {
            timerValueEl.classList.add('critical');
        } else if (timeRemaining <= 10) {
            timerValueEl.classList.add('warning');
        }
    }
    
    function solveItem(solved) {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        itemResults.push({
            item: currentItem,
            solved: solved,
            size: ITEM_CONFIG[currentItem - 1]
        });
        
        if (solved) {
            totalScore++;
            
            const boxes = numberBoxesEl.querySelectorAll('.number-box');
            boxes.forEach(box => {
                box.classList.remove('correct');
                box.classList.add('solved', 'celebrate');
            });
        }
        
        setTimeout(() => {
            if (currentItem < TOTAL_ITEMS) {
                currentItem++;
                startItem();
            } else {
                showResults();
            }
        }, solved ? 600 : 300);
    }

    function floorToTwoDecimals(value) {
        return Math.floor(value * 100) / 100;
    }

    function showResults() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        gameScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        const normalizedScore = floorToTwoDecimals(totalScore);
        
        finalScoreEl.textContent = normalizedScore;
        
        localStorage.setItem('brainScore_combinatorialOperator', normalizedScore);
        submitTestResult(normalizedScore);
        breakdownList.innerHTML = '';
        itemResults.forEach(({ item, solved }) => {
            const itemEl = document.createElement('div');
            itemEl.className = `breakdown-item ${solved ? 'solved' : 'failed'}`;
            itemEl.innerHTML = `
                <span class="item-num">${item}</span>
                <span class="status">${solved ? 'O' : 'X'}</span>
            `;
            breakdownList.appendChild(itemEl);
        });
    }
    
    function resetGame() {
        currentItem = 1;
        totalScore = 0;
        itemResults = [];
        
        resultsScreen.classList.add('hidden');
        instructionsScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        startItem();
    }
    
    function skipItem() {
        solveItem(false);
    }
    

startBtn.addEventListener('click', () => {
        if (!ageGroupSelect.value) { ageGroupSelect.focus(); ageGroupSelect.style.border = '2px solid red'; return; }
    if (!genderSelect.value) { genderSelect.focus(); genderSelect.style.border = '2px solid red'; return; }
    if (!nicknameInput.value.trim()) { nicknameInput.focus(); nicknameInput.style.border = '2px solid red'; return; }
    ageGroupSelect.style.border = ''; genderSelect.style.border = ''; nicknameInput.style.border = '';
        instructionsScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startItem();
    });
    
    skipBtn.addEventListener('click', skipItem);
    
    retryBtn.addEventListener('click', resetGame);

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
});
