const startButton = document.getElementById('start-button');
const crosswordContainer = document.getElementById('crossword-container');
const timerContainer = document.getElementById('timer-container');
const scoreContainer = document.getElementById('score-container');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const gridElement = document.getElementById('grid');
const checkButton = document.getElementById('check-button'); 
const gridSize = 19; 
const wordList = [
    { word: "DISSATISFACTION", start: [0, 0], direction: "horizontal" },
    { word: "FAIRWAGES", start: [0, 8], direction: "vertical" },
    { word: "CIRCULARECONOMY", start: [0, 10], direction: "vertical" },
    { word: "UPCYCLING", start: [4, 10], direction: "horizontal" },
    { word: "CARBONFOOTPRINT", start: [4, 12], direction: "vertical" },
    { word: "ECOTURISM", start: [8, 10], direction: "horizontal" },
    { word: "SLOWFASHION", start: [10, 8], direction: "horizontal" },
    { word: "MINIMALISM", start: [8, 18], direction: "vertical" },
    { word: "AWARENESS", start: [8, 0], direction: "horizontal" },
    { word: "MINDFUL", start: [6, 0], direction: "horizontal" },
    { word: "GREENWASHING", start: [2, 2], direction: "vertical" },
    { word: "CONSUMPTION", start: [13, 5], direction: "horizontal" },
    { word: "LOCAL", start: [12, 14], direction: "vertical" },
    { word: "ZEROWASTE", start: [10, 6], direction: "vertical" },
    { word: "PLASTIC", start: [17, 2], direction: "horizontal" },
    { word: "FAIRTRADE", start: [15, 0], direction: "horizontal" },
    { word: "LANDFILL", start: [11, 0], direction: "vertical" },
];

const cells = {}; 
let timer = null;
let startTime = null;


let activeDirection = null;
let activeWord = null;
let activeIndex = 0;

function handleCellClick(row, col) {
    for (const { word, start, direction } of wordList) {
        const [startRow, startCol] = start;

        if (direction === "horizontal" && row === startRow && col >= startCol && col < startCol + word.length) {
            activeDirection = "horizontal";
            activeWord = { word, start, direction };
            activeIndex = col - startCol;
            cells[`${row}-${col}`].input.focus();
            return;
        }

        if (direction === "vertical" && col === startCol && row >= startRow && row < startRow + word.length) {
            activeDirection = "vertical";
            activeWord = { word, start, direction };
            activeIndex = row - startRow;
            cells[`${row}-${col}`].input.focus();
            return;
        }
    }
}


function handleInput(event, row, col) {
    const currentInput = cells[`${row}-${col}`].input;
    if (event.key === "Backspace") {
        currentInput.value = ""; 
        moveToPreviousCell(row, col);
        return;
    }
    if (!/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        return;
    }
    currentInput.value = event.key.toUpperCase();
    moveToNextCell(row, col);
}

function moveToNextCell(row, col) {
    if (!activeDirection || !activeWord) return;

    const { start, direction, word } = activeWord;
    const [startRow, startCol] = start;

    if (direction === "horizontal") {
        const nextCol = col + 1;
        if (nextCol < startCol + word.length) {
            cells[`${row}-${nextCol}`].input.focus();
            activeIndex++;
        }
    } else if (direction === "vertical") {
        const nextRow = row + 1;
        if (nextRow < startRow + word.length) {
            cells[`${nextRow}-${col}`].input.focus();
            activeIndex++;
        }
    }
}

function moveToPreviousCell(row, col) {
    if (!activeDirection || !activeWord) return;

    const { start, direction } = activeWord;
    const [startRow, startCol] = start;

    if (direction === "horizontal") {
        const prevCol = col - 1;
        if (prevCol >= startCol) {
            cells[`${row}-${prevCol}`].input.focus();
            activeIndex--;
        }
    } else if (direction === "vertical") {
        const prevRow = row - 1;
        if (prevRow >= startRow) {
            cells[`${prevRow}-${col}`].input.focus();
            activeIndex--;
        }
    }
}

function createGrid() {
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            const letterInfo = getLetterAtPosition(row, col);
            if (letterInfo) {
                if (!cells[`${row}-${col}`]) {
                    const input = document.createElement('input');
                    input.maxLength = 1;
                    input.disabled = true;
                    input.addEventListener('click', () => handleCellClick(row, col));
                    input.addEventListener('keydown', (event) => handleInput(event, row, col));
                    cell.appendChild(input);
                    cells[`${row}-${col}`] = { input, letter: letterInfo.letter };
                }
            } else {
                cell.classList.add('filled');
            }

            gridElement.appendChild(cell);
        }
    }
}

function getLetterAtPosition(row, col) {
    for (const { word, start, direction } of wordList) {
        const [startRow, startCol] = start;

        if (direction === "horizontal" && row === startRow && col >= startCol && col < startCol + word.length) {
            return { letter: word[col - startCol], direction };
        }

        if (direction === "vertical" && col === startCol && row >= startRow && row < startRow + word.length) {
            return { letter: word[row - startRow], direction };
        }
    }
    return null;
}

function enableGridInputs() {
    Object.values(cells).forEach(({ input }) => {
        input.disabled = false;
    });
}

startButton.addEventListener('click', () => {
    crosswordContainer.classList.remove('d-none');
    timerContainer.classList.remove('d-none');
    startButton.classList.add('d-none');
    enableGridInputs();
    startGame();
});

function startGame() {
    startTime = new Date();
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsedTime = Math.floor((new Date() - startTime) / 1000);
    const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const seconds = String(elapsedTime % 60).padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;

}

checkButton.addEventListener('click', checkAnswers);
function checkAnswers() {
    let allCorrect = true;
    let correctWords = 0;
    Object.values(cells).forEach(({ input }) => {
        input.classList.remove('correct', 'incorrect');
    });
    for (const { word, start, direction } of wordList) {
        const [startRow, startCol] = start;
        let isWordCorrect = true;

        for (let i = 0; i < word.length; i++) {
            const row = direction === "horizontal" ? startRow : startRow + i;
            const col = direction === "horizontal" ? startCol + i : startCol;

            const cellData = cells[`${row}-${col}`]; 
            if (cellData) {
                const expectedLetter = word[i];
                if (cellData.input.value.toUpperCase() === expectedLetter) {
                    cellData.input.classList.add('correct');
                } else {
                    cellData.input.classList.add('incorrect');
                    isWordCorrect = false;
                }
            }
        }

        if (isWordCorrect) {
            correctWords++;
        } else {
            allCorrect = false;
        }
    }
    if (allCorrect) {
        alert("All answers are correct, congratulations!");
    } else {
        alert("Some words or letters are incorrect, check and try again.");
    }
    stopTimerAndCalculateScore(correctWords);
}

function stopTimerAndCalculateScore(correctWords) {
    clearInterval(timer);

    const elapsedTime = Math.floor((new Date() - startTime) / 1000);
    const timePenalty = Math.max(0, 300 - elapsedTime);
    const score = correctWords * 100 + timePenalty;
    if (scoreElement) {
        scoreElement.textContent = score;
    } else {
        console.error('Elemento #score no encontrado.');
    }
    scoreContainer.classList.remove('d-none');
    savePoints(score);
    console.log('Correct Words:', correctWords, 'Score:', score);
}

function savePoints(points) {
    fetch('/update-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta del servidor:', data);

        const totalPointsElement = document.querySelector('#total-points');
        const crosswordPointsElement = document.querySelector('#crossword-points');

        if (crosswordPointsElement) {
            crosswordPointsElement.textContent = points;
        } else {
            console.error('Elemento #crossword-points no encontrado.');
        }

        if (totalPointsElement) {
            totalPointsElement.textContent = data.totalPoints || 0;
        } else {
            console.error('Elemento #total-points no encontrado.');
        }
    })
    .catch(err => console.error('Error en la solicitud:', err));
}


document.addEventListener('DOMContentLoaded', () => {
    createGrid();
});
