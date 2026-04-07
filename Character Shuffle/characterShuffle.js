document.addEventListener('DOMContentLoaded', function() {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const submitBtn = document.getElementById('submitBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    const currentItemEl = document.getElementById('currentItem');
    const progressFill = document.getElementById('progressFill');
    const originalStringEl = document.getElementById('originalString');
    const shuffledStringEl = document.getElementById('shuffledString');
    const challengeStringEl = document.getElementById('challengeString');
    const answerInput = document.getElementById('answerInput');
    const finalScoreEl = document.getElementById('finalScore');
    const breakdownList = document.getElementById('breakdownList');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    const timerValueEl = document.getElementById('timerValue');
    let currentItem = 1;
    let totalScore = 0;
    let itemScores = [];
    let currentPattern = [];
    let correctAnswer = '';
    let timerInterval = null;
    let timeRemaining = 30;
    const LEVEL_TIME = 30;
    
    const TOTAL_ITEMS = 10;
    const MAX_SCORE = 65;
    const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    function generateRandomString(length) {
        let result = '';
        const availableChars = CHARACTERS.split('');
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            result += availableChars[randomIndex];
            availableChars.splice(randomIndex, 1);
        }
        
        return result;
    }
    
    function generateShufflePattern(length) {
        const indices = Array.from({ length }, (_, i) => i);
        
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const isIdentity = indices.every((val, idx) => val === idx);
        if (isIdentity) {
            [indices[0], indices[1]] = [indices[1], indices[0]];
        }
        
        return indices;
    }
    
    function applyPattern(str, pattern) {
        const result = new Array(str.length);
        for (let i = 0; i < pattern.length; i++) {
            result[pattern[i]] = str[i];
        }
        return result.join('');
    }
    
    function calculateScore(userAnswer, correctAnswer) {
        let correct = 0;
        const normalizedUser = userAnswer.toUpperCase();
        
        for (let i = 0; i < correctAnswer.length; i++) {
            if (normalizedUser[i] === correctAnswer[i]) {
                correct++;
            }
        }
        
        return correct;
    }
    
    function startItem() {
        const length = currentItem + 1;
        
        const originalStr = generateRandomString(length);
        currentPattern = generateShufflePattern(length);
        const shuffledStr = applyPattern(originalStr, currentPattern);
        
        let challengeStr;
        do {
            challengeStr = generateRandomString(length);
        } while (challengeStr === originalStr);
        
        correctAnswer = applyPattern(challengeStr, currentPattern);
        
        originalStringEl.textContent = originalStr;
        shuffledStringEl.textContent = shuffledStr;
        challengeStringEl.textContent = challengeStr;
        answerInput.value = '';
        answerInput.maxLength = length;
        answerInput.className = 'answer-input';
        answerInput.focus();
        
        currentItemEl.textContent = currentItem;
        progressFill.style.width = ((currentItem - 1) / TOTAL_ITEMS * 100) + '%';
        
        startTimer();
    }
    
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timeRemaining = LEVEL_TIME;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                autoSubmit();
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
    
    function autoSubmit() {
        const length = currentItem + 1;
        const userAnswer = answerInput.value.toUpperCase().padEnd(length, ' ');
        processAnswer(userAnswer);
    }
    
    function submitAnswer() {
        const length = currentItem + 1;
        const userAnswer = answerInput.value.toUpperCase().padEnd(length, ' ');
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        processAnswer(userAnswer);
    }
    
    function processAnswer(userAnswer) {
        const itemScore = calculateScore(userAnswer, correctAnswer);
        const maxItemScore = currentItem + 1;
        
        itemScores.push({
            item: currentItem,
            score: itemScore,
            maxScore: maxItemScore,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer
        });
        
        totalScore += itemScore;
        
        if (itemScore === maxItemScore) {
            answerInput.className = 'answer-input correct pulse';
        } else if (itemScore > 0) {
            answerInput.className = 'answer-input partial pulse';
        } else {
            answerInput.className = 'answer-input incorrect shake';
        }
        
        setTimeout(() => {
            if (currentItem < TOTAL_ITEMS) {
                currentItem++;
                startItem();
            } else {
                showResults();
            }
        }, 800);
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
        
        localStorage.setItem('brainScore_characterShuffle', normalizedScore);
        submitTestResult(normalizedScore);
        breakdownList.innerHTML = '';
        itemScores.forEach(({ item, score, maxScore }) => {
            const el = document.createElement('div');
            el.className = 'breakdown-item';
            
            if (score === maxScore) {
                el.classList.add('perfect');
            } else if (score > 0) {
                el.classList.add('partial');
            } else {
                el.classList.add('zero');
            }
            
            el.innerHTML = `
                <span class="item">Item ${item}</span>
                <span class="points">${score}/${maxScore}</span>
            `;
            breakdownList.appendChild(el);
        });
    }
    
    function resetGame() {
        currentItem = 1;
        totalScore = 0;
        itemScores = [];
        
        resultsScreen.classList.add('hidden');
        instructionsScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        startItem();
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
    
    submitBtn.addEventListener('click', submitAnswer);

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
    
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
    
    answerInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    });
    
    retryBtn.addEventListener('click', resetGame);
});
