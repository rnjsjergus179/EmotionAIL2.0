
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 달력 & 감정 학습</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    
    #right-hud {
      position: fixed;
      top: 10%;
      right: 1%;
      width: 20%;
      padding: 1%;
      background: rgba(255,255,255,0.8);
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 20;
    }
    #region-select {
      width: 100%;
      padding: 5px;
      font-size: 14px;
      margin-bottom: 10px;
    }
    #chat-input-area {
      display: flex;
      margin-top: 10px;
    }
    #chat-input {
      flex: 1;
      padding: 5px;
      font-size: 14px;
    }
    #file-upload {
      margin-top: 10px;
      font-size: 14px;
    }
    
    #left-hud {
      position: fixed;
      top: 10%;
      left: 1%;
      width: 20%;
      padding: 1%;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #00ffcc;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0, 255, 204, 0.5);
      z-index: 20;
      max-height: 80vh;
      overflow-y: auto;
      color: #00ffcc;
    }
    #left-hud h3 { 
      margin-bottom: 5px; 
      text-shadow: 0 0 5px #00ffcc;
    }
    #calendar-container { margin-top: 10px; }
    #calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    #calendar-header button { 
      padding: 2px 6px; 
      font-size: 12px; 
      cursor: pointer; 
      background: #00ffcc; 
      color: #000; 
      border: none; 
      border-radius: 3px; 
      box-shadow: 0 0 5px #00ffcc; 
      transition: all 0.3s; 
    }
    #calendar-header button:hover { 
      background: #00cc99; 
      box-shadow: 0 0 10px #00ffcc; 
    }
    #month-year-label { 
      font-weight: bold; 
      font-size: 14px; 
      text-shadow: 0 0 5px #00ffcc; 
    }
    #year-select { 
      font-size: 12px; 
      padding: 2px; 
      margin-left: 5px; 
      background: #333; 
      color: #00ffcc; 
      border: 1px solid #00ffcc; 
      border-radius: 3px; 
    }
    #calendar-actions {
      margin-top: 5px;
      text-align: center;
    }
    #calendar-actions button {
      margin: 2px;
      padding: 5px 8px;
      font-size: 12px;
      cursor: pointer;
      background: #00ffcc;
      color: #000;
      border: none;
      border-radius: 3px;
      box-shadow: 0 0 5px #00ffcc;
      transition: all 0.3s;
    }
    #calendar-actions button:hover {
      background: #00cc99;
      box-shadow: 0 0 10px #00ffcc;
    }
    #calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    #calendar-grid div {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #00ffcc;
      border-radius: 4px;
      min-height: 25px;
      font-size: 10px;
      padding: 2px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s;
    }
    #calendar-grid div:hover { 
      background: rgba(0, 255, 204, 0.3);
      box-shadow: 0 0 5px #00ffcc; 
    }
    .day-number {
      position: absolute;
      top: 2px;
      left: 2px;
      font-weight: bold;
      font-size: 10px;
      color: #00ffcc;
      text-shadow: 0 0 3px #00ffcc;
    }
    .event {
      margin-top: 14px;
      font-size: 8px;
      color: #00ffcc;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-shadow: 0 0 3px #00ffcc;
    }
    
    #canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      display: block;
    }
    #speech-bubble {
      position: fixed;
      background: white;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 12px;
      display: none;
      z-index: 30;
      white-space: pre-line;
      pointer-events: none;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    #hud-3 {
      position: fixed;
      top: 70%;
      right: 1%;
      width: 20%;
      height: 20%;
      padding: 1%;
      background: rgba(255,255,255,0.9);
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 20;
      overflow: hidden;
    }
    
    @media (max-width: 480px) {
      #right-hud, #left-hud, #hud-3 { width: 90%; left: 5%; right: 5%; top: 5%; }
    }
  </style>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  
  <script>
    let currentCity = "서울";
    let currentWeather = "";
    let wordFrequencies = {}; // 학습된 단어 빈도 저장
    
    // 감정 키워드와 반응 매핑
    let emotionMap = {
      "안녕": "👋 안녕!",
      "반갑": "🤗 반갑습니다!",
      "뭐해": "🤔 나? 지금 너랑 대화 중이야!",
      "기쁘": "🎉 나도 기뻐!",
      "좋아": "😊 좋아, 나도 좋아!",
      "슬프": "😢 슬프구나... 괜찮아?",
      "화나": "😡 화났어? 진정해...",
      "사랑": "💕 나도 사랑해!"
    };

    // 텍스트 전처리: 토큰화 및 정제
    function tokenizeAndClean(text) {
      text = text.toLowerCase()
                 .replace(/[^\w\s가-힣]/g, '')
                 .replace(/\s+/g, ' ')
                 .trim();
      return text.split(' ').filter(token => token.length > 0);
    }

    // 학습 모델: 단어 빈도 기반 학습
    function trainModel(data) {
      let tokens = [];
      if (typeof data === 'string') {
        tokens = tokenizeAndClean(data);
      } else if (typeof data === 'object') {
        for (let date in data) {
          tokens = tokens.concat(tokenizeAndClean(data[date]));
        }
      }

      if (tokens.length === 0) return "학습할 데이터가 없습니다.";

      tokens.forEach(token => {
        wordFrequencies[token] = (wordFrequencies[token] || 0) + 0.01;
      });

      const newKeywords = Object.keys(wordFrequencies)
        .filter(word => wordFrequencies[word] > 0.02 && !emotionMap[word])
        .sort((a, b) => wordFrequencies[b] - wordFrequencies[a])
        .slice(0, 3);

      newKeywords.forEach(word => {
        if (!emotionMap[word]) {
          emotionMap[word] = `😀 ${word}이(가) 자주 나왔네요!`;
        }
      });

      return newKeywords.length > 0 ? `새로운 키워드 학습: ${newKeywords.join(', ')}` : "새로운 키워드 없음";
    }

    // 감정 인식 및 반응 생성
    function respondToEmotion(input) {
      const tokens = tokenizeAndClean(input);
      for (let token of tokens) {
        for (let keyword in emotionMap) {
          if (token.includes(keyword)) {
            return emotionMap[keyword];
          }
        }
      }
      return "🤔 잘 이해하지 못했어요. 다시 말해줄래요?";
    }

    // 채팅 전송 처리
    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (!input) return;

      let response = "";
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes("안녕")) {
        response = "안녕하세요, 주인님! 오늘 기분이 어떠신가요?";
        characterGroup.children[7].rotation.z = Math.PI / 4;
        setTimeout(() => { characterGroup.children[7].rotation.z = 0; }, 1000);
      } else if (lowerInput.includes("기분") && lowerInput.includes("좋아")) {
        response = "정말요!? 저도 정말 기분 좋아요😁";
        leftEye.material.color.set(0xffff00);
        rightEye.material.color.set(0xffff00);
        setTimeout(() => {
          leftEye.material.color.set(0x000000);
          rightEye.material.color.set(0x000000);
        }, 500);
      } else if (lowerInput.includes("춤")) {
        response = "춤추겠습니다! 잠시만 기다려 주세요.";
        const danceInterval = setInterval(() => {
          characterGroup.children[7].rotation.z = Math.sin(Date.now() * 0.01) * Math.PI / 4;
        }, 50);
        setTimeout(() => {
          clearInterval(danceInterval);
          characterGroup.children[7].rotation.z = 0;
        }, 3000);
      } else {
        const trainResult = trainModel(input);
        const emotionResponse = respondToEmotion(input);
        response = `${trainResult}\n${emotionResponse}`;
      }

      showSpeechBubble(response);
      inputEl.value = "";
    }

    // 파일 업로드 처리
    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const content = e.target.result;
        let data = content;
        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        }
        const result = trainModel(data);
        showSpeechBubble(result);
      };
      reader.readAsText(file);
    }

    // 말풍선 표시
    function showSpeechBubble(text) {
      const bubble = document.getElementById("speech-bubble");
      bubble.textContent = text;
      bubble.style.display = "block";
      setTimeout(() => { bubble.style.display = "none"; }, 3000);
    }

    window.addEventListener("DOMContentLoaded", function() {
      document.getElementById("chat-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") sendChat();
      });
      document.getElementById("file-upload").addEventListener("change", handleFileUpload);
    });
  </script>
</head>
<body>
  <div id="right-hud">
    <h3>채팅창</h3>
    <div id="chat-input-area">
      <input type="text" id="chat-input" placeholder="채팅 입력..." />
    </div>
    <input type="file" id="file-upload" accept=".txt,.json" />
  </div>
  
  <div id="left-hud">
    <h3>캘린더</h3>
    <div id="calendar-container">
      <div id="calendar-header">
        <button id="prev-month">◀</button>
        <span id="month-year-label"></span>
        <button id="next-month">▶</button>
      </div>
      <div id="calendar-grid"></div>
    </div>
  </div>
  
  <div id="speech-bubble"></div>
  
  <canvas id="canvas"></canvas>
  
  <script>
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
    
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x333333));
    
    const characterGroup = new THREE.Group();
    const charBody = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5),
                                    new THREE.MeshStandardMaterial({ color: 0x00cc66 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32),
                                new THREE.MeshStandardMaterial({ color: 0xffcc66 }));
    head.position.y = 1.2;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
    leftEye.position.set(-0.2, 1.3, 0.45);
    rightEye.position.set(0.2, 1.3, 0.45);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05),
                                 new THREE.MeshStandardMaterial({ color: 0xff3366 }));
    mouth.position.set(0, 1.1, 0.51);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
    leftArm.position.set(-0.7, 0.4, 0);
    rightArm.position.set(0.7, 0.4, 0);
    characterGroup.add(charBody, head, leftEye, rightEye, mouth, leftArm, rightArm);
    characterGroup.position.y = -1;
    scene.add(characterGroup);
    
    function animate() {
      requestAnimationFrame(animate);
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      const screenPos = headWorldPos.project(camera);
      const bubble = document.getElementById("speech-bubble");
      bubble.style.left = ((screenPos.x * 0.5 + 0.5) * window.innerWidth) + "px";
      bubble.style.top = ((1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight - 50) + "px";
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>
