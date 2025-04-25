document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const passBtn = document.getElementById('pass-btn');
    const resetBtn = document.getElementById('reset-btn');
    const currentPlayerDisplay = document.getElementById('current-player');
    const blackCapturesDisplay = document.getElementById('black-captures');
    const whiteCapturesDisplay = document.getElementById('white-captures');
    const goGameBtn = document.getElementById('go-game-btn');
    const gomokuGameBtn = document.getElementById('gomoku-game-btn');
    const chessGameBtn = document.getElementById('chess-game-btn');
    const goSettings = document.getElementById('go-settings');
    const gomokuSettings = document.getElementById('gomoku-settings');
    const chessSettings = document.getElementById('chess-settings');
    const goBoardSizeSelect = document.getElementById('go-board-size');
    const capturesContainer = document.getElementById('captures-container');

    // 创建模式选择DOM元素
    const modeSelection = document.createElement('div');
    modeSelection.className = 'mode-selection';
    modeSelection.innerHTML = `
        <label>游戏模式:</label>
        <div class="mode-buttons">
            <button id="pvp-mode-btn" class="mode-btn active">双人对战</button>
            <button id="pve-mode-btn" class="mode-btn">人机对战</button>
        </div>
    `;
    
    // 创建选边DOM元素
    const sideSelection = document.createElement('div');
    sideSelection.className = 'side-selection';
    sideSelection.innerHTML = `
        <label>选择您的一方:</label>
        <div class="side-buttons">
            <button id="black-side-btn" class="side-btn active">黑方</button>
            <button id="white-side-btn" class="side-btn">白方</button>
        </div>
    `;

    // 创建象棋选边DOM元素 - 确保ID不冲突
    const chessSideSelection = document.createElement('div');
    chessSideSelection.className = 'side-selection';
    chessSideSelection.innerHTML = `
        <label>选择您的一方:</label>
        <div class="side-buttons">
            <button id="red-side-btn" class="side-btn active">红方</button>
            <button id="black-chess-side-btn" class="side-btn">黑方</button>
        </div>
    `;
    
    // 插入到游戏设置区域
    goSettings.appendChild(modeSelection.cloneNode(true));
    goSettings.appendChild(sideSelection.cloneNode(true));
    gomokuSettings.appendChild(modeSelection.cloneNode(true));
    gomokuSettings.appendChild(sideSelection.cloneNode(true));
    if (chessSettings) { // 确保chess元素存在
        chessSettings.appendChild(modeSelection.cloneNode(true));
        chessSettings.appendChild(chessSideSelection);
    }
    
    // 获取所有模式和选边按钮
    const pvpBtnGo = goSettings.querySelector('#pvp-mode-btn');
    const pveBtnGo = goSettings.querySelector('#pve-mode-btn');
    const blackBtnGo = goSettings.querySelector('#black-side-btn');
    const whiteBtnGo = goSettings.querySelector('#white-side-btn');

    const pvpBtnGomoku = gomokuSettings.querySelector('#pvp-mode-btn');
    const pveBtnGomoku = gomokuSettings.querySelector('#pve-mode-btn');
    const blackBtnGomoku = gomokuSettings.querySelector('#black-side-btn');
    const whiteBtnGomoku = gomokuSettings.querySelector('#white-side-btn');

    let pvpBtnChess = null;
    let pveBtnChess = null;
    let redBtnChess = null;
    let blackBtnChess = null;

    if (chessSettings) {
        pvpBtnChess = chessSettings.querySelector('#pvp-mode-btn');
        pveBtnChess = chessSettings.querySelector('#pve-mode-btn');
        redBtnChess = chessSettings.querySelector('#red-side-btn');
        blackBtnChess = chessSettings.querySelector('#black-chess-side-btn');
    }

    // 游戏状态
    let gameMode = 'go'; // 'go', 'gomoku' 或 'chess'
    let playMode = 'pvp'; // 'pvp' 或 'pve'
    let playerSide = 1; // 用户选择的一方：1=黑/红方，2=白/黑方
    let boardSize = 19;
    let cellSize = 30;
    let stoneRadius = cellSize * 0.4;
    let padding = cellSize;
    let board = [];
    let currentPlayer = 1; // 1=黑/红, 2=白/黑
    let captures = { black: 0, white: 0 };
    let lastMove = null;
    let consecutivePasses = 0;
    let gameOver = false;
    let isAIThinking = false;
    
    // 象棋特有状态
    let chessPieces = [];
    let selectedPiece = null;
    let possibleMoves = [];
    let lastMovedPiece = null; // 用于跟踪上一步移动的棋子，添加高亮效果

    // 象棋棋子定义
    const chessPieceTypes = {
        // 红方
        'R_KING': { name: '帅', value: 30000 },
        'R_ADVISOR': { name: '仕', value: 120 },
        'R_ELEPHANT': { name: '相', value: 120 },
        'R_HORSE': { name: '马', value: 270 },
        'R_CHARIOT': { name: '车', value: 600 },
        'R_CANNON': { name: '炮', value: 285 },
        'R_PAWN': { name: '兵', value: 30 },
        
        // 黑方
        'B_KING': { name: '将', value: 30000 },
        'B_ADVISOR': { name: '士', value: 120 },
        'B_ELEPHANT': { name: '象', value: 120 },
        'B_HORSE': { name: '马', value: 270 },
        'B_CHARIOT': { name: '车', value: 600 },
        'B_CANNON': { name: '炮', value: 285 },
        'B_PAWN': { name: '卒', value: 30 }
    };

    // 添加被吃棋子显示区域的状态
    let capturedChessPieces = {
        black: [], // 黑方被吃的棋子
        red: []    // 红方被吃的棋子
    };

    // 初始化棋盘
    function initBoard() {
        if (gameMode === 'chess') {
            // 中国象棋棋盘和棋子初始化
            initChessBoard();
        } else {
            // 围棋/五子棋棋盘初始化
            board = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
        }
    }

    // 调整画布大小
    function resizeCanvas() {
        if (gameMode === 'chess') {
            // 象棋棋盘大小，确保在移动设备上显示足够大
            const maxWidth = Math.min(window.innerWidth - 40, 800);
            const containerWidth = document.querySelector('.board-container').clientWidth;
            const availableWidth = Math.min(maxWidth, containerWidth);
            
            // 根据可用宽度计算单元格大小，确保移动设备上棋盘足够大
            cellSize = Math.max(30, Math.floor(availableWidth / 11)); // 9格+2个边距
            
            // 计算棋盘实际宽度和高度
            const boardWidth = (boardSize.width - 1) * cellSize;
            const boardHeight = (boardSize.height - 1) * cellSize;
            
            // 添加外边距，确保棋盘完全显示，并为被吃棋子显示预留空间
            const horizontalMargin = cellSize * 2; // 水平方向边距
            const verticalMargin = cellSize * 2.5; // 垂直方向边距增加，为上下方被吃棋子区域留出空间
            
            // 设置画布尺寸
            canvas.width = boardWidth + horizontalMargin * 2;
            canvas.height = boardHeight + verticalMargin * 2;
            
            console.log("画布尺寸：", canvas.width, "x", canvas.height, "像素");
            console.log("单元格大小：", cellSize, "像素");
        } else {
            // 围棋/五子棋棋盘大小...（保持不变）
            const maxWidth = Math.min(window.innerWidth - 40, 800);
            const containerWidth = document.querySelector('.board-container').clientWidth;
            const availableWidth = Math.min(maxWidth, containerWidth);
            
            // 根据可用宽度和棋盘大小计算合适的单元格大小
            const maxCellSize = Math.floor((availableWidth - 40) / boardSize);
            
            if (boardSize > 13) {
                cellSize = Math.max(20, Math.min(30, maxCellSize));
            } else {
                cellSize = Math.max(25, Math.min(35, maxCellSize));
            }
            
            stoneRadius = cellSize * 0.4;
            padding = cellSize;
            
            // 修复：对于围棋，棋盘应该是(boardSize-1)个单元格宽度加上两侧padding
            if (gameMode === 'go') {
                // 围棋棋盘尺寸应为线的数量-1再加padding，因为围棋是在交叉点落子
                canvas.width = (boardSize - 1) * cellSize + padding * 2;
                canvas.height = (boardSize - 1) * cellSize + padding * 2;
            } else {
                // 五子棋是在格子内落子，所以保持原有逻辑
                canvas.width = boardSize * cellSize + padding * 2;
                canvas.height = boardSize * cellSize + padding * 2;
            }
            
            console.log("围棋/五子棋画布尺寸：", canvas.width, "x", canvas.height, "像素");
            console.log("单元格大小：", cellSize, "像素");
        }
        
        drawBoard();
    }

    // 绘制棋盘
    function drawBoard() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (gameMode === 'chess') {
            drawChessBoard();
        } else {
            // 绘制围棋/五子棋棋盘
            
            // 绘制棋盘背景 - 两种棋盘都使用同样的背景色
            ctx.fillStyle = '#dcb35c';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制网格线
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            
            if (gameMode === 'gomoku') {
                // 五子棋棋盘格子内落子
                for (let i = 0; i <= boardSize; i++) {
                    // 水平线
                    ctx.beginPath();
                    ctx.moveTo(padding, padding + i * cellSize);
                    ctx.lineTo(padding + boardSize * cellSize, padding + i * cellSize);
                    ctx.stroke();
                    
                    // 垂直线
                    ctx.beginPath();
                    ctx.moveTo(padding + i * cellSize, padding);
                    ctx.lineTo(padding + i * cellSize, padding + boardSize * cellSize);
                    ctx.stroke();
                }
                
                // 五子棋棋盘标记点
                const centerPoint = Math.floor(boardSize / 2);
                const starPoints = [
                    [centerPoint, centerPoint],
                    [3, 3], 
                    [3, boardSize - 3], 
                    [boardSize - 3, 3], 
                    [boardSize - 3, boardSize - 3]
                ];
                
                for (const [x, y] of starPoints) {
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#000';
                    ctx.fill();
                }
            } else {
                // 围棋在交叉点落子
                for (let i = 0; i < boardSize; i++) {
                    // 水平线
                    ctx.beginPath();
                    ctx.moveTo(padding, padding + i * cellSize);
                    ctx.lineTo(padding + (boardSize - 1) * cellSize, padding + i * cellSize);
                    ctx.stroke();
                    
                    // 垂直线
                    ctx.beginPath();
                    ctx.moveTo(padding + i * cellSize, padding);
                    ctx.lineTo(padding + i * cellSize, padding + (boardSize - 1) * cellSize);
                    ctx.stroke();
                }
                
                // 围棋星位
                let starPoints;
                if (boardSize === 19) {
                    starPoints = [3, 9, 15];
                } else if (boardSize === 13) {
                    starPoints = [3, 6, 9];
                } else if (boardSize === 9) {
                    starPoints = [2, 4, 6];
                }
                
                for (let x of starPoints) {
                    for (let y of starPoints) {
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize, padding + y * cellSize, 3, 0, Math.PI * 2);
                        ctx.fillStyle = '#000';
                        ctx.fill();
                    }
                }
            }
            
            // 绘制棋子
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    if (board[y][x] !== 0) {
                        drawStone(x, y, board[y][x]);
                    }
                }
            }
        }
    }
    
    // 初始化象棋棋盘和棋子
    function initChessBoard() {
        // 清空棋子
        chessPieces = [];
        capturedChessPieces = { black: [], red: [] };
        
        // 初始化象棋棋盘数组 (10x9)
        boardSize = {width: 9, height: 10};
        board = Array(boardSize.height).fill().map(() => Array(boardSize.width).fill(0));
        
        console.log("初始化象棋棋盘，玩家选择:", playerSide === 1 ? "黑方" : "红方");
        
        // 添加红方棋子
        addChessPiece('R_CHARIOT', 0, 9, 2); // 车
        addChessPiece('R_HORSE', 1, 9, 2);   // 马
        addChessPiece('R_ELEPHANT', 2, 9, 2); // 相
        addChessPiece('R_ADVISOR', 3, 9, 2);  // 仕
        addChessPiece('R_KING', 4, 9, 2);     // 帅
        addChessPiece('R_ADVISOR', 5, 9, 2);  // 仕
        addChessPiece('R_ELEPHANT', 6, 9, 2); // 相
        addChessPiece('R_HORSE', 7, 9, 2);   // 马
        addChessPiece('R_CHARIOT', 8, 9, 2); // 车
        addChessPiece('R_CANNON', 1, 7, 2);  // 炮
        addChessPiece('R_CANNON', 7, 7, 2);  // 炮
        addChessPiece('R_PAWN', 0, 6, 2);    // 兵
        addChessPiece('R_PAWN', 2, 6, 2);    // 兵
        addChessPiece('R_PAWN', 4, 6, 2);    // 兵
        addChessPiece('R_PAWN', 6, 6, 2);    // 兵
        addChessPiece('R_PAWN', 8, 6, 2);    // 兵
        
        // 添加黑方棋子
        addChessPiece('B_CHARIOT', 0, 0, 1); // 车
        addChessPiece('B_HORSE', 1, 0, 1);   // 马
        addChessPiece('B_ELEPHANT', 2, 0, 1); // 象
        addChessPiece('B_ADVISOR', 3, 0, 1);  // 士
        addChessPiece('B_KING', 4, 0, 1);     // 将
        addChessPiece('B_ADVISOR', 5, 0, 1);  // 士
        addChessPiece('B_ELEPHANT', 6, 0, 1); // 象
        addChessPiece('B_HORSE', 7, 0, 1);   // 马
        addChessPiece('B_CHARIOT', 8, 0, 1); // 车
        addChessPiece('B_CANNON', 1, 2, 1);  // 炮
        addChessPiece('B_CANNON', 7, 2, 1);  // 炮
        addChessPiece('B_PAWN', 0, 3, 1);    // 卒
        addChessPiece('B_PAWN', 2, 3, 1);    // 卒
        addChessPiece('B_PAWN', 4, 3, 1);    // 卒
        addChessPiece('B_PAWN', 6, 3, 1);    // 卒
        addChessPiece('B_PAWN', 8, 3, 1);    // 卒
        
        // 打印棋子数量，用于调试
        console.log(`初始化完成，红方棋子: ${chessPieces.filter(p => p.player === 2).length}，黑方棋子: ${chessPieces.filter(p => p.player === 1).length}`);
        
        // 更新棋盘数组
        updateChessBoardArray();
        
        // 设置象棋初始玩家为红方（值为2）
        currentPlayer = 2;
        currentPlayerDisplay.textContent = '红';
    }

    // 添加象棋棋子
    function addChessPiece(type, x, y, player) {
        chessPieces.push({
            type: type,
            x: x,
            y: y,
            player: player // 1=黑, 2=红
        });
    }

    // 更新象棋棋盘数组
    function updateChessBoardArray() {
        // 重置棋盘
        for (let y = 0; y < boardSize.height; y++) {
            for (let x = 0; x < boardSize.width; x++) {
                board[y][x] = 0;
            }
        }
        
        // 放置棋子
        for (const piece of chessPieces) {
            board[piece.y][piece.x] = piece.player === 1 ? -1 : 1; // 黑=-1, 红=1
        }
    }

    // 绘制象棋棋盘
    function drawChessBoard() {
        const width = boardSize.width;
        const height = boardSize.height;
        
        // 绘制整个画布背景
        ctx.fillStyle = '#f2d2a9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 计算棋盘绘制的起始坐标，使其居中
        const boardWidth = (width - 1) * cellSize;
        const boardHeight = (height - 1) * cellSize;
        const boardLeft = Math.floor((canvas.width - boardWidth) / 2);
        const boardTop = Math.floor((canvas.height - boardHeight) / 2);
        
        // 存储棋盘位置，供其他函数使用
        const boardPosition = {
            left: boardLeft,
            top: boardTop,
            width: boardWidth,
            height: boardHeight
        };
        
        // 绘制格子线
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        
        // 水平线
        for (let i = 0; i < height; i++) {
            ctx.beginPath();
            ctx.moveTo(boardLeft, boardTop + i * cellSize);
            ctx.lineTo(boardLeft + boardWidth, boardTop + i * cellSize);
            ctx.stroke();
        }
        
        // 垂直线
        for (let i = 0; i < width; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(boardLeft + i * cellSize, boardTop);
            ctx.lineTo(boardLeft + i * cellSize, boardTop + boardHeight);
            ctx.stroke();
        }
        
        // 绘制楚河汉界
        ctx.fillStyle = '#f2d2a9';
        ctx.fillRect(boardLeft, boardTop + 4 * cellSize, boardWidth, cellSize);
        ctx.font = 'bold ' + (cellSize * 0.7) + 'px SimHei, "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 正确绘制楚河汉界（无论视角如何，楚河总是在右侧，汉界总是在左侧）
        ctx.fillText('汉 界', boardLeft + boardWidth / 4, boardTop + 4.5 * cellSize);
        ctx.fillText('楚 河', boardLeft + boardWidth * 3 / 4, boardTop + 4.5 * cellSize);
        
        // 绘制九宫格
        // 上方九宫格
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(boardLeft + 3 * cellSize, boardTop);
        ctx.lineTo(boardLeft + 5 * cellSize, boardTop + 2 * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(boardLeft + 5 * cellSize, boardTop);
        ctx.lineTo(boardLeft + 3 * cellSize, boardTop + 2 * cellSize);
        ctx.stroke();
        
        // 下方九宫格
        ctx.beginPath();
        ctx.moveTo(boardLeft + 3 * cellSize, boardTop + 7 * cellSize);
        ctx.lineTo(boardLeft + 5 * cellSize, boardTop + 9 * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(boardLeft + 5 * cellSize, boardTop + 7 * cellSize);
        ctx.lineTo(boardLeft + 3 * cellSize, boardTop + 9 * cellSize);
        ctx.stroke();
        
        // 绘制棋子
        drawChessPieces(boardPosition);
        
        // 绘制可能的移动位置
        drawPossibleMoves(boardPosition);
        
        // 绘制被吃掉的棋子
        drawCapturedChessPieces(boardPosition);
    }

    // 绘制象棋棋子，考虑棋盘方向
    function drawChessPieces(boardPosition) {
        // 检查棋子数量
        if (chessPieces.length === 0) {
            console.error("棋子数组为空");
            return;
        }
        
        // 确定是否需要翻转棋盘
        const shouldFlip = playerSide === 1; // 如果玩家选择黑方，则需要翻转棋盘
        const boardLeft = boardPosition.left;
        const boardTop = boardPosition.top;
        
        // 先绘制上一步的起始位置标记（如果有）
        if (lastMove) {
            let fromDisplayX = lastMove.fromX;
            let fromDisplayY = lastMove.fromY;
            
            // 如果需要翻转棋盘
            if (shouldFlip) {
                fromDisplayX = 8 - fromDisplayX;
                fromDisplayY = 9 - fromDisplayY;
            }
            
            const fromCenterX = boardLeft + fromDisplayX * cellSize;
            const fromCenterY = boardTop + fromDisplayY * cellSize;
            
            // 绘制白色圆点作为起始位置标记
            ctx.beginPath();
            ctx.arc(fromCenterX, fromCenterY, cellSize * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
        }
        
        // 绘制棋子
        for (const piece of chessPieces) {
            let displayX = piece.x;
            let displayY = piece.y;
            
            // 如果需要翻转棋盘
            if (shouldFlip) {
                displayX = 8 - displayX;
                displayY = 9 - displayY;
            }
            
            const centerX = boardLeft + displayX * cellSize;
            const centerY = boardTop + displayY * cellSize;
            
            // 绘制棋子背景 - 调整棋子大小为单元格的0.45倍
            const pieceRadius = cellSize * 0.45;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pieceRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#f5f5f5';
            ctx.fill();
            
            // 添加阴影效果
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // 加粗棋子边框
            ctx.lineWidth = 3;
            if (piece.player === 1) { // 黑方
                ctx.strokeStyle = '#000';
            } else { // 红方
                ctx.strokeStyle = '#c00';
            }
            ctx.stroke();
            
            // 重置阴影，防止影响文字
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 绘制棋子名称 - 调整字体大小以适应更大的棋子
            ctx.font = 'bold ' + (pieceRadius * 1.3) + 'px SimHei, "Microsoft YaHei", sans-serif';
            if (piece.player === 1) { // 黑方
                ctx.fillStyle = '#000';
            } else { // 红方
                ctx.fillStyle = '#c00';
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(chessPieceTypes[piece.type].name, centerX, centerY);
            
            // 高亮选中的棋子
            if (selectedPiece === piece) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, pieceRadius * 1.05, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // 添加上一步移动棋子的边缘光环效果
            if (lastMovedPiece === piece) {
                // 保存当前上下文状态
                ctx.save();
                
                // 绘制外圈光环
                ctx.beginPath();
                ctx.arc(centerX, centerY, pieceRadius * 1.15, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = pieceRadius * 0.25;
                ctx.stroke();
                
                // 绘制内圈亮边
                ctx.beginPath();
                ctx.arc(centerX, centerY, pieceRadius * 1.03, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = pieceRadius * 0.07;
                ctx.stroke();
                
                // 恢复上下文状态
                ctx.restore();
            }
        }
    }

    // 绘制可能的移动位置，考虑棋盘方向
    function drawPossibleMoves(boardPosition) {
        if (!possibleMoves || possibleMoves.length === 0) return;
        
        // 确定是否需要翻转棋盘
        const shouldFlip = playerSide === 1; // 如果玩家选择黑方，则需要翻转棋盘
        const boardLeft = boardPosition.left;
        const boardTop = boardPosition.top;
        
        for (const move of possibleMoves) {
            let displayX = move.x;
            let displayY = move.y;
            
            // 如果需要翻转棋盘
            if (shouldFlip) {
                displayX = 8 - displayX;
                displayY = 9 - displayY;
            }
            
            const centerX = boardLeft + displayX * cellSize;
            const centerY = boardTop + displayY * cellSize;
            
            // 绘制可能的移动位置
            ctx.beginPath();
            ctx.arc(centerX, centerY, cellSize * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 204, 0, 0.6)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#007700';
            ctx.stroke();
        }
    }

    // 绘制被吃掉的棋子
    function drawCapturedChessPieces(boardPosition) {
        const capturedPieceSize = cellSize * 0.3; // 增大被吃棋子的大小
        const spacing = capturedPieceSize * 2.2; // 增加棋子之间的间距，防止重叠
        
        // 调整为上方和下方的矩形区域
        const boardWidth = boardPosition.width;
        const topAreaY = boardPosition.top - cellSize * 1.2; // 上方区域Y坐标，距离棋盘顶部更远
        const bottomAreaY = boardPosition.top + boardPosition.height + cellSize * 1.2; // 下方区域Y坐标，距离棋盘底部更远
        const startX = boardPosition.left + cellSize * 0.5; // 起始X坐标
        const pieceAreaWidth = boardWidth - cellSize; // 棋子区域宽度
        
        // 计算每行最多可以放置的棋子数量
        const maxPiecesPerRow = Math.floor(pieceAreaWidth / spacing);
        
        // 根据玩家选择的一方，确定对方和我方
        let myPieces, opponentPieces;
        let myColor, opponentColor;
        
        if (playerSide === 2) { // 我方是红方
            myPieces = capturedChessPieces.black; // 我方吃的是黑方棋子
            opponentPieces = capturedChessPieces.red; // 对方吃的是红方棋子
            myColor = '#c00'; // 红色
            opponentColor = '#000'; // 黑色
        } else { // 我方是黑方
            myPieces = capturedChessPieces.red; // 我方吃的是红方棋子
            opponentPieces = capturedChessPieces.black; // 对方吃的是黑方棋子
            myColor = '#000'; // 黑色
            opponentColor = '#c00'; // 红色
        }
        
        // 绘制对方吃掉的棋子（下方区域）
        let currentX = startX;
        let currentY = bottomAreaY;
        let pieceCount = 0;
        
        for (const piece of opponentPieces) {
            // 每行达到最大数量时换行
            if (pieceCount > 0 && pieceCount % maxPiecesPerRow === 0) {
                currentY += spacing;
                currentX = startX;
            }
            
            // 绘制棋子
            ctx.beginPath();
            ctx.arc(currentX, currentY, capturedPieceSize, 0, Math.PI * 2);
            ctx.fillStyle = '#f5f5f5';
            ctx.fill();
            
            ctx.lineWidth = 1;
            ctx.strokeStyle = myColor;
            ctx.stroke();
            
            // 绘制棋子名称
            ctx.font = 'bold ' + (capturedPieceSize * 1.2) + 'px SimHei, "Microsoft YaHei", sans-serif';
            ctx.fillStyle = myColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(chessPieceTypes[piece.type].name, currentX, currentY);
            
            // 更新下一个棋子的位置
            currentX += spacing;
            pieceCount++;
        }
        
        // 绘制我方吃掉的棋子（上方区域）
        currentX = startX;
        currentY = topAreaY;
        pieceCount = 0;
        
        for (const piece of myPieces) {
            // 每行达到最大数量时换行
            if (pieceCount > 0 && pieceCount % maxPiecesPerRow === 0) {
                currentY -= spacing;
                currentX = startX;
            }
            
            // 绘制棋子
            ctx.beginPath();
            ctx.arc(currentX, currentY, capturedPieceSize, 0, Math.PI * 2);
            ctx.fillStyle = '#f5f5f5';
            ctx.fill();
            
            ctx.lineWidth = 1;
            ctx.strokeStyle = opponentColor;
            ctx.stroke();
            
            // 绘制棋子名称
            ctx.font = 'bold ' + (capturedPieceSize * 1.2) + 'px SimHei, "Microsoft YaHei", sans-serif';
            ctx.fillStyle = opponentColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(chessPieceTypes[piece.type].name, currentX, currentY);
            
            // 更新下一个棋子的位置
            currentX += spacing;
            pieceCount++;
        }
    }

    // 绘制棋子
    function drawStone(x, y, player) {
        let centerX, centerY;
        
        if (gameMode === 'gomoku') {
            // 五子棋在格子内落子
            centerX = padding + x * cellSize;
            centerY = padding + y * cellSize;
        } else {
            // 围棋在交叉点落子
            centerX = padding + x * cellSize;
            centerY = padding + y * cellSize;
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, stoneRadius, 0, Math.PI * 2);
        
        if (player === 1) { // 黑子
            ctx.fillStyle = '#000';
            ctx.fill();
        } else { // 白子
            const gradient = ctx.createRadialGradient(
                centerX - stoneRadius / 3, 
                centerY - stoneRadius / 3, 
                stoneRadius / 10, 
                centerX, 
                centerY, 
                stoneRadius
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // 标记最后一手
        if (lastMove && lastMove.x === x && lastMove.y === y) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, stoneRadius / 3, 0, Math.PI * 2);
            ctx.fillStyle = player === 1 ? '#fff' : '#000';
            ctx.fill();
        }
    }

    // 获取鼠标点击在棋盘上的位置
    function getBoardPosition(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        // 移除缩放相关计算，直接使用画布坐标比例
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        // 增加调试信息，帮助排查问题
        console.log("点击/触摸位置:", {clientX, clientY});
        console.log("画布位置:", {left: rect.left, top: rect.top, width: rect.width, height: rect.height});
        console.log("相对坐标:", {x, y});
        
        if (gameMode === 'chess') {
            // 计算棋盘的位置
            const boardWidth = (boardSize.width - 1) * cellSize;
            const boardHeight = (boardSize.height - 1) * cellSize;
            const boardLeft = Math.floor((canvas.width - boardWidth) / 2);
            const boardTop = Math.floor((canvas.height - boardHeight) / 2);
            
            // 将点击坐标转换为棋盘坐标
            let boardX = Math.round((x - boardLeft) / cellSize);
            let boardY = Math.round((y - boardTop) / cellSize);
            
            console.log("象棋坐标转换:", {boardX, boardY, boardLeft, boardTop});
            
            // 确保在有效范围内
            if (boardX < 0) boardX = 0;
            if (boardX > 8) boardX = 8;
            if (boardY < 0) boardY = 0;
            if (boardY > 9) boardY = 9;
            
            // 考虑棋盘翻转的情况
            if (playerSide === 1) { // 黑方视角，需要翻转
                boardX = 8 - boardX;
                boardY = 9 - boardY;
            }
            
            return { x: boardX, y: boardY };
        } else {
            // 围棋和五子棋的位置计算
            let boardX, boardY;
            
            if (gameMode === 'gomoku') {
                // 五子棋在格子交叉点落子
                boardX = Math.round((x - padding) / cellSize);
                boardY = Math.round((y - padding) / cellSize);
            } else {
                // 围棋在格子交叉点落子
                boardX = Math.round((x - padding) / cellSize);
                boardY = Math.round((y - padding) / cellSize);
            }
            
            console.log("围棋/五子棋坐标转换:", {boardX, boardY, padding});
            
            // 检查点击位置是否在有效范围内
            if (boardX >= 0 && boardX < boardSize && boardY >= 0 && boardY < boardSize) {
                return { x: boardX, y: boardY };
            }
        }
        
        return null; // 如果点击在棋盘外，返回null
    }

    // 围棋相关函数 =========================

    // 检查坐标是否合法
    function isValidPosition(x, y) {
        return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
    }

    // 获取一个坐标相邻的所有坐标
    function getNeighbors(x, y) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (isValidPosition(nx, ny)) {
                neighbors.push({x: nx, y: ny});
            }
        }
        
        return neighbors;
    }

    // 查找一个棋子所在的气
    function findLiberties(x, y, visited = new Set()) {
        const key = `${x},${y}`;
        if (visited.has(key)) return [];
        
        visited.add(key);
        const player = board[y][x];
        if (player === 0) return [{x, y}]; // 空位为气
        
        const liberties = [];
        const neighbors = getNeighbors(x, y);
        
        for (const {x: nx, y: ny} of neighbors) {
            if (board[ny][nx] === 0) {
                liberties.push({x: nx, y: ny});
            } else if (board[ny][nx] === player) {
                liberties.push(...findLiberties(nx, ny, visited));
            }
        }
        
        return liberties;
    }

    // 查找一个棋子所在的棋串
    function findGroup(x, y, visited = new Set()) {
        const key = `${x},${y}`;
        if (visited.has(key)) return [];
        
        visited.add(key);
        const player = board[y][x];
        if (player === 0) return []; // 空位不构成棋串
        
        const group = [{x, y}];
        const neighbors = getNeighbors(x, y);
        
        for (const {x: nx, y: ny} of neighbors) {
            if (board[ny][nx] === player) {
                group.push(...findGroup(nx, ny, visited));
            }
        }
        
        return group;
    }

    // 检查落子会不会产生自杀的情况
    function wouldBeSuicide(x, y, player) {
        // 临时落子
        board[y][x] = player;
        
        // 检查落子点所在的棋串
        const group = findGroup(x, y);
        const liberties = new Set();
        
        for (const {x: gx, y: gy} of group) {
            const neighbors = getNeighbors(gx, gy);
            for (const {x: nx, y: ny} of neighbors) {
                if (board[ny][nx] === 0) {
                    liberties.add(`${nx},${ny}`);
                }
            }
        }
        
        // 恢复棋盘
        board[y][x] = 0;
        
        // 如果没有气，则是自杀
        return liberties.size === 0;
    }

    // 检查落子是否会提掉对方棋子
    function wouldCapture(x, y, player) {
        const opponent = player === 1 ? 2 : 1;
        let wouldCapture = false;
        
        // 临时落子
        board[y][x] = player;
        
        // 检查相邻位置是否有对方棋子可以提
        const neighbors = getNeighbors(x, y);
        for (const {x: nx, y: ny} of neighbors) {
            if (board[ny][nx] === opponent) {
                const group = findGroup(nx, ny);
                const hasLiberties = group.some(({x: gx, y: gy}) => {
                    const groupNeighbors = getNeighbors(gx, gy);
                    return groupNeighbors.some(({x: nnx, y: nny}) => board[nny][nnx] === 0);
                });
                
                if (!hasLiberties) {
                    wouldCapture = true;
                    break;
                }
            }
        }
        
        // 恢复棋盘
        board[y][x] = 0;
        
        return wouldCapture;
    }

    // 处理提子
    function captureStones(x, y) {
        const player = board[y][x];
        const opponent = player === 1 ? 2 : 1;
        let captureCount = 0;
        
        const neighbors = getNeighbors(x, y);
        for (const {x: nx, y: ny} of neighbors) {
            if (board[ny][nx] === opponent) {
                // 查找对方棋串
                const group = findGroup(nx, ny);
                
                // 检查是否没有气
                const hasLiberties = group.some(({x: gx, y: gy}) => {
                    const groupNeighbors = getNeighbors(gx, gy);
                    return groupNeighbors.some(({x: nnx, y: nny}) => board[nny][nnx] === 0);
                });
                
                // 如果没有气，提掉整个棋串
                if (!hasLiberties) {
                    for (const {x: gx, y: gy} of group) {
                        board[gy][gx] = 0;
                        captureCount++;
                    }
                }
            }
        }
        
        // 更新提子数
        if (player === 1) {
            captures.black += captureCount;
            blackCapturesDisplay.textContent = captures.black;
        } else {
            captures.white += captureCount;
            whiteCapturesDisplay.textContent = captures.white;
        }
        
        return captureCount;
    }

    // 围棋落子
    function placeGoStone(x, y) {
        if (gameOver || isAIThinking) return false;
        
        // 如果是人机对战模式，只有当轮到玩家时才能落子
        if (playMode === 'pve' && currentPlayer !== playerSide) return false;
        
        if (!isValidMove(x, y)) return false;
        
        board[y][x] = currentPlayer;
        lastMove = {x, y};
        captureStones(x, y);
        consecutivePasses = 0;
        
        // 切换玩家
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑' : '白';
        
        drawBoard();
        
        // 如果是人机对战模式且现在是AI回合
        if (playMode === 'pve' && currentPlayer !== playerSide && !gameOver) {
            makeAIMove();
        }
        
        return true;
    }

    // 检查围棋落子是否合法
    function isValidMove(x, y) {
        // 检查位置是否已被占用
        if (board[y][x] !== 0) return false;
        
        // 检查是否会导致自杀
        if (wouldBeSuicide(x, y, currentPlayer) && !wouldCapture(x, y, currentPlayer)) return false;
        
        return true;
    }

    // 五子棋相关函数 =========================

    // 五子棋落子
    function placeGomokuStone(x, y) {
        if (gameOver || isAIThinking) return false;
        
        // 如果是人机对战模式，只有当轮到玩家时才能落子
        if (playMode === 'pve' && currentPlayer !== playerSide) return false;
        
        if (board[y][x] !== 0) return false;
        
        board[y][x] = currentPlayer;
        lastMove = {x, y};
        
        // 检查是否获胜
        if (checkGomokuWin(x, y)) {
            gameOver = true;
            setTimeout(() => {
                alert((currentPlayer === 1 ? '黑' : '白') + '方获胜！');
            }, 100);
        } else {
            // 切换玩家
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑' : '白';
            
            // 如果是人机对战模式且现在是AI回合
            if (playMode === 'pve' && currentPlayer !== playerSide && !gameOver) {
                makeAIMove();
            }
        }
        
        drawBoard();
        return true;
    }

    // 检查五子棋是否获胜
    function checkGomokuWin(x, y) {
        const player = board[y][x];
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 对角线 \
            [1, -1]   // 对角线 /
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;  // 当前落子点算一个
            
            // 向一个方向查找
            for (let i = 1; i <= 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (!isValidPosition(nx, ny) || board[ny][nx] !== player) break;
                count++;
            }
            
            // 向相反方向查找
            for (let i = 1; i <= 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (!isValidPosition(nx, ny) || board[ny][nx] !== player) break;
                count++;
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }

    // AI相关函数 =========================
    
    // AI移动函数
    function makeAIMove() {
        isAIThinking = true;
        
        // 模拟AI思考时间
        setTimeout(() => {
            if (gameMode === 'go') {
                makeGoAIMove();
            } else if (gameMode === 'gomoku') {
                makeGomokuAIMove();
            } else if (gameMode === 'chess') {
                makeChessAIMove();
            }
            isAIThinking = false;
        }, 500);
    }
    
    // 围棋AI移动
    function makeGoAIMove() {
        // 简单AI策略：随机选择一个合法位置
        const validMoves = [];
        
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (board[y][x] === 0 && !wouldBeSuicide(x, y, currentPlayer)) {
                    validMoves.push({x, y});
                }
            }
        }
        
        if (validMoves.length > 0) {
            // 随机选择一个合法位置
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            const {x, y} = validMoves[randomIndex];
            
            board[y][x] = currentPlayer;
            lastMove = {x, y};
            captureStones(x, y);
            consecutivePasses = 0;
            
            // 切换回玩家
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑' : '白';
            
            drawBoard();
        } else {
            // 如果没有合法位置，则虚着
            pass();
        }
    }
    
    // 五子棋AI移动
    function makeGomokuAIMove() {
        // 简单AI策略：评估每个位置的得分并选择最高分的位置
        let bestScore = -Infinity;
        let bestMove = null;
        
        // 评分函数 - 简单版本
        const evaluatePosition = (x, y, player) => {
            if (board[y][x] !== 0) return -Infinity;
            
            // 临时落子
            board[y][x] = player;
            
            // 检查是否获胜
            if (checkGomokuWin(x, y)) {
                board[y][x] = 0; // 恢复
                return 1000;
            }
            
            let score = 0;
            const directions = [
                [1, 0],   // 水平
                [0, 1],   // 垂直
                [1, 1],   // 对角线 \
                [1, -1]   // 对角线 /
            ];
            
            // 检查每个方向的连子情况
            for (const [dx, dy] of directions) {
                let myCount = 1;
                let opponentCount = 0;
                let openEnds = 0;
                
                // 向一个方向查找
                for (let i = 1; i <= 4; i++) {
                    const nx = x + dx * i;
                    const ny = y + dy * i;
                    if (!isValidPosition(nx, ny)) break;
                    
                    if (board[ny][nx] === player) {
                        myCount++;
                    } else if (board[ny][nx] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                }
                
                // 向相反方向查找
                for (let i = 1; i <= 4; i++) {
                    const nx = x - dx * i;
                    const ny = y - dy * i;
                    if (!isValidPosition(nx, ny)) break;
                    
                    if (board[ny][nx] === player) {
                        myCount++;
                    } else if (board[ny][nx] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                }
                
                // 根据连子数和开口数评分
                if (myCount >= 4 && openEnds >= 1) score += 500; // 四子一开口
                else if (myCount >= 3 && openEnds >= 2) score += 200; // 三子两开口
                else if (myCount >= 3 && openEnds >= 1) score += 50; // 三子一开口
                else if (myCount >= 2 && openEnds >= 2) score += 10; // 二子两开口
                else score += myCount;
                
                // 防守分 - 检查对手是否能在此位置形成威胁
                board[y][x] = player === 1 ? 2 : 1; // 假设对手在此位置落子
                
                myCount = 1;
                openEnds = 0;
                
                // 向一个方向查找
                for (let i = 1; i <= 4; i++) {
                    const nx = x + dx * i;
                    const ny = y + dy * i;
                    if (!isValidPosition(nx, ny)) break;
                    
                    if (board[ny][nx] === (player === 1 ? 2 : 1)) {
                        myCount++;
                    } else if (board[ny][nx] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                }
                
                // 向相反方向查找
                for (let i = 1; i <= 4; i++) {
                    const nx = x - dx * i;
                    const ny = y - dy * i;
                    if (!isValidPosition(nx, ny)) break;
                    
                    if (board[ny][nx] === (player === 1 ? 2 : 1)) {
                        myCount++;
                    } else if (board[ny][nx] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                }
                
                // 对手威胁分数
                if (myCount >= 4 && openEnds >= 1) score += 400; // 阻止对手四子一开口
                else if (myCount >= 3 && openEnds >= 2) score += 300; // 阻止对手三子两开口
                else if (myCount >= 3 && openEnds >= 1) score += 100; // 阻止对手三子一开口
            }
            
            // 恢复棋盘
            board[y][x] = 0;
            
            return score;
        };
        
        // 评估所有可能的位置
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (board[y][x] === 0) {
                    const score = evaluatePosition(x, y, currentPlayer);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = {x, y};
                    }
                }
            }
        }
        
        if (bestMove) {
            const {x, y} = bestMove;
            board[y][x] = currentPlayer;
            lastMove = {x, y};
            
            // 检查是否获胜
            if (checkGomokuWin(x, y)) {
                gameOver = true;
                setTimeout(() => {
                    alert((currentPlayer === 1 ? '黑' : '白') + '方获胜！');
                }, 100);
            }
            
            // 切换回玩家
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑' : '白';
            
            drawBoard();
        }
    }

    // 虚着（围棋专用）
    function pass() {
        if (gameMode !== 'go' || gameOver || isAIThinking) return;
        
        // 如果是人机对战模式，只有当轮到玩家时才能虚着
        if (playMode === 'pve' && currentPlayer !== playerSide) return;
        
        consecutivePasses++;
        lastMove = null;
        
        // 切换玩家
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑' : '白';
        
        // 两次连续虚着结束游戏
        if (consecutivePasses >= 2) {
            gameOver = true;
            setTimeout(() => {
                alert('游戏结束！双方连续虚着。');
            }, 100);
        } else if (playMode === 'pve' && currentPlayer !== playerSide) {
            // 如果是AI回合，让AI行动
            makeAIMove();
        }
        
        drawBoard();
    }

    // 重置游戏
    function resetGame() {
        initBoard();
        
        // 根据游戏类型和玩家选边设置当前玩家
        if (gameMode === 'chess') {
            currentPlayer = 2; // 象棋红方先行（红=2）
            currentPlayerDisplay.textContent = '红';
            // 初始化被吃棋子数组
            capturedChessPieces = { black: [], red: [] };
        } else {
            currentPlayer = 1; // 围棋/五子棋黑方先行
            currentPlayerDisplay.textContent = '黑';
        }
        
        captures = {black: 0, white: 0};
        blackCapturesDisplay.textContent = '0';
        whiteCapturesDisplay.textContent = '0';
        lastMove = null; // 确保清除上一步记录
        lastMovedPiece = null; // 重置上一步移动的棋子记录
        consecutivePasses = 0;
        gameOver = false;
        isAIThinking = false;
        selectedPiece = null;
        possibleMoves = [];
        
        // 如果是人机对战模式且AI先行，则让AI走棋
        if (playMode === 'pve' && playerSide !== currentPlayer) {
            makeAIMove();
        }
        
        drawBoard();
    }

    // 切换游戏模式
    function switchGameMode(mode) {
        gameMode = mode;
        
        if (mode === 'go') {
            goGameBtn.classList.add('active');
            gomokuGameBtn.classList.remove('active');
            if (chessGameBtn) chessGameBtn.classList.remove('active');
            goSettings.style.display = 'block';
            gomokuSettings.style.display = 'none';
            if (chessSettings) chessSettings.style.display = 'none';
            capturesContainer.style.display = 'flex';
            passBtn.style.display = 'inline-block';
            boardSize = parseInt(goBoardSizeSelect.value);
            currentPlayerDisplay.textContent = '黑';
            
            // 默认黑方先行
            playerSide = 1;
                blackBtnGo.classList.add('active');
                whiteBtnGo.classList.remove('active');
        } else if (mode === 'gomoku') {
            goGameBtn.classList.remove('active');
            gomokuGameBtn.classList.add('active');
            if (chessGameBtn) chessGameBtn.classList.remove('active');
            goSettings.style.display = 'none';
            gomokuSettings.style.display = 'block';
            if (chessSettings) chessSettings.style.display = 'none';
            capturesContainer.style.display = 'none';
            passBtn.style.display = 'none';
            boardSize = 15; // 五子棋固定为15×15
            currentPlayerDisplay.textContent = '黑';
            
            // 默认黑方先行
            playerSide = 1;
            blackBtnGomoku.classList.add('active');
            whiteBtnGomoku.classList.remove('active');
        } else { // chess
            goGameBtn.classList.remove('active');
            gomokuGameBtn.classList.remove('active');
            if (chessGameBtn) chessGameBtn.classList.add('active');
            goSettings.style.display = 'none';
            gomokuSettings.style.display = 'none';
            if (chessSettings) chessSettings.style.display = 'block';
            capturesContainer.style.display = 'none';
            passBtn.style.display = 'none';
            currentPlayerDisplay.textContent = '红';
            
            // 默认红方先行
            playerSide = 2;
            if (redBtnChess && blackBtnChess) {
                redBtnChess.classList.add('active');
                blackBtnChess.classList.remove('active');
            }
        }
        
        // 重新绑定选边按钮事件
        attachSideButtonEvents();
        
        resetGame();
        resizeCanvas();
    }
    
    // 切换游戏模式（PVP/PVE）
    function switchPlayMode(mode, gameType) {
        playMode = mode;
        
        if (gameType === 'go') {
            if (mode === 'pvp') {
                pvpBtnGo.classList.add('active');
                pveBtnGo.classList.remove('active');
                // 双人对战模式下隐藏选边选项
                goSettings.querySelector('.side-selection').style.display = 'none';
            } else {
                pvpBtnGo.classList.remove('active');
                pveBtnGo.classList.add('active');
                // 人机对战模式下显示选边选项
                goSettings.querySelector('.side-selection').style.display = 'block';
            }
        } else if (gameType === 'gomoku') {
            if (mode === 'pvp') {
                pvpBtnGomoku.classList.add('active');
                pveBtnGomoku.classList.remove('active');
                // 双人对战模式下隐藏选边选项
                gomokuSettings.querySelector('.side-selection').style.display = 'none';
            } else {
                pvpBtnGomoku.classList.remove('active');
                pveBtnGomoku.classList.add('active');
                // 人机对战模式下显示选边选项
                gomokuSettings.querySelector('.side-selection').style.display = 'block';
            }
        } else if (gameType === 'chess' && pvpBtnChess && pveBtnChess) {
            if (mode === 'pvp') {
                pvpBtnChess.classList.add('active');
                pveBtnChess.classList.remove('active');
                // 双人对战模式下隐藏选边选项
                if (chessSettings && chessSettings.querySelector('.side-selection')) {
                    chessSettings.querySelector('.side-selection').style.display = 'none';
                }
            } else {
                pvpBtnChess.classList.remove('active');
                pveBtnChess.classList.add('active');
                // 人机对战模式下显示选边选项
                if (chessSettings && chessSettings.querySelector('.side-selection')) {
                    chessSettings.querySelector('.side-selection').style.display = 'block';
                }
            }
        }
        
        resetGame();
    }

    // 切换玩家选边
    function switchPlayerSide(side, gameType) {
        console.log(`切换到${gameType}游戏，选择${side === 1 ? '黑' : (side === 2 ? '红' : '白')}方`);
        
        // 保存选择的一方
        playerSide = side;
        
        // 更新按钮状态
        if (gameType === 'go') {
            // 确保获取到了按钮引用
            if (blackBtnGo && whiteBtnGo) {
                if (side === 1) { // 黑方
                    blackBtnGo.classList.add('active');
                    whiteBtnGo.classList.remove('active');
                } else { // 白方
                    blackBtnGo.classList.remove('active');
                    whiteBtnGo.classList.add('active');
                }
            } else {
                console.error('围棋选边按钮未找到');
            }
        } else if (gameType === 'gomoku') {
            // 确保获取到了按钮引用
            if (blackBtnGomoku && whiteBtnGomoku) {
                if (side === 1) { // 黑方
                    blackBtnGomoku.classList.add('active');
                    whiteBtnGomoku.classList.remove('active');
                } else { // 白方
                    blackBtnGomoku.classList.remove('active');
                    whiteBtnGomoku.classList.add('active');
                }
            } else {
                console.error('五子棋选边按钮未找到');
            }
        } else if (gameType === 'chess') {
            // 确保获取到了按钮引用
            if (redBtnChess && blackBtnChess) {
                if (side === 2) { // 红方（注意象棋中红方是2）
                    redBtnChess.classList.add('active');
                    blackBtnChess.classList.remove('active');
                } else { // 黑方
                    redBtnChess.classList.remove('active');
                    blackBtnChess.classList.add('active');
                }
            } else {
                console.error('象棋选边按钮未找到');
            }
        }
        
        // 重置游戏以应用新的选边
        resetGame();
        drawBoard();
    }

    // 事件监听
    canvas.addEventListener('touchstart', (e) => {
        // 单指触摸处理落子
        if (e.touches.length === 1) {
            e.preventDefault(); // 防止触发默认行为
            
            // 获取触摸点的坐标
            const touch = e.touches[0];
            const pos = getBoardPosition(touch.clientX, touch.clientY);
            if (!pos) return;
            
            console.log("触摸事件触发:", pos);
            
            if (gameMode === 'go') {
                placeGoStone(pos.x, pos.y);
            } else if (gameMode === 'gomoku') {
                placeGomokuStone(pos.x, pos.y);
            } else if (gameMode === 'chess') {
                handleChessClick(pos.x, pos.y);
            }
        }
    }, { passive: false });
    
    // 删除touchmove和touchend事件监听器中的缩放处理代码
    
    // 删除鼠标滚轮缩放支持
    
    // 鼠标点击事件处理
    canvas.addEventListener('click', (e) => {
        const pos = getBoardPosition(e.clientX, e.clientY);
        if (!pos) return;
        
        if (gameMode === 'go') {
            placeGoStone(pos.x, pos.y);
        } else if (gameMode === 'gomoku') {
            placeGomokuStone(pos.x, pos.y);
        } else if (gameMode === 'chess') {
            handleChessClick(pos.x, pos.y);
        }
    });

    passBtn.addEventListener('click', pass);
    resetBtn.addEventListener('click', resetGame);
    
    goGameBtn.addEventListener('click', () => switchGameMode('go'));
    gomokuGameBtn.addEventListener('click', () => switchGameMode('gomoku'));
    if (chessGameBtn) {
        chessGameBtn.addEventListener('click', () => switchGameMode('chess'));
    }
    
    goBoardSizeSelect.addEventListener('change', () => {
        boardSize = parseInt(goBoardSizeSelect.value);
        resetGame();
        resizeCanvas();
    });
    
    // 游戏模式切换按钮事件
    pvpBtnGo.addEventListener('click', () => switchPlayMode('pvp', 'go'));
    pveBtnGo.addEventListener('click', () => switchPlayMode('pve', 'go'));
    pvpBtnGomoku.addEventListener('click', () => switchPlayMode('pvp', 'gomoku'));
    pveBtnGomoku.addEventListener('click', () => switchPlayMode('pve', 'gomoku'));
    
    if (pvpBtnChess && pveBtnChess) {
        pvpBtnChess.addEventListener('click', () => switchPlayMode('pvp', 'chess'));
        pveBtnChess.addEventListener('click', () => switchPlayMode('pve', 'chess'));
    }

    // 检查是否可以移动到指定位置（空位或可以吃子）
    function canMoveOrCapture(x, y, player) {
        // 查找该位置是否有棋子
        const piece = chessPieces.find(p => p.x === x && p.y === y);
        
        // 如果没有棋子或者是对方的棋子（可以吃子）
        return !piece || piece.player !== player;
    }

    // 检查是否可以吃指定位置的棋子
    function canCapture(x, y, player) {
        // 查找该位置是否有对方棋子
        const piece = chessPieces.find(p => p.x === x && p.y === y);
        return piece && piece.player !== player;
    }

    // 检查坐标是否合法（为象棋定制）
    function isChessValidPosition(x, y) {
        return x >= 0 && x < boardSize.width && y >= 0 && y < boardSize.height;
    }

    // 象棋AI移动
    function makeChessAIMove() {
        isAIThinking = true;
        
        // 模拟思考时间
        setTimeout(() => {
            const move = findBestChessMove();
            
            if (move) {
                const { piece, toX, toY } = move;
                moveChessPiece(piece, toX, toY);
            }
            
            isAIThinking = false;
        }, 500);
    }

    // 寻找最佳的象棋移动（简单AI）
    function findBestChessMove() {
        const aiPlayer = currentPlayer;
        const allMoves = [];
        
        // 遍历所有己方棋子，找出所有可能的移动
        for (const piece of chessPieces) {
            if (piece.player === aiPlayer) {
                selectedPiece = piece;
                calculatePossibleMoves();
                
                for (const move of possibleMoves) {
                    // 评估每一个可能的移动
                    const moveScore = evaluateChessMove(piece, move.x, move.y);
                    allMoves.push({
                        piece,
                        toX: move.x,
                        toY: move.y,
                        score: moveScore
                    });
                }
            }
        }
        
        // 清除选中状态
        selectedPiece = null;
        possibleMoves = [];
        
        // 根据分数排序，选择最佳移动
        if (allMoves.length > 0) {
            allMoves.sort((a, b) => b.score - a.score);
            return allMoves[0];
        }
        
        return null;
    }

    // 评估象棋移动的分数
    function evaluateChessMove(piece, toX, toY) {
        let score = 0;
        
        // 检查是否可以吃子，如果可以，加上被吃棋子的价值
        const capturedPiece = chessPieces.find(p => p.x === toX && p.y === toY);
        if (capturedPiece) {
            score += chessPieceTypes[capturedPiece.type].value * 2; // 吃子权重加倍
            
            // 如果可以吃对方的将/帅，这是最优先的
            if (capturedPiece.type.includes('KING')) {
                return 100000;
            }
        }
        
        // 简单的位置评估 - 车和炮靠近中路，马靠近对方区域
        if (piece.type.includes('CHARIOT') || piece.type.includes('CANNON')) {
            // 车和炮占据中间列
            if (toX >= 3 && toX <= 5) {
                score += 10;
            }
            
            // 车和炮深入对方区域
            if ((piece.player === 1 && toY > 5) || (piece.player === 2 && toY < 4)) {
                score += 15;
            }
        }
        
        if (piece.type.includes('HORSE')) {
            // 马靠近对方区域
            if ((piece.player === 1 && toY > 4) || (piece.player === 2 && toY < 5)) {
                score += 10;
            }
        }
        
        if (piece.type.includes('PAWN')) {
            // 兵/卒过河
            if ((piece.player === 1 && toY > 4) || (piece.player === 2 && toY < 5)) {
                score += 5;
            }
            
            // 兵/卒靠近对方将/帅
            const kingPos = piece.player === 1 ? 
                chessPieces.find(p => p.type === 'R_KING') : 
                chessPieces.find(p => p.type === 'B_KING');
            
            if (kingPos) {
                const distance = Math.abs(toX - kingPos.x) + Math.abs(toY - kingPos.y);
                score += (10 - distance) * 2; // 越接近对方将/帅越好
            }
        }
        
        // 避免在没有直接好处的情况下将自己的重要棋子暴露在危险中
        if (chessPieceTypes[piece.type].value > 200) {
            // 检查移动后是否会被对方吃掉
            if (isPositionThreatened(toX, toY, piece.player)) {
                score -= chessPieceTypes[piece.type].value;
            }
        }
        
        // 添加随机因素，避免AI总是做出相同的移动
        score += Math.random() * 5;
        
        return score;
    }

    // 检查位置是否被对方威胁
    function isPositionThreatened(x, y, player) {
        const opponentPlayer = player === 1 ? 2 : 1;
        
        for (const piece of chessPieces) {
            if (piece.player === opponentPlayer) {
                // 临时选中对方棋子，计算可能的移动
                const originalSelectedPiece = selectedPiece;
                selectedPiece = piece;
                calculatePossibleMoves();
                
                // 检查是否有移动可以到达目标位置
                const canAttack = possibleMoves.some(move => move.x === x && move.y === y);
                
                if (canAttack) {
                    // 恢复选中状态
                    selectedPiece = originalSelectedPiece;
                    possibleMoves = [];
                    return true;
                }
            }
        }
        
        // 恢复状态
        possibleMoves = [];
        return false;
    }

    // 处理象棋点击事件
    function handleChessClick(x, y) {
        if (gameOver || isAIThinking) return false;
        
        // 如果是人机对战模式，只有当轮到玩家时才能操作
        if (playMode === 'pve' && currentPlayer !== playerSide) return false;
        
        // 查找点击位置是否有棋子
        const clickedPieceIndex = chessPieces.findIndex(piece => 
            piece.x === x && piece.y === y
        );
        
        // 有选中的棋子，检查是否可以移动到点击位置
        if (selectedPiece) {
            const moveIndex = possibleMoves.findIndex(move => 
                move.x === x && move.y === y
            );
            
            // 点击的是可移动的位置
            if (moveIndex !== -1) {
                moveChessPiece(selectedPiece, x, y);
                return true;
            }
            
            // 点击的是自己方的另一个棋子，更换选中棋子
            if (clickedPieceIndex !== -1 && chessPieces[clickedPieceIndex].player === currentPlayer) {
                selectedPiece = chessPieces[clickedPieceIndex];
                calculatePossibleMoves();
                drawBoard();
                return true;
            }
            
            // 点击空白处或对方棋子，取消选中
            selectedPiece = null;
            possibleMoves = [];
            drawBoard();
            return true;
        }
        
        // 没有选中棋子，检查是否点击己方棋子
        if (clickedPieceIndex !== -1 && chessPieces[clickedPieceIndex].player === currentPlayer) {
            selectedPiece = chessPieces[clickedPieceIndex];
            calculatePossibleMoves();
            drawBoard();
            return true;
        }
        
        return false;
    }

    // 移动象棋棋子
    function moveChessPiece(piece, toX, toY) {
        // 记录移动前的位置
        lastMove = {
            fromX: piece.x,
            fromY: piece.y,
            toX: toX,
            toY: toY,
            piece: piece.type
        };
        
        // 检查目标位置是否有对方棋子，如果有则吃掉
        const capturedIndex = chessPieces.findIndex(p => 
            p.x === toX && p.y === toY && p.player !== piece.player
        );
        
        if (capturedIndex !== -1) {
            const capturedPiece = chessPieces[capturedIndex];
            
            // 记录被吃的棋子，注意黑方棋子被红方吃，红方棋子被黑方吃
            if (capturedPiece.player === 1) { // 黑方棋子被吃
                capturedChessPieces.black.push({...capturedPiece});
                console.log("黑方棋子被吃:", chessPieceTypes[capturedPiece.type].name);
            } else { // 红方棋子被吃
                capturedChessPieces.red.push({...capturedPiece});
                console.log("红方棋子被吃:", chessPieceTypes[capturedPiece.type].name);
            }
            
            // 吃掉对方的将/帅，游戏结束
            if (capturedPiece.type.includes('KING')) {
                gameOver = true;
                setTimeout(() => {
                    alert((currentPlayer === 1 ? '黑' : '红') + '方获胜！');
                }, 100);
            }
            
            // 移除被吃的棋子
            chessPieces.splice(capturedIndex, 1);
        }
        
        // 移动棋子
        piece.x = toX;
        piece.y = toY;
        
        // 更新上一步移动的棋子，用于高亮显示
        lastMovedPiece = piece;
        
        // 更新棋盘数组
        updateChessBoardArray();
        
        // 清除选中状态
        selectedPiece = null;
        possibleMoves = [];
        
        // 切换玩家
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑' : '红';
        
        drawBoard();
        
        // 如果是人机对战模式且现在是AI回合
        if (playMode === 'pve' && currentPlayer !== playerSide && !gameOver) {
            makeChessAIMove();
        }
    }

    // 计算象棋可能的移动位置
    function calculatePossibleMoves() {
        possibleMoves = [];
        
        if (!selectedPiece) return;
        
        const piece = selectedPiece;
        const x = piece.x;
        const y = piece.y;
        
        // 根据棋子类型计算不同的移动规则
        switch (piece.type) {
            case 'R_KING':
            case 'B_KING':
                calculateKingMoves(piece);
                break;
            case 'R_ADVISOR':
            case 'B_ADVISOR':
                calculateAdvisorMoves(piece);
                break;
            case 'R_ELEPHANT':
            case 'B_ELEPHANT':
                calculateElephantMoves(piece);
                break;
            case 'R_HORSE':
            case 'B_HORSE':
                calculateHorseMoves(piece);
                break;
            case 'R_CHARIOT':
            case 'B_CHARIOT':
                calculateChariotMoves(piece);
                break;
            case 'R_CANNON':
            case 'B_CANNON':
                calculateCannonMoves(piece);
                break;
            case 'R_PAWN':
            case 'B_PAWN':
                calculatePawnMoves(piece);
                break;
        }
    }

    // 计算将/帅的移动
    function calculateKingMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        // 将/帅只能在九宫格内移动
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // 检查是否在九宫格内
            if (isInPalace(nx, ny, player) && canMoveOrCapture(nx, ny, player)) {
                possibleMoves.push({x: nx, y: ny});
            }
        }
        
        // 将帅对视规则 - 可以直接吃对方的将/帅
        checkKingFacing(piece);
    }

    // 检查是否在九宫格内
    function isInPalace(x, y, player) {
        if (player === 1) { // 黑方
            return x >= 3 && x <= 5 && y >= 0 && y <= 2;
        } else { // 红方
            return x >= 3 && x <= 5 && y >= 7 && y <= 9;
        }
    }

    // 检查将帅是否对视
    function checkKingFacing(piece) {
        const x = piece.x;
        const player = piece.player;
        
        // 查找对方的将/帅
        const opponentKing = chessPieces.find(p => 
            (player === 1 && p.type === 'R_KING') || 
            (player === 2 && p.type === 'B_KING')
        );
        
        if (!opponentKing || opponentKing.x !== x) return;
        
        // 检查两个将/帅之间是否有其他棋子
        const minY = Math.min(piece.y, opponentKing.y);
        const maxY = Math.max(piece.y, opponentKing.y);
        
        let hasPieceBetween = false;
        
        for (let y = minY + 1; y < maxY; y++) {
            if (chessPieces.some(p => p.x === x && p.y === y)) {
                hasPieceBetween = true;
                break;
            }
        }
        
        // 如果没有棋子阻挡，可以直接吃对方的将/帅
        if (!hasPieceBetween) {
            possibleMoves.push({x: opponentKing.x, y: opponentKing.y});
        }
    }

    // 计算士/仕的移动
    function calculateAdvisorMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        // 士/仕只能在九宫格内沿对角线移动
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // 检查是否在九宫格内
            if (isInPalace(nx, ny, player) && canMoveOrCapture(nx, ny, player)) {
                possibleMoves.push({x: nx, y: ny});
            }
        }
    }

    // 计算象/相的移动
    function calculateElephantMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        // 象/相走田字，不能过河
        const directions = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // 检查是否在己方区域且没有被塞象眼
            if (isInOwnTerritory(nx, ny, player) && 
                !isElephantEyeBlocked(x, y, nx, ny) && 
                canMoveOrCapture(nx, ny, player)) {
                possibleMoves.push({x: nx, y: ny});
            }
        }
    }

    // 检查是否在己方领土内（不能过河）
    function isInOwnTerritory(x, y, player) {
        if (player === 1) { // 黑方
            return x >= 0 && x <= 8 && y >= 0 && y <= 4;
        } else { // 红方
            return x >= 0 && x <= 8 && y >= 5 && y <= 9;
        }
    }

    // 检查象眼是否被堵塞
    function isElephantEyeBlocked(fromX, fromY, toX, toY) {
        const eyeX = (fromX + toX) / 2;
        const eyeY = (fromY + toY) / 2;
        
        return chessPieces.some(p => p.x === eyeX && p.y === eyeY);
    }

    // 计算马的移动
    function calculateHorseMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        // 马走日字
        const directions = [
            [1, 2], [2, 1], [2, -1], [1, -2],
            [-1, -2], [-2, -1], [-2, 1], [-1, 2]
        ];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // 检查是否在棋盘内且没有被蹩马腿
            if (isChessValidPosition(nx, ny) && 
                !isHorseLegBlocked(x, y, nx, ny) && 
                canMoveOrCapture(nx, ny, player)) {
                possibleMoves.push({x: nx, y: ny});
            }
        }
    }

    // 检查马腿是否被堵塞
    function isHorseLegBlocked(fromX, fromY, toX, toY) {
        // 确定马腿的位置
        let legX, legY;
        
        if (Math.abs(toX - fromX) === 1) {
            // 马走横日，腿在纵向
            legX = fromX;
            legY = fromY + (toY > fromY ? 1 : -1);
        } else {
            // 马走竖日，腿在横向
            legX = fromX + (toX > fromX ? 1 : -1);
            legY = fromY;
        }
        
        return chessPieces.some(p => p.x === legX && p.y === legY);
    }

    // 计算车的移动
    function calculateChariotMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        // 车走直线
        // 向上
        for (let ny = y - 1; ny >= 0; ny--) {
            if (!canMoveOrCapture(x, ny, player)) break;
            possibleMoves.push({x, y: ny});
            if (isPieceAt(x, ny)) break; // 吃子后停止
        }
        
        // 向下
        for (let ny = y + 1; ny < boardSize.height; ny++) {
            if (!canMoveOrCapture(x, ny, player)) break;
            possibleMoves.push({x, y: ny});
            if (isPieceAt(x, ny)) break; // 吃子后停止
        }
        
        // 向左
        for (let nx = x - 1; nx >= 0; nx--) {
            if (!canMoveOrCapture(nx, y, player)) break;
            possibleMoves.push({x: nx, y});
            if (isPieceAt(nx, y)) break; // 吃子后停止
        }
        
        // 向右
        for (let nx = x + 1; nx < boardSize.width; nx++) {
            if (!canMoveOrCapture(nx, y, player)) break;
            possibleMoves.push({x: nx, y});
            if (isPieceAt(nx, y)) break; // 吃子后停止
        }
    }

    // 计算炮的移动
    function calculateCannonMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        // 炮走直线，但吃子需要隔子
        // 向上
        let hasObstacle = false;
        for (let ny = y - 1; ny >= 0; ny--) {
            if (!hasObstacle) {
                if (!isPieceAt(x, ny)) {
                    possibleMoves.push({x, y: ny});
                } else {
                    hasObstacle = true;
                }
            } else {
                // 隔子后遇到对方棋子可以吃
                if (isPieceAt(x, ny)) {
                    if (canCapture(x, ny, player)) {
                        possibleMoves.push({x, y: ny});
                    }
                    break;
                }
            }
        }
        
        // 向下
        hasObstacle = false;
        for (let ny = y + 1; ny < boardSize.height; ny++) {
            if (!hasObstacle) {
                if (!isPieceAt(x, ny)) {
                    possibleMoves.push({x, y: ny});
                } else {
                    hasObstacle = true;
                }
            } else {
                // 隔子后遇到对方棋子可以吃
                if (isPieceAt(x, ny)) {
                    if (canCapture(x, ny, player)) {
                        possibleMoves.push({x, y: ny});
                    }
                    break;
                }
            }
        }
        
        // 向左
        hasObstacle = false;
        for (let nx = x - 1; nx >= 0; nx--) {
            if (!hasObstacle) {
                if (!isPieceAt(nx, y)) {
                    possibleMoves.push({x: nx, y});
                } else {
                    hasObstacle = true;
                }
            } else {
                // 隔子后遇到对方棋子可以吃
                if (isPieceAt(nx, y)) {
                    if (canCapture(nx, y, player)) {
                        possibleMoves.push({x: nx, y});
                    }
                    break;
                }
            }
        }
        
        // 向右
        hasObstacle = false;
        for (let nx = x + 1; nx < boardSize.width; nx++) {
            if (!hasObstacle) {
                if (!isPieceAt(nx, y)) {
                    possibleMoves.push({x: nx, y});
                } else {
                    hasObstacle = true;
                }
            } else {
                // 隔子后遇到对方棋子可以吃
                if (isPieceAt(nx, y)) {
                    if (canCapture(nx, y, player)) {
                        possibleMoves.push({x: nx, y});
                    }
                    break;
                }
            }
        }
    }

    // 计算兵/卒的移动
    function calculatePawnMoves(piece) {
        const x = piece.x;
        const y = piece.y;
        const player = piece.player;
        
        let directions = [];
        
        if (player === 1) { // 黑方
            directions.push([0, 1]); // 向下
            
            // 过河后可以向左右移动
            if (y > 4) {
                directions.push([1, 0], [-1, 0]);
            }
        } else { // 红方
            directions.push([0, -1]); // 向上
            
            // 过河后可以向左右移动
            if (y < 5) {
                directions.push([1, 0], [-1, 0]);
            }
        }
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (isChessValidPosition(nx, ny) && canMoveOrCapture(nx, ny, player)) {
                possibleMoves.push({x: nx, y: ny});
            }
        }
    }

    // 检查指定位置是否有棋子
    function isPieceAt(x, y) {
        return chessPieces.some(p => p.x === x && p.y === y);
    }

    // 初始化
    initBoard();
    resizeCanvas();
    
    // 添加窗口大小变化事件监听
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // 确保添加选边按钮事件
    function attachSideButtonEvents() {
        console.log('添加选边按钮事件');
        
        // 直接使用内联函数作为事件处理程序
        // 这样避免了变量未定义的问题
        
        // 围棋选边按钮
        blackBtnGo.onclick = () => {
            console.log('切换到围棋黑方');
            switchPlayerSide(1, 'go');
        };
        
        whiteBtnGo.onclick = () => {
            console.log('切换到围棋白方');
            switchPlayerSide(2, 'go');
        };
        
        // 五子棋选边按钮
        blackBtnGomoku.onclick = () => {
            console.log('切换到五子棋黑方');
            switchPlayerSide(1, 'gomoku');
        };
        
        whiteBtnGomoku.onclick = () => {
            console.log('切换到五子棋白方');
            switchPlayerSide(2, 'gomoku');
        };
        
        // 象棋选边按钮
        if (redBtnChess) {
            redBtnChess.onclick = () => {
                console.log('切换到象棋红方');
                switchPlayerSide(2, 'chess');
            };
        }
        
        if (blackBtnChess) {
            blackBtnChess.onclick = () => {
                console.log('切换到象棋黑方');
                switchPlayerSide(1, 'chess');
            };
        }
        
        console.log('选边按钮事件添加完成');
    }

    // 在初始化部分调用事件绑定
    attachSideButtonEvents();

    // 初始化时处理选边选项的显示状态
    // 在DOMContentLoaded事件中添加如下代码
    // 初始化时隐藏双人对战模式下的选边选项
    goSettings.querySelector('.side-selection').style.display = 'none';
    gomokuSettings.querySelector('.side-selection').style.display = 'none';
    if (chessSettings && chessSettings.querySelector('.side-selection')) {
        chessSettings.querySelector('.side-selection').style.display = 'none';
    }
    
    // 调试信息
    console.log("棋类游戏初始化完成，当前模式:", gameMode);
}); 