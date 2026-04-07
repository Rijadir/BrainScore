document.addEventListener('DOMContentLoaded', () => {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const countdownScreen = document.getElementById('countdownScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const countdownNumber = document.getElementById('countdownNumber');
    const currentScoreSpan = document.getElementById('currentScore');
    const timerSpan = document.getElementById('timer');
    const symbolDisplay = document.getElementById('symbolDisplay');
    const feedback = document.getElementById('feedback');
    const finalScoreSpan = document.getElementById('finalScore');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    const keys = ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p'];
    
    const allSymbols = ['▲', '●', '■', '★', '♠', '♥', '♣', '◆'];

    let symbolMap = {};
    let keyMap = {};
    let symbols = [];
    const validKeys = keys;

    let score = 0;
    let timeLeft = 60;
    let timerInterval = null;
    let currentSymbol = '';
    let gameActive = false;

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function generateMapping() {
        const shuffledSymbols = shuffle(allSymbols);
        symbolMap = {};
        keyMap = {};
        
        for (let i = 0; i < keys.length; i++) {
            symbolMap[keys[i]] = shuffledSymbols[i];
            keyMap[shuffledSymbols[i]] = keys[i];
        }
        
        symbols = shuffledSymbols;
    }

    function updateLegend() {
        const allKeys = ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p'];
        
        const instructionRow = document.querySelector('.key-mapping .key-row');
        if (instructionRow) {
            instructionRow.innerHTML = allKeys.slice(0, 4).map(k => 
                `<div class="key-box"><span class="symbol">${symbolMap[k]}</span></div>`
            ).join('') + 
            '<span class="key-separator"></span>' +
            allKeys.slice(4).map(k => 
                `<div class="key-box"><span class="symbol">${symbolMap[k]}</span></div>`
            ).join('');
        }
        
        const gameLegendRow = document.querySelector('.key-legend .legend-row');
        if (gameLegendRow) {
            gameLegendRow.innerHTML = allKeys.slice(0, 4).map(k => 
                `<div class="legend-box">${symbolMap[k]}</div>`
            ).join('') + 
            '<span class="legend-separator"></span>' +
            allKeys.slice(4).map(k => 
                `<div class="legend-box">${symbolMap[k]}</div>`
            ).join('');
        }
    }

    function showScreen(screen) {
        [instructionsScreen, countdownScreen, gameScreen, resultsScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function updateScore() {
        currentScoreSpan.textContent = score;
    }

    function updateTimer() {
        timerSpan.textContent = timeLeft;
    }

    function getRandomSymbol() {
        const availableSymbols = symbols.filter(s => s !== currentSymbol);
        return availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
    }

    function showNextSymbol() {
        currentSymbol = getRandomSymbol();
        symbolDisplay.textContent = currentSymbol;
    }

    function showFeedback(isCorrect) {
        feedback.textContent = isCorrect ? '+1' : '-1';
        feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = 'feedback';
        }, 200);
    }

    function handleKeyPress(e) {
        if (!gameActive) return;
        
        const key = e.key.toLowerCase();
        
        if (!validKeys.includes(key)) return;
        
        const correctKey = keyMap[currentSymbol];
        
        if (key === correctKey) {
            score++;
            showFeedback(true);
        } else {
            score--;
            showFeedback(false);
        }
        
        updateScore();
        showNextSymbol();
    }

    function startCountdown() {
        showScreen(countdownScreen);
        let count = 3;
        countdownNumber.textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
            } else {
                clearInterval(countInterval);
                startGame();
            }
        }, 1000);
    }

    function startGame() {
        score = 0;
        timeLeft = 60;
        gameActive = true;
        
        updateScore();
        updateTimer();
        showNextSymbol();
        showScreen(gameScreen);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
        
        document.addEventListener('keydown', handleKeyPress);
    }

    function floorToTwoDecimals(value) {
        return Math.floor(value * 100) / 100;
    }

    function endGame() {
        gameActive = false;
        clearInterval(timerInterval);
        document.removeEventListener('keydown', handleKeyPress);
        const normalizedScore = floorToTwoDecimals(score);
        
        finalScoreSpan.textContent = normalizedScore;
        
        localStorage.setItem('brainScore_symbolSprint', normalizedScore);
        submitTestResult(normalizedScore);
        showScreen(resultsScreen);
    }

    function resetGame() {
        score = 0;
        timeLeft = 60;
        gameActive = false;
        currentSymbol = '';
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        document.removeEventListener('keydown', handleKeyPress);
        
        generateMapping();
        updateLegend();
    }

    generateMapping();
    updateLegend();


startBtn.addEventListener('click', () => {
        if (!ageGroupSelect.value) { ageGroupSelect.focus(); ageGroupSelect.style.border = '2px solid red'; return; }
    if (!genderSelect.value) { genderSelect.focus(); genderSelect.style.border = '2px solid red'; return; }
    if (!nicknameInput.value.trim()) { nicknameInput.focus(); nicknameInput.style.border = '2px solid red'; return; }
    ageGroupSelect.style.border = ''; genderSelect.style.border = ''; nicknameInput.style.border = '';
        startCountdown();
    });

    retryBtn.addEventListener('click', () => {
        resetGame();
        showScreen(instructionsScreen);
    });

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
