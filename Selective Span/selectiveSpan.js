document.addEventListener('DOMContentLoaded', () => {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const displayScreen = document.getElementById('displayScreen');
    const recallScreen = document.getElementById('recallScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const submitBtn = document.getElementById('submitBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const currentItemSpan = document.getElementById('currentItem');
    const livesSpan = document.getElementById('lives');
    const currentCharSpan = document.getElementById('currentChar');
    const greenInput = document.getElementById('greenInput');
    const redInput = document.getElementById('redInput');
    const finalScoreSpan = document.getElementById('finalScore');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    let currentItem = 0;
    let totalScore = 0;
    let lives = 3;
    let currentSequence = [];
    let greenSequence = '';
    let redSequence = '';
    const itemConfigs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'.split('');

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function showScreen(screen) {
        [instructionsScreen, displayScreen, recallScreen, resultsScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function generateSequence(n) {
        const greenCount = Math.ceil(n / 2);
        const redCount = Math.floor(n / 2);
        
        const selectedChars = shuffle(characters).slice(0, n);
        
        currentSequence = [];
        greenSequence = '';
        redSequence = '';
        
        const colors = [];
        for (let i = 0; i < greenCount; i++) colors.push('green');
        for (let i = 0; i < redCount; i++) colors.push('red');
        
        const shuffledColors = shuffle(colors);
        
        for (let i = 0; i < n; i++) {
            const color = shuffledColors[i];
            currentSequence.push({
                char: selectedChars[i],
                color: color
            });
            
            if (color === 'green') {
                greenSequence += selectedChars[i];
            } else {
                redSequence += selectedChars[i];
            }
        }
    }

    function displaySequence() {
        let index = 0;
        currentCharSpan.textContent = '';
        currentCharSpan.className = 'char';
        
        const showNextChar = () => {
            if (index < currentSequence.length) {
                const item = currentSequence[index];
                currentCharSpan.textContent = item.char;
                currentCharSpan.className = `char ${item.color}`;
                index++;
                setTimeout(() => {
                    currentCharSpan.textContent = '';
                    currentCharSpan.className = 'char';
                    setTimeout(showNextChar, 300);
                }, 800);
            } else {
                setTimeout(startRecallPhase, 500);
            }
        };
        
        setTimeout(showNextChar, 500);
    }

    function startItem() {
        const n = itemConfigs[currentItem];
        generateSequence(n);
        
        currentItemSpan.textContent = currentItem + 1;
        showScreen(displayScreen);
        displaySequence();
    }

    function startRecallPhase() {
        greenInput.value = '';
        redInput.value = '';
        greenInput.className = 'sequence-input';
        redInput.className = 'sequence-input';
        
        showScreen(recallScreen);
        greenInput.focus();
    }

    function updateLives() {
        livesSpan.textContent = '❤️ '.repeat(lives).trim() || '💔';
    }

    function submitAnswer() {
        const userGreen = greenInput.value.toUpperCase();
        const userRed = redInput.value.toUpperCase();
        
        const greenCorrect = userGreen === greenSequence;
        const redCorrect = userRed === redSequence;
        
        greenInput.classList.add(greenCorrect ? 'correct' : 'wrong');
        redInput.classList.add(redCorrect ? 'correct' : 'wrong');
        
        if (greenCorrect && redCorrect) {
            totalScore++;
            currentItem++;
        } else {
            lives--;
            updateLives();
        }
        
        greenInput.disabled = true;
        redInput.disabled = true;
        
        setTimeout(() => {
            greenInput.disabled = false;
            redInput.disabled = false;
            
            if (lives <= 0 || currentItem >= itemConfigs.length) {
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
        
        localStorage.setItem('brainScore_selectiveSpan', normalizedScore);
        submitTestResult(normalizedScore);
        showScreen(resultsScreen);
    }

    function resetGame() {
        currentItem = 0;
        totalScore = 0;
        lives = 3;
        currentSequence = [];
        greenSequence = '';
        redSequence = '';
        updateLives();
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

    greenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            redInput.focus();
        }
    });

    redInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
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
