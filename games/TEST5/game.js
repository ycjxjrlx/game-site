document.addEventListener('DOMContentLoaded', () => {
console.log('游戏初始化开始...');
// 获取DOM元素
const gameContainer = document.getElementById('game-container');
const player1Element = document.getElementById('player');
const player2Element = document.getElementById('player2');
const gameOver = document.getElementById('game-over');
const gameOverText = document.getElementById('game-over-text');
const restartBtn = document.getElementById('restart-btn');
const levelComplete = document.getElementById('level-complete');
const levelCompleteText = document.getElementById('level-complete-text');
const levelTime = document.getElementById('level-time');
const winnerText = document.getElementById('winner-text');
const nextLevelBtn = document.getElementById('next-level-btn');
const levelSelectBtn = document.getElementById('level-select-btn');
const levelSelectBtn2 = document.getElementById('level-select-btn-2');
const levelSelection = document.getElementById('level-selection');
const levelButtons = document.getElementById('level-buttons');
const currentLevelDisplay = document.getElementById('current-level');
const timerDisplay = document.getElementById('timer');
const mainMenuBtn = document.getElementById('main-menu-btn');
const resetProgressBtn = document.getElementById('reset-progress-btn');
const player1LivesDisplay = document.getElementById('player1-lives');
const player2LivesDisplay = document.getElementById('player2-lives');
const switchPlayerBtn = document.getElementById('switch-player-btn');

// 游戏参数
let isGameOver = false;
let gravity = 0.6;
let jumpHeight = 12;
let moveSpeed = 5;
let mobileMoveSpeed = 5; 
let currentLevel = 1;
let maxUnlockedLevel = 1;
let gameTime = 0;
let timerInterval;
let isLevelComplete = false;
let debugMode = false;
const MAX_LIVES = 3;
const INVINCIBILITY_DURATION = 1500; // 玩家重生后的无敌时间 (毫秒)
const DAMAGE_STOP_DURATION = 800;    // 玩家停在原地闪烁的时间 (毫秒)

// 当前控制的玩家ID (全局变量)
let activePlayer = 1; 

// 锁定游戏世界物理宽度为 800
const GAME_WIDTH = 800; 

// 地面高度设置
const GROUND_HEIGHT = 140; 

// 缓存关卡对象数据
let levelObjects = {
    obstacles: [],
    platforms: [],
    waters: [],
    fires: [],
    finish: { x: 0, width: 0, height: 1000 }
};

// 玩家1状态
const player1State = {
    x: 50,
    y: GROUND_HEIGHT,
    prevY: GROUND_HEIGHT,
    width: 30,
    height: 50,
    velocityY: 0,
    jumpCount: 0,
    maxJumpCount: 2,
    isJumping: false,
    onGround: true,
    onPlatform: false,
    platformId: null,
    isActive: true,
    reachedFinish: false,
    lives: MAX_LIVES,
    isInvincible: false,
    isStunned: false // 新增：硬直状态，控制是否能移动
};

// 玩家2状态
const player2State = {
    x: 100,
    y: GROUND_HEIGHT,
    prevY: GROUND_HEIGHT,
    width: 30,
    height: 50,
    velocityY: 0,
    jumpCount: 0,
    maxJumpCount: 2,
    isJumping: false,
    onGround: true,
    onPlatform: false,
    platformId: null,
    isActive: true,
    reachedFinish: false,
    lives: MAX_LIVES,
    isInvincible: false,
    isStunned: false // 新增：硬直状态
};

function loadGameProgress() {
    const savedProgress = localStorage.getItem('jumpGameProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        maxUnlockedLevel = progress.maxUnlockedLevel || 1;
    }
}

function saveGameProgress() {
    const progress = {
        maxUnlockedLevel: maxUnlockedLevel
    };
    localStorage.setItem('jumpGameProgress', JSON.stringify(progress));
}

function resetGameProgress() {
    maxUnlockedLevel = 1;
    saveGameProgress();
    createLevelButtons();
    showLevelSelection();
}

function createLevelButtons() {
    levelButtons.innerHTML = '';
    for (let i = 1; i <= LEVELS.length; i++) {
        const levelButton = document.createElement('div');
        levelButton.className = i <= maxUnlockedLevel ? 'level-button' : 'level-button locked';
        levelButton.textContent = i;
        if (i <= maxUnlockedLevel) {
            levelButton.addEventListener('click', () => {
                startLevel(i);
                hideLevelSelection();
            });
        }
        levelButtons.appendChild(levelButton);
    }
}

const LEVELS = [
    // 关卡 1
    {
        obstacles: [
            { id: 'obs1', x: 200, y: 0, width: 30, height: 80 },
            { id: 'obs2', x: 400, y: 0, width: 30, height: 100 }
        ],
        platforms: [
            { id: 'plat1', x: 300, y: 80, width: 100, height: 20 }
        ],
        startX: 50,
        finishX: 700
    },
    // 关卡 2
    {
        obstacles: [
            { id: 'obs1', x: 150, y: 0, width: 30, height: 100 },
            { id: 'obs2', x: 300, y: 0, width: 30, height: 150 },
            { id: 'obs3', x: 450, y: 120, width: 100, height: 20 },
            { id: 'obs4', x: 600, y: 0, width: 30, height: 180 }
        ],
        platforms: [
            { id: 'plat1', x: 200, y: 100, width: 100, height: 20 },
            { id: 'plat2', x: 350, y: 150, width: 100, height: 20 },
            { id: 'plat3', x: 500, y: 180, width: 100, height: 20 }
        ],
        startX: 50,
        finishX: 700
    },
    // 关卡 3
    {
        obstacles: [
            { id: 'obs1', x: 120, y: 0, width: 30, height: 120 },
            { id: 'obs2', x: 200, y: 120, width: 100, height: 20 },
            { id: 'obs3', x: 350, y: 0, width: 30, height: 80 },
            { id: 'obs4', x: 450, y: 0, width: 30, height: 150 },
            { id: 'obs5', x: 550, y: 150, width: 60, height: 20 },
            { id: 'obs6', x: 650, y: 0, width: 30, height: 100 }
        ],
        platforms: [
            { id: 'plat1', x: 150, y: 120, width: 50, height: 20 },
            { id: 'plat2', x: 250, y: 180, width: 50, height: 20 },
            { id: 'plat3', x: 350, y: 120, width: 50, height: 20 },
            { id: 'plat4', x: 450, y: 180, width: 50, height: 20 },
            { id: 'plat6', x: 650, y: 180, width: 50, height: 20 }
        ],
        startX: 40,
        finishX: 720
    },
    // 关卡 4
    {
        obstacles: [
            { id: 'obs1', x: 150, y: 0, width: 30, height: 80 },
            { id: 'obs2', x: 350, y: 0, width: 30, height: 120 },
            { id: 'obs3', x: 550, y: 0, width: 30, height: 100 }
        ],
        platforms: [
            { id: 'plat1', x: 100, y: 100, width: 80, height: 20 },
            { id: 'plat2', x: 250, y: 150, width: 80, height: 20 },
            { id: 'plat3', x: 400, y: 180, width: 80, height: 20 },
            { id: 'plat4', x: 550, y: 150, width: 80, height: 20 },
            { id: 'plat5', x: 650, y: 180, width: 80, height: 20 }
        ],
        waters: [
            { id: 'water1', x: 200, y: 0, width: 80, height: 15 },
            { id: 'water2', x: 450, y: 0, width: 80, height: 15 }
        ],
        fires: [
            { id: 'fire1', x: 300, y: 0, width: 80, height: 15 },
            { id: 'fire2', x: 600, y: 0, width: 80, height: 15 }
        ],
        startX: 50,
        finishX: 750
    },
    // 关卡 5
    {
        obstacles: [
            { id: 'obs1', x: 100, y: 0, width: 30, height: 100 },
            { id: 'obs3', x: 300, y: 0, width: 30, height: 150 },
            { id: 'obs5', x: 500, y: 0, width: 30, height: 130 },
        ],
        platforms: [
        ],
        waters: [
            { id: 'water1', x: 130, y: 0, width: 70, height: 15 },
            { id: 'water2', x: 330, y: 0, width: 70, height: 15 },
            { id: 'water3', x: 530, y: 0, width: 70, height: 15 }
        ],
        fires: [
            { id: 'fire1', x: 230, y: 0, width: 70, height: 15 },
            { id: 'fire2', x: 430, y: 0, width: 70, height: 15 },
            { id: 'fire3', x: 630, y: 0, width: 70, height: 15 }
        ],
        startX: 30,
        finishX: 760
    },
    // 关卡 6
    {
        obstacles: [
            { id: 'obs1', x: 150, y: 100, width: 100, height: 20 },
            { id: 'obs3', x: 450, y: 100, width: 100, height: 20 },
        ],
        platforms: [
            { id: 'plat1', x: 100, y: 150, width: 50, height: 20 },
            { id: 'plat3', x: 400, y: 150, width: 50, height: 20 },
            { id: 'plat5', x: 700, y: 150, width: 50, height: 20 }
        ],
        waters: [
            { id: 'water1', x: 50, y: 0, width: 100, height: 15 },
            { id: 'water2', x: 200, y: 0, width: 100, height: 15 },
            { id: 'water3', x: 350, y: 0, width: 100, height: 15 },
            { id: 'water4', x: 500, y: 0, width: 100, height: 15 },
            { id: 'water5', x: 650, y: 0, width: 100, height: 15 }
        ],
        fires: [
            { id: 'fire1', x: 150, y: 0, width: 50, height: 15 },
            { id: 'fire2', x: 300, y: 0, width: 50, height: 15 },
            { id: 'fire3', x: 450, y: 0, width: 50, height: 15 },
            { id: 'fire4', x: 600, y: 0, width: 50, height: 15 }
        ],
        startX: 20,
        finishX: 770
    }
];

function clearGameElements() {
    document.querySelectorAll('.obstacle, .platform, .water, .fire, .ground-layer').forEach(element => {
        element.remove();
    });
    levelObjects = {
        obstacles: [],
        platforms: [],
        waters: [],
        fires: [],
        finish: { x: 0, width: 50, height: 1000 }
    };
}

function createGround() {
    const ground = document.createElement('div');
    ground.className = 'ground-layer';
    ground.style.position = 'absolute';
    ground.style.bottom = '0';
    ground.style.left = '0';
    ground.style.width = '100%';
    ground.style.height = `${GROUND_HEIGHT}px`;
    ground.style.backgroundColor = '#2c2c2c'; 
    ground.style.borderTop = '3px solid #1a1a1a';
    ground.style.zIndex = '1'; 
    gameContainer.appendChild(ground);
}

function loadLevel(levelIndex) {
    clearGameElements();
    createGround();
    
    containerWidth = GAME_WIDTH;
    
    const level = LEVELS[levelIndex - 1];
    if (!level) return;
    
    level.obstacles.forEach(obs => {
        const visualY = obs.y + GROUND_HEIGHT;
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        obstacle.id = obs.id;
        obstacle.style.width = `${obs.width}px`;
        obstacle.style.height = `${obs.height}px`;
        obstacle.style.left = `${obs.x}px`;
        obstacle.style.bottom = `${visualY}px`;
        obstacle.style.zIndex = '2';
        gameContainer.appendChild(obstacle);
        
        levelObjects.obstacles.push({
            x: obs.x,
            y: visualY,
            width: obs.width,
            height: obs.height,
            right: obs.x + obs.width,
            top: visualY + obs.height,
            id: obs.id
        });
    });
    
    level.platforms.forEach(plat => {
        const visualY = plat.y + GROUND_HEIGHT;
        const platform = document.createElement('div');
        platform.classList.add('platform');
        platform.id = plat.id;
        platform.style.width = `${plat.width}px`;
        platform.style.height = `${plat.height}px`;
        platform.style.left = `${plat.x}px`;
        platform.style.bottom = `${visualY}px`;
        platform.style.zIndex = '2';
        gameContainer.appendChild(platform);
        
        levelObjects.platforms.push({
            x: plat.x,
            y: visualY,
            width: plat.width,
            height: plat.height,
            right: plat.x + plat.width,
            top: visualY + plat.height,
            id: plat.id
        });
    });
    
    const start = document.getElementById('start');
    const finish = document.getElementById('finish');
    
    start.style.zIndex = '4';
    finish.style.zIndex = '4';

    start.style.left = `${level.startX}px`;
    start.style.bottom = `${GROUND_HEIGHT}px`;
    
    finish.style.right = ''; 
    finish.style.left = `${level.finishX}px`; 
    finish.style.bottom = `${GROUND_HEIGHT}px`;
    
    const finishWidth = finish.offsetWidth || 50;
    const finishHeight = finish.offsetHeight || 100;
    
    levelObjects.finish = {
        x: level.finishX, 
        y: GROUND_HEIGHT, 
        width: finishWidth, 
        height: finishHeight 
    };
    
    currentLevelDisplay.textContent = levelIndex;
}

function createWaters(level) {
    if (!level.waters) return;
    level.waters.forEach(water => {
        const visualY = water.y + GROUND_HEIGHT;
        const waterElement = document.createElement('div');
        waterElement.classList.add('water');
        waterElement.id = water.id;
        waterElement.style.width = water.width + 'px';
        waterElement.style.height = water.height + 'px';
        waterElement.style.left = water.x + 'px';
        waterElement.style.bottom = `${visualY}px`;
        waterElement.style.zIndex = '2';
        gameContainer.appendChild(waterElement);
        levelObjects.waters.push({
            x: water.x,
            y: visualY,
            width: water.width,
            height: water.height,
            right: water.x + water.width,
            top: visualY + water.height,
            id: water.id
        });
    });
}

function createFires(level) {
    if (!level.fires) return;
    level.fires.forEach(fire => {
        const visualY = fire.y + GROUND_HEIGHT;
        const fireElement = document.createElement('div');
        fireElement.classList.add('fire');
        fireElement.id = fire.id;
        fireElement.style.width = fire.width + 'px';
        fireElement.style.height = fire.height + 'px';
        fireElement.style.left = fire.x + 'px';
        fireElement.style.bottom = `${visualY}px`;
        fireElement.style.zIndex = '2';
        gameContainer.appendChild(fireElement);
        levelObjects.fires.push({
            x: fire.x,
            y: visualY,
            width: fire.width,
            height: fire.height,
            right: fire.x + fire.width,
            top: visualY + fire.height,
            id: fire.id
        });
    });
}

function updateActivePlayerUI() {
    if (!switchPlayerBtn) return;
    
    switchPlayerBtn.textContent = 'P' + activePlayer;
    switchPlayerBtn.className = 'switch-player-btn player' + activePlayer + '-border';
    
    if (activePlayer === 1) {
        player1Element.classList.add('player-active');
        player2Element.classList.remove('player-active');
    } else {
        player2Element.classList.add('player-active');
        player1Element.classList.remove('player-active');
    }
}

function startLevel(levelIndex) {
    stopTimer();
    currentLevel = levelIndex;
    
    for (let key in keys) {
        keys[key] = false;
    }

    loadLevel(currentLevel);
    
    const level = LEVELS[currentLevel - 1];
    createWaters(level);
    createFires(level);
    
    resetPlayerStates();
    
    if(player1Element) player1Element.classList.remove('damage-effect');
    if(player2Element) player2Element.classList.remove('damage-effect');
    
    isGameOver = false;
    isLevelComplete = false;
    gameTime = 0;
    
    updateLivesDisplay();
    
    gameOver.style.display = 'none';
    levelComplete.style.display = 'none';
    
    activePlayer = 1;
    updateActivePlayerUI(); 
    
    if(switchPlayerBtn) switchPlayerBtn.style.display = 'flex';
    player1Element.style.display = 'block';
    player2Element.style.display = 'block';
    
    updatePlayersDisplay();
    startTimer();
    requestAnimationFrame(gameLoop);
}

function resetPlayerStates() {
    const level = LEVELS[currentLevel - 1];
    const startX = level ? level.startX : 50;
    
    player1State.x = startX;
    player1State.y = GROUND_HEIGHT;
    player1State.prevY = GROUND_HEIGHT;
    player1State.velocityY = 0;
    player1State.jumpCount = 0;
    player1State.isJumping = false;
    player1State.onGround = true;
    player1State.onPlatform = false;
    player1State.platformId = null;
    player1State.isActive = true;
    player1State.reachedFinish = false;
    player1State.lives = MAX_LIVES; 
    player1State.isInvincible = false; 
    player1State.isStunned = false; 
    
    player2State.x = startX + 40;
    player2State.y = GROUND_HEIGHT;
    player2State.prevY = GROUND_HEIGHT;
    player2State.velocityY = 0;
    player2State.jumpCount = 0;
    player2State.isJumping = false;
    player2State.onGround = true;
    player2State.onPlatform = false;
    player2State.platformId = null;
    player2State.isActive = true;
    player2State.reachedFinish = false;
    player2State.lives = MAX_LIVES; 
    player2State.isInvincible = false; 
    player2State.isStunned = false; 
    
    for (let key in keys) {
        keys[key] = false;
    }
}

// 清空指定玩家的移动按键状态
function resetPlayerControls(playerState) {
    if (playerState === player1State) {
        keys.KeyA = false;
        keys.KeyD = false;
    } else {
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
    }
}

// 玩家受伤逻辑
function handlePlayerDamage(playerState) {
    if (!playerState.isActive || playerState.isInvincible) return;

    playerState.lives--;
    
    // 立即停止玩家的移动控制
    resetPlayerControls(playerState);
    updateLivesDisplay();

    // 视觉反馈：闪烁效果
    const playerElement = playerState === player1State ? player1Element : player2Element;
    playerElement.classList.add('damage-effect');
    
    playerState.isInvincible = true; 
    playerState.isStunned = true; // 开启硬直，此时不能移动

    if (playerState.lives <= 0) {
        playerState.lives = 0;
        playerState.isActive = false;
        updateLivesDisplay();
        endGame(`游戏结束：${playerState === player1State ? '玩家1' : '玩家2'} 生命耗尽！`);
        return;
    } else {
        if (debugMode) console.log(`玩家 ${playerState === player1State ? 1 : 2} 受伤, 停在原地闪烁, 剩余生命: ${playerState.lives}`);
        setTimeout(() => {
            playerElement.classList.remove('damage-effect'); 
            respawnPlayer(playerState); 
            // 关键点：闪烁结束后，解除硬直，玩家可以移动了
            playerState.isStunned = false; 

            if (debugMode) console.log(`玩家 ${playerState === player1State ? 1 : 2} 重生，继续无敌 ${INVINCIBILITY_DURATION - DAMAGE_STOP_DURATION}ms`);
            
            setTimeout(() => {
                playerState.isInvincible = false; 
                if (debugMode) console.log(`玩家 ${playerState === player1State ? 1 : 2} 无敌时间结束`);
            }, INVINCIBILITY_DURATION - DAMAGE_STOP_DURATION);
        }, DAMAGE_STOP_DURATION);
    }
}

// 重生玩家到起点
function respawnPlayer(playerState) {
    const level = LEVELS[currentLevel - 1];
    const startX = level ? level.startX : 50;
    
    // 玩家2稍微错开位置
    playerState.x = playerState === player2State ? startX + 40 : startX;
    playerState.y = GROUND_HEIGHT;
    playerState.prevY = GROUND_HEIGHT;
    playerState.velocityY = 0;
    playerState.jumpCount = 0;
    playerState.isJumping = false;
    playerState.onGround = true;
    playerState.onPlatform = false;
    playerState.platformId = null;
    
    if (debugMode) {
        console.log(`玩家 ${playerState === player1State ? 1 : 2} 重生到起点: (${playerState.x}, ${playerState.y})`);
    }
}

function updateLivesDisplay() {
    const getDisplayContent = (playerState) => {
        if (playerState.reachedFinish) {
            return "已完成";
        }
        if (playerState.lives <= 0 && !playerState.isActive) { 
            return "失败";
        }
        return "❤️".repeat(playerState.lives) + "🖤".repeat(MAX_LIVES - playerState.lives);
    };

    player1LivesDisplay.textContent = getDisplayContent(player1State);
    player2LivesDisplay.textContent = getDisplayContent(player2State);

    if (player1State.reachedFinish) {
        player1LivesDisplay.style.color = "#f1c40f"; 
    } else if (player1State.lives <= 0 && !player1State.isActive) {
        player1LivesDisplay.style.color = "#e74c3c"; 
    } else {
        player1LivesDisplay.style.color = ""; 
    }

    if (player2State.reachedFinish) {
        player2LivesDisplay.style.color = "#f1c40f"; 
    } else if (player2State.lives <= 0 && !player2State.isActive) {
        player2LivesDisplay.style.color = "#e74c3c"; 
    } else {
        player2LivesDisplay.style.color = ""; 
    }
}

function startTimer() {
    gameTime = 0;
    timerDisplay.textContent = '0';
    timerInterval = setInterval(() => {
        gameTime++;
        timerDisplay.textContent = gameTime;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function completeLevel() {
    isLevelComplete = true;
    stopTimer();
    
    levelTime.textContent = gameTime;
    
    if (currentLevel >= maxUnlockedLevel && currentLevel < LEVELS.length) {
        maxUnlockedLevel = currentLevel + 1;
        saveGameProgress();
        createLevelButtons();
    }
    
    levelComplete.style.display = 'flex';
    
    let winnerMessage = "";
    if (player1State.reachedFinish && player2State.reachedFinish) {
        winnerMessage = "双方玩家都成功到达终点！";
    } else if (player1State.reachedFinish && !player2State.isActive) {
        winnerMessage = "<span class='player1-color'>玩家1</span> 到达终点！<span class='player2-color'>玩家2</span> 未能完成挑战。";
    } else if (player2State.reachedFinish && !player1State.isActive) {
        winnerMessage = "<span class='player2-color'>玩家2</span> 到达终点！<span class='player1-color'>玩家1</span> 未能完成挑战。";
    } else if (player1State.reachedFinish) {
        winnerMessage = "<span class='player1-color'>玩家1</span> 率先到达终点！";
    } else if (player2State.reachedFinish) {
        winnerMessage = "<span class='player2-color'>玩家2</span> 率先到达终点！";
    }
    
    winnerText.innerHTML = winnerMessage;
    
    if (currentLevel === LEVELS.length) {
        levelCompleteText.textContent = '恭喜！你们已完成所有关卡！';
        nextLevelBtn.style.display = 'none';
    } else {
        levelCompleteText.textContent = '恭喜完成关卡！';
        nextLevelBtn.style.display = 'block';
    }
    
    for (let key in keys) {
        keys[key] = false;
    }
}

function updatePlayersDisplay() {
    if (player1State.reachedFinish) {
        player1Element.style.display = 'none';
    } else {
        player1Element.style.left = `${player1State.x}px`;
        player1Element.style.bottom = `${player1State.y}px`;
        player1Element.style.zIndex = '10';
        // 无敌状态（包括硬直状态）时半透明显示
        player1Element.style.opacity = (player1State.isActive && !player1State.isInvincible) ? "1" : "0.5";
    }
    
    if (player2State.reachedFinish) {
        player2Element.style.display = 'none';
    } else {
        player2Element.style.left = `${player2State.x}px`;
        player2Element.style.bottom = `${player2State.y}px`;
        player2Element.style.zIndex = '10';
         // 无敌状态（包括硬直状态）时半透明显示
        player2Element.style.opacity = (player2State.isActive && !player2State.isInvincible) ? "1" : "0.5";
    }
}

function showLevelSelection() {
    levelSelection.style.display = 'flex';
    stopTimer();
    for (let key in keys) {
        keys[key] = false;
    }
}

function hideLevelSelection() {
    levelSelection.style.display = 'none';
}

function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

function checkPlayerToPlayerCollision(targetX, targetY, me, other) {
    if (!other.isActive || other.reachedFinish) return false; 

    return (
        targetX < other.x + other.width &&
        targetX + me.width > other.x &&
        targetY < other.y + other.height &&
        targetY + me.height > other.y
    );
}

function checkPlayerLandingOnPlayer(playerState, otherPlayer) {
    if (!otherPlayer.isActive || otherPlayer.reachedFinish) return false;
    if (playerState.velocityY > 0) return false; 

    const myLeft = playerState.x;
    const myRight = playerState.x + playerState.width;
    const myBottom = playerState.y;
    const myPrevBottom = playerState.prevY; 

    const otherTop = otherPlayer.y + otherPlayer.height;
    const otherLeft = otherPlayer.x;
    const otherRight = otherPlayer.x + otherPlayer.width;

    const hasHorizontalOverlap = 
        myRight > otherLeft + 2 && 
        myLeft < otherRight - 2;
    
    const landedOnTop = 
        myPrevBottom >= otherTop - 5 && 
        myBottom <= otherTop;

    if (hasHorizontalOverlap && landedOnTop) {
        playerState.y = otherTop;
        playerState.velocityY = 0;
        playerState.onGround = true;
        playerState.onPlatform = true; 
        return true;
    }
    return false;
}

function checkObstacleCollisions(playerState) {
    if (!playerState.isActive) return false;
    
    const playerBox = {
        x: playerState.x,
        y: playerState.y,
        width: playerState.width,
        height: playerState.height
    };
    
    for (const obstacle of levelObjects.obstacles) {
        if (checkCollision(playerBox, obstacle)) {
            if (debugMode) console.log('障碍物碰撞:', obstacle.id);
            return true;
        }
    }
    return false;
}

function checkFinishCollision(playerState) {
    if (!playerState.isActive) return false;
    if (playerState.reachedFinish) return false;
    
    const playerBox = {
        x: playerState.x,
        y: playerState.y,
        width: playerState.width,
        height: playerState.height
    };
    
    const collision = checkCollision(playerBox, levelObjects.finish);
    if (collision && debugMode) {
        console.log('终点碰撞!');
    }
    return collision;
}

function checkPlatforms(playerState) {
    if (playerState.velocityY > 0 || !playerState.isActive) {
        return false;
    }
    
    const playerLeft = playerState.x;
    const playerRight = playerState.x + playerState.width;
    const playerBottom = playerState.y;
    const playerPrevBottom = playerState.prevY;
    
    for (const platform of levelObjects.platforms) {
        const platformTop = platform.top;
        
        const hasHorizontalOverlap = 
            playerRight > platform.x + 2 && 
            playerLeft < platform.right - 2;
        
        const passedThroughPlatform = 
            playerPrevBottom >= platformTop && 
            playerBottom <= platformTop;

        if (hasHorizontalOverlap && passedThroughPlatform) {
            playerState.y = platformTop;
            playerState.velocityY = 0;
            playerState.onGround = true;
            playerState.onPlatform = true;
            playerState.platformId = platform.id;
            
            if (debugMode) {
                console.log(`站在平台上: ${platform.id}`);
            }
            return true;
        }
    }
    
    if (playerState.onPlatform) {
        playerState.onPlatform = false;
        playerState.platformId = null;
        if (playerState.y > GROUND_HEIGHT) {
            playerState.onGround = false;
        }
    }
    return false;
}

function jumpPlayer(playerState) {
    // 修改：使用 isStunned 判断是否能跳跃，而不是 isInvincible
    // 这样重生后的无敌期间也能跳跃
    if (playerState.jumpCount < playerState.maxJumpCount && playerState.isActive && !isGameOver && !isLevelComplete && !playerState.isStunned) {
        playerState.velocityY = jumpHeight;
        playerState.isJumping = true;
        playerState.jumpCount++;
        
        if (playerState.onGround) {
            playerState.onGround = false;
        }
        
        const playerElement = playerState === player1State ? player1Element : player2Element;
        playerElement.style.transition = 'transform 0.1s';
        playerElement.style.transform = 'scaleY(1.1)';
        setTimeout(() => {
            playerElement.style.transform = 'scaleY(1)';
        }, 100);
    }
}

const keys = {
    KeyW: false, KeyA: false, KeyD: false,
    ArrowUp: false, ArrowLeft: false, ArrowRight: false
};

document.addEventListener('keydown', function(e) {
    if (e.code === 'KeyW' && !keys[e.code]) {
        keys[e.code] = true;
        jumpPlayer(player1State);
    }
    if (e.code === 'ArrowUp' && !keys[e.code]) {
        keys[e.code] = true;
        jumpPlayer(player2State);
    }
    if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keys[e.code] = true;
    }
    if (e.code === 'KeyD' && e.ctrlKey) {
        debugMode = !debugMode;
        console.log('调试模式:', debugMode ? '开启' : '关闭');
    }
    if (e.code === 'Space') {
        const switchBtn = document.getElementById('switch-player-btn');
        if(switchBtn && switchBtn.style.display !== 'none') switchBtn.click();
    }
});

document.addEventListener('keyup', function(e) {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

function updatePlayerPhysics(playerState, leftKey, rightKey, element) {
    // 修改：使用 isStunned 判断是否冻结物理逻辑，而不是 isInvincible
    if (!playerState.isActive || playerState.reachedFinish || playerState.isStunned) return;

    playerState.prevY = playerState.y;
    
    const otherPlayer = playerState === player1State ? player2State : player1State;

    if (keys[leftKey] && !isGameOver && !isLevelComplete) {
        const speed = isMobileDevice() ? mobileMoveSpeed : moveSpeed;
        const nextX = playerState.x - speed;
        if (!checkPlayerToPlayerCollision(nextX, playerState.y, playerState, otherPlayer)) {
            playerState.x = nextX;
            if (playerState.x < 0) playerState.x = 0;
        }
    }
    if (keys[rightKey] && !isGameOver && !isLevelComplete) {
        const speed = isMobileDevice() ? mobileMoveSpeed : moveSpeed;
        const nextX = playerState.x + speed;
        if (!checkPlayerToPlayerCollision(nextX, playerState.y, playerState, otherPlayer)) {
            playerState.x = nextX;
            const maxX = containerWidth - playerState.width;
            if (playerState.x > maxX) playerState.x = maxX;
        }
    }
    
    playerState.velocityY -= gravity;
    if (playerState.velocityY < -12) playerState.velocityY = -12;
    
    playerState.y += playerState.velocityY;
    
    checkPlatforms(playerState);
    checkPlayerLandingOnPlayer(playerState, otherPlayer);

    if (playerState.y <= GROUND_HEIGHT) {
        playerState.y = GROUND_HEIGHT;
        playerState.velocityY = 0;
        playerState.onGround = true;
        playerState.isJumping = false;
        playerState.jumpCount = 0;
    }
    
    if (playerState.onGround && playerState.velocityY <= 0 && playerState.isJumping) {
         element.style.transition = 'transform 0.1s';
         element.style.transform = 'scaleY(0.9)';
         setTimeout(() => {
             element.style.transform = 'scaleY(1)';
         }, 100);
         playerState.isJumping = false;
         playerState.jumpCount = 0;
    }
}

function updatePlayer1() {
    updatePlayerPhysics(player1State, 'KeyA', 'KeyD', player1Element);
}

function updatePlayer2() {
    updatePlayerPhysics(player2State, 'ArrowLeft', 'ArrowRight', player2Element);
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.matchMedia("(max-width: 768px)").matches;
}

function updateGame() {
    updatePlayer1();
    updatePlayer2();
    updatePlayersDisplay();
    
    if (player1State.isActive) {
        if (checkObstacleCollisions(player1State) || checkWaterCollisions(player1State)) {
            handlePlayerDamage(player1State);
        }
        if (checkFinishCollision(player1State)) {
            player1State.reachedFinish = true;
            updateLivesDisplay(); 
            if (!player2State.reachedFinish) {
                if (switchPlayerBtn) {
                    if (activePlayer === 1) switchPlayerBtn.click();
                    switchPlayerBtn.style.display = 'none';
                }
            }
        }
    }
    
    if (player2State.isActive) {
        if (checkObstacleCollisions(player2State) || checkFireCollisions(player2State)) {
            handlePlayerDamage(player2State);
        }
        if (checkFinishCollision(player2State)) {
            player2State.reachedFinish = true;
            updateLivesDisplay(); 
            if (!player1State.reachedFinish) {
                if (switchPlayerBtn) {
                    if (activePlayer === 2) switchPlayerBtn.click();
                    switchPlayerBtn.style.display = 'none';
                }
            }
        }
    }
    
    checkGameEndConditions();
}

function checkGameEndConditions() {
    if ((player1State.reachedFinish && player2State.reachedFinish)) {
        completeLevel();
        return;
    }
    if (!player1State.isActive || !player2State.isActive) {
         // 冗余检查
    }
}

function checkWaterCollisions(playerState) {
    if (playerState === player2State) return false;
    if (!playerState.isActive || playerState.reachedFinish) return false;
    
    const playerBox = {
        x: playerState.x,
        y: playerState.y,
        width: playerState.width,
        height: playerState.height
    };
    
    for (const water of levelObjects.waters) {
        if (checkCollision(playerBox, water)) {
            if (debugMode) console.log('玩家1碰到水池!');
            return true;
        }
    }
    return false;
}

function checkFireCollisions(playerState) {
    if (playerState === player1State) return false;
    if (!playerState.isActive || playerState.reachedFinish) return false;
    
    const playerBox = {
        x: playerState.x,
        y: playerState.y,
        width: playerState.width,
        height: playerState.height
    };
    
    for (const fire of levelObjects.fires) {
        if (checkCollision(playerBox, fire)) {
            if (debugMode) console.log('玩家2碰到火池!');
            return true;
        }
    }
    return false;
}

function gameLoop() {
    if (isGameOver || isLevelComplete) return;
    updateGame();
    requestAnimationFrame(gameLoop);
}

function endGame(message) {
    isGameOver = true;
    stopTimer();
    gameOverText.innerText = message;
    gameOver.style.display = 'flex';
    for (let key in keys) {
        keys[key] = false;
    }
}

function setupEventListeners() {
    restartBtn.addEventListener('click', () => startLevel(currentLevel));
    nextLevelBtn.addEventListener('click', () => {
        if (currentLevel < LEVELS.length) startLevel(currentLevel + 1);
    });
    levelSelectBtn.addEventListener('click', showLevelSelection);
    levelSelectBtn2.addEventListener('click', showLevelSelection);
    mainMenuBtn.addEventListener('click', () => {
        showLevelSelection();
        stopTimer();
    });
    resetProgressBtn.addEventListener('click', resetGameProgress);
}

function setupPlayerSwitching() {
    const p1 = document.getElementById('player');
    const p2 = document.getElementById('player2');
    const btn = document.getElementById('switch-player-btn');
    p1.classList.add('player-active');
    
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && btn && btn.style.display !== 'none') {
            btn.click();
            e.preventDefault();
        }
    });
}

function setupMobileControls() {
    const playerJump = document.getElementById('player-jump');
    const playerLeft = document.getElementById('player-left');
    const playerRight = document.getElementById('player-right');
    const switchPlayerBtn = document.getElementById('switch-player-btn');
    const p1 = document.getElementById('player');
    const p2 = document.getElementById('player2');
    const mobileControls = document.getElementById('mobile-controls');
    
    if (mobileControls) {
        if (playerLeft) { playerLeft.style.width = '60px'; playerLeft.style.height = '60px'; playerLeft.style.marginRight = '40px'; }
        if (playerRight) { playerRight.style.width = '60px'; playerRight.style.height = '60px'; playerRight.style.marginLeft = '40px'; }
        if (playerJump) { playerJump.style.width = '60px'; playerJump.style.height = '60px'; }
    }
    
    let activePlayerRef = 1; 
    p1.classList.add('player-active');
    
    if (switchPlayerBtn) {
        switchPlayerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            activePlayer = activePlayer === 1 ? 2 : 1;
            updateActivePlayerUI();
        });
    }
    
    const bindButtonAction = (btn, actionType, key1, key2) => {
        if (!btn) return;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        btn = newBtn;
        
        const handleStart = (e) => {
            e.preventDefault(); 
            if (actionType === 'jump') {
                if (activePlayer === 1) jumpPlayer(player1State);
                else jumpPlayer(player2State);
            } else if (actionType === 'move') {
                // 修改：移除了对 isInvincible 的判断，总是响应按键
                if (activePlayer === 1) keys[key1] = true;
                else keys[key2] = true;
            }
        };

        const handleEnd = (e) => {
            e.preventDefault();
            if (actionType === 'move') {
                if (activePlayer === 1) keys[key1] = false;
                else keys[key2] = false;
            }
        };

        btn.addEventListener('touchstart', handleStart, { passive: false });
        btn.addEventListener('touchend', handleEnd, { passive: false });
        btn.addEventListener('touchcancel', handleEnd, { passive: false }); 
        
        btn.addEventListener('mousedown', handleStart);
        btn.addEventListener('mouseup', handleEnd);
        btn.addEventListener('mouseleave', handleEnd);
    };
    
    const leftBtn = document.getElementById('player-left');
    bindButtonAction(leftBtn, 'move', 'KeyA', 'ArrowLeft');
    
    const rightBtn = document.getElementById('player-right');
    bindButtonAction(rightBtn, 'move', 'KeyD', 'ArrowRight');
    
    const jumpBtn = document.getElementById('player-jump');
    bindButtonAction(jumpBtn, 'jump');
}

function detectDeviceAndSetControls() {
    const mobileControls = document.getElementById('mobile-controls');
    if(mobileControls) mobileControls.style.display = 'flex';
}

function initGame() {
    if(player1Element) player1Element.style.transition = 'transform 0.1s, opacity 0.1s';
    if(player2Element) player2Element.style.transition = 'transform 0.1s, opacity 0.1s';

    loadGameProgress();
    createLevelButtons();
    setupEventListeners();
    setupMobileControls();
    setupPlayerSwitching();
    detectDeviceAndSetControls();
    startLevel(1);
}

initGame();
});