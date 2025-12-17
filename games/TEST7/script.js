/**
 * 忍者跑酷游戏
 * 一个简单的2D跑酷游戏，玩家控制一个忍者角色跳跃和闪避障碍物
 */

/**
 * 摄像机控制模块
 */
class CameraController {
    constructor(canvas, player) {
        this.canvas = canvas;
        this.player = player;

        this.x = 0; // 当前摄像头位置

        // 过渡相关
        this.transitioning = false;
        this.transitionStartTime = 0;
        this.transitionDuration = 500; // 过渡时间（毫秒）
        this.startX = 0;
    }

    // 缓动函数（easeInOutQuad）
    ease(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // 开始从当前摄像机位置过渡到目标位置
    startTransition() {
        this.transitioning = true;
        this.transitionStartTime = Date.now();
        this.startX = this.x;
    }

    update() {
        const offset = this.canvas.width / 4;
        const targetX = Math.max(0, this.player.x - offset);

        if (this.transitioning) {
            const elapsed = Date.now() - this.transitionStartTime;
            const progress = Math.min(elapsed / this.transitionDuration, 1);
            const easeProgress = this.ease(progress);

            this.x = this.startX + (targetX - this.startX) * easeProgress;

            if (progress >= 1) {
                this.transitioning = false;
            }
        } else if (this.player.dodging) {
            // 闪避中缓慢跟随
            this.x += (targetX - this.x) * 0.05;
        } else {
            // 正常跟随
            this.x = targetX;
        }
    }
}

class NinjaRunner {
    /**
     * 初始化游戏
     */
    constructor() {
        this.debug("初始化游戏");
        
        // 游戏状态
        this.gameState = "menu"; // menu, playing, gameOver
        
        // DOM元素
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.gameMenu = document.getElementById("game-menu");
        this.gameOver = document.getElementById("game-over");
        this.finalScore = document.getElementById("final-score");
        this.debugOutput = document.getElementById("debug-output");
        
        // 游戏设置
        this.score = 0;
        this.speed = 5;
        this.gravity = 0.5;
        
        // 武器系统
        this.weapons = ["拳", "剑", "手里剑"];
        this.currentWeaponIndex = 0;
        
        // 玩家数据
        this.player = {
            x: 50,
            y: 0,
            width: 40,
            height: 50,
            jumping: false,
            yVelocity: 0,
            health: 100,
            energy: 100,
            maxEnergy: 100,
            dodging: false,
            invulnerable: false
        };
        
        // 摄像机控制器
        this.camera = new CameraController(this.canvas, this.player);
        
        // 障碍物数组
        this.obstacles = [];
        
        // 初始化游戏
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        this.debug("初始化游戏设置和事件监听");
        
        // 设置画布大小
        this.resizeCanvas();
        
        // 事件监听
        window.addEventListener("resize", () => this.resizeCanvas());
        
        // 添加对元素存在性的检查
        const restartGameBtn = document.getElementById("restart-game-btn");
        if (restartGameBtn) {
            restartGameBtn.addEventListener("click", () => this.restartGame());
        } else {
            this.debug("警告：未找到restart-game-btn元素");
        }
        
        const menuBtn = document.getElementById("menu-btn");
        if (menuBtn) {
            menuBtn.addEventListener("click", () => this.returnToMenu());
        } else {
            this.debug("警告：未找到menu-btn元素，请在HTML中添加此按钮");
        }
        
        const startBtn = document.getElementById("start-btn");
        if (startBtn) {
            startBtn.addEventListener("click", () => this.startGame());
        } else {
            this.debug("警告：未找到start-btn元素");
        }
        
        // 初始化移动端控制
        this.setupMobileControls();
        
        // 键盘事件
        window.addEventListener("keydown", (e) => this.handleKeyDown(e));
        
        // 开始渲染循环
        this.update();
    }
    
    /**
     * 调整画布大小
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 重新设置玩家位置
        this.player.y = this.canvas.height - this.player.height - 50;
    }
    
    /**
     * 处理键盘事件
     */
    handleKeyDown(e) {
        if (this.gameState !== "playing") return;
        
        // 空格键跳跃
        if (e.code === "Space" && !this.player.jumping) {
            this.jump();
        }
    }
    
    /**
     * 处理移动控制按钮点击
     */
    setupMobileControls() {
        // 跳跃控制
        const jumpBtn = document.getElementById("jump-btn");
        if (jumpBtn) {
            jumpBtn.addEventListener("touchstart", (e) => {
                e.preventDefault(); // 防止默认滚动行为
                if (this.gameState === "playing" && !this.player.jumping) {
                    this.jump();
                }
            });
            jumpBtn.addEventListener("mousedown", () => {
                if (this.gameState === "playing" && !this.player.jumping) {
                    this.jump();
                }
            });
        }
        
        // 攻击控制
        const attackBtn = document.getElementById("attack-btn");
        if (attackBtn) {
            attackBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                if (this.gameState === "playing") {
                    this.attack();
                }
            });
            attackBtn.addEventListener("mousedown", () => {
                if (this.gameState === "playing") {
                    this.attack();
                }
            });
        }
        
        // 闪避控制
        const dodgeBtn = document.getElementById("dodge-btn");
        if (dodgeBtn) {
            dodgeBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                if (this.gameState === "playing") {
                    this.dodge();
                }
            });
            dodgeBtn.addEventListener("mousedown", () => {
                if (this.gameState === "playing") {
                    this.dodge();
                }
            });
        }
        
        // 切换武器控制
        const weaponSwitchBtn = document.getElementById("weapon-switch-btn");
        if (weaponSwitchBtn) {
            weaponSwitchBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                if (this.gameState === "playing") {
                    this.switchWeapon();
                }
            });
            weaponSwitchBtn.addEventListener("mousedown", () => {
                if (this.gameState === "playing") {
                    this.switchWeapon();
                }
            });
        }
        
        // 技能控制
        const skillBtn = document.getElementById("skill-btn");
        if (skillBtn) {
            skillBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                if (this.gameState === "playing") {
                    this.useSkill();
                }
            });
            skillBtn.addEventListener("mousedown", () => {
                if (this.gameState === "playing") {
                    this.useSkill();
                }
            });
        }
    }
    
    /**
     * 玩家跳跃
     */
    jump() {
        // 检查能量是否足够
        if (this.player.energy >= 20) {
            this.player.jumping = true;
            this.player.yVelocity = -15;
            
            // 消耗能量
            this.player.energy -= 20;
            this.updateEnergyBar();
            
            this.debug("玩家跳跃，消耗能量: 20，剩余: " + this.player.energy);
        } else {
            this.debug("能量不足，无法跳跃");
        }
    }
    
    /**
     * 更新能量条显示
     */
    updateEnergyBar() {
        const energyBar = document.getElementById("energy-bar");
        if (energyBar) {
            const percentage = (this.player.energy / this.player.maxEnergy) * 100;
            energyBar.style.width = percentage + "%";
        }
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        this.debug("游戏开始");
        this.gameState = "playing";
        
        // 重置游戏数据
        this.score = 0;
        this.speed = 5;
        this.obstacleChance = 0.01;
        this.recentlyDamaged = false;
        
        // 重置UI显示
        this.gameMenu.style.display = "none";
        this.gameOver.style.display = "none";
        
        // 重置玩家状态
        this.player.health = 100;
        this.player.energy = 100;
        this.player.dodging = false;
        this.player.invulnerable = false;
        this.currentWeaponIndex = 0;
        
        // 重置武器属性为拳头的属性
        this.attackPower = 10;
        this.attackRange = 60;
        this.attackEnergyCost = 15;
        
        // 更新健康状态条
        this.updateHealthBar();
        
        // 更新能量条
        this.updateEnergyBar();
        
        // 重置玩家位置
        this.player.y = this.canvas.height - this.player.height - 50;
        this.player.x = 50; // 确保横坐标也重置
        this.player.jumping = false;
        this.player.yVelocity = 0;
        
        // 重置摄像机
        this.camera.x = 0;
        
        // 清空障碍物
        this.obstacles = [];
        
        // 清除攻击效果
        this.attackEffect = null;
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        this.debug("重新开始游戏");
        this.startGame();
    }
    
    /**
     * 返回主菜单
     */
    returnToMenu() {
        this.debug("返回主菜单");
        this.gameState = "menu";
        this.gameOver.style.display = "none";
        this.gameMenu.style.display = "flex";
    }
    
    /**
     * 游戏结束
     */
    gameOverHandler() {
        this.debug("游戏结束，得分：" + this.score);
        this.gameState = "gameOver";
        this.finalScore.textContent = "得分: " + Math.floor(this.score);
        this.gameOver.style.display = "flex";
    }
    
    /**
     * 游戏主循环
     */
    update() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 根据游戏状态渲染不同内容
        if (this.gameState === "playing") {
            this.updatePlaying();
        } else if (this.gameState === "menu") {
            this.renderMenu();
        } else if (this.gameState === "gameOver") {
            this.renderGameOver();
        }
        
        // 继续渲染循环
        requestAnimationFrame(() => this.update());
    }
    
    /**
     * 更新游戏状态
     */
    updatePlaying() {
        // 更新分数
        this.score += 0.1;
        
        // 恢复能量
        if (this.player.energy < this.player.maxEnergy) {
            this.player.energy += 0.2;
            if (this.player.energy > this.player.maxEnergy) {
                this.player.energy = this.player.maxEnergy;
            }
            this.updateEnergyBar();
        }
        
        // 缓慢恢复血量
        if (this.player.health < 100 && !this.recentlyDamaged) {
            this.player.health += 0.05;
            if (this.player.health > 100) {
                this.player.health = 100;
            }
            // 更新血量条
            this.updateHealthBar();
        }
        
        // 随着分数增加提高游戏难度
        this.updateDifficulty();
        
        // 更新玩家位置
        if (this.player.jumping) {
            this.player.yVelocity += this.gravity;
            this.player.y += this.player.yVelocity;
            
            // 检查是否落地
            if (this.player.y >= this.canvas.height - this.player.height - 50) {
                this.player.y = this.canvas.height - this.player.height - 50;
                this.player.jumping = false;
                this.player.yVelocity = 0;
            }
        }
        
        // 更新摄像机
        this.camera.update();
        
        // 生成障碍物
        this.generateObstacles();
        
        // 更新障碍物
        this.updateObstacles();
        
        // 检测碰撞
        this.checkCollisions();
        
        // 渲染
        this.renderPlaying();
    }
    
    /**
     * 根据分数更新游戏难度
     */
    updateDifficulty() {
        // 每100分增加速度
        this.speed = 5 + Math.floor(this.score / 100);
        
        // 随着速度增加，增加障碍物生成概率
        this.obstacleChance = 0.01 + (this.speed - 5) * 0.002;
        
        // 限制最大难度
        if (this.speed > 15) this.speed = 15;
        if (this.obstacleChance > 0.05) this.obstacleChance = 0.05;
    }
    
    /**
     * 生成障碍物
     */
    generateObstacles() {
        // 使用动态计算的障碍物生成概率
        if (!this.obstacleChance) this.obstacleChance = 0.01;
        
        // 使用摄像机位置计算可视区域
        const visibleRight = this.camera.x + this.canvas.width;
        
        // 随机生成障碍物，并确保它在当前视图右侧生成
        if (Math.random() < this.obstacleChance) {
            // 随机障碍物高度，使游戏更有挑战性
            const height = 30 + Math.random() * 50;
            
            this.obstacles.push({
                x: visibleRight + 50, // 确保在屏幕右侧生成
                y: this.canvas.height - height - 50,
                width: 30,
                height: height,
                hit: false
            });
            
            this.debug("生成新障碍物，高度: " + Math.floor(height) + "，位置: " + Math.floor(visibleRight + 50));
        }
    }
    
    /**
     * 更新障碍物
     */
    updateObstacles() {
        // 使用摄像机位置计算可视区域
        const visibleLeft = this.camera.x - 100; // 给一点缓冲区
        
        // 移动障碍物
        for (let i = 0; i < this.obstacles.length; i++) {
            this.obstacles[i].x -= this.speed;
            
            // 移出屏幕很远则移除
            if (this.obstacles[i].x + this.obstacles[i].width < visibleLeft) {
                this.obstacles.splice(i, 1);
                i--;
            }
        }
    }
    
    /**
     * 检测碰撞
     */
    checkCollisions() {
        // 闪避时无敌，跳过碰撞检测
        if (this.player.invulnerable) {
            return;
        }
        
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            
            // 已经碰撞过的障碍物不再重复计算
            if (obstacle.hit) continue;
            
            if (this.isColliding(this.player, obstacle)) {
                obstacle.hit = true; // 标记为已碰撞
                
                // 减少玩家生命值
                this.player.health -= 25;
                
                // 设置最近受伤标记，暂停恢复
                this.recentlyDamaged = true;
                setTimeout(() => {
                    this.recentlyDamaged = false;
                }, 5000); // 5秒后开始恢复
                
                // 更新生命值条
                this.updateHealthBar();
                
                this.debug("玩家受到伤害! 剩余生命值: " + this.player.health.toFixed(1));
                
                // 闪烁画面表示受伤
                this.flashScreen();
                
                // 检查生命值是否耗尽
                if (this.player.health <= 0) {
                    this.gameOverHandler();
                    break;
                }
            }
        }
    }
    
    /**
     * 闪烁画面表示受伤
     */
    flashScreen() {
        // 创建红色覆盖层
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
        overlay.style.zIndex = "999";
        overlay.style.pointerEvents = "none";
        
        document.body.appendChild(overlay);
        
        // 短暂显示后移除
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 200);
    }
    
    /**
     * 碰撞检测
     */
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    /**
     * 渲染游戏菜单
     */
    renderMenu() {
        // 渲染背景
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 菜单由HTML处理
    }
    
    /**
     * 渲染游戏结束画面
     */
    renderGameOver() {
        // 渲染背景
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 结束画面由HTML处理
    }
    
    /**
     * 渲染游戏内容
     */
    renderPlaying() {
        // 渲染背景
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存当前环境
        this.ctx.save();
        
        // 应用摄像头变换
        this.ctx.translate(-this.camera.x, 0);
        
        // 渲染地面
        this.ctx.fillStyle = "#555";
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width * 5, 50);
        
        // 处理闪避移动
        if (this.player.dodging && this.player.dodgeDistance < this.player.dodgeMaxDistance) {
            // 渲染闪避残影
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            this.ctx.fillRect(this.player.x - 30, this.player.y, this.player.width, this.player.height);
            this.ctx.globalAlpha = 1.0;
        }
        
        // 渲染玩家，如果处于无敌状态则闪烁
        if (this.player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // 闪烁效果
        } else {
            this.ctx.fillStyle = "red";
        }
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 渲染攻击效果
        if (this.attackEffect && this.attackEffect.duration > 0) {
            this.ctx.fillStyle = this.attackEffect.color;
            this.ctx.fillRect(
                this.attackEffect.x, 
                this.attackEffect.y, 
                this.attackEffect.width, 
                this.attackEffect.height
            );
            this.attackEffect.duration--;
        }
        
        // 渲染障碍物
        this.ctx.fillStyle = "blue";
        for (let obstacle of this.obstacles) {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        
        // 恢复之前的环境
        this.ctx.restore();
        
        // 渲染不随摄像头移动的UI元素
        
        const x = this.canvas.width / 2;

        // 渲染武器信息
        if (this.weapons && this.currentWeaponIndex !== undefined) {
            this.ctx.fillStyle = "white";
            this.ctx.font = "16px Arial";
            this.ctx.fillText("武器: " + this.weapons[this.currentWeaponIndex], x, 70);
        }
        
        // 渲染分数
        this.ctx.fillStyle = "white";
        this.ctx.font = "24px Arial";
        this.ctx.fillText("得分: " + Math.floor(this.score), x, 40);
        
        // 显示血量和能量数值
        this.ctx.fillStyle = "white";
        this.ctx.font = "14px Arial";
        this.ctx.fillText("生命: " + Math.floor(this.player.health) + "%", 230, 30);
        this.ctx.fillText("能量: " + Math.floor(this.player.energy) + "%", 230, 50);
        this.ctx.fillText("距离: " + Math.floor(this.player.x) + "m", 230, 70);
    }
    
    /**
     * 调试信息
     */
    debug(message) {
        console.log(message);
        if (this.debugOutput) {
            this.debugOutput.innerHTML += "[游戏] " + message + "<br>";
            this.debugOutput.scrollTop = this.debugOutput.scrollHeight;
        }
    }
    
    /**
     * 玩家攻击
     */
    attack() {
        // 如果没有初始化攻击属性，先初始化为拳头攻击
        if (!this.attackPower) {
            this.attackPower = 10;
            this.attackRange = 60;
            this.attackEnergyCost = 15;
        }
        
        // 检查能量是否足够
        if (this.player.energy >= this.attackEnergyCost) {
            // 消耗能量
            this.player.energy -= this.attackEnergyCost;
            this.updateEnergyBar();
            
            // 创建攻击效果
            this.createAttackEffect();
            
            // 获取当前武器
            const currentWeapon = this.weapons[this.currentWeaponIndex];
            
            // 检查是否命中障碍物
            for (let i = 0; i < this.obstacles.length; i++) {
                const obstacle = this.obstacles[i];
                // 计算攻击范围的开始和结束位置
                const attackStartX = this.player.x + this.player.width;
                const attackEndX = attackStartX + this.attackRange;
                
                // 如果障碍物在攻击范围内
                // 情况1: 障碍物左边界在攻击范围内
                // 情况2: 障碍物右边界在攻击范围内
                // 情况3: 障碍物完全包含攻击范围
                if ((obstacle.x >= attackStartX && obstacle.x <= attackEndX) || 
                    (obstacle.x + obstacle.width >= attackStartX && obstacle.x + obstacle.width <= attackEndX) ||
                    (obstacle.x <= attackStartX && obstacle.x + obstacle.width >= attackEndX)) {
                    
                    // 销毁障碍物并增加分数
                    this.obstacles.splice(i, 1);
                    i--;
                    this.score += this.attackPower / 2;
                    this.debug("用" + currentWeapon + "攻击摧毁障碍物! +" + (this.attackPower / 2) + "分");
                }
            }
            
            this.debug("玩家用" + currentWeapon + "攻击，消耗能量: " + this.attackEnergyCost + "，剩余: " + this.player.energy);
        } else {
            this.debug("能量不足，无法攻击");
        }
    }
    
    /**
     * 创建攻击效果
     */
    createAttackEffect() {
        // 获取当前武器
        const currentWeapon = this.weapons[this.currentWeaponIndex];
        let color, duration;
        
        // 根据武器类型设置效果
        switch(currentWeapon) {
            case "拳":
                color = "rgba(255, 165, 0, 0.6)"; // 橙色
                duration = 5;
                break;
            case "剑":
                color = "rgba(255, 0, 0, 0.6)"; // 红色
                duration = 8;
                break;
            case "手里剑":
                color = "rgba(0, 0, 255, 0.6)"; // 蓝色
                duration = 12;
                break;
            default:
                color = "rgba(255, 255, 255, 0.6)"; // 白色
                duration = 10;
        }
        
        // 攻击起始位置是玩家右侧
        const attackStartX = this.player.x + this.player.width;
        
        // 在画布上创建一个临时的攻击效果
        this.attackEffect = {
            x: attackStartX,
            y: this.player.y,
            width: this.attackRange,
            height: this.player.height,
            color: color,
            duration: duration // 持续帧数
        };
        
        // 添加调试信息
        this.debug("攻击效果: 起始位置=" + attackStartX + ", 范围=" + this.attackRange + ", 武器=" + currentWeapon);
    }
    
    /**
     * 玩家闪避
     */
    dodge() {
        // 检查能量是否足够
        if (this.player.energy >= 30 && !this.player.dodging) {
            // 消耗能量
            this.player.energy -= 30;
            this.updateEnergyBar();
            
            // 设置闪避状态
            this.player.dodging = true;
            this.player.invulnerable = true; // 无敌状态
            
            // 闪避动画 - 短暂加速向前移动
            this.player.dodgeDistance = 0;
            this.player.dodgeMaxDistance = 150; // 闪避距离
            
            // 启动摄像头过渡
            this.camera.startTransition();
            
            // 闪避冲刺阶段
            const dodgeInterval = setInterval(() => {
                if (this.player.dodgeDistance < this.player.dodgeMaxDistance) {
                    // 移动玩家
                    this.player.dodgeDistance += 30;
                    this.player.x += 30;
                    
                    // 防止越界
                    if (this.player.x > this.canvas.width * 4) {
                        this.player.x = this.canvas.width * 4;
                        clearInterval(dodgeInterval);
                    }
                } else {
                    clearInterval(dodgeInterval);
                }
            }, 50); // 每50毫秒执行一次，冲刺更快
            
            // 2秒后恢复正常
            setTimeout(() => {
                this.player.dodging = false;
                this.player.invulnerable = false;
            }, 2000);
            
            this.debug("玩家闪避，消耗能量: 30，剩余: " + this.player.energy);
        } else if (this.player.dodging) {
            this.debug("正在闪避中");
        } else {
            this.debug("能量不足，无法闪避");
        }
    }
    
    /**
     * 切换武器
     */
    switchWeapon() {
        // 切换到下一个武器
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        const newWeapon = this.weapons[this.currentWeaponIndex];
        
        // 根据武器类型改变攻击属性
        switch(newWeapon) {
            case "拳":
                this.attackPower = 10;
                this.attackRange = 60;
                this.attackEnergyCost = 15;
                break;
            case "剑":
                this.attackPower = 20;
                this.attackRange = 100;
                this.attackEnergyCost = 20;
                break;
            case "手里剑":
                this.attackPower = 15;
                this.attackRange = 150;
                this.attackEnergyCost = 25;
                break;
        }
        
        this.debug("切换武器: " + newWeapon + "，攻击力: " + this.attackPower + "，范围: " + this.attackRange);
    }
    
    /**
     * 使用技能
     */
    useSkill() {
        // 检查能量是否足够
        if (this.player.energy >= 50) {
            // 消耗能量
            this.player.energy -= 50;
            this.updateEnergyBar();
            
            // 清除所有障碍物
            const obstacleCount = this.obstacles.length;
            this.obstacles = [];
            
            // 增加分数
            this.score += obstacleCount * 2;
            
            // 创建技能效果
            this.createSkillEffect();
            
            this.debug("使用技能，摧毁所有障碍物! 消耗能量: 50，剩余: " + this.player.energy);
        } else {
            this.debug("能量不足，无法使用技能");
        }
    }
    
    /**
     * 创建技能效果
     */
    createSkillEffect() {
        // 创建全屏闪光效果
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 255, 255, 0.3)";
        overlay.style.zIndex = "999";
        overlay.style.pointerEvents = "none";
        
        document.body.appendChild(overlay);
        
        // 短暂显示后移除
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 500);
    }
    
    /**
     * 更新血量条显示
     */
    updateHealthBar() {
        const healthBar = document.getElementById("health-bar");
        if (healthBar) {
            const percentage = Math.max(0, Math.min(100, this.player.health)) + "%";
            healthBar.style.width = percentage;
        }
    }
}

// 当文档加载完成后创建游戏实例
document.addEventListener("DOMContentLoaded", () => {
    window.game = new NinjaRunner();
}); 