document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');
    const fsiqScoreEl = document.getElementById('fsiqScore');
    const fsiqClassificationEl = document.getElementById('fsiqClassification');
    const percentileEl = document.getElementById('percentile');
    const canvas = document.getElementById('bellCurve');
    const ctx = canvas.getContext('2d');

    function initCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth * 2; // Retina display
        canvas.height = 400;
        canvas.style.width = container.offsetWidth + 'px';
        canvas.style.height = '200px';
    }

    function drawBellCurve(markerIQ = null) {
        initCanvas();
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        ctx.clearRect(0, 0, width, height);
        
        const mean = 100;
        const stdDev = 15;
        const minIQ = 40;
        const maxIQ = 160;
        
        function normalPDF(x, mean, stdDev) {
            const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
            const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
            return coefficient * Math.exp(exponent);
        }
        
        const maxY = normalPDF(mean, mean, stdDev);
        
        const gradient = ctx.createLinearGradient(0, height - padding, 0, padding);
        gradient.addColorStop(0, 'rgba(42, 42, 42, 0.05)');
        gradient.addColorStop(1, 'rgba(42, 42, 42, 0.2)');
        
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        
        for (let x = padding; x <= width - padding; x++) {
            const iq = minIQ + ((x - padding) / (width - 2 * padding)) * (maxIQ - minIQ);
            const y = normalPDF(iq, mean, stdDev);
            const scaledY = (y / maxY) * (height - 2 * padding);
            ctx.lineTo(x, height - padding - scaledY);
        }
        
        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        for (let x = padding; x <= width - padding; x++) {
            const iq = minIQ + ((x - padding) / (width - 2 * padding)) * (maxIQ - minIQ);
            const y = normalPDF(iq, mean, stdDev);
            const scaledY = (y / maxY) * (height - 2 * padding);
            
            if (x === padding) {
                ctx.moveTo(x, height - padding - scaledY);
            } else {
                ctx.lineTo(x, height - padding - scaledY);
            }
        }
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const sdMarkers = [55, 70, 85, 100, 115, 130, 145];
        ctx.lineWidth = 2;
        
        sdMarkers.forEach(iq => {
            const x = padding + ((iq - minIQ) / (maxIQ - minIQ)) * (width - 2 * padding);
            const y = normalPDF(iq, mean, stdDev);
            const scaledY = (y / maxY) * (height - 2 * padding);
            
            ctx.beginPath();
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = '#888888';
            ctx.moveTo(x, height - padding);
            ctx.lineTo(x, height - padding - scaledY);
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.fillStyle = '#666666';
            ctx.font = '20px Inter, sans-serif';
            ctx.textAlign = 'center';
        });
        
        ctx.setLineDash([]);
        
        if (markerIQ !== null && markerIQ >= minIQ && markerIQ <= maxIQ) {
            const markerX = padding + ((markerIQ - minIQ) / (maxIQ - minIQ)) * (width - 2 * padding);
            const markerY = normalPDF(markerIQ, mean, stdDev);
            const scaledMarkerY = (markerY / maxY) * (height - 2 * padding);
            
            ctx.beginPath();
            ctx.moveTo(markerX, height - padding);
            ctx.lineTo(markerX, height - padding - scaledMarkerY);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(markerX, height - padding - scaledMarkerY, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#2a2a2a';
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(markerIQ), markerX, height - padding - scaledMarkerY - 20);
        }
    }
    
    function calculatePercentile(iq) {
        const mean = 100;
        const stdDev = 15;
        const z = (iq - mean) / stdDev;
        
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        
        return z > 0 ? (1 - p) * 100 : p * 100;
    }
    
    function getClassification(iq) {
        if (iq >= 145) return 'Highly Gifted';
        if (iq >= 130) return 'Gifted';
        if (iq >= 115) return 'Above Average';
        if (iq >= 85) return 'Average';
        if (iq >= 70) return 'Below Average';
        return 'Low';
    }
    
    const testConfigs = {
        score1: { name: 'Character Shuffle', mean: 14.49, stdDev: 11.33 },
        score2: { name: 'Combinatorial Operator', mean: 7.11, stdDev: 3.81 },
        score3: { name: 'Diamond Dilemma', mean: 3.99, stdDev: 5.43 },
        score4: { name: 'Figure Rotation', mean: 5.94, stdDev: 4.68 },
        score5: { name: 'Matrix Reasoning', mean: 6.36, stdDev: 3.12 },
        score6: { name: 'Mental Coding', mean: 18.02, stdDev: 4.86 },
        score7: { name: 'Selective Span', mean: 4.84, stdDev: 0.85 },
        score8: { name: 'Spatial Addition', mean: 6.53, stdDev: 3.32 },
        score9: { name: 'Symbol Rush', mean: 23.54, stdDev: 8.51 },
        score10: { name: 'Visual Construction', mean: 2.81, stdDev: 2.59 }
    };
    
    const indexDefinitions = {
        FRI: ['score2', 'score3', 'score5'],  // Combinatorial Operator, Diamond Dilemma, Matrix Reasoning
        WMI: ['score6', 'score7', 'score8'],  // Mental Coding, Selective Span, Spatial Addition
        VSI: ['score4', 'score10'],            // Figure Rotation, Visual Construction
        PSI: ['score1', 'score9']              // Character Shuffle, Symbol Rush
    };
    
    const indexParams = {
        FRI: { mean: 300, stdDev: 37.94 },  // 3 tests
        WMI: { mean: 300, stdDev: 41.18 },  // 3 tests
        VSI: { mean: 200, stdDev: 29.08 },  // 2 tests
        PSI: { mean: 200, stdDev: 26.91 }   // 2 tests
    };
    
    const fsiqParams = { mean: 1000, stdDev: 127.08 };

    function roundIqByMean(iq, mean = 100) {
        return iq < mean ? Math.ceil(iq) : Math.floor(iq);
    }

    function floorToTwoDecimals(value) {
        return Math.floor(value * 100) / 100;
    }

    function formatScoreInputValue(rawScore, testId) {
        const normalizedScore = floorToTwoDecimals(rawScore);
        if (testId === 'score3') {
            return normalizedScore.toFixed(2);
        }
        return String(normalizedScore);
    }
    
    function convertToIQ(rawScore, testId) {
        const config = testConfigs[testId];
        if (!config) return null;
        
        const zScore = (rawScore - config.mean) / config.stdDev;
        
        const iq = 100 + (zScore * 15);

        const roundedIQ = roundIqByMean(iq);
        return Math.min(160, Math.max(40, roundedIQ));
    }
    
    function convertIndexSumToIQ(sum, indexName) {
        const params = indexParams[indexName];
        if (!params) return null;
        
        const zScore = (sum - params.mean) / params.stdDev;
        const iq = 100 + (zScore * 15);
        return Math.min(160, Math.max(40, roundIqByMean(iq)));
    }
    
    function hideAllComposites() {
        ['FRI', 'WMI', 'VSI', 'PSI'].forEach(index => {
            const el = document.getElementById(`${index.toLowerCase()}Composite`);
            if (el) el.style.display = 'none';
        });
    }
    
    function updateCompositeDisplay(indexScores) {
        const indexOrder = ['FRI', 'WMI', 'VSI', 'PSI'];
        
        indexOrder.forEach(indexName => {
            const compositeEl = document.getElementById(`${indexName.toLowerCase()}Composite`);
            const scoreEl = document.getElementById(`${indexName.toLowerCase()}Score`);
            
            if (compositeEl && scoreEl) {
                if (indexScores[indexName] !== undefined) {
                    scoreEl.textContent = indexScores[indexName];
                    compositeEl.style.display = 'flex';
                } else {
                    compositeEl.style.display = 'none';
                }
            }
        });
    }
    
    function calculateFSIQ() {
        const requiredTestIds = Object.keys(testConfigs);

        const testIQScores = {};
        
        for (const inputId of requiredTestIds) {
            const input = document.getElementById(inputId);
            if (!input) continue;

            const value = parseFloat(input.value);
            
            if (!isNaN(value)) {
                const flooredRaw = floorToTwoDecimals(value);
                input.value = formatScoreInputValue(flooredRaw, inputId);
                testIQScores[inputId] = convertToIQ(flooredRaw, inputId);
            }
        }
        
        const ageYearsInput = document.getElementById('ageYears');
        const genderInput = document.getElementById('genderInput');
        const nicknameInput = document.getElementById('nicknameInput');
        const ageGroupValue = ageYearsInput?.value || '';
        const genderValue = genderInput?.value || '';
        const nicknameValue = nicknameInput?.value?.trim() || '';

        if (!nicknameValue) {
            fsiqScoreEl.textContent = '--';
            fsiqClassificationEl.textContent = 'Please enter a nickname';
            percentileEl.textContent = '--';
            hideAllComposites();
            drawBellCurve(null);
            if (nicknameInput) {
                nicknameInput.classList.add('error');
                nicknameInput.focus();
            }
            return;
        }

        if (!genderValue) {
            fsiqScoreEl.textContent = '--';
            fsiqClassificationEl.textContent = 'Please select your gender';
            percentileEl.textContent = '--';
            hideAllComposites();
            drawBellCurve(null);
            if (genderInput) {
                genderInput.classList.add('error');
                genderInput.focus();
            }
            return;
        }

        if (!ageGroupValue) {
            fsiqScoreEl.textContent = '--';
            fsiqClassificationEl.textContent = 'Please select your age group';
            percentileEl.textContent = '--';
            hideAllComposites();
            drawBellCurve(null);
            if (ageYearsInput) {
                ageYearsInput.classList.add('error');
                ageYearsInput.focus();
            }
            return;
        }

        nicknameInput?.classList.remove('error');
        genderInput?.classList.remove('error');
        ageYearsInput?.classList.remove('error');
        
        const missingTestIds = requiredTestIds.filter(id => testIQScores[id] === undefined);
        if (missingTestIds.length > 0) {
            const missingTestNames = missingTestIds.map(id => testConfigs[id].name);
            fsiqScoreEl.textContent = '--';
            fsiqClassificationEl.textContent = `Complete all tests first: ${missingTestNames.join(', ')}`;
            percentileEl.textContent = '--';
            hideAllComposites();
            drawBellCurve(null);

            const firstMissingInput = document.getElementById(missingTestIds[0]);
            if (firstMissingInput) firstMissingInput.focus();
            return;
        }
        
        const indexScores = {};
        const indexOrder = ['FRI', 'WMI', 'VSI', 'PSI'];
        
        for (const indexName of indexOrder) {
            const testIds = indexDefinitions[indexName];
            const scores = testIds
                .filter(id => testIQScores[id] !== undefined)
                .map(id => testIQScores[id]);
            
            if (scores.length > 0) {
                const fullTestCount = testIds.length;
                const sum = scores.reduce((a, b) => a + b, 0);
                const scaledSum = sum * (fullTestCount / scores.length);
                
                indexScores[indexName] = convertIndexSumToIQ(scaledSum, indexName);
            }
        }
        
        updateCompositeDisplay(indexScores);
        
        const testScoreSum = requiredTestIds.reduce((sum, testId) => sum + testIQScores[testId], 0);

        const fsiqZScore = (testScoreSum - fsiqParams.mean) / fsiqParams.stdDev;
        const totalIQ = 100 + (fsiqZScore * 15);
        const fsiq = Math.min(160, Math.max(40, roundIqByMean(totalIQ)));
        
        if (totalIQ > 160) {
            fsiqScoreEl.textContent = '> 160';
        } else if (totalIQ < 40) {
            fsiqScoreEl.textContent = '< 40';
        } else {
            fsiqScoreEl.textContent = fsiq;
        }
        fsiqClassificationEl.textContent = getClassification(fsiq);
        
        const percentile = calculatePercentile(fsiq);
        let adjustedPercentile;
        if (percentile < 50) {
            adjustedPercentile = Math.ceil(percentile * 100) / 100;
        } else if (percentile > 50) {
            adjustedPercentile = Math.floor(percentile * 100) / 100;
        } else {
            adjustedPercentile = percentile;
        }
        percentileEl.textContent = adjustedPercentile.toFixed(2) + '%';
        
        drawBellCurve(fsiq);
        
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        fsiqScoreEl.style.animation = 'none';
        fsiqScoreEl.offsetHeight; // Trigger reflow
        fsiqScoreEl.style.animation = 'fadeIn 0.5s ease-out';
        
        submitFsiqForm(fsiq, adjustedPercentile, getClassification(fsiq));
    }
    
    function submitFsiqForm(fsiq, percentile, classification) {
        const form = document.getElementById('fsiqForm');
        if (!form) return;
        
        document.getElementById('formFsiq').value = fsiq;
        document.getElementById('formPercentile').value = percentile;
        document.getElementById('formClassification').value = classification;
        document.getElementById('formAgeYears').value = document.getElementById('ageYears')?.value || '';
        document.getElementById('formGender').value = document.getElementById('genderInput')?.value || '';
        document.getElementById('formNickname').value = document.getElementById('nicknameInput')?.value?.trim() || '';
        document.getElementById('formScore1').value = document.getElementById('score1')?.value || '';
        document.getElementById('formScore2').value = document.getElementById('score2')?.value || '';
        document.getElementById('formScore3').value = document.getElementById('score3')?.value || '';
        document.getElementById('formScore4').value = document.getElementById('score4')?.value || '';
        document.getElementById('formScore5').value = document.getElementById('score5')?.value || '';
        document.getElementById('formScore6').value = document.getElementById('score6')?.value || '';
        document.getElementById('formScore7').value = document.getElementById('score7')?.value || '';
        document.getElementById('formScore8').value = document.getElementById('score8')?.value || '';
        document.getElementById('formScore9').value = document.getElementById('score9')?.value || '';
        document.getElementById('formScore10').value = document.getElementById('score10')?.value || '';
        document.getElementById('formTimestamp').value = new Date().toISOString();
        
        const formData = new FormData(form);
        fetch(form.action, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }).catch(err => console.log('Form submission error:', err));
    }
    
    calculateBtn.addEventListener('click', calculateFSIQ);
    
    const ageInputField = document.getElementById('ageYears');
    const genderInputField = document.getElementById('genderInput');
    const nicknameInputField = document.getElementById('nicknameInput');

    if (nicknameInputField) {
        nicknameInputField.addEventListener('input', (e) => {
            e.target.classList.remove('error');
        });
    }
    
    if (ageInputField) {
        ageInputField.addEventListener('change', (e) => {
            e.target.classList.remove('error');
        });
    }

    if (genderInputField) {
        genderInputField.addEventListener('change', (e) => {
            e.target.classList.remove('error');
        });
    }
    
    document.querySelectorAll('.score-inputs .input-group input').forEach(input => {
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const max = parseFloat(e.target.max);
            const min = parseFloat(e.target.min);
            
            if (!isNaN(value) && !isNaN(max) && value > max) {
                e.target.value = max;
            }
            if (!isNaN(value) && !isNaN(min) && value < min) {
                e.target.value = min;
            }
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateFSIQ();
            }
        });
    });
    
    const scoreMapping = {
        'characterShuffle': 'score1',
        'combinatorialOperator': 'score2',
        'diamondDilemma': 'score3',
        'figureRotation': 'score4',
        'matrixReasoning': 'score5',
        'mentalCoding': 'score6',
        'selectiveSpan': 'score7',
        'spatialAddition': 'score8',
        'symbolSprint': 'score9',
        'visualConstruction': 'score10'
    };
    
    Object.values(scoreMapping).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.readOnly = true;
            input.classList.add('auto-filled');
            input.placeholder = 'Complete test';
        }
    });
    
    Object.keys(scoreMapping).forEach(key => {
        const savedScore = localStorage.getItem(`brainScore_${key}`);
        if (savedScore !== null) {
            const input = document.getElementById(scoreMapping[key]);
            if (input) {
                const parsed = parseFloat(savedScore);
                if (!isNaN(parsed)) {
                    input.value = formatScoreInputValue(parsed, scoreMapping[key]);
                } else {
                    input.value = savedScore;
                }
            }
        }
    });
    
    drawBellCurve(null);
    
    window.addEventListener('resize', () => {
        const currentScore = fsiqScoreEl.textContent;
        if (currentScore !== '--') {
            drawBellCurve(parseInt(currentScore));
        } else {
            drawBellCurve(null);
        }
    });
    
    document.querySelectorAll('.nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.test-card, .guide-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
});
