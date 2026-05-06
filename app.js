// State
const state = {
    data: null,
    currentSkill: null, // 'reading' or 'listening'
    currentPart: null,
    currentTopicId: null
};

// DOM Elements
const appContainer = document.getElementById('app');
const breadcrumbsContainer = document.getElementById('breadcrumbs');
const hintBtn = document.getElementById('hintBtn');
const hintModal = document.getElementById('hintModal');
const closeHintBtn = document.getElementById('closeHint');
const globalNotesContainer = document.getElementById('globalNotes');
const topicHintsContainer = document.getElementById('topicHints');

// Utility: Shuffle Array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Initialize App
async function init() {
    try {
        const response = await fetch('data.json');
        state.data = await response.json();
        
        // Setup Hint Modal Listeners
        hintBtn.addEventListener('click', () => hintModal.classList.remove('hidden'));
        closeHintBtn.addEventListener('click', () => hintModal.classList.add('hidden'));
        hintModal.addEventListener('click', (e) => {
            if (e.target === hintModal) hintModal.classList.add('hidden');
        });

        // Setup Global Notes
        if (state.data.notes && state.data.notes.length > 0) {
            globalNotesContainer.innerHTML = '<h3>General Tips</h3><ul>' + 
                state.data.notes.map(note => `<li>${note}</li>`).join('') + 
                '</ul>';
        } else {
            globalNotesContainer.innerHTML = '';
        }

        renderHome();
    } catch (error) {
        console.error("Failed to load data:", error);
        appContainer.innerHTML = `<div class="error">Failed to load practice data. Please check if data.json exists.</div>`;
    }
}

// Render Breadcrumbs
function renderBreadcrumbs() {
    let html = `<span onclick="renderHome()"><i class="fa-solid fa-home"></i> Home</span>`;
    
    if (state.currentSkill) {
        const skillName = state.currentSkill.charAt(0).toUpperCase() + state.currentSkill.slice(1);
        html += ` > <span onclick="renderPartSelection('${state.currentSkill}')">${skillName} Practice</span>`;
    }
    
    if (state.currentPart) {
        const partName = formatPartName(state.currentPart);
        html += ` > <span onclick="renderTopicSelection('${state.currentPart}')">${partName}</span>`;
    }

    if (state.currentTopicId) {
        html += ` > <span>Practice</span>`;
    }

    breadcrumbsContainer.innerHTML = html;
}

function formatPartName(part) {
    if (part === 'part1_13') return 'Parts 1-13';
    if (part === 'part16') return 'Part 16';
    if (part === 'part17') return 'Part 17';
    return part.replace('part', 'Part ');
}

// Render Home (Level 1)
function renderHome() {
    state.currentSkill = null;
    state.currentPart = null;
    state.currentTopicId = null;
    renderBreadcrumbs();
    hideHint();

    appContainer.innerHTML = `
        <div class="grid-cards">
            <div class="card" onclick="renderPartSelection('reading')">
                <i class="fa-solid fa-book-open-reader"></i>
                <h3>Reading Practice</h3>
                <p>Improve your reading comprehension with 5 different part types.</p>
            </div>
            <div class="card" onclick="renderPartSelection('listening')">
                <i class="fa-solid fa-headphones"></i>
                <h3>Listening Practice</h3>
                <p>Enhance your listening skills with various scenarios.</p>
            </div>
            <div class="card card-mock" onclick="startMockTest()">
                <i class="fa-solid fa-stopwatch"></i>
                <h3>Thi Thử</h3>
                <p>Thực hiện bài thi đầy đủ Reading + Listening và xem điểm số của bạn.</p>
            </div>
        </div>
    `;
}

// Render Part Selection (Level 2)
function renderPartSelection(skill) {
    state.currentSkill = skill;
    state.currentPart = null;
    state.currentTopicId = null;
    renderBreadcrumbs();
    hideHint();

    let parts = [];
    if (skill === 'reading') {
        parts = ['part1', 'part2', 'part3', 'part4', 'part5'];
    } else if (skill === 'listening') {
        parts = ['part1_13', 'part14', 'part15', 'part16', 'part17'];
    }

    const cardsHtml = parts.map(part => `
        <div class="card" onclick="renderTopicSelection('${part}')">
            <i class="fa-solid fa-layer-group"></i>
            <h3>${formatPartName(part)}</h3>
        </div>
    `).join('');

    appContainer.innerHTML = `
        <div class="practice-header">
            <h2>Select a Part</h2>
            <button class="btn btn-secondary" onclick="renderHome()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
        </div>
        <div class="grid-cards">
            ${cardsHtml}
        </div>
    `;
}

// Render Topic Selection (Level 3)
function renderTopicSelection(part) {
    state.currentPart = part;
    state.currentTopicId = null;
    renderBreadcrumbs();
    hideHint();

    let topics = [];
    if (state.currentSkill === 'reading') {
        topics = state.data[part] || [];
    } else {
        topics = state.data.listening[part] || [];
    }

    const topicsHtml = topics.map((topicData, index) => {
        // Handle different topic naming conventions in JSON
        const topicName = topicData.topic || `Practice Topic ${index + 1}`;
        return `
            <div class="topic-item" onclick="renderPractice('${part}', ${topicData.id})">
                <strong>${topicName}</strong>
            </div>
        `;
    }).join('');

    appContainer.innerHTML = `
        <div class="practice-header">
            <h2>Select a Topic</h2>
            <button class="btn btn-secondary" onclick="renderPartSelection('${state.currentSkill}')">
                <i class="fa-solid fa-arrow-left"></i> Back to Parts
            </button>
        </div>
        <div class="topic-list">
            ${topicsHtml.length > 0 ? topicsHtml : '<p>No topics available for this part.</p>'}
        </div>
    `;
}

// Render Practice View (Level 4)
function renderPractice(part, topicId) {
    state.currentTopicId = topicId;
    renderBreadcrumbs();
    
    let topicData;
    let topicIndex;
    let totalTopics;
    if (state.currentSkill === 'reading') {
        const topics = state.data[part] || [];
        topicIndex = topics.findIndex(t => t.id === topicId);
        topicData = topics[topicIndex];
        totalTopics = topics.length;
    } else {
        const topics = state.data.listening[part] || [];
        topicIndex = topics.findIndex(t => t.id === topicId);
        topicData = topics[topicIndex];
        totalTopics = topics.length;
    }

    if (!topicData) {
        appContainer.innerHTML = `<p>Topic not found.</p>`;
        return;
    }

    setupHintSystem(part, topicData);

    let contentHtml = '';
    let validationFunction = '';

    const topicNumber = topicIndex + 1;
    const topicLabel = topicData.topic
        ? `<h3><span class="topic-badge">Topic ${topicNumber}/${totalTopics}</span> ${topicData.topic}</h3>`
        : `<h3><span class="topic-badge">Topic ${topicNumber}/${totalTopics}</span></h3>`;
    const title = topicLabel;

    if (state.currentSkill === 'reading') {
        if (part === 'part1') {
            contentHtml = renderReadingPart1(topicData);
            validationFunction = 'validateReadingPart1';
        } else if (['part2', 'part3', 'part5'].includes(part)) {
            contentHtml = renderReadingOrdering(topicData);
            validationFunction = 'validateReadingOrdering';
        } else if (part === 'part4') {
            contentHtml = renderReadingPart4(topicData);
            validationFunction = 'validateReadingPart4';
        }
    } else if (state.currentSkill === 'listening') {
        if (part === 'part1_13') {
            contentHtml = renderListeningMultipleChoice(topicData);
            validationFunction = 'validateListeningMultipleChoice';
        } else if (part === 'part16' || part === 'part17') {
            contentHtml = renderListeningPart16_17(topicData);
            validationFunction = 'validateListeningPart16_17';
        } else if (part === 'part14') {
            contentHtml = renderListeningPart14(topicData);
            validationFunction = 'validateListeningPart14';
        } else if (part === 'part15') {
            contentHtml = renderListeningPart15(topicData);
            validationFunction = 'validateListeningPart15';
        }
    }

    appContainer.innerHTML = `
        <div class="practice-container">
            <div class="practice-header">
                <h2>Practice</h2>
                <button class="btn btn-secondary" onclick="renderTopicSelection('${part}')">
                    <i class="fa-solid fa-arrow-left"></i> Back to Topics
                </button>
            </div>
            ${title}
            <div id="practiceContent">
                ${contentHtml}
            </div>
            <div class="action-area">
                <button class="btn btn-primary" onclick="${validationFunction}(${topicId})">
                    <i class="fa-solid fa-check-double"></i> Check Answer
                </button>
            </div>
        </div>
    `;

    // Post-render setup (e.g., SortableJS, Drag and Drop events)
    if (['part2', 'part3', 'part5'].includes(part) && state.currentSkill === 'reading') {
        const el = document.getElementById('sortableList');
        if (el) {
            Sortable.create(el, { animation: 150 });
        }
    }
    
    if (part === 'part1' && state.currentSkill === 'reading') {
        setupDragAndDrop();
    }
}

// --- Reading Render Functions ---

function renderReadingPart1(topicData) {
    const shuffledWords = shuffleArray(topicData.words);
    const chipsHtml = shuffledWords.map(word => `
        <div class="chip" draggable="true" data-word="${word}">${word}</div>
    `).join('');

    // Replace ___ with drop zones
    let hintHtml = topicData.hint;
    let index = 0;
    while (hintHtml.includes('___')) {
        hintHtml = hintHtml.replace('___', `<span class="drop-zone" data-index="${index}"></span>`);
        index++;
    }

    return `
        <div class="chips-container" id="chipsContainer">
            ${chipsHtml}
        </div>
        <div class="question-block" style="line-height: 2.5; font-size: 1.2rem;">
            ${hintHtml}
        </div>
    `;
}

function setupDragAndDrop() {
    const chips = document.querySelectorAll('.chip');
    const dropZones = document.querySelectorAll('.drop-zone');
    const chipsContainer = document.getElementById('chipsContainer');

    let draggedItem = null;

    chips.forEach(chip => {
        chip.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });
        chip.addEventListener('dragend', function() {
            draggedItem = null;
            this.style.opacity = '1';
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.style.borderColor = 'var(--primary)';
        });
        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = 'var(--primary)'; // maintain dashed
        });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--primary)';
            if (draggedItem) {
                // If zone already has a chip, move it back to container
                if (this.children.length > 0) {
                    chipsContainer.appendChild(this.children[0]);
                }
                this.appendChild(draggedItem);
                this.classList.add('filled');
            }
        });
    });

    chipsContainer.addEventListener('dragover', e => e.preventDefault());
    chipsContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedItem) {
            this.appendChild(draggedItem);
            // remove filled class from parent drop zone if any
            document.querySelectorAll('.drop-zone').forEach(z => {
                if (z.children.length === 0) z.classList.remove('filled');
            });
        }
    });
}

function renderReadingOrdering(topicData) {
    const shuffledSentences = shuffleArray(topicData.sentences.map((s, i) => ({ text: s, originalIndex: i })));
    
    const listHtml = shuffledSentences.map(item => `
        <div class="sortable-item" data-id="${item.originalIndex}">
            <i class="fa-solid fa-grip-vertical"></i>
            <span>${item.text}</span>
        </div>
    `).join('');

    return `
        <div class="question-block">
            <p class="question-text">Drag and drop the sentences to order them correctly.</p>
            <div id="sortableList" class="sortable-list">
                ${listHtml}
            </div>
        </div>
    `;
}

function renderReadingPart4(topicData) {
    // Render passage cards if available
    let passagesHtml = '';
    if (topicData.passages && topicData.passages.length > 0) {
        const cards = topicData.passages.map(p => `
            <div class="passage-card">
                <div class="passage-person">${p.person}</div>
                <p class="passage-text">${p.text}</p>
            </div>
        `).join('');
        passagesHtml = `
            <div class="passages-container">
                <div class="passages-label"><i class="fa-solid fa-book-open"></i> Đọc các đoạn văn sau, sau đó trả lời câu hỏi bên dưới</div>
                <div class="passages-grid">${cards}</div>
            </div>
        `;
    }

    // Extract unique answers for the dropdown
    const uniqueAnswers = [...new Set(topicData.questions.map(q => q.answer))].sort();
    const optionsHtml = uniqueAnswers.map(ans => `<option value="${ans}">${ans}</option>`).join('');

    const questionsHtml = topicData.questions.map((q, index) => `
        <div class="question-block">
            <div class="question-text">${index + 1}. ${q.question}</div>
            <select class="modern-select" id="q_${index}">
                <option value="">Select an answer...</option>
                ${optionsHtml}
            </select>
        </div>
    `).join('');

    return passagesHtml + questionsHtml;
}

// --- Listening Render Functions ---

function renderListeningMultipleChoice(topicData) {
    const questionsHtml = topicData.questions.map((q, qIndex) => {
        const shuffledOptions = shuffleArray(q.options);
        const optionsHtml = shuffledOptions.map((opt, oIndex) => `
            <label class="option-label" id="label_${qIndex}_${oIndex}">
                <input type="radio" name="q_${qIndex}" value="${opt.replace(/"/g, '&quot;')}">
                <span>${opt}</span>
            </label>
        `).join('');

        return `
            <div class="question-block" data-original-question="${q.question.replace(/"/g, '&quot;')}">
                <div class="question-text">${qIndex + 1}. ${q.question}</div>
                <div class="options-group">
                    ${optionsHtml}
                </div>
            </div>
        `;
    }).join('');

    return questionsHtml;
}

function renderListeningPart16_17(topicData) {
    const shuffledOptions = shuffleArray(topicData.options);

    const optionsHtml = shuffledOptions.map((opt, i) => `
        <label class="option-label checkbox-label">
            <input type="checkbox" name="p16_17" value="${opt.replace(/"/g, '&quot;')}">
            <span>${opt}</span>
        </label>
    `).join('');

    return `
        <div class="question-block">
            <div class="question-text">Chọn <strong>2 đáp án đúng</strong> trong các đáp án dưới đây:</div>
            <div class="options-group">
                ${optionsHtml}
            </div>
        </div>
    `;
}

function renderListeningPart14(topicData) {
    // Collect all hint_starts for dropdowns
    const hintStarts = topicData.options.map(opt => opt.hint_start);
    // Shuffle the hint starts for the dropdown options so they aren't always in order
    const shuffledHints = shuffleArray(hintStarts);
    const dropdownOptions = shuffledHints.map(hint => `<option value="${hint.replace(/"/g, '&quot;')}">${hint}</option>`).join('');

    const linesHtml = topicData.options.map((opt, index) => `
        <div class="question-block">
            <div class="question-text">Person ${index + 1}: ${opt.answer}</div>
            <select class="modern-select" id="p14_${index}">
                <option value="">Select what they say (Hint Start)...</option>
                ${dropdownOptions}
            </select>
        </div>
    `).join('');

    return linesHtml;
}

function renderListeningPart15(topicData) {
    const questionsHtml = topicData.questions.map((q, index) => `
        <div class="question-block">
            <div class="question-text">${index + 1}. ${q.statement}</div>
            <select class="modern-select" id="p15_${index}">
                <option value="">Select Speaker...</option>
                <option value="M">Man (M)</option>
                <option value="W">Woman (W)</option>
                <option value="B">Both (B)</option>
            </select>
        </div>
    `).join('');

    return questionsHtml;
}


// --- Validation Functions ---

function validateReadingPart1(topicId) {
    const topicData = state.data.part1.find(t => t.id === topicId);
    const dropZones = document.querySelectorAll('.drop-zone');
    
    dropZones.forEach((zone, index) => {
        zone.classList.remove('correct', 'incorrect');
        // Remove old icons
        const oldIcon = zone.parentNode.querySelector(`.res-icon-${index}`);
        if(oldIcon) oldIcon.remove();

        const chip = zone.querySelector('.chip');
        const userAnswer = chip ? chip.getAttribute('data-word') : null;
        const correctAnswer = topicData.answers[index];

        const icon = document.createElement('i');
        icon.className = `fa-solid result-icon res-icon-${index}`;

        if (userAnswer === correctAnswer) {
            zone.classList.add('correct');
            icon.classList.add('fa-check');
        } else {
            zone.classList.add('incorrect');
            icon.classList.add('fa-times');
        }
        zone.parentNode.insertBefore(icon, zone.nextSibling);
    });
}

function validateReadingOrdering(topicId) {
    const part = state.currentPart;
    const topicData = state.data[part].find(t => t.id === topicId);
    
    const items = document.querySelectorAll('.sortable-item');
    let isAllCorrect = true;

    items.forEach((item, index) => {
        item.classList.remove('correct', 'incorrect');
        // Remove old icons
        const oldIcon = item.querySelector('.result-icon');
        if(oldIcon) oldIcon.remove();

        const originalIndex = parseInt(item.getAttribute('data-id'));
        
        const icon = document.createElement('i');
        icon.className = 'fa-solid result-icon';

        if (originalIndex === index) {
            item.classList.add('correct');
            icon.classList.add('fa-check');
        } else {
            item.classList.add('incorrect');
            icon.classList.add('fa-times');
            isAllCorrect = false;
        }
        item.appendChild(icon);
    });
}

function validateReadingPart4(topicId) {
    const topicData = state.data.part4.find(t => t.id === topicId);
    
    topicData.questions.forEach((q, index) => {
        const select = document.getElementById(`q_${index}`);
        const block = select.closest('.question-block');
        block.classList.remove('correct', 'incorrect');
        
        const userAnswer = select.value;
        const correctAnswer = q.answer;

        if (userAnswer === correctAnswer) {
            block.classList.add('correct');
        } else {
            block.classList.add('incorrect');
        }
    });
}

function validateListeningMultipleChoice(topicId) {
    const part = state.currentPart;
    const topicData = state.data.listening[part].find(t => t.id === topicId);
    
    // Because we shuffled, we need to match by question text
    const blocks = document.querySelectorAll('.question-block');
    
    blocks.forEach((block, index) => {
        block.classList.remove('correct', 'incorrect');
        const qText = block.getAttribute('data-original-question');
        const originalQuestion = topicData.questions.find(q => q.question === qText);
        
        const selectedRadio = block.querySelector('input[type="radio"]:checked');
        const userAnswer = selectedRadio ? selectedRadio.value : null;
        const correctAnswer = originalQuestion.answer;

        if (userAnswer === correctAnswer) {
            block.classList.add('correct');
        } else {
            block.classList.add('incorrect');
        }
    });
}

function validateListeningPart16_17(topicId) {
    const part = state.currentPart;
    const topicData = state.data.listening[part].find(t => t.id === topicId);
    const correctAnswers = topicData.answers;

    const checkboxes = document.querySelectorAll('input[name="p16_17"]');
    const selectedAnswers = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // Highlight each option label
    checkboxes.forEach(cb => {
        const label = cb.closest('.option-label');
        label.classList.remove('correct', 'incorrect', 'missed');
        const isCorrect = correctAnswers.includes(cb.value);
        const isSelected = cb.checked;

        if (isSelected && isCorrect) {
            label.classList.add('correct');
        } else if (isSelected && !isCorrect) {
            label.classList.add('incorrect');
        } else if (!isSelected && isCorrect) {
            label.classList.add('missed'); // show what was missed
        }
    });
}

function validateListeningPart14(topicId) {
    const topicData = state.data.listening.part14.find(t => t.id === topicId);
    
    topicData.options.forEach((opt, index) => {
        const select = document.getElementById(`p14_${index}`);
        const block = select.closest('.question-block');
        block.classList.remove('correct', 'incorrect');
        
        const userAnswer = select.value;
        const correctAnswer = opt.hint_start;

        if (userAnswer === correctAnswer) {
            block.classList.add('correct');
        } else {
            block.classList.add('incorrect');
        }
    });
}

function validateListeningPart15(topicId) {
    const topicData = state.data.listening.part15.find(t => t.id === topicId);
    
    topicData.questions.forEach((q, index) => {
        const select = document.getElementById(`p15_${index}`);
        const block = select.closest('.question-block');
        block.classList.remove('correct', 'incorrect');
        
        const userAnswer = select.value;
        const correctAnswer = q.answer;

        if (userAnswer === correctAnswer) {
            block.classList.add('correct');
        } else {
            block.classList.add('incorrect');
        }
    });
}

// --- Hint System ---

function setupHintSystem(part, topicData) {
    hintBtn.classList.remove('hidden');
    let hintsHtml = `<h3>Correct Answers for this Topic</h3><ul>`;

    if (state.currentSkill === 'reading') {
        if (part === 'part1') {
            hintsHtml += topicData.answers.map((w, i) => `<li>Blank ${i + 1}: <strong>${w}</strong></li>`).join('');
        } else if (['part2', 'part3', 'part5'].includes(part)) {
            hintsHtml += topicData.sentences.map((s, i) => `<li>${i + 1}. ${s}</li>`).join('');
        } else if (part === 'part4') {
            hintsHtml += topicData.questions.map(q => `<li>${q.question}<br>Answer: <strong>${q.answer}</strong></li>`).join('');
        }
    } else {
        if (part === 'part1_13') {
            hintsHtml += topicData.questions.map((q, i) => `<li>Q${i+1}: ${q.question}<br>Answer: <strong>${q.answer}</strong></li>`).join('');
        } else if (part === 'part16' || part === 'part17') {
            hintsHtml += topicData.answers.map((ans, i) => `<li>Đáp án đúng ${i+1}: <strong>${ans}</strong></li>`).join('');
        } else if (part === 'part14') {
            hintsHtml += topicData.options.map((opt, i) => `<li>Person ${i+1} (${opt.answer}):<br>Starts with: <strong>"${opt.hint_start}"</strong></li>`).join('');
        } else if (part === 'part15') {
            hintsHtml += topicData.questions.map((q, i) => `<li>${q.statement}<br>Speaker: <strong>${q.answer}</strong></li>`).join('');
        }
    }

    hintsHtml += `</ul>`;
    topicHintsContainer.innerHTML = hintsHtml;
}

function hideHint() {
    hintBtn.classList.add('hidden');
}

// =============================================
// MOCK TEST (THI THỬ)
// =============================================

const mockState = {
    active: false,
    phase: 'reading',
    partIndex: 0,
    readingPartKeys: ['part1', 'part2', 'part3', 'part4', 'part5'],
    listeningPartKeys: ['part1_13', 'part14', 'part15', 'part16', 'part17'],
    topics: {},
    gradingResults: {}
};

function startMockTest() {
    mockState.active = true;
    mockState.phase = 'reading';
    mockState.partIndex = 0;
    mockState.topics = {};
    mockState.gradingResults = {};

    const allParts = [...mockState.readingPartKeys, ...mockState.listeningPartKeys];
    allParts.forEach(part => {
        let pool;
        if (['part1', 'part2', 'part3', 'part4', 'part5'].includes(part)) {
            pool = state.data[part];
        } else {
            pool = state.data.listening[part];
        }
        mockState.topics[part] = pool[Math.floor(Math.random() * pool.length)];
    });

    hideHint();
    breadcrumbsContainer.innerHTML = '';
    renderMockTestPart();
}

function exitMockTest() {
    mockState.active = false;
    renderHome();
}

function renderMockTestPart() {
    const partKeys = mockState.phase === 'reading' ? mockState.readingPartKeys : mockState.listeningPartKeys;
    const part = partKeys[mockState.partIndex];
    const topicData = mockState.topics[part];
    const totalParts = mockState.readingPartKeys.length + mockState.listeningPartKeys.length;
    const globalIndex = mockState.phase === 'reading'
        ? mockState.partIndex
        : mockState.readingPartKeys.length + mockState.partIndex;
    const progressPct = Math.round((globalIndex / totalParts) * 100);

    const isLastPart = mockState.partIndex === partKeys.length - 1;
    const isListening = mockState.phase === 'listening';
    let btnText = isLastPart && isListening
        ? '<i class="fa-solid fa-flag-checkered"></i> Nộp Bài & Xem Kết Quả'
        : isLastPart
            ? '<i class="fa-solid fa-headphones"></i> Chuyển sang Listening →'
            : 'Part Tiếp Theo <i class="fa-solid fa-arrow-right"></i>';

    const badgeClass = mockState.phase === 'reading' ? 'badge-reading' : 'badge-listening';
    const phaseLabel = mockState.phase === 'reading' ? 'Reading' : 'Listening';
    const partLabel = formatPartName(part);
    const topicName = topicData.topic || '';

    let contentHtml = '';
    if (mockState.phase === 'reading') {
        if (part === 'part1') contentHtml = renderReadingPart1(topicData);
        else if (['part2', 'part3', 'part5'].includes(part)) contentHtml = renderReadingOrdering(topicData);
        else if (part === 'part4') contentHtml = renderReadingPart4(topicData);
    } else {
        if (part === 'part1_13') contentHtml = renderListeningMultipleChoice(topicData);
        else if (part === 'part14') contentHtml = renderListeningPart14(topicData);
        else if (part === 'part15') contentHtml = renderListeningPart15(topicData);
        else if (part === 'part16' || part === 'part17') contentHtml = renderListeningPart16_17(topicData);
    }

    appContainer.innerHTML = `
        <div class="practice-container">
            <div class="mock-test-header">
                <div>
                    <span class="mock-progress-label">${phaseLabel}</span>
                    <span class="mock-phase-badge ${badgeClass}">${partLabel}</span>
                </div>
                <button class="btn btn-secondary" onclick="exitMockTest()">
                    <i class="fa-solid fa-xmark"></i> Thoát
                </button>
            </div>
            <div class="mock-progress-bar">
                <div class="mock-progress-fill" style="width: ${progressPct}%"></div>
            </div>
            ${topicName ? `<p class="mock-topic-title"><i class="fa-solid fa-tag"></i> ${topicName}</p>` : ''}
            <div id="practiceContent">${contentHtml}</div>
            <div class="action-area">
                <button class="btn btn-primary" onclick="mockNextPart()">${btnText}</button>
            </div>
        </div>
    `;

    if (['part2', 'part3', 'part5'].includes(part) && mockState.phase === 'reading') {
        const el = document.getElementById('sortableList');
        if (el) Sortable.create(el, { animation: 150 });
    }
    if (part === 'part1' && mockState.phase === 'reading') {
        setupDragAndDrop();
    }
}

function mockNextPart() {
    const partKeys = mockState.phase === 'reading' ? mockState.readingPartKeys : mockState.listeningPartKeys;
    const part = partKeys[mockState.partIndex];
    const topicData = mockState.topics[part];

    mockState.gradingResults[part] = collectAndGradePart(part, topicData);

    const isLastPart = mockState.partIndex === partKeys.length - 1;
    if (isLastPart && mockState.phase === 'listening') {
        showMockTestResults();
    } else if (isLastPart && mockState.phase === 'reading') {
        mockState.phase = 'listening';
        mockState.partIndex = 0;
        renderMockTestPart();
    } else {
        mockState.partIndex++;
        renderMockTestPart();
    }
}

function collectAndGradePart(part, topicData) {
    const result = { correct: 0, total: 0, wrong: [], partLabel: formatPartName(part), topic: topicData.topic || '' };

    if (part === 'part1') {
        document.querySelectorAll('.drop-zone').forEach((zone, i) => {
            result.total++;
            const chip = zone.querySelector('.chip');
            const userAnswer = chip ? chip.getAttribute('data-word') : '(bỏ trống)';
            const correctAnswer = topicData.answers[i];
            if (userAnswer === correctAnswer) {
                result.correct++;
            } else {
                result.wrong.push({ question: `Ô trống ${i + 1}`, userAnswer, correctAnswer });
            }
        });
    } else if (['part2', 'part3', 'part5'].includes(part)) {
        document.querySelectorAll('.sortable-item').forEach((item, i) => {
            result.total++;
            const originalIndex = parseInt(item.getAttribute('data-id'));
            if (originalIndex === i) {
                result.correct++;
            } else {
                result.wrong.push({
                    question: `Vị trí ${i + 1}`,
                    userAnswer: topicData.sentences[originalIndex],
                    correctAnswer: topicData.sentences[i]
                });
            }
        });
    } else if (part === 'part4') {
        topicData.questions.forEach((q, i) => {
            result.total++;
            const select = document.getElementById(`q_${i}`);
            const userAnswer = select ? select.value : '(bỏ trống)';
            if (userAnswer === q.answer) {
                result.correct++;
            } else {
                result.wrong.push({ question: q.question, userAnswer: userAnswer || '(bỏ trống)', correctAnswer: q.answer });
            }
        });
    } else if (part === 'part1_13') {
        document.querySelectorAll('.question-block').forEach(block => {
            result.total++;
            const qText = block.getAttribute('data-original-question');
            const originalQ = topicData.questions.find(q => q.question === qText);
            if (!originalQ) return;
            const selected = block.querySelector('input[type="radio"]:checked');
            const userAnswer = selected ? selected.value : '(bỏ trống)';
            if (userAnswer === originalQ.answer) {
                result.correct++;
            } else {
                result.wrong.push({ question: originalQ.question, userAnswer, correctAnswer: originalQ.answer });
            }
        });
    } else if (part === 'part14') {
        topicData.options.forEach((opt, i) => {
            result.total++;
            const select = document.getElementById(`p14_${i}`);
            const userAnswer = select ? select.value : '(bỏ trống)';
            if (userAnswer === opt.hint_start) {
                result.correct++;
            } else {
                result.wrong.push({ question: `Person ${i + 1}: ${opt.answer}`, userAnswer: userAnswer || '(bỏ trống)', correctAnswer: opt.hint_start });
            }
        });
    } else if (part === 'part15') {
        topicData.questions.forEach((q, i) => {
            result.total++;
            const select = document.getElementById(`p15_${i}`);
            const userAnswer = select ? select.value : '(bỏ trống)';
            if (userAnswer === q.answer) {
                result.correct++;
            } else {
                result.wrong.push({ question: q.statement, userAnswer: userAnswer || '(bỏ trống)', correctAnswer: q.answer });
            }
        });
    } else if (part === 'part16' || part === 'part17') {
        const selected = Array.from(document.querySelectorAll('input[name="p16_17"]:checked')).map(cb => cb.value);
        topicData.answers.forEach((ans, i) => {
            result.total++;
            if (selected.includes(ans)) {
                result.correct++;
            } else {
                result.wrong.push({ question: `Đáp án đúng ${i + 1}`, userAnswer: selected[i] || '(không chọn)', correctAnswer: ans });
            }
        });
    }

    return result;
}

function showMockTestResults() {
    let readingCorrect = 0;
    let listeningCorrect = 0;

    mockState.readingPartKeys.forEach(p => {
        if (mockState.gradingResults[p]) readingCorrect += mockState.gradingResults[p].correct;
    });
    mockState.listeningPartKeys.forEach(p => {
        if (mockState.gradingResults[p]) listeningCorrect += mockState.gradingResults[p].correct;
    });

    const readingScore = Math.round((readingCorrect / 29) * 50 * 10) / 10;
    const listeningScore = listeningCorrect * 2;
    const totalScore = Math.round((readingScore + listeningScore) * 10) / 10;

    const allWrong = [...mockState.readingPartKeys, ...mockState.listeningPartKeys]
        .map(p => mockState.gradingResults[p])
        .filter(r => r && r.wrong.length > 0);

    const wrongHtml = allWrong.length === 0
        ? '<p class="all-correct">🎉 Hoàn hảo! Bạn trả lời đúng tất cả câu!</p>'
        : allWrong.map(r => `
            <div class="review-section">
                <h4><i class="fa-solid fa-layer-group"></i> ${r.partLabel} — ${r.topic}</h4>
                ${r.wrong.map(w => `
                    <div class="review-item">
                        <div class="review-question">${w.question}</div>
                        <div class="review-user">Bạn trả lời: <span class="wrong-ans">${w.userAnswer}</span></div>
                        <div class="review-correct">Đáp án đúng: <span class="right-ans">${w.correctAnswer}</span></div>
                    </div>
                `).join('')}
            </div>
        `).join('');

    appContainer.innerHTML = `
        <div class="results-container">
            <h2>🎓 Kết Quả Thi Thử</h2>
            <div class="scores-grid">
                <div class="score-card">
                    <div class="score-label">Reading</div>
                    <div class="score-value">${readingScore}<span>/50</span></div>
                    <div class="score-detail">${readingCorrect}/29 câu đúng</div>
                </div>
                <div class="score-card">
                    <div class="score-label">Listening</div>
                    <div class="score-value">${listeningScore}<span>/50</span></div>
                    <div class="score-detail">${listeningCorrect}/25 câu đúng</div>
                </div>
                <div class="score-card total">
                    <div class="score-label">Tổng Điểm</div>
                    <div class="score-value">${totalScore}<span>/100</span></div>
                </div>
            </div>
            <div class="review-area">
                <h3>📋 Xem Lại Câu Sai</h3>
                ${wrongHtml}
            </div>
            <div class="results-action-area">
                <button class="btn btn-primary" onclick="startMockTest()">
                    <i class="fa-solid fa-rotate-right"></i> Thi Lại
                </button>
                <button class="btn btn-secondary" onclick="renderHome()">
                    <i class="fa-solid fa-home"></i> Về Trang Chủ
                </button>
            </div>
        </div>
    `;
    breadcrumbsContainer.innerHTML = '';
}

// Run app
document.addEventListener('DOMContentLoaded', init);
