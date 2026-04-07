document.addEventListener('DOMContentLoaded', function() {
    const instructionsScreen = document.getElementById('instructionsScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    const startBtn = document.getElementById('startBtn');
    const retryBtn = document.getElementById('retryBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    const currentItemEl = document.getElementById('currentItem');
    const progressFill = document.getElementById('progressFill');
    const diamondsGrid = document.getElementById('diamondsGrid');
    const finalScoreEl = document.getElementById('finalScore');
    const breakdownList = document.getElementById('breakdownList');
    const timerValueEl = document.getElementById('timerValue');
    const weightLimitEl = document.getElementById('weightLimit');
    const ageGroupSelect = document.getElementById('ageGroup');
    const genderSelect = document.getElementById('genderSelect');
    const nicknameInput = document.getElementById('nickname');
    let currentItem = 1;
    let totalScore = 0;
    let timerInterval = null;
    let totalTimeRemaining = 10 * 60;
    let allItems = [];
    
    const TOTAL_ITEMS = 20;
    const TOTAL_TIME = 10 * 60;
    
    function getDiamondCount(itemNum) {
        if (itemNum <= 5) return 4;
        if (itemNum <= 10) return 5;
        if (itemNum <= 15) return 6;
        return 7;
    }
    
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function generateDiamonds(count, wLimit) {
        const minWeight = Math.floor(wLimit / 5);
        const maxWeight = Math.floor(wLimit / 2);
        
        const newDiamonds = [];
        for (let i = 0; i < count; i++) {
            newDiamonds.push({
                id: i,
                value: randomInt(100, 1000),
                weight: randomInt(minWeight, maxWeight)
            });
        }
        
        return newDiamonds;
    }
    
    function generateAllItems() {
        allItems = [];
        for (let i = 1; i <= TOTAL_ITEMS; i++) {
            const count = getDiamondCount(i);
            const wLimit = randomInt(50, 150);
            const diamonds = generateDiamonds(count, wLimit);
            allItems.push({
                diamonds: diamonds,
                weightLimit: wLimit,
                selectedDiamonds: [],
                submitted: false,
                solved: false,
                score: 0
            });
        }
    }

    function calculateCubedTotalScore() {
        const cubedSum = allItems.reduce((sum, it) => {
            const itemScore = it.score || 0;
            return sum + Math.pow(itemScore, 3);
        }, 0);
        return Math.floor(cubedSum * 100) / 100;
    }
    
    function calculateOptimalValue(diamonds, capacity) {
        const n = diamonds.length;
        const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
        
        for (let i = 1; i <= n; i++) {
            const diamond = diamonds[i - 1];
            for (let w = 0; w <= capacity; w++) {
                if (diamond.weight <= w) {
                    dp[i][w] = Math.max(
                        dp[i - 1][w],
                        dp[i - 1][w - diamond.weight] + diamond.value
                    );
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
            }
        }
        
        return dp[n][capacity];
    }
    
    function renderDiamonds() {
        const item = allItems[currentItem - 1];
        diamondsGrid.innerHTML = '';
        
        item.diamonds.forEach((diamond, index) => {
            const div = document.createElement('div');
            div.className = 'diamond-item';
            if (item.selectedDiamonds.includes(index)) {
                div.classList.add('selected');
            }
            if (item.submitted) {
                div.classList.add('disabled');
            }
            div.innerHTML = `
                <span class="diamond-emoji">💎</span>
                <span class="diamond-value">$${diamond.value}</span>
                <span class="diamond-weight">${diamond.weight} kg</span>
            `;
            if (!item.submitted) {
                div.addEventListener('click', () => toggleDiamond(index));
            }
            diamondsGrid.appendChild(div);
        });
    }
    
    function toggleDiamond(index) {
        const item = allItems[currentItem - 1];
        if (item.submitted) return;
        
        const idx = item.selectedDiamonds.indexOf(index);
        if (idx > -1) {
            item.selectedDiamonds.splice(idx, 1);
        } else {
            item.selectedDiamonds.push(index);
        }
        renderDiamonds();
    }
    
    function displayItem() {
        const item = allItems[currentItem - 1];
        
        weightLimitEl.textContent = item.weightLimit;
        currentItemEl.textContent = currentItem;
        progressFill.style.width = ((currentItem - 1) / TOTAL_ITEMS * 100) + '%';
        
        renderDiamonds();
        
        updateNavButtons();
    }
    
    function updateNavButtons() {
        prevBtn.disabled = currentItem === 1;
        
        if (currentItem === TOTAL_ITEMS) {
            nextBtn.textContent = 'Submit';
            nextBtn.classList.remove('nav-btn');
            nextBtn.classList.add('primary-btn');
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.classList.remove('primary-btn');
            nextBtn.classList.add('nav-btn');
            nextBtn.disabled = false;
        }
    }
    
    function goPrev() {
        if (currentItem > 1) {
            currentItem--;
            displayItem();
        }
    }
    
    function goNext() {
        if (currentItem === TOTAL_ITEMS) {
            submitAllItems();
        } else if (currentItem < TOTAL_ITEMS) {
            currentItem++;
            displayItem();
        }
    }
    
    function submitAllItems() {
        allItems.forEach((item, idx) => {
            if (!item.submitted) {
                let userWeight = 0;
                let userValue = 0;
                
                item.selectedDiamonds.forEach(diamondIdx => {
                    userWeight += item.diamonds[diamondIdx].weight;
                    userValue += item.diamonds[diamondIdx].value;
                });
                
                const optimalValue = calculateOptimalValue(item.diamonds, item.weightLimit);
                const isValid = userWeight <= item.weightLimit;
                
                let itemScore = 0;
                if (isValid && optimalValue > 0) {
                    itemScore = Math.floor((userValue / optimalValue) * 100) / 100;
                }
                
                item.submitted = true;
                item.score = itemScore;
                item.solved = itemScore === 1;
            }
        });
        
        showResults();
    }
    
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        totalTimeRemaining = TOTAL_TIME;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            totalTimeRemaining--;
            updateTimerDisplay();
            
            if (totalTimeRemaining <= 0) {
                clearInterval(timerInterval);
                allItems.forEach((item, idx) => {
                    if (!item.submitted) {
                        item.submitted = true;
                        item.solved = false;
                        item.score = 0;
                    }
                });
                showResults();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(totalTimeRemaining / 60);
        const seconds = totalTimeRemaining % 60;
        timerValueEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        timerValueEl.classList.remove('warning', 'critical');
        if (totalTimeRemaining <= 60) {
            timerValueEl.classList.add('critical');
        } else if (totalTimeRemaining <= 180) {
            timerValueEl.classList.add('warning');
        }
    }
    
    function submitItem() {
        const item = allItems[currentItem - 1];
        if (item.submitted) return;
        
        let userWeight = 0;
        let userValue = 0;
        
        item.selectedDiamonds.forEach(idx => {
            userWeight += item.diamonds[idx].weight;
            userValue += item.diamonds[idx].value;
        });
        
        const optimalValue = calculateOptimalValue(item.diamonds, item.weightLimit);
        
        const isValid = userWeight <= item.weightLimit;
        
        let itemScore = 0;
        if (isValid && optimalValue > 0) {
            itemScore = Math.floor((userValue / optimalValue) * 100) / 100;
        }
        
        item.submitted = true;
        item.score = itemScore;
        item.solved = itemScore === 1;
        
        totalScore = calculateCubedTotalScore();
        
        const allSubmitted = allItems.every(it => it.submitted);
        if (allSubmitted) {
            showResults();
        } else {
            renderDiamonds();
            if (currentItem < TOTAL_ITEMS) {
                currentItem++;
                displayItem();
            }
        }
    }
    
    function skipItem() {
        const item = allItems[currentItem - 1];
        if (item.submitted) {
            if (currentItem < TOTAL_ITEMS) {
                currentItem++;
                displayItem();
            }
            return;
        }
        
        item.submitted = true;
        item.solved = false;
        
        const allSubmitted = allItems.every(it => it.submitted);
        if (allSubmitted) {
            showResults();
        } else if (currentItem < TOTAL_ITEMS) {
            currentItem++;
            displayItem();
        } else {
            renderDiamonds();
        }
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
        
        totalScore = calculateCubedTotalScore();
        const normalizedScore = floorToTwoDecimals(totalScore);
        finalScoreEl.textContent = normalizedScore;
        
        localStorage.setItem('brainScore_diamondDilemma', normalizedScore);
        submitTestResult(normalizedScore);
        breakdownList.innerHTML = '';
        allItems.forEach((item, idx) => {
            const itemEl = document.createElement('div');
            const score = item.score || 0;
            itemEl.className = `breakdown-item ${score === 1 ? 'solved' : score > 0 ? 'partial' : 'failed'}`;
            itemEl.innerHTML = `
                <span class="item-num">${idx + 1}</span>
                <span class="status">${score.toFixed(2)}</span>
            `;
            breakdownList.appendChild(itemEl);
        });
    }
    
    function resetGame() {
        currentItem = 1;
        totalScore = 0;
        
        generateAllItems();
        
        resultsScreen.classList.add('hidden');
        instructionsScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        startTimer();
        displayItem();
    }
    

startBtn.addEventListener('click', () => {
        if (!ageGroupSelect.value) { ageGroupSelect.focus(); ageGroupSelect.style.border = '2px solid red'; return; }
    if (!genderSelect.value) { genderSelect.focus(); genderSelect.style.border = '2px solid red'; return; }
    if (!nicknameInput.value.trim()) { nicknameInput.focus(); nicknameInput.style.border = '2px solid red'; return; }
    ageGroupSelect.style.border = ''; genderSelect.style.border = ''; nicknameInput.style.border = '';
        generateAllItems();
        instructionsScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startTimer();
        displayItem();
    });
    
    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
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
