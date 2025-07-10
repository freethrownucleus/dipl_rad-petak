// Globalne varijable
let username, password;
let loginFlag = false, gameInProgress = false;
let timer;
let timeLeft;
let timerEnabled = false;
let mainGame;
let url = "https://dipl-rad-petak.onrender/";
let divsArray = ["homePageDiv", "gameFormDiv", "gameDiv", "rankingDiv", "rulesDiv"];

// Inicijalizacija DOM elemenata
function initElements() {
    // Get all necessary elements
    window.homePageDiv = document.getElementById("homePageDiv");
    window.gameFormDiv = document.getElementById("gameFormDiv");
    window.gameDiv = document.getElementById("gameDiv");
    window.rankingDiv = document.getElementById("rankingDiv");
    window.rulesDiv = document.getElementById("rulesDiv");
    window.loginDiv = document.getElementById("loginDiv");
    window.optionsDiv = document.getElementById("optionsDiv");
    window.userInputForm = document.getElementById("userInputForm");
    window.boardSizeForm = document.getElementById("boardSizeForm");
    window.wrongPasswordText = document.getElementById("wrongPasswordText");
    window.userInput = document.getElementById("userInput");
    window.passwordInput = document.getElementById("passwordInput");
    window.tableRankingDiv = document.getElementById("tableRankingDiv");
    window.showLoginDiv = document.getElementById("user-profile");
    window.showLoginText = document.getElementById("username-display");
    window.leaveGameButton = document.getElementById("leaveGameButton");
    window.restartGameButton = document.getElementById("restartGameButton");
    window.timerDisplay = document.getElementById("timerDisplay");
    window.messageH1 = document.getElementById("messageH1");

    // Set up event listeners
    if (userInputForm) {
        userInputForm.addEventListener("submit", function(e) {
            e.preventDefault();
            login();
        });
    }

    // Dodajemo event listener za Enter tipku u oba polja
    [userInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    login();
                }
            });
        }
    });
    
    // Initialize form values
    resetGameOptions();
}

function resetGameOptions() {
    if (document.querySelector('input[name="playFirstButton"][value="player"]')) {
        document.querySelector('input[name="playFirstButton"][value="player"]').checked = true;
    }
    if (document.getElementById("boardSizeInput")) {
        document.getElementById("boardSizeInput").value = "4";
    }
    if (document.querySelector('input[name="gameVersion"][value="standard"]')) {
        document.querySelector('input[name="gameVersion"][value="standard"]').checked = true;
    }
    if (document.querySelector('input[name="difficulty"][value="easy"]')) {
        document.querySelector('input[name="difficulty"][value="easy"]').checked = true;
    }
    if (document.querySelector('input[name="timerOption"][value="none"]')) {
        document.querySelector('input[name="timerOption"][value="none"]').checked = true;
    }
}

// Rukovanje klikom na gumb za igru
function handlePlayButton() {
    if (loginFlag) {
        showGameForm(true, true);
    } else {
        showGameForm(true, false);
    }
}

function showFrontPage() {
    hideAllScreens();
    if (!loginFlag && homePageDiv) {
        homePageDiv.classList.add("active");
    } else {
        // If logged in, show game form instead
        showGameForm(true, true);
    }
    updateLoginDisplay();
}

// Prikaz postavki igre
function showGameForm(password = true, showOptions = false) {
    hideAllScreens();
    if (gameInProgress) leaveGame();
    
    if (gameFormDiv) {
        gameFormDiv.classList.add("active");
        
        if (loginDiv) loginDiv.style.display = (loginFlag || showOptions) ? "none" : "block";
        if (optionsDiv) optionsDiv.style.display = (loginFlag || showOptions) ? "block" : "none";
        if (userInputForm) userInputForm.reset();

        resetGameOptions();
    }
    
    updateLoginDisplay();
}

// Sakrij sve ekrane
function hideAllScreens() {
    divsArray.forEach(divId => {
        const element = document.getElementById(divId);
        if (element) element.classList.remove("active");
    });
}

// Prikaz igre
function showGameDiv() {
    hideAllScreens();
    if (gameDiv) gameDiv.classList.add("active");
}

// Resetiraj div igre
function resetGameDiv() {
    if (gameDiv) {
        const gameBoardContainer = gameDiv.querySelector(".game-board-container");
        if (gameBoardContainer) {
            gameBoardContainer.innerHTML = ""; // Potpuno očisti HTML
            gameBoardContainer.style.display = "block"; // Osiguraj da je vidljiv
        }
    }
    clearInterval(timer); // Očisti sve tajmere
}

// Prikaz rang liste najboljih igrača
function showRanks() {
    if (gameInProgress) leaveGame();
    hideAllScreens();
    if (rankingDiv) rankingDiv.classList.add("active");

    let players = [];
    for (let i = 0; i < localStorage.length; i++) {
        let jsonUsername = localStorage.key(i);
        let json = JSON.parse(localStorage.getItem(jsonUsername));

        if (json.games >= 5) {
            let winPercentage = ((json.victories / json.games) * 100).toFixed(2);
            players.push({
                username: jsonUsername,
                games: json.games,
                victories: json.victories,
                losses: json.games - json.victories,
                winPercentage: parseFloat(winPercentage),
            });
        }
    }

    players.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        if (b.victories !== a.victories) return b.victories - a.victories;
        return a.username.localeCompare(b.username);
    });

    players = players.slice(0, 10);

    let finalText = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th>Igrač</th>
                    <th>Ukupno</th>
                    <th>Pobjeda</th>
                    <th>Poraz</th>
                    <th>Omjer</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(player => `
                    <tr>
                        <td>${player.username}</td>
                        <td>${player.games}</td>
                        <td>${player.victories}</td>
                        <td>${player.losses}</td>
                        <td>${player.winPercentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    if (tableRankingDiv) tableRankingDiv.innerHTML = finalText;
}

// Prikaz pravila igre 
function showRules() {
    if (gameInProgress) leaveGame();
    hideAllScreens();
    if (rulesDiv) rulesDiv.classList.add("active");
}

// Početak partije
function playGame(event) {
    if (event) event.preventDefault();

    if (!loginFlag) {
        showGameForm(true, false);
        return false;
    }

    // Resetiraj sve prije pokretanja nove igre
    resetGameDiv();
    gameInProgress = false;

    // Postavi novu igru
    const firstPlayer = document.querySelector('input[name="playFirstButton"]:checked')?.value || "player";
    const boardSize = parseInt(document.getElementById("boardSizeInput")?.value, 10) || 4;
    const gameVersion = document.querySelector('input[name="gameVersion"]:checked')?.value || "standard";
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "easy";
    const timerOption = document.querySelector('input[name="timerOption"]:checked')?.value || "none";

    mainGame = new NimGame(firstPlayer, boardSize, gameVersion, difficulty, timerOption !== "none", timerOption !== "none" ? parseInt(timerOption, 10) : 0);
    mainGame.initiateGame();

    return false;
}


function restartGame() {
    const gameBoardContainer = document.querySelector(".game-board-container");
    if (gameBoardContainer) gameBoardContainer.style.display = "";

    if (timerDisplay) timerDisplay.style.display = "";

    const allButtons = document.querySelectorAll('.game-controls button');
    allButtons.forEach(btn => btn.style.display = '');

    if (messageH1) {
        messageH1.className = "game-status";
        messageH1.style.display = "";
    }

    if (!gameInProgress) {
        playGame();
        return;
    }

    if (mainGame?.currentTimer) {
        clearInterval(mainGame.currentTimer);
        mainGame.currentTimer = null;
    }

    const firstPlayer = document.querySelector('input[name="playFirstButton"]:checked')?.value || "player";
    const boardSize = parseInt(document.getElementById("boardSizeInput")?.value, 10) || 4;
    const gameVersion = document.querySelector('input[name="gameVersion"]:checked')?.value || "standard";
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "easy";
    const timerOption = document.querySelector('input[name="timerOption"]:checked')?.value || "none";

    const timerEnabled = timerOption !== "none";
    const timeLimit = timerEnabled ? parseInt(timerOption, 10) : 0;

    setTimeout(() => {
        mainGame = new NimGame(firstPlayer, boardSize, gameVersion, difficulty, timerEnabled, timeLimit);
        mainGame.initiateGame();

        if (mainGame.pcTimeout) {
            clearTimeout(mainGame.pcTimeout);
            mainGame.pcTimeout = null;
        }
    }, 100);
}


// Prijava korisnika u aplikaciju
function login() {
    username = userInput.value;
    password = passwordInput.value;

    let js_obj = { "user": username, "pass": password };
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url + "register", true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                loginFlag = true;
                updateLoginDisplay();
                
                // ... nastavak ...

                if (!localStorage[username]) {
                    localStorage[username] = JSON.stringify({ victories: 0, games: 0 });
                }
                showGameForm(true, true);
            } else if (xhr.status === 400) {
                if (userInput) userInput.value = "";
                if (passwordInput) passwordInput.value = "";
                showGameForm(false, false);
            }
        }
    };
    xhr.send(JSON.stringify(js_obj));
}

// Odjava korisnika iz aplikacije
function logout() {
    if (gameInProgress) {
        if (showLoginText) {
            showLoginText.textContent = "Igra je u tijeku!";
            showLoginText.style.color = "red";

            setTimeout(() => {
                if (showLoginText) {
                    showLoginText.textContent = username;
                    showLoginText.style.color = ""; 
                }
            }, 3000);
        }
        return;
    }

    loginFlag = false;
    username = null;
    updateLoginDisplay();
    showFrontPage();
}


// Ažuriraj prikaz prijave
function updateLoginDisplay() {
    if (showLoginDiv) {
        showLoginDiv.style.display = loginFlag ? "flex" : "none";
        if (showLoginText) showLoginText.textContent = loginFlag ? username : "";
    }
    
    // Hide home page if logged in
    if (loginFlag && homePageDiv && homePageDiv.classList.contains("active")) {
        homePageDiv.classList.remove("active");
        showGameForm(true, true);
    }
}

// Napusti igru
function leaveGame() {
    if (gameInProgress && mainGame) {
        mainGame.leave(); // Ovo bi trebalo pozvati clearTimer() i resetirati stanje
    }
    resetGameDiv();
    gameInProgress = false; // Eksplicitno postaviti na false
    showFrontPage(); // Vrati na početni ekran
}

class Board {
    constructor(size) {
        this.size = size;
        this.boardQuantityArray = [];

        this.createBoard = function () {
            const boardContainer = document.querySelector(".game-board-container");
            if (!boardContainer) return;

            boardContainer.innerHTML = "";

            const boardDiv = document.createElement("div");
            boardDiv.className = "board";

            for (let row = 0; row < this.size; row++) {
                const chipsInRow = row * 2 + 1;
                this.boardQuantityArray.push(chipsInRow);

                const rowDiv = document.createElement("div");
                rowDiv.className = "row";

                const spaces = this.size - 1 - row;
                for (let s = 0; s < spaces; s++) {
                    const space = document.createElement("div");
                    space.className = "chip-space";
                    rowDiv.appendChild(space);
                }

                for (let col = 0; col < chipsInRow; col++) {
                    const piece = new Piece(row, col);
                    rowDiv.appendChild(piece.html);
                }

                boardDiv.appendChild(rowDiv);
            }

            boardContainer.appendChild(boardDiv);
        };
    }
}


class NimGame {
    constructor(firstPlayer, boardSize, gameVersion, difficulty, timerEnabled, timeLimit) {
        this.firstPlayer = firstPlayer;
        this.boardSize = boardSize;
        this.gameVersion = gameVersion;
        this.difficulty = difficulty;
        this.timerEnabled = timerEnabled;
        this.timeLimit = timeLimit;
        this.currentTimer = null;
        this.timeLeft = 0;
        this.playerTurn = false;
        this.moves = 0; 

        this.initiateGame = function () {
            this.moves = 0;
            this.playerTurn = (this.firstPlayer === "player");
            gameInProgress = true; // Postavi na true prije generiranja ploče

            // Resetiraj ploču
            this.board = new Board(this.boardSize);
            this.pc = new PC(this.gameVersion, this.difficulty);

            resetGameDiv(); // Očisti prethodnu ploču
            showGameDiv();  // Prikaži gameDiv

            // Generiraj nove zetone
            this.board.createBoard();
            this.updateGameState();

            if (this.firstPlayer === "pc") {
                setTimeout(() => {
                    if (gameInProgress) {
                        this.pc.move();
                    }
                }, 1500);
            }
        }

        this.startPlayerTimer = function () {
            this.clearTimer();
            clearInterval(this.currentTimer);
            this.currentTimer = null;

            if (!this.timerEnabled || !gameInProgress || !this.playerTurn) {
                return;
            }

            this.timeLeft = this.timeLimit;
            this.updateTimerDisplay();

            this.currentTimer = setInterval(() => {
                if (!gameInProgress || !this.playerTurn) {
                    this.clearTimer();
                    return;
                }

                this.timeLeft--;
                this.updateTimerDisplay();

                if (this.timeLeft <= 0) {
                    this.handleTimeOut();
                }
            }, 1000);
        };

        this.clearTimer = function () {
            if (this.currentTimer) {
                clearInterval(this.currentTimer);
                this.currentTimer = null;
            }

            let id = window.setInterval(function () { }, 9999);

            while (id--) {
                window.clearInterval(id);
            }
        };

        this.updateTimerDisplay = function () {
            if (!this.timerEnabled || !timerDisplay || !this.playerTurn) {
                if (timerDisplay) timerDisplay.style.display = this.playerTurn ? "block" : "none";
                return;
            }

            timerDisplay.style.display = "block";
            timerDisplay.textContent = `Još ${this.timeLeft} sekundi za ${username}`;
            timerDisplay.className = "";
            timerDisplay.style.fontSize = "20px";

            if (this.timeLeft <= 3) {
                timerDisplay.classList.add("time-critical");
            } else if (this.timeLeft <= this.timeLimit / 2) {
                timerDisplay.classList.add("time-warning");
            }
        };

        this.handleTimeOut = function () {
            this.clearTimer();
            clearInterval(this.currentTimer);
            this.currentTimer = null;

            if (!gameInProgress) return;

            const allchips = document.querySelectorAll('.chip:not(.removed)');
            allchips.forEach(chip => {
                chip.style.pointerEvents = 'none';
            });

            if (messageH1) messageH1.textContent = "Vrijeme je isteklo! Izgubili ste... 😢";

            let json = JSON.parse(localStorage[username] || '{"victories":0,"games":0}');
            json.games++;
            localStorage[username] = JSON.stringify(json);

            gameInProgress = false;
            this.playerTurn = false; 
        };

        this.updateGameState = function () {
            this.playerTurn = ((this.moves % 2 === 0 && this.firstPlayer === "player") ||
                (this.moves % 2 !== 0 && this.firstPlayer !== "player"));

            const allchips = document.querySelectorAll('.chip:not(.removed)');
            allchips.forEach(chip => {
                chip.style.pointerEvents = this.playerTurn ? 'auto' : 'none';
                if (!this.playerTurn) {
                    chip.classList.remove("selected"); 
                }
            });
      
            this.clearTimer();
            clearInterval(this.currentTimer);
            this.currentTimer = null;

            if (messageH1) {
                messageH1.textContent = this.playerTurn ? `${username} (Vi)` : "Računalo";
                messageH1.className = "game-status " + (this.playerTurn ? "player-turn" : "pc-turn");
            }

            if (this.timerEnabled) {
                if (this.playerTurn) {
                    if (timerDisplay) {
                        timerDisplay.style.display = "block";
                        this.startPlayerTimer();
                        timerDisplay.textContent = `Još ${this.timeLeft} sekundi za ${username}`;
                        timerDisplay.style.fontSize = "20px";
                    }
                } else {
                    if (timerDisplay) {
                        timerDisplay.textContent = "Računalo razmišlja...";
                        timerDisplay.style.display = "block";
                        timerDisplay.className = "";
                        timerDisplay.style.fontSize = "20px";
                    }
                }
            } else {
                if (timerDisplay) {
                    timerDisplay.textContent = this.playerTurn ? `${username} razmišlja...` : "Računalo razmišlja...";
                    timerDisplay.style.display = "block";
                    timerDisplay.className = "";
                    timerDisplay.style.fontSize = "20px";
                }
            }
        };

        this.deletePiece = function (row, col) {
            if (!gameInProgress) return;

            this.clearTimer();
            clearInterval(this.currentTimer);
            this.currentTimer = null;

            if (this.board.boardQuantityArray[row] === 0) {
                return; 
            }

            const chipsInRow = this.board.boardQuantityArray[row];
            const chipsToRemove = chipsInRow - col;

            if (chipsToRemove <= 0 || chipsToRemove > chipsInRow || col < 0) {
                console.error("Nevažeći potez:", { row, col, chipsInRow });
                return;
            }

            for (let i = chipsInRow - 1; i >= col; i--) {
                const piece = document.getElementById(`piece${row}|${i}`);
                if (piece) {
                    piece.classList.add("removed");
                    piece.style.pointerEvents = "none";
                }
            }

            this.board.boardQuantityArray[row] = col;

            if (this.checkGameOver()) {
                this.endGame();
                return;
            }

            this.moves++;
            this.updateGameState();

            if (!this.playerTurn && gameInProgress) {
                if (timerDisplay) {
                    timerDisplay.textContent = "Računalo razmišlja...";
                    timerDisplay.style.display = "block";
                    timerDisplay.className = "";

                }

                this.pcTimeout = setTimeout(() => {
                    if (gameInProgress) {
                        this.pc.move();
                    }
                }, 1500);
            }
        };

        this.checkGameOver = function () {
            return this.board.boardQuantityArray.every(q => q === 0);
        };

        this.endGame = function () {
            this.clearTimer();

            let json = JSON.parse(localStorage[username] || '{"victories":0,"games":0}');
            let playerWon = this.playerTurn;

            if (this.gameVersion === "misere") {
                playerWon = !playerWon;
            }

            json.games++;

            if (playerWon) json.victories++;
            localStorage[username] = JSON.stringify(json);

            const gameBoardContainer = document.querySelector(".game-board-container");

            if (gameBoardContainer) {
                gameBoardContainer.style.display = "none";
            }
            if (timerDisplay) {
                timerDisplay.style.display = "none";
            }

            if (messageH1) {
                messageH1.textContent = playerWon ? "Pobijedili ste! 😊" : "Izgubili ste, više sreće sljedeći put... 😢";
                messageH1.className = "game-status end-game-message " + (playerWon ? "win" : "lose");
                messageH1.style.display = "block";
                messageH1.style.fontSize = "32px";
            }

            /*
            const allButtons = document.querySelectorAll('.game-controls button');
            allButtons.forEach(btn => {
                if (btn.id !== 'restartGameButton' && btn.id !== 'leaveGameButton') {
                    btn.style.display = 'none';
                }
            });

            gameInProgress = false;
            */
        };

        this.leave = function () {
            gameInProgress = false;
            this.clearTimer();
            resetGameDiv();
        };
    }
}


class PC {
    constructor(gameVersion, difficulty) {
        this.gameVersion = gameVersion;
        this.difficulty = difficulty;

        this.move = function () {
            const nonZeroPiles = mainGame.board.boardQuantityArray.filter(p => p > 0);

            if (this.difficulty === "hard") {
                this.hardMove();
            }
            else if (nonZeroPiles.length <= 3) {
                this.hardMove();
            }
            else {
                this.randomMove();
            }
        };

        // ... nastavak ...

        this.randomMove = function () {
            let x;
            do {
                x = Math.floor(Math.random() * mainGame.board.boardQuantityArray.length);
            } while (mainGame.board.boardQuantityArray[x] === 0);

            let y = Math.floor(Math.random() * mainGame.board.boardQuantityArray[x]);
            mainGame.deletePiece(x, y);
        };

        this.hardMove = function () {
            const piles = [...mainGame.board.boardQuantityArray];
            const nonZeroPiles = piles.filter(p => p > 0);
            const ones = nonZeroPiles.filter(p => p === 1).length;
            const moreThanOne = nonZeroPiles.filter(p => p > 1).length;
            const totalPiles = nonZeroPiles.length;

            if (totalPiles === 1) {
                const index = piles.indexOf(nonZeroPiles[0]);
                if (nonZeroPiles[0] > 1) {
                    mainGame.deletePiece(index, nonZeroPiles[0] - (this.gameVersion === "misere" ? 0 : 1));
                } else {
                    mainGame.deletePiece(index, 0);
                }
                return;
            }

            if (this.gameVersion === "misere" && moreThanOne <= 1) {
                if (moreThanOne === 1) {
                    const bigPileIndex = piles.findIndex(p => p > 1);
                    const bigPileSize = piles[bigPileIndex];

                    if (ones > 0) {
                        const target = (ones % 2 === 0) ? 1 : 0;
                        mainGame.deletePiece(bigPileIndex, target);
                    } else {
                        mainGame.deletePiece(bigPileIndex, bigPileSize - 1);
                    }
                    return;
                    
                } else {
                    if (totalPiles % 2 === 0) {
                        const index = piles.indexOf(1);
                        mainGame.deletePiece(index, 0);
                    } else {
                        const index = piles.indexOf(1);
                        mainGame.deletePiece(index, totalPiles > 1 ? 0 : 0);
                    }
                    return;
                }
            }

            // ... nastavak ...

            const xorSum = piles.reduce((a, b) => a ^ b, 0);
            if (xorSum !== 0) {
                for (let i = 0; i < piles.length; i++) {
                    if (piles[i] > 0) {
                        const target = piles[i] ^ xorSum;
                        if (target < piles[i]) {
                            mainGame.deletePiece(i, target);
                            return;
                        }
                    }
                }
            }

            this.randomMove();
        };
    }
}

class Piece {
    constructor(x, y) {
        this.html = document.createElement("div");
        this.html.className = "chip";
        this.html.id = `piece${x}|${y}`;
        this.html.textContent = "●";
        this.html.style.transition = "opacity 0.1s ease, transform 0.1s ease";

        this.html.onmouseover = function () {
            if (!this.classList.contains("removed") && mainGame.playerTurn && gameInProgress) {
                highlightPieces(this.id, true);
            }
        };

        this.html.onmouseleave = function () {
            if (!this.classList.contains("removed") && mainGame.playerTurn && gameInProgress) {
                highlightPieces(this.id, false);
            }
        };

        this.html.onclick = function () {
            if (!this.classList.contains("removed") && mainGame.playerTurn && gameInProgress) {
                let [x, y] = this.id.replace("piece", "").split("|").map(Number);
                mainGame.deletePiece(x, y);
            }
        };

        function highlightPieces(id, hover) {
            let [x, y] = id.replace("piece", "").split("|").map(Number);
            for (; y < mainGame.board.boardQuantityArray[x]; y++) {
                const piece = document.getElementById(`piece${x}|${y}`);
                if (piece) {
                    piece.classList.toggle("selected", hover);
                }
            }
        }
    }
}

// Inicijalizacija kada se stranica učita
document.addEventListener('DOMContentLoaded', function() {
    initElements();
    updateLoginDisplay(); // Check login state first
    showFrontPage(); // This will show home page only if not logged in
    
    // Dodaj event listener za gumb "Započni igru"
    const startButton = document.getElementById("startButton");
    if (startButton) {
        startButton.addEventListener("click", playGame);
    }
});
