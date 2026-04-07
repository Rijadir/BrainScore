document.addEventListener('DOMContentLoaded', () => {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const studyScreen = document.getElementById('studyScreen');
    const testScreen = document.getElementById('testScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const submitBtn = document.getElementById('submitBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const currentItemSpan = document.getElementById('currentItem');
    const studyTimer = document.getElementById('studyTimer');
    const studyGrid = document.getElementById('studyGrid');
    const testGrid = document.getElementById('testGrid');
    const finalScoreSpan = document.getElementById('finalScore');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    let currentItem = 0;
    let totalScore = 0;
    let timerInterval = null;
    let currentCoding = {};
    let currentSymbols = [];
    const itemConfigs = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
    
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
    const numbers = '123456789'.split('');

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function showScreen(screen) {
        [instructionsScreen, studyScreen, testScreen, resultsScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function generateCoding(n) {
        const selectedLetters = shuffle(letters).slice(0, n);
        const selectedNumbers = shuffle(numbers).slice(0, n);
        
        currentCoding = {};
        for (let i = 0; i < n; i++) {
            currentCoding[selectedLetters[i]] = selectedNumbers[i];
            currentCoding[selectedNumbers[i]] = selectedLetters[i];
        }
        
        return {
            letters: selectedLetters,
            numbers: selectedNumbers
        };
    }

    function renderStudyGrid(pairs) {
        studyGrid.innerHTML = '';
        
        for (let i = 0; i < pairs.letters.length; i++) {
            const column = document.createElement('div');
            column.className = 'coding-column';
            column.innerHTML = `
                <span class="symbol">${pairs.letters[i]}</span>
                <div class="link-line"></div>
                <span class="number">${pairs.numbers[i]}</span>
            `;
            studyGrid.appendChild(column);
        }
    }

    function renderTestGrid(pairs) {
        testGrid.innerHTML = '';
        
        const n = itemConfigs[currentItem];
        const allSymbols = [...pairs.letters, ...pairs.numbers];
        const shuffled = shuffle(allSymbols);
        
        currentSymbols = [];
        const usedEquivalents = new Set();
        
        for (const symbol of shuffled) {
            if (currentSymbols.length >= n) break;
            const equivalent = currentCoding[symbol];
            if (!usedEquivalents.has(symbol)) {
                currentSymbols.push(symbol);
                usedEquivalents.add(equivalent);
            }
        }
        
        for (let i = 0; i < currentSymbols.length; i++) {
            const column = document.createElement('div');
            column.className = 'coding-column';
            column.innerHTML = `
                <span class="symbol">${currentSymbols[i]}</span>
                <div class="link-line"></div>
                <input type="text" class="answer-input" maxlength="1" data-index="${i}" autocomplete="off">
            `;
            testGrid.appendChild(column);
        }

        const firstInput = testGrid.querySelector('.answer-input');
        if (firstInput) {
            firstInput.focus();
        }

        const inputs = testGrid.querySelectorAll('.answer-input');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
                if (e.target.value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    } else {
                        submitAnswer();
                    }
                }
            });
        });
    }

    function startTimer() {
        let timeLeft = 10;
        studyTimer.textContent = timeLeft;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            studyTimer.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                startTestPhase();
            }
        }, 1000);
    }

    function startItem() {
        const n = itemConfigs[currentItem];
        const pairs = generateCoding(n);
        
        currentItemSpan.textContent = currentItem + 1;
        renderStudyGrid(pairs);
        
        showScreen(studyScreen);
        startTimer();
    }

    function startTestPhase() {
        const n = itemConfigs[currentItem];
        const pairs = {
            letters: Object.keys(currentCoding).filter(k => letters.includes(k)),
            numbers: Object.keys(currentCoding).filter(k => numbers.includes(k))
        };
        
        renderTestGrid(pairs);
        showScreen(testScreen);
    }

    function submitAnswer() {
        const inputs = testGrid.querySelectorAll('.answer-input');
        let itemScore = 0;
        
        inputs.forEach((input, index) => {
            const symbol = currentSymbols[index];
            const correctAnswer = currentCoding[symbol];
            const userAnswer = input.value.toUpperCase();
            
            if (userAnswer === correctAnswer) {
                input.classList.add('correct');
                itemScore++;
            } else {
                input.classList.add('wrong');
            }
            input.disabled = true;
        });
        
        totalScore += itemScore;
        
        setTimeout(() => {
            currentItem++;
            if (currentItem < itemConfigs.length) {
                startItem();
            } else {
                showResults();
            }
        }, 1000);
    }

    function floorToTwoDecimals(value) {
        return Math.floor(value * 100) / 100;
    }

    function showResults() {
        const normalizedScore = floorToTwoDecimals(totalScore);
        finalScoreSpan.textContent = normalizedScore;
        
        localStorage.setItem('brainScore_mentalCoding', normalizedScore);
        submitTestResult(normalizedScore);
        showScreen(resultsScreen);
    }

    function resetGame() {
        currentItem = 0;
        totalScore = 0;
        currentCoding = {};
        currentSymbols = [];
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
