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
    const player1Status = document.getElementById('player1-status');
    const player2Status = document.getElementById('player2-status');
    
    // 游戏参数
    let isGameOver = false;
    let gravity = 0.6;
    let jumpHeight = 12;
    let moveSpeed = 10;
    let mobileMoveSpeed = 5; // 移动端速度降低为一半
    let currentLevel = 1;
    let maxUnlockedLevel = 1;
    let gameTime = 0;
    let timerInterval;
    let isLevelComplete = false;
    let debugMode = false; // 调试模式
    
    // 玩家1状态
    const player1State = {
        x: 50,              // 左侧位置
        y: 0,               // 底部位置
        width: 30,          // 宽度
        height: 50,         // 高度
        velocityY: 0,       // Y轴速度
        jumpCount: 0,       // 跳跃次数
        maxJumpCount: 2,    // 最大跳跃次数
        isJumping: false,   // 是否在跳跃
        onGround: true,     // 是否在地面
        onPlatform: false,  // 是否在平台上
        platformId: null,   // 当前站立的平台ID
        isActive: true,     // 是否活跃(未死亡)
        reachedFinish: false // 是否到达终点
    };
    
    // 玩家2状态
    const player2State = {
        x: 100,             // 左侧位置
        y: 0,               // 底部位置
        width: 30,          // 宽度
        height: 50,         // 高度
        velocityY: 0,       // Y轴速度
        jumpCount: 0,       // 跳跃次数
        maxJumpCount: 2,    // 最大跳跃次数
        isJumping: false,   // 是否在跳跃
        onGround: true,     // 是否在地面
        onPlatform: false,  // 是否在平台上
        platformId: null,   // 当前站立的平台ID
        isActive: true,     // 是否活跃(未死亡)
        reachedFinish: false // 是否到达终点
    };
    
    // 从本地存储加载游戏进度
    function loadGameProgress() {
        const savedProgress = localStorage.getItem('jumpGameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            maxUnlockedLevel = progress.maxUnlockedLevel || 1;
        }
    }
    
    // 保存游戏进度
    function saveGameProgress() {
        const progress = {
            maxUnlockedLevel: maxUnlockedLevel
        };
        localStorage.setItem('jumpGameProgress', JSON.stringify(progress));
    }
    
    // 重置游戏进度
    function resetGameProgress() {
        maxUnlockedLevel = 1;
        saveGameProgress();
        createLevelButtons();
        showLevelSelection();
    }
    
    // 创建关卡按钮
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
    
    // 关卡配置
    const LEVELS = [
        // 关卡 1 - 简单入门
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
        // 关卡 2 - 增加难度
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
        // 关卡 3 - 高级挑战
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
                { id: 'plat5', x: 550, y: 220, width: 50, height: 20 },
                { id: 'plat6', x: 650, y: 180, width: 50, height: 20 }
            ],
            startX: 40,
            finishX: 720
        },
        // 关卡 4 - 水火双重挑战
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
        // 关卡 5 - 交错迷宫
        {
            obstacles: [
                { id: 'obs1', x: 100, y: 0, width: 30, height: 100 },
                { id: 'obs2', x: 200, y: 100, width: 30, height: 200 },
                { id: 'obs3', x: 300, y: 0, width: 30, height: 150 },
                { id: 'obs4', x: 400, y: 120, width: 30, height: 180 },
                { id: 'obs5', x: 500, y: 0, width: 30, height: 130 },
                { id: 'obs6', x: 600, y: 100, width: 30, height: 200 }
            ],
            platforms: [
                { id: 'plat1', x: 50, y: 120, width: 70, height: 20 },
                { id: 'plat2', x: 140, y: 150, width: 70, height: 20 },
                { id: 'plat3', x: 250, y: 170, width: 70, height: 20 },
                { id: 'plat4', x: 350, y: 200, width: 70, height: 20 },
                { id: 'plat5', x: 450, y: 180, width: 70, height: 20 },
                { id: 'plat6', x: 550, y: 150, width: 70, height: 20 },
                { id: 'plat7', x: 650, y: 180, width: 70, height: 20 }
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
        // 关卡 6 - 终极挑战
        {
            obstacles: [
                { id: 'obs1', x: 150, y: 100, width: 100, height: 20 },
                { id: 'obs2', x: 300, y: 180, width: 100, height: 20 },
                { id: 'obs3', x: 450, y: 100, width: 100, height: 20 },
                { id: 'obs4', x: 600, y: 180, width: 100, height: 20 }
            ],
            platforms: [
                { id: 'plat1', x: 100, y: 150, width: 50, height: 20 },
                { id: 'plat2', x: 250, y: 230, width: 50, height: 20 },
                { id: 'plat3', x: 400, y: 150, width: 50, height: 20 },
                { id: 'plat4', x: 550, y: 230, width: 50, height: 20 },
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
    
    // 清除游戏元素
    function clearGameElements() {
        // 删除所有障碍物和平台
        document.querySelectorAll('.obstacle, .platform').forEach(element => {
            element.remove();
        });
        
        // 删除水池和火池
        document.querySelectorAll('.water, .fire').forEach(element => {
            element.remove();
        });
    }
    
    // 加载关卡
    function loadLevel(levelIndex) {
        // 清除之前的元素
        clearGameElements();
        
        const level = LEVELS[levelIndex - 1];
        if (!level) return;
        
        // 创建障碍物
        level.obstacles.forEach(obs => {
            const obstacle = document.createElement('div');
            obstacle.classList.add('obstacle');
            obstacle.id = obs.id;
            obstacle.style.width = `${obs.width}px`;
            obstacle.style.height = `${obs.height}px`;
            obstacle.style.left = `${obs.x}px`;
            obstacle.style.bottom = `${obs.y}px`;
            gameContainer.appendChild(obstacle);
        });
        
        // 创建平台
        level.platforms.forEach(plat => {
            const platform = document.createElement('div');
            platform.classList.add('platform');
            platform.id = plat.id;
            platform.style.width = `${plat.width}px`;
            platform.style.height = `${plat.height}px`;
            platform.style.left = `${plat.x}px`;
            platform.style.bottom = `${plat.y}px`;
            gameContainer.appendChild(platform);
        });
        
        // 设置起点和终点位置
        const start = document.getElementById('start');
        const finish = document.getElementById('finish');
        
        start.style.left = `${level.startX}px`;
        finish.style.right = `${gameContainer.offsetWidth - level.finishX}px`;
        
        // 更新当前关卡显示
        currentLevelDisplay.textContent = levelIndex;
    }
    
    // 创建水池
    function createWaters(level) {
        if (!level.waters) return;
        
        level.waters.forEach(water => {
            const waterElement = document.createElement('div');
            waterElement.classList.add('water');
            waterElement.id = water.id;
            waterElement.style.width = water.width + 'px';
            waterElement.style.height = water.height + 'px';
            waterElement.style.left = water.x + 'px';
            waterElement.style.bottom = water.y + 'px';
            gameContainer.appendChild(waterElement);
        });
    }
    
    // 创建火池
    function createFires(level) {
        if (!level.fires) return;
        
        level.fires.forEach(fire => {
            const fireElement = document.createElement('div');
            fireElement.classList.add('fire');
            fireElement.id = fire.id;
            fireElement.style.width = fire.width + 'px';
            fireElement.style.height = fire.height + 'px';
            fireElement.style.left = fire.x + 'px';
            fireElement.style.bottom = fire.y + 'px';
            gameContainer.appendChild(fireElement);
        });
    }
    
    // 清除所有游戏元素
    function clearGame() {
        // 删除所有障碍物和平台
        document.querySelectorAll('.obstacle, .platform').forEach(element => {
            element.remove();
        });
        
        // 删除水池和火池
        document.querySelectorAll('.water, .fire').forEach(element => {
            element.remove();
        });
    }
    
    // 开始关卡
    function startLevel(levelIndex) {
        // 停止之前的计时器
        stopTimer();
        
        // 设置当前关卡
        currentLevel = levelIndex;
        
        // 加载关卡
        loadLevel(currentLevel);
        
        // 创建水池和火池
        const level = LEVELS[currentLevel - 1];
        createWaters(level);
        createFires(level);
        
        // 重置玩家状态
        resetPlayerStates();
        
        // 重置游戏状态
        isGameOver = false;
        isLevelComplete = false;
        gameTime = 0;
        
        // 更新玩家状态显示
        updatePlayerStatusDisplay();
        
        // 隐藏游戏结束和关卡完成界面
        gameOver.style.display = 'none';
        levelComplete.style.display = 'none';
        
        // 更新玩家显示
        updatePlayersDisplay();
        
        // 开始计时器
        startTimer();
        
        // 开始游戏循环
        requestAnimationFrame(gameLoop);
    }
    
    // 重置玩家状态
    function resetPlayerStates() {
        // 获取当前关卡的起点位置
        const level = LEVELS[currentLevel - 1];
        const startX = level ? level.startX : 50;
        
        // 重置玩家1
        player1State.x = startX;
        player1State.y = 0;
        player1State.velocityY = 0;
        player1State.jumpCount = 0;
        player1State.isJumping = false;
        player1State.onGround = true;
        player1State.onPlatform = false;
        player1State.platformId = null;
        player1State.isActive = true;
        player1State.reachedFinish = false;
        
        // 重置玩家2
        player2State.x = startX + 40;
        player2State.y = 0;
        player2State.velocityY = 0;
        player2State.jumpCount = 0;
        player2State.isJumping = false;
        player2State.onGround = true;
        player2State.onPlatform = false;
        player2State.platformId = null;
        player2State.isActive = true;
        player2State.reachedFinish = false;
        
        // 重置键盘状态
        for (let key in keys) {
            keys[key] = false;
        }
    }
    
    // 更新玩家状态显示
    function updatePlayerStatusDisplay() {
        player1Status.textContent = player1State.isActive ? 
            (player1State.reachedFinish ? "已完成" : "活跃") : "失败";
        player2Status.textContent = player2State.isActive ? 
            (player2State.reachedFinish ? "已完成" : "活跃") : "失败";
        
        // 更新颜色
        player1Status.style.color = player1State.isActive ? 
            (player1State.reachedFinish ? "#ffc107" : "white") : "#ff5252";
        player2Status.style.color = player2State.isActive ? 
            (player2State.reachedFinish ? "#ffc107" : "white") : "#ff5252";
    }
    
    // 开始计时器
    function startTimer() {
        gameTime = 0;
        timerDisplay.textContent = '0';
        timerInterval = setInterval(() => {
            gameTime++;
            timerDisplay.textContent = gameTime;
        }, 1000);
    }
    
    // 停止计时器
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    // 完成关卡
    function completeLevel() {
        isLevelComplete = true;
        stopTimer();
        
        // 更新关卡完成时间
        levelTime.textContent = gameTime;
        
        // 解锁下一关
        if (currentLevel >= maxUnlockedLevel && currentLevel < LEVELS.length) {
            maxUnlockedLevel = currentLevel + 1;
            saveGameProgress();
            createLevelButtons();
        }
        
        // 显示完成界面
        levelComplete.style.display = 'flex';
        
        // 确定胜者
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
        
        // 如果是最后一关
        if (currentLevel === LEVELS.length) {
            levelCompleteText.textContent = '恭喜！你们已完成所有关卡！';
            nextLevelBtn.style.display = 'none';
        } else {
            levelCompleteText.textContent = '恭喜完成关卡！';
            nextLevelBtn.style.display = 'block';
        }
        
        // 重置键盘状态
        for (let key in keys) {
            keys[key] = false;
        }
    }
    
    // 更新玩家显示位置
    function updatePlayersDisplay() {
        player1Element.style.left = `${player1State.x}px`;
        player1Element.style.bottom = `${player1State.y}px`;
        
        player2Element.style.left = `${player2State.x}px`;
        player2Element.style.bottom = `${player2State.y}px`;
        
        // 根据玩家状态调整透明度
        player1Element.style.opacity = player1State.isActive ? "1" : "0.5";
        player2Element.style.opacity = player2State.isActive ? "1" : "0.5";
    }
    
    // 显示关卡选择界面
    function showLevelSelection() {
        levelSelection.style.display = 'flex';
        stopTimer();
        
        // 重置键盘状态
        for (let key in keys) {
            keys[key] = false;
        }
    }
    
    // 隐藏关卡选择界面
    function hideLevelSelection() {
        levelSelection.style.display = 'none';
    }
    
    // 获取元素的位置信息
    function getElementPosition(element) {
        // 使用CSS样式中的定位属性而非getBoundingClientRect
        // 这确保了与我们的物理模型一致
        const left = parseInt(window.getComputedStyle(element).left);
        const bottom = parseInt(window.getComputedStyle(element).bottom);
        const width = parseInt(window.getComputedStyle(element).width);
        const height = parseInt(window.getComputedStyle(element).height);
        
        return {
            x: left,
            y: bottom,
            width: width,
            height: height,
            right: left + width,
            top: bottom + height
        };
    }
    
    // 检测碰撞 - 直接使用游戏内坐标系
    function checkCollision(obj1, obj2) {
        return (
            obj1.x < obj2.right &&
            obj1.right > obj2.x &&
            obj1.y < obj2.top &&
            obj1.top > obj2.y
        );
    }
    
    // 检测障碍物碰撞
    function checkObstacleCollisions(playerState) {
        if (!playerState.isActive) return false;
        
        const obstacles = document.querySelectorAll('.obstacle');
        if (!obstacles.length) return false;
        
        // 获取玩家当前位置
        const playerPos = {
            x: playerState.x,
            y: playerState.y,
            width: playerState.width,
            height: playerState.height,
            right: playerState.x + playerState.width,
            top: playerState.y + playerState.height
        };
        
        for (const obstacle of obstacles) {
            const obsPos = getElementPosition(obstacle);
            
            if (checkCollision(playerPos, obsPos)) {
                if (debugMode) console.log('障碍物碰撞:', obstacle.id);
                return true;
            }
        }
        
        return false;
    }
    
    // 检测终点碰撞
    function checkFinishCollision(playerState) {
        if (!playerState.isActive) return false;
        if (playerState.reachedFinish) return false;
        
        const finish = document.getElementById('finish');
        if (!finish) return false;
        
        const playerPos = {
            x: playerState.x,
            y: playerState.y,
            width: playerState.width,
            height: playerState.height,
            right: playerState.x + playerState.width,
            top: playerState.y + playerState.height
        };
        
        const finishPos = getElementPosition(finish);
        
        const collision = checkCollision(playerPos, finishPos);
        if (collision && debugMode) {
            console.log('终点碰撞!');
        }
        
        return collision;
    }
    
    // 检测平台碰撞
    function checkPlatforms(playerState) {
        // 如果玩家正在上升或已失活，不检查平台
        if (playerState.velocityY > 0 || !playerState.isActive) {
            return false;
        }
        
        const platforms = document.querySelectorAll('.platform');
        if (!platforms.length) return false;
        
        // 获取玩家当前位置
        const playerBottom = playerState.y;
        const playerLeft = playerState.x;
        const playerRight = playerState.x + playerState.width;
        
        for (const platform of platforms) {
            const platformPos = getElementPosition(platform);
            const platformTop = platformPos.top;
            
            // 检查玩家是否在平台上方附近
            const isNearPlatformTop = Math.abs(playerBottom - platformTop) <= 5;
            
            // 检查玩家是否水平重叠平台
            const hasHorizontalOverlap = 
                playerRight > platformPos.x + 2 && 
                playerLeft < platformPos.right - 2;
            
            // 只有玩家下落时才进行平台碰撞检测
            if (isNearPlatformTop && hasHorizontalOverlap && playerState.velocityY <= 0) {
                // 玩家落在平台上
                playerState.y = platformTop;
                playerState.velocityY = 0;
                playerState.onGround = true;
                playerState.onPlatform = true;
                playerState.platformId = platform.id;
                
                if (debugMode) {
                    console.log(`站在平台上: ${platform.id}, 位置: ${platformTop}`);
                }
                
                return true;
            }
        }
        
        // 如果之前在平台上但现在不在了
        if (playerState.onPlatform) {
            playerState.onPlatform = false;
            playerState.platformId = null;
            if (playerState.y > 0) {
                playerState.onGround = false;
            }
        }
        
        return false;
    }
    
    // 控制玩家跳跃
    function jumpPlayer(playerState) {
        if (playerState.jumpCount < playerState.maxJumpCount && playerState.isActive && !isGameOver && !isLevelComplete) {
            playerState.velocityY = jumpHeight;
            playerState.isJumping = true;
            playerState.jumpCount++;
            
            if (playerState.onGround) {
                playerState.onGround = false;
            }
            
            // 跳跃动画 - 根据玩家添加不同的动画效果
            const playerElement = playerState === player1State ? player1Element : player2Element;
            playerElement.style.transition = 'transform 0.1s';
            playerElement.style.transform = 'scaleY(1.1)';
            setTimeout(() => {
                playerElement.style.transform = 'scaleY(1)';
            }, 100);
        }
    }
    
    // 创建键盘状态对象
    const keys = {
        // 玩家1控制键 (WASD)
        KeyW: false,
        KeyA: false,
        KeyD: false,
        
        // 玩家2控制键 (方向键)
        ArrowUp: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    
    // 按键按下事件
    document.addEventListener('keydown', function(e) {
        console.log('按键按下:', e.code);
        
        // 玩家1跳跃
        if (e.code === 'KeyW' && !keys[e.code]) {
            keys[e.code] = true;
            console.log('玩家1跳跃');
            jumpPlayer(player1State);
        }
        
        // 玩家2跳跃
        if (e.code === 'ArrowUp' && !keys[e.code]) {
            keys[e.code] = true;
            console.log('玩家2跳跃');
            jumpPlayer(player2State);
        }
        
        // 其他方向键
        if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            keys[e.code] = true;
            console.log('方向键按下:', e.code);
        }
        
        // 调试模式切换
        if (e.code === 'KeyD' && e.ctrlKey) {
            debugMode = !debugMode;
            console.log('调试模式:', debugMode ? '开启' : '关闭');
        }
        
        // 添加键盘事件监听，实现键盘切换玩家
        if (e.code === 'Space') {
            switchPlayerBtn.click(); // 模拟点击切换按钮
        }
    });
    
    // 按键松开事件
    document.addEventListener('keyup', function(e) {
        if (e.code in keys) {
            keys[e.code] = false;
        }
    });
    
    // 更新玩家1
    function updatePlayer1() {
        if (!player1State.isActive) return;
        
        // 处理左右移动
        if (keys.KeyA && !isGameOver && !isLevelComplete) {
            // 区分PC和移动端的移动速度
            const speed = isMobileDevice() ? mobileMoveSpeed : moveSpeed;
            player1State.x -= speed;
            if (player1State.x < 0) {
                player1State.x = 0;
            }
        }
        
        if (keys.KeyD && !isGameOver && !isLevelComplete) {
            // 区分PC和移动端的移动速度
            const speed = isMobileDevice() ? mobileMoveSpeed : moveSpeed;
            player1State.x += speed;
            const maxX = gameContainer.offsetWidth - player1State.width;
            if (player1State.x > maxX) {
                player1State.x = maxX;
            }
        }
        
        // 应用重力
        player1State.velocityY -= gravity;
        
        // 限制下落速度
        if (player1State.velocityY < -12) {
            player1State.velocityY = -12;
        }
        
        // 更新玩家位置
        player1State.y += player1State.velocityY;
        
        // 检查是否站在平台上
        checkPlatforms(player1State);
        
        // 检查是否在地面上
        if (player1State.y <= 0) {
            player1State.y = 0;
            player1State.velocityY = 0;
            player1State.onGround = true;
            player1State.isJumping = false;
            player1State.jumpCount = 0;
        }
        
        // 落地动画效果
        if (player1State.onGround && player1State.velocityY <= 0) {
            player1Element.style.transition = 'transform 0.1s';
            player1Element.style.transform = 'scaleY(0.9)';
            setTimeout(() => {
                player1Element.style.transform = 'scaleY(1)';
            }, 100);
            
            // 重置跳跃状态
            player1State.isJumping = false;
            player1State.jumpCount = 0;
        }
    }
    
    // 更新玩家2
    function updatePlayer2() {
        if (!player2State.isActive) return;
        
        // 处理左右移动
        if (keys.ArrowLeft && !isGameOver && !isLevelComplete) {
            // 区分PC和移动端的移动速度
            const speed = isMobileDevice() ? mobileMoveSpeed : moveSpeed;
            player2State.x -= speed;
            if (player2State.x < 0) {
                player2State.x = 0;
            }
        }
        
        if (keys.ArrowRight && !isGameOver && !isLevelComplete) {
            // 区分PC和移动端的移动速度
            const speed = isMobileDevice() ? mobileMoveSpeed : moveSpeed;
            player2State.x += speed;
            const maxX = gameContainer.offsetWidth - player2State.width;
            if (player2State.x > maxX) {
                player2State.x = maxX;
            }
        }
        
        // 应用重力
        player2State.velocityY -= gravity;
        
        // 限制下落速度
        if (player2State.velocityY < -12) {
            player2State.velocityY = -12;
        }
        
        // 更新玩家位置
        player2State.y += player2State.velocityY;
        
        // 检查是否站在平台上
        checkPlatforms(player2State);
        
        // 检查是否在地面上
        if (player2State.y <= 0) {
            player2State.y = 0;
            player2State.velocityY = 0;
            player2State.onGround = true;
            player2State.isJumping = false;
            player2State.jumpCount = 0;
        }
        
        // 落地动画效果
        if (player2State.onGround && player2State.velocityY <= 0) {
            player2Element.style.transition = 'transform 0.1s';
            player2Element.style.transform = 'scaleY(0.9)';
            setTimeout(() => {
                player2Element.style.transform = 'scaleY(1)';
            }, 100);
            
            // 重置跳跃状态
            player2State.isJumping = false;
            player2State.jumpCount = 0;
        }
    }
    
    // 检测是否是移动设备
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.matchMedia("(max-width: 768px)").matches;
    }
    
    // 更新游戏逻辑
    function updateGame() {
        // 更新玩家1
        updatePlayer1();
        
        // 更新玩家2
        updatePlayer2();
        
        // 更新玩家显示
        updatePlayersDisplay();
        
        // 检查玩家1碰撞
        if (player1State.isActive) {
            // 检查障碍物碰撞
            if (checkObstacleCollisions(player1State)) {
                player1State.isActive = false;
                updatePlayerStatusDisplay();
            }
            
            // 检查水池碰撞（玩家1碰到水池会死亡）
            if (checkWaterCollisions(player1State)) {
                player1State.isActive = false;
                updatePlayerStatusDisplay();
            }
            
            // 检查终点碰撞
            if (checkFinishCollision(player1State)) {
                player1State.reachedFinish = true;
                updatePlayerStatusDisplay();
                
                // 如果玩家1到达终点，自动切换到玩家2
                if (!player2State.reachedFinish) {
                    // 获取切换按钮
                    const switchPlayerBtn = document.getElementById('switch-player-btn');
                    if (switchPlayerBtn) {
                        // 切换到玩家2
                        switchPlayerBtn.click();
                    }
                }
            }
        }
        
        // 检查玩家2碰撞
        if (player2State.isActive) {
            // 检查障碍物碰撞
            if (checkObstacleCollisions(player2State)) {
                player2State.isActive = false;
                updatePlayerStatusDisplay();
            }
            
            // 检查火池碰撞（玩家2碰到火池会死亡）
            if (checkFireCollisions(player2State)) {
                player2State.isActive = false;
                updatePlayerStatusDisplay();
            }
            
            // 检查终点碰撞
            if (checkFinishCollision(player2State)) {
                player2State.reachedFinish = true;
                updatePlayerStatusDisplay();
                
                // 如果玩家2到达终点，自动切换到玩家1
                if (!player1State.reachedFinish) {
                    // 获取切换按钮
                    const switchPlayerBtn = document.getElementById('switch-player-btn');
                    if (switchPlayerBtn) {
                        // 切换到玩家1
                        switchPlayerBtn.click();
                    }
                }
            }
        }
        
        // 检查游戏结束条件
        checkGameEndConditions();
    }
    
    // 检查游戏结束条件
    function checkGameEndConditions() {
        // 如果任何一个玩家失活，游戏失败
        if (!player1State.isActive || !player2State.isActive) {
            endGame('游戏结束：需要两名玩家共同完成！');
            return;
        }
        
        // 如果两个玩家都到达终点，关卡完成
        if (player1State.reachedFinish && player2State.reachedFinish) {
            completeLevel();
            return;
        }
    }
    
    // 检测水池碰撞（对玩家1有害）
    function checkWaterCollisions(playerState) {
        // 玩家2可以通过水池
        if (playerState === player2State) return false;
        // 玩家1已经失活或已经到达终点则不检测
        if (!playerState.isActive || playerState.reachedFinish) return false;
        
        const waters = document.querySelectorAll('.water');
        if (!waters.length) return false;
        
        // 获取玩家当前位置
        const playerPos = {
            x: playerState.x,
            y: playerState.y,
            width: playerState.width,
            height: playerState.height,
            right: playerState.x + playerState.width,
            top: playerState.y + playerState.height
        };
        
        for (const water of waters) {
            const waterPos = getElementPosition(water);
            
            if (checkCollision(playerPos, waterPos)) {
                if (debugMode) console.log('玩家1碰到水池!');
                return true;
            }
        }
        
        return false;
    }
    
    // 检测火池碰撞（对玩家2有害）
    function checkFireCollisions(playerState) {
        // 玩家1可以通过火池
        if (playerState === player1State) return false;
        // 玩家2已经失活或已经到达终点则不检测
        if (!playerState.isActive || playerState.reachedFinish) return false;
        
        const fires = document.querySelectorAll('.fire');
        if (!fires.length) return false;
        
        // 获取玩家当前位置
        const playerPos = {
            x: playerState.x,
            y: playerState.y,
            width: playerState.width,
            height: playerState.height,
            right: playerState.x + playerState.width,
            top: playerState.y + playerState.height
        };
        
        for (const fire of fires) {
            const firePos = getElementPosition(fire);
            
            if (checkCollision(playerPos, firePos)) {
                if (debugMode) console.log('玩家2碰到火池!');
                return true;
            }
        }
        
        return false;
    }
    
    // 检查玩家是否碰到水池或火池
    function checkWaterFireCollision() {
        // 获取所有水池
        const waters = document.querySelectorAll('.water');
        
        // 获取所有火池
        const fires = document.querySelectorAll('.fire');
        
        // 检查玩家1是否碰到水池 (玩家1不能碰水)
        waters.forEach(water => {
            const waterPos = getElementPosition(water);
            const player1Pos = {
                x: player1State.x,
                y: player1State.y,
                width: player1State.width,
                height: player1State.height,
                right: player1State.x + player1State.width,
                top: player1State.y + player1State.height
            };
            
            if (checkCollision(player1Pos, waterPos) && player1State.isActive) {
                player1State.isActive = false;
                updatePlayerStatusDisplay();
            }
        });
        
        // 检查玩家2是否碰到火池 (玩家2不能碰火)
        fires.forEach(fire => {
            const firePos = getElementPosition(fire);
            const player2Pos = {
                x: player2State.x,
                y: player2State.y,
                width: player2State.width,
                height: player2State.height,
                right: player2State.x + player2State.width,
                top: player2State.y + player2State.height
            };
            
            if (checkCollision(player2Pos, firePos) && player2State.isActive) {
                player2State.isActive = false;
                updatePlayerStatusDisplay();
            }
        });
    }
    
    // 游戏循环
    function gameLoop() {
        if (isGameOver || isLevelComplete) return;
        
        console.log('游戏循环运行中，玩家位置:', 
                    '玩家1:', Math.round(player1State.x), Math.round(player1State.y), 
                    '玩家2:', Math.round(player2State.x), Math.round(player2State.y));
        
        updateGame();
        
        // 检查碰撞
        checkObstacleCollisions(player1State);
        checkObstacleCollisions(player2State);
        checkPlatforms(player1State);
        checkPlatforms(player2State);
        checkWaterFireCollision();  // 添加水池和火池碰撞检测
        
        // 检查是否完成关卡
        checkGameEndConditions();
        
        requestAnimationFrame(gameLoop);
    }
    
    // 结束游戏
    function endGame(message) {
        isGameOver = true;
        stopTimer();
        gameOverText.innerText = message;
        gameOver.style.display = 'flex';
        
        // 重置键盘状态
        for (let key in keys) {
            keys[key] = false;
        }
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        console.log('设置事件监听器...');
        
        // 事件监听
        restartBtn.addEventListener('click', () => {
            console.log('点击：重新开始按钮');
            startLevel(currentLevel);
        });
        
        nextLevelBtn.addEventListener('click', () => {
            console.log('点击：下一关按钮');
            if (currentLevel < LEVELS.length) {
                startLevel(currentLevel + 1);
            }
        });
        
        levelSelectBtn.addEventListener('click', () => {
            console.log('点击：选择关卡按钮1');
            showLevelSelection();
        });
        
        levelSelectBtn2.addEventListener('click', () => {
            console.log('点击：选择关卡按钮2');
            showLevelSelection();
        });
        
        mainMenuBtn.addEventListener('click', () => {
            console.log('点击：主菜单按钮');
            showLevelSelection();
            stopTimer();
        });
        
        resetProgressBtn.addEventListener('click', () => {
            console.log('点击：重置进度按钮');
            resetGameProgress();
        });
        
        console.log('事件监听器设置完成');
    }
    
    // 初始化游戏
    function initGame() {
        console.log('initGame: 开始初始化游戏...');
        loadGameProgress();
        console.log('initGame: 游戏进度已加载');
        createLevelButtons();
        console.log('initGame: 关卡按钮已创建');
        setupEventListeners();
        console.log('initGame: 事件监听器已设置');
        setupMobileControls();
        console.log('initGame: 移动控制已设置');
        
        // 添加空格键切换玩家功能
        setupPlayerSwitching();
        console.log('initGame: 玩家切换功能已设置');
        
        // 检测设备类型并显示/隐藏移动控件
        detectDeviceAndSetControls();
        console.log('initGame: 设备控制已设置');
        
        // 开始第一关
        console.log('initGame: 准备开始第一关');
        startLevel(1);
        console.log('initGame: 初始化完成');
    }
    
    // 设置玩家切换功能
    function setupPlayerSwitching() {
        const player1Element = document.getElementById('player');
        const player2Element = document.getElementById('player2');
        const switchPlayerBtn = document.getElementById('switch-player-btn');
        
        // 初始时给玩家1添加发光效果
        player1Element.classList.add('player-active');
        
        // 添加空格键切换玩家事件
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space' && switchPlayerBtn) {
                // 模拟点击切换按钮
                switchPlayerBtn.click();
                e.preventDefault(); // 防止空格键触发其他操作
            }
        });
    }
    
    // 设置移动端控制
    function setupMobileControls() {
        console.log('设置移动端控制...');
        
        // 移动控制按钮
        const playerJump = document.getElementById('player-jump');
        const playerLeft = document.getElementById('player-left');
        const playerRight = document.getElementById('player-right');
        const switchPlayerBtn = document.getElementById('switch-player-btn');
        const player1Element = document.getElementById('player');
        const player2Element = document.getElementById('player2');
        const mobileControls = document.getElementById('mobile-controls');
        
        // 优化移动端控制按钮样式
        if (mobileControls) {
            // 增加按钮大小和间距
            if (playerLeft) playerLeft.style.width = '60px';
            if (playerLeft) playerLeft.style.height = '60px';
            if (playerRight) playerRight.style.width = '60px';
            if (playerRight) playerRight.style.height = '60px';
            if (playerJump) playerJump.style.width = '60px';
            if (playerJump) playerJump.style.height = '60px';
            
            // 增加左右按钮之间的间距
            if (playerLeft) playerLeft.style.marginRight = '40px';
            if (playerRight) playerRight.style.marginLeft = '40px';
        }
        
        // 当前活动玩家（默认为玩家1）
        let activePlayer = 1;
        
        // 初始时给玩家1添加发光效果
        player1Element.classList.add('player-active');
        
        // 切换玩家按钮
        if (switchPlayerBtn) {
            switchPlayerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                activePlayer = activePlayer === 1 ? 2 : 1;
                switchPlayerBtn.textContent = 'P' + activePlayer;
                switchPlayerBtn.className = 'switch-player-btn player' + activePlayer + '-border';
                
                // 切换发光效果
                if (activePlayer === 1) {
                    player1Element.classList.add('player-active');
                    player2Element.classList.remove('player-active');
                } else {
                    player2Element.classList.add('player-active');
                    player1Element.classList.remove('player-active');
                }
                
                console.log('切换到玩家' + activePlayer);
            });
        }
        
        // 跳跃按钮 - 单次点击事件
        if (playerJump) {
            playerJump.addEventListener('click', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    jumpPlayer(player1State);
                } else {
                    jumpPlayer(player2State);
                }
            });
        }
        
        // 移动按钮 - 长按处理
        
        // 左移
        if (playerLeft) {
            // 使用移动设备时的触摸事件
            playerLeft.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyA = true;
                } else {
                    keys.ArrowLeft = true;
                }
            });
            playerLeft.addEventListener('touchend', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyA = false;
                } else {
                    keys.ArrowLeft = false;
                }
            });
            
            // 使用鼠标点击时的事件
            playerLeft.addEventListener('mousedown', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyA = true;
                } else {
                    keys.ArrowLeft = true;
                }
            });
            playerLeft.addEventListener('mouseup', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyA = false;
                } else {
                    keys.ArrowLeft = false;
                }
            });
            playerLeft.addEventListener('mouseleave', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyA = false;
                } else {
                    keys.ArrowLeft = false;
                }
            });
        }
        
        // 右移
        if (playerRight) {
            // 使用移动设备时的触摸事件
            playerRight.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyD = true;
                } else {
                    keys.ArrowRight = true;
                }
            });
            playerRight.addEventListener('touchend', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyD = false;
                } else {
                    keys.ArrowRight = false;
                }
            });
            
            // 使用鼠标点击时的事件
            playerRight.addEventListener('mousedown', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyD = true;
                } else {
                    keys.ArrowRight = true;
                }
            });
            playerRight.addEventListener('mouseup', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyD = false;
                } else {
                    keys.ArrowRight = false;
                }
            });
            playerRight.addEventListener('mouseleave', function(e) {
                e.preventDefault();
                if (activePlayer === 1) {
                    keys.KeyD = false;
                } else {
                    keys.ArrowRight = false;
                }
            });
        }
        
        console.log('移动端控制设置完成');
    }
    
    // 检测设备类型并显示/隐藏移动控件
    function detectDeviceAndSetControls() {
        const mobileControls = document.getElementById('mobile-controls');
        // 始终显示控制按钮，不再根据设备类型隐藏
        mobileControls.style.display = 'flex';
        console.log('控制按钮已启用（所有设备）');
    }
    
    // 开始初始化
    initGame();
}); 