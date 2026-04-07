document.addEventListener('DOMContentLoaded', () => {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const displayScreen = document.getElementById('displayScreen');
    const answerScreen = document.getElementById('answerScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const submitBtn = document.getElementById('submitBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const currentItemSpan = document.getElementById('currentItem');
    const livesSpan = document.getElementById('lives');
    const displayTimer = document.getElementById('displayTimer');
    const gridLabel = document.getElementById('gridLabel');
    const displayGrid = document.getElementById('displayGrid');
    const answerGrid = document.getElementById('answerGrid');
    const finalScoreSpan = document.getElementById('finalScore');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    let currentItem = 0;
    let totalScore = 0;
    let lives = 3;
    let timerInterval = null;
    let grid1 = [];
    let grid2 = [];
    let correctAnswer = [];
    let userAnswer = [];
    const totalItems = 16;

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function showScreen(screen) {
        [instructionsScreen, displayScreen, answerScreen, resultsScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function updateLives() {
        livesSpan.textContent = '❤️ '.repeat(lives).trim() || '💔';
    }

    function generateGrids(n) {
        grid1 = new Array(16).fill(0);
        grid2 = new Array(16).fill(0);
        
        const maxGrid1 = Math.ceil(n / 2);
        const grid1Balls = Math.floor(Math.random() * maxGrid1) + 1;
        const grid2Balls = n - grid1Balls;
        
        const allPositions = shuffle([...Array(16).keys()]);
        
        for (let i = 0; i < grid1Balls; i++) {
            grid1[allPositions[i]] = 1;
        }
        
        const grid2Positions = shuffle([...Array(16).keys()]);
        for (let i = 0; i < grid2Balls; i++) {
            grid2[grid2Positions[i]] = 1;
        }
        
        correctAnswer = [];
        for (let i = 0; i < 16; i++) {
            correctAnswer[i] = grid1[i] + grid2[i];
        }
    }

    function renderDisplayGrid(gridData) {
        displayGrid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (gridData[i] === 1) {
                const ball = document.createElement('div');
                ball.className = 'ball gray';
                cell.appendChild(ball);
            }
            displayGrid.appendChild(cell);
        }
    }

    function renderAnswerGrid() {
        answerGrid.innerHTML = '';
        userAnswer = new Array(16).fill(0);
        
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            cell.addEventListener('click', () => {
                userAnswer[i] = (userAnswer[i] + 1) % 3;
                updateCell(cell, userAnswer[i]);
            });
            
            answerGrid.appendChild(cell);
        }
    }

    function updateCell(cell, value) {
        cell.innerHTML = '';
        if (value === 1) {
            const ball = document.createElement('div');
            ball.className = 'ball gray';
            cell.appendChild(ball);
        } else if (value === 2) {
            const ball = document.createElement('div');
            ball.className = 'ball black';
            cell.appendChild(ball);
        }
    }

    function startTimer(callback) {
        let timeLeft = 5;
        displayTimer.textContent = timeLeft;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            displayTimer.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                callback();
            }
        }, 1000);
    }

    function showGrid1() {
        gridLabel.textContent = 'Grid 1';
        renderDisplayGrid(grid1);
        showScreen(displayScreen);
        startTimer(showGrid2);
    }

    function showGrid2() {
        gridLabel.textContent = 'Grid 2';
        renderDisplayGrid(grid2);
        startTimer(showAnswerPhase);
    }

    function showAnswerPhase() {
        renderAnswerGrid();
        showScreen(answerScreen);
        submitBtn.disabled = false;
    }

    function startItem() {
        const n = currentItem + 1;
        generateGrids(n);
        currentItemSpan.textContent = currentItem + 1;
        showGrid1();
    }

    function submitAnswer() {
        submitBtn.disabled = true;
        
        let isCorrect = true;
        const cells = answerGrid.querySelectorAll('.cell');
        
        for (let i = 0; i < 16; i++) {
            if (userAnswer[i] === correctAnswer[i]) {
                cells[i].classList.add('correct');
            } else {
                cells[i].classList.add('wrong');
                isCorrect = false;
            }
        }
        
        if (isCorrect) {
            totalScore++;
            currentItem++;
        } else {
            lives--;
            updateLives();
        }
        
        cells.forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
        
        setTimeout(() => {
            if (lives <= 0 || currentItem >= totalItems) {
                showResults();
            } else {
                startItem();
            }
        }, 1200);
    }

    function floorToTwoDecimals(value) {
        return Math.floor(value * 100) / 100;
    }

    function showResults() {
        const normalizedScore = floorToTwoDecimals(totalScore);
        finalScoreSpan.textContent = normalizedScore;
        
        localStorage.setItem('brainScore_spatialAddition', normalizedScore);
        submitTestResult(normalizedScore);
        showScreen(resultsScreen);
    }

    function resetGame() {
        currentItem = 0;
        totalScore = 0;
        lives = 3;
        grid1 = [];
        grid2 = [];
        correctAnswer = [];
        userAnswer = [];
        updateLives();
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }


startBtn.addEventListener('click', () => {
        if (!ageGroupSelect.value) { ageGroupSelect.focus(); ageGroupSelect.style.border = '2px solid red'; return; }
    if (!genderSelect.value) { genderSelect.focus(); genderSelect.style.border = '2px solid red'; return; }
    if (!nicknameInput.value.trim()) { nicknameInput.focus(); nicknameInput.style.border = '2px solid red'; return; }
    ageGroupSelect.style.border = ''; genderSelect.style.border = ''; nicknameInput.style.border = '';
        resetGame();
        startItem();
    });

    submitBtn.addEventListener('click', submitAnswer);

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
