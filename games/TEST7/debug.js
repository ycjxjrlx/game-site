/**
 * 调试工具类
 * 提供游戏开发过程中的调试功能
 */
class DebugTool {
    constructor() {
        this.isEnabled = false;
        this.outputElement = document.getElementById('debug-output');
        this.infoContainer = document.getElementById('debug-info');
        this.messageCount = 0;
        this.maxMessages = 50;
        
        // 初始化调试界面
        this.init();
    }
    
    /**
     * 初始化调试工具
     */
    init() {
        // 如果调试元素不存在，创建它们
        if (!this.outputElement) {
            this.infoContainer = document.createElement('div');
            this.infoContainer.id = 'debug-info';
            this.infoContainer.style.position = 'absolute';
            this.infoContainer.style.bottom = '10px';
            this.infoContainer.style.left = '10px';
            this.infoContainer.style.width = '300px';
            this.infoContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
            this.infoContainer.style.color = '#0f0';
            this.infoContainer.style.padding = '10px';
            this.infoContainer.style.zIndex = '1000';
            this.infoContainer.style.display = 'none';
            
            this.outputElement = document.createElement('div');
            this.outputElement.id = 'debug-output';
            this.infoContainer.appendChild(this.outputElement);
            
            document.body.appendChild(this.infoContainer);
        }
        
        // 添加快捷键以显示/隐藏调试信息
        document.addEventListener('keydown', (e) => {
            // 按下Ctrl+D切换调试面板
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    /**
     * 开启调试模式
     */
    enable() {
        this.isEnabled = true;
        if (this.infoContainer) {
            this.infoContainer.style.display = 'block';
        }
        this.log('调试模式已启用 - 按Ctrl+D切换显示');
    }
    
    /**
     * 关闭调试模式
     */
    disable() {
        this.isEnabled = false;
        if (this.infoContainer) {
            this.infoContainer.style.display = 'none';
        }
    }
    
    /**
     * 切换调试模式状态
     */
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
    
    /**
     * 添加日志信息
     * @param {string} message - 日志消息
     * @param {string} [type='info'] - 日志类型 (info, warn, error)
     */
    log(message, type = 'info') {
        if (!this.isEnabled) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const msgElement = document.createElement('div');
        
        // 根据消息类型设置不同颜色
        let color;
        switch (type) {
            case 'warn':
                color = '#ffcc00';
                break;
            case 'error':
                color = '#ff3333';
                break;
            default:
                color = '#00ff00';
        }
        
        msgElement.style.color = color;
        msgElement.innerHTML = `[${timestamp}] ${message}`;
        
        // 将消息添加到调试输出区域
        if (this.outputElement) {
            this.outputElement.appendChild(msgElement);
            
            // 自动滚动到最新消息
            this.outputElement.scrollTop = this.outputElement.scrollHeight;
            
            // 限制消息数量
            this.messageCount++;
            if (this.messageCount > this.maxMessages) {
                this.outputElement.removeChild(this.outputElement.firstChild);
                this.messageCount--;
            }
        }
        
        // 同时在控制台输出
        if (type === 'error') {
            console.error(message);
        } else if (type === 'warn') {
            console.warn(message);
        } else {
            console.log(message);
        }
    }
    
    /**
     * 清空调试输出
     */
    clear() {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
            this.messageCount = 0;
        }
        console.clear();
        this.log('调试输出已清空');
    }
    
    /**
     * 显示游戏状态信息
     * @param {Object} gameState - 游戏状态对象
     */
    displayGameState(gameState) {
        if (!this.isEnabled) return;
        
        let stateInfo = '';
        for (const [key, value] of Object.entries(gameState)) {
            // 跳过显示函数和过大的对象
            if (typeof value === 'function' || 
                (typeof value === 'object' && value !== null && Object.keys(value).length > 5)) {
                continue;
            }
            stateInfo += `${key}: ${JSON.stringify(value)}<br>`;
        }
        
        // 创建或更新状态显示元素
        let stateElement = document.getElementById('debug-state');
        if (!stateElement) {
            stateElement = document.createElement('div');
            stateElement.id = 'debug-state';
            stateElement.style.marginTop = '10px';
            stateElement.style.padding = '5px';
            stateElement.style.border = '1px solid #444';
            this.infoContainer.appendChild(stateElement);
        }
        
        stateElement.innerHTML = `<strong>游戏状态:</strong><br>${stateInfo}`;
    }
    
    /**
     * 计算并显示FPS
     */
    trackFPS() {
        if (!this.isEnabled) return;
        
        if (!this.fpsElement) {
            this.fpsElement = document.createElement('div');
            this.fpsElement.id = 'debug-fps';
            this.fpsElement.style.position = 'absolute';
            this.fpsElement.style.top = '10px';
            this.fpsElement.style.right = '10px';
            this.fpsElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
            this.fpsElement.style.color = '#fff';
            this.fpsElement.style.padding = '5px';
            this.fpsElement.style.zIndex = '1000';
            document.body.appendChild(this.fpsElement);
            
            this.frameCount = 0;
            this.lastFpsUpdate = performance.now();
        }
        
        this.frameCount++;
        const now = performance.now();
        
        // 每秒更新一次FPS
        if (now - this.lastFpsUpdate >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.fpsElement.textContent = `FPS: ${fps}`;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }
}

// 创建全局调试工具实例
const debugTool = new DebugTool();

// 在window对象上暴露调试方法，方便控制台访问
window.debug = {
    enable: () => debugTool.enable(),
    disable: () => debugTool.disable(),
    toggle: () => debugTool.toggle(),
    log: (msg, type) => debugTool.log(msg, type),
    clear: () => debugTool.clear(),
    showState: (state) => debugTool.displayGameState(state)
};

// 简单的调试脚本
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面已加载');
    
    // 获取开始游戏按钮
    const startBtn = document.getElementById('start-btn');
    if(startBtn) {
        console.log('找到开始游戏按钮');
        
        // 添加点击事件
        startBtn.addEventListener('click', function() {
            console.log('开始游戏按钮被点击');
            // 无需在这里处理，避免干扰主游戏流程
            // document.getElementById('game-menu').style.display = 'none';
            // alert('游戏开始！');
        });
    } else {
        console.error('未找到开始游戏按钮');
    }
    
    // 检查游戏菜单元素
    const gameMenu = document.getElementById('game-menu');
    if(gameMenu) {
        console.log('找到游戏菜单');
    } else {
        console.error('未找到游戏菜单');
    }
}); 