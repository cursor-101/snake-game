// 게임 캔버스와 컨텍스트 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 변수 설정
const gridSize = 20; // 격자 크기
const tileCount = canvas.width / gridSize; // 격자 수
let speed = 7; // 게임 속도

// 뱀 초기화
let snake = [];
let snakeLength = 1;

// 뱀 초기 위치
let headX = 10;
let headY = 10;

// 이동 방향
let velocityX = 0;
let velocityY = 0;
let nextVelocityX = 0;
let nextVelocityY = 0;

// 사과 위치
let appleX;
let appleY;

// 점수
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// 게임 상태
let gameRunning = false;
let gamePaused = false;

// UI 요소
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');

// 게임 초기화 함수
function initGame() {
    snake = [];
    snakeLength = 1;
    headX = 10;
    headY = 10;
    velocityX = 0;
    velocityY = 0;
    nextVelocityX = 0;
    nextVelocityY = 0;
    score = 0;
    updateScore();
    spawnApple();
}

// 애플 생성 함수
function spawnApple() {
    // 랜덤 위치에 애플 생성
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
    
    // 뱀의 몸통과 겹치지 않도록 확인
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === appleX && snake[i].y === appleY) {
            spawnApple(); // 겹치면 다시 생성
            break;
        }
    }
}

// 게임 루프
function gameLoop() {
    if (!gameRunning) return;
    
    setTimeout(function() {
        requestAnimationFrame(gameLoop);
        if (!gamePaused) {
            updateGame();
            drawGame();
        }
    }, 1000 / speed);
}

// 게임 업데이트
function updateGame() {
    // 다음 프레임에 적용할 방향으로 변경
    velocityX = nextVelocityX;
    velocityY = nextVelocityY;
    
    // 뱀 머리 이동
    headX += velocityX;
    headY += velocityY;
    
    // 벽에 부딪히면 게임 오버
    if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) {
        gameOver();
        return;
    }
    
    // 뱀 몸통 업데이트
    snake.unshift({x: headX, y: headY}); // 머리 추가
    
    // 사과를 먹었는지 확인
    if (headX === appleX && headY === appleY) {
        snakeLength++;
        score += 10;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
        }
        updateScore();
        spawnApple();
        
        // 뱀 속도 증가 (최대 15)
        if (speed < 15) {
            speed += 0.2;
        }
    }
    
    // 뱀 길이에 맞게 꼬리 제거
    while (snake.length > snakeLength) {
        snake.pop();
    }
    
    // 자기 자신과 충돌 체크
    for (let i = 1; i < snake.length; i++) {
        if (headX === snake[i].x && headY === snake[i].y) {
            gameOver();
            return;
        }
    }
}

// 게임 그리기
function drawGame() {
    // 캔버스 지우기
    ctx.fillStyle = '#e8f5e9'; // 배경색을 연한 녹색으로 변경
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 격자 그리기
    ctx.strokeStyle = '#c8e6c9'; // 연한 녹색 격자선
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // 사과 그리기 - 원형으로 변경
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
        (appleX * gridSize) + gridSize/2, 
        (appleY * gridSize) + gridSize/2, 
        gridSize/2 - 2, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // 사과 꼭지 그리기
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(appleX * gridSize + gridSize/2 - 2, appleY * gridSize + 2, 4, 4);
    
    // 뱀 그리기
    for (let i = 0; i < snake.length; i++) {
        // 뱀 부분 (원형으로 그리기)
        if (i === 0) {
            ctx.fillStyle = '#4CAF50'; // 머리는 녹색
        } else {
            ctx.fillStyle = '#81C784'; // 몸통은 연한 녹색
        }
        
        // 원 그리기
        ctx.beginPath();
        ctx.arc(
            (snake[i].x * gridSize) + gridSize/2, 
            (snake[i].y * gridSize) + gridSize/2, 
            gridSize/2 - 1, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // 머리에 눈 추가
        if (i === 0) {
            // 방향에 따라 눈 위치 조정
            let eyeX1, eyeY1, eyeX2, eyeY2;
            const eyeOffset = gridSize / 4;
            
            if (velocityX === 1) { // 오른쪽을 보는 경우
                eyeX1 = (snake[i].x * gridSize) + gridSize - 6;
                eyeY1 = (snake[i].y * gridSize) + 7;
                eyeX2 = (snake[i].x * gridSize) + gridSize - 6;
                eyeY2 = (snake[i].y * gridSize) + gridSize - 7;
            } else if (velocityX === -1) { // 왼쪽을 보는 경우
                eyeX1 = (snake[i].x * gridSize) + 6;
                eyeY1 = (snake[i].y * gridSize) + 7;
                eyeX2 = (snake[i].x * gridSize) + 6;
                eyeY2 = (snake[i].y * gridSize) + gridSize - 7;
            } else if (velocityY === -1) { // 위쪽을 보는 경우
                eyeX1 = (snake[i].x * gridSize) + 7;
                eyeY1 = (snake[i].y * gridSize) + 6;
                eyeX2 = (snake[i].x * gridSize) + gridSize - 7;
                eyeY2 = (snake[i].y * gridSize) + 6;
            } else { // 아래쪽을 보는 경우 (기본)
                eyeX1 = (snake[i].x * gridSize) + 7;
                eyeY1 = (snake[i].y * gridSize) + gridSize - 6;
                eyeX2 = (snake[i].x * gridSize) + gridSize - 7;
                eyeY2 = (snake[i].y * gridSize) + gridSize - 6;
            }
            
            // 눈 그리기
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 눈동자 그리기
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 게임 오버 처리
function gameOver() {
    gameRunning = false;
    startBtn.textContent = '다시 시작';
    alert(`게임 오버! 최종 점수: ${score}`);
}

// 점수 업데이트
function updateScore() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(event) {
    // 게임이 실행 중일 때만 키 입력 처리
    if (!gameRunning) return;
    
    switch(event.key) {
        case 'ArrowUp':
            // 아래로 가고 있지 않을 때만 위로 이동
            if (velocityY !== 1) {
                nextVelocityX = 0;
                nextVelocityY = -1;
            }
            event.preventDefault();
            break;
        case 'ArrowDown':
            // 위로 가고 있지 않을 때만 아래로 이동
            if (velocityY !== -1) {
                nextVelocityX = 0;
                nextVelocityY = 1;
            }
            event.preventDefault();
            break;
        case 'ArrowLeft':
            // 오른쪽으로 가고 있지 않을 때만 왼쪽으로 이동
            if (velocityX !== 1) {
                nextVelocityX = -1;
                nextVelocityY = 0;
            }
            event.preventDefault();
            break;
        case 'ArrowRight':
            // 왼쪽으로 가고 있지 않을 때만 오른쪽으로 이동
            if (velocityX !== -1) {
                nextVelocityX = 1;
                nextVelocityY = 0;
            }
            event.preventDefault();
            break;
        case ' ':
            // 스페이스바로 게임 일시정지/재개
            gamePaused = !gamePaused;
            event.preventDefault();
            break;
    }
});

// 시작 버튼 이벤트
startBtn.addEventListener('click', function() {
    if (!gameRunning) {
        gameRunning = true;
        initGame();
        this.textContent = '다시 시작';
        // 첫 시작시 오른쪽으로 이동
        nextVelocityX = 1;
        nextVelocityY = 0;
        gameLoop();
    } else {
        // 게임 재시작
        initGame();
        nextVelocityX = 1;
        nextVelocityY = 0;
    }
});

// 초기 하이스코어 표시
highScoreElement.textContent = highScore;

// 게임 캔버스 그리기
drawGame();