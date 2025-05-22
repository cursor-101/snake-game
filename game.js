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
let lastVelocityX = 0;
let lastVelocityY = 0;
let directionChanged = false;

// 사과 위치
let appleX;
let appleY;

// 점수
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// 게임 상태
let gameRunning = false;
let gamePaused = false;
let gameOverState = false;

// 애니메이션 프레임 ID
let animationFrameId;

// UI 요소
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');

// 게임 메시지 요소 생성
const messageContainer = document.createElement('div');
messageContainer.className = 'message-container';
messageContainer.style.position = 'absolute';
messageContainer.style.top = '50%';
messageContainer.style.left = '50%';
messageContainer.style.transform = 'translate(-50%, -50%)';
messageContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
messageContainer.style.color = 'white';
messageContainer.style.padding = '20px';
messageContainer.style.borderRadius = '10px';
messageContainer.style.textAlign = 'center';
messageContainer.style.display = 'none';
messageContainer.style.zIndex = '100';
document.querySelector('.game-container').appendChild(messageContainer);

// 게임 초기화 함수
function initGame() {
    // 기존 게임 루프 정리
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    snake = [];
    snakeLength = 1;
    headX = 10;
    headY = 10;
    velocityX = 0;
    velocityY = 0;
    nextVelocityX = 0;
    nextVelocityY = 0;
    lastVelocityX = 0;
    lastVelocityY = 0;
    directionChanged = false;
    score = 0;
    gameOverState = false;
    
    // 메시지 숨기기
    messageContainer.style.display = 'none';
    
    updateScore();
    spawnApple();
    drawGame(); // 초기 상태 그리기
}

// 애플 생성 함수
function spawnApple() {
    // 최대 시도 횟수 설정
    const maxAttempts = 50;
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < maxAttempts) {
        // 랜덤 위치에 애플 생성
        appleX = Math.floor(Math.random() * tileCount);
        appleY = Math.floor(Math.random() * tileCount);
        
        // 뱀의 몸통과 겹치지 않는지 확인
        validPosition = true;
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === appleX && snake[i].y === appleY) {
                validPosition = false;
                break;
            }
        }
        
        attempts++;
    }
    
    // 유효한 위치를 찾지 못한 경우 (뱀이 거의 모든 공간을 차지)
    if (!validPosition) {
        // 격자 전체를 순회하며 비어있는 첫 번째 칸 찾기
        outerLoop:
        for (let y = 0; y < tileCount; y++) {
            for (let x = 0; x < tileCount; x++) {
                let occupied = false;
                for (let i = 0; i < snake.length; i++) {
                    if (snake[i].x === x && snake[i].y === y) {
                        occupied = true;
                        break;
                    }
                }
                if (!occupied) {
                    appleX = x;
                    appleY = y;
                    break outerLoop;
                }
            }
        }
    }
}

// 게임 루프
function gameLoop() {
    if (!gameRunning) return;
    
    // 일정 시간마다 게임 상태 업데이트
    const now = Date.now();
    if (!gamePaused) {
        updateGame();
        drawGame();
        directionChanged = false;
    }
    
    // 다음 프레임 예약
    animationFrameId = setTimeout(() => {
        requestAnimationFrame(gameLoop);
    }, 1000 / speed);
}

// 게임 업데이트
function updateGame() {
    // 다음 프레임에 적용할 방향으로 변경
    velocityX = nextVelocityX;
    velocityY = nextVelocityY;
    
    // 마지막 이동 방향 저장
    lastVelocityX = velocityX;
    lastVelocityY = velocityY;
    
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
            } else if (velocityY === 1) { // 아래쪽을 보는 경우
                eyeX1 = (snake[i].x * gridSize) + 7;
                eyeY1 = (snake[i].y * gridSize) + gridSize - 6;
                eyeX2 = (snake[i].x * gridSize) + gridSize - 7;
                eyeY2 = (snake[i].y * gridSize) + gridSize - 6;
            } else { // 정지 상태 (기본)
                eyeX1 = (snake[i].x * gridSize) + 7;
                eyeY1 = (snake[i].y * gridSize) + 8;
                eyeX2 = (snake[i].x * gridSize) + gridSize - 7;
                eyeY2 = (snake[i].y * gridSize) + 8;
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
    
    // 게임 오버 상태인 경우 메시지 표시
    if (gameOverState) {
        messageContainer.style.display = 'block';
    }
}

// 게임 오버 처리
function gameOver() {
    gameRunning = false;
    gameOverState = true;
    startBtn.textContent = '다시 시작';
    
    // alert 대신 화면에 메시지 표시
    messageContainer.innerHTML = `
        <h2>게임 오버!</h2>
        <p>최종 점수: ${score}</p>
        <p>최고 점수: ${highScore}</p>
        <p>다시 시작하려면 버튼을 클릭하세요</p>
    `;
    messageContainer.style.display = 'block';
}

// 점수 업데이트
function updateScore() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(event) {
    // 게임이 실행 중일 때만 키 입력 처리
    if (!gameRunning || gamePaused) return;
    
    // 방향 전환이 이번 프레임에서 이미 발생했으면 무시
    if (directionChanged) return;
    
    switch(event.key) {
        case 'ArrowUp':
            // 아래로 가고 있지 않을 때만 위로 이동
            if (lastVelocityY !== 1) {
                nextVelocityX = 0;
                nextVelocityY = -1;
                directionChanged = true;
            }
            event.preventDefault();
            break;
        case 'ArrowDown':
            // 위로 가고 있지 않을 때만 아래로 이동
            if (lastVelocityY !== -1) {
                nextVelocityX = 0;
                nextVelocityY = 1;
                directionChanged = true;
            }
            event.preventDefault();
            break;
        case 'ArrowLeft':
            // 오른쪽으로 가고 있지 않을 때만 왼쪽으로 이동
            if (lastVelocityX !== 1) {
                nextVelocityX = -1;
                nextVelocityY = 0;
                directionChanged = true;
            }
            event.preventDefault();
            break;
        case 'ArrowRight':
            // 왼쪽으로 가고 있지 않을 때만 오른쪽으로 이동
            if (lastVelocityX !== -1) {
                nextVelocityX = 1;
                nextVelocityY = 0;
                directionChanged = true;
            }
            event.preventDefault();
            break;
        case ' ':
            // 스페이스바로 게임 일시정지/재개
            gamePaused = !gamePaused;
            
            // 일시정지 메시지 표시/숨김
            if (gamePaused) {
                messageContainer.innerHTML = '<h2>일시정지</h2><p>계속하려면 스페이스바를 누르세요</p>';
                messageContainer.style.display = 'block';
            } else {
                messageContainer.style.display = 'none';
            }
            
            event.preventDefault();
            break;
    }
});

// 모바일 터치 이벤트 추가
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    if (!gameRunning || gamePaused) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, false);

document.addEventListener('touchmove', function(e) {
    if (!gameRunning || gamePaused || directionChanged) return;
    
    e.preventDefault(); // 스크롤 방지
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // 가장 긴 축으로 스와이프 방향 결정
    if (Math.abs(dx) > Math.abs(dy)) {
        // 수평 스와이프
        if (dx > 0 && lastVelocityX !== -1) {
            // 오른쪽으로 스와이프
            nextVelocityX = 1;
            nextVelocityY = 0;
            directionChanged = true;
        } else if (dx < 0 && lastVelocityX !== 1) {
            // 왼쪽으로 스와이프
            nextVelocityX = -1;
            nextVelocityY = 0;
            directionChanged = true;
        }
    } else {
        // 수직 스와이프
        if (dy > 0 && lastVelocityY !== -1) {
            // 아래로 스와이프
            nextVelocityX = 0;
            nextVelocityY = 1;
            directionChanged = true;
        } else if (dy < 0 && lastVelocityY !== 1) {
            // 위로 스와이프
            nextVelocityX = 0;
            nextVelocityY = -1;
            directionChanged = true;
        }
    }
    
    // 새로운 터치 시작점으로 업데이트
    touchStartX = touchEndX;
    touchStartY = touchEndY;
}, { passive: false });

// 시작 버튼 이벤트
startBtn.addEventListener('click', function() {
    if (!gameRunning) {
        gameRunning = true;
        initGame();
        this.textContent = '다시 시작';
        // 첫 시작시 오른쪽으로 이동
        nextVelocityX = 1;
        nextVelocityY = 0;
        lastVelocityX = 1;
        lastVelocityY = 0;
        
        // 게임 루프 시작
        gameLoop();
        
        // 시작 안내 메시지 잠시 표시
        messageContainer.innerHTML = '<h2>시작!</h2><p>방향키로 뱀을 조작하세요</p>';
        messageContainer.style.display = 'block';
        setTimeout(() => {
            if (gameRunning && !gamePaused) {
                messageContainer.style.display = 'none';
            }
        }, 1500);
    } else {
        // 게임 재시작
        initGame();
        nextVelocityX = 1;
        nextVelocityY = 0;
        lastVelocityX = 1;
        lastVelocityY = 0;
        gameLoop();
    }
});

// 창 크기 변경 대응
window.addEventListener('resize', function() {
    drawGame();
});

// 초기 하이스코어 표시
highScoreElement.textContent = highScore;

// 게임 캔버스 그리기
drawGame();