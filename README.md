<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 달력 & ML 학습 파이프라인</title>
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
    #chat-input {
      width: 100%;
      padding: 5px;
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
    #calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-top: 10px;
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
    #speech-bubble {
      position: fixed;
      background: white;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 12px;
      display: none;
      z-index: 30;
      pointer-events: none;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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
  </style>
  
  <!-- Three.js 라이브러리 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <!-- TensorFlow.js 라이브러리 -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest"></script>
  
  <script>
    // 기본 이벤트 차단
    document.addEventListener("contextmenu", event => event.preventDefault());

    // 전역 변수
    let currentCity = "서울";
    let currentWeather = "";

    // TensorFlow.js를 활용한 ML 파이프라인 함수
    async function trainModelWithTFJS(trainingData) {
      // trainingData: [{text: "문장", label: 0}, ...]
      const texts = trainingData.map(d => d.text);
      const labels = trainingData.map(d => d.label);
      
      // 단어 사전 생성 (간단한 소문자화, 특수문자 제거 후 토큰화)
      const vocab = {"<PAD>": 0, "<UNK>": 1};
      let vocabSize = 2;
      texts.forEach(text => {
        const tokens = text.toLowerCase().replace(/[^0-9a-z가-힣\s]/g, "").split(/\s+/);
        tokens.forEach(token => {
          if (token && !(token in vocab)) {
            vocab[token] = vocabSize++;
          }
        });
      });
      
      // 최대 길이 설정 및 시퀀스 변환
      const maxLen = 10;
      function textToSeq(text) {
        const tokens = text.toLowerCase().replace(/[^0-9a-z가-힣\s]/g, "").split(/\s+/);
        let seq = tokens.map(token => vocab[token] || vocab["<UNK>"]);
        if (seq.length < maxLen) {
          seq = seq.concat(Array(maxLen - seq.length).fill(vocab["<PAD>"]));
        } else {
          seq = seq.slice(0, maxLen);
        }
        return seq;
      }
      const xs = texts.map(text => textToSeq(text));
      
      // label은 정수값으로 가정 (예: 0, 1, 2, ...)
      const numClasses = Math.max(...labels) + 1;
      
      // 텐서 생성
      const xsTensor = tf.tensor2d(xs, [xs.length, maxLen], 'int32');
      const ysTensor = tf.tensor1d(labels, 'int32');
      const ysOneHot = tf.oneHot(ysTensor, numClasses);
      
      // 모델 정의: 임베딩 + 글로벌 평균 풀링 + Dense
      const model = tf.sequential();
      model.add(tf.layers.embedding({inputDim: vocabSize, outputDim: 16, inputLength: maxLen}));
      model.add(tf.layers.globalAveragePooling1d());
      model.add(tf.layers.dense({units: numClasses, activation: 'softmax'}));
      
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      // 모델 학습
      await model.fit(xsTensor, ysOneHot, {
        epochs: 5,
        batchSize: 2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const msg = `Epoch ${epoch+1}: loss=${logs.loss.toFixed(3)}, acc=${logs.acc.toFixed(3)}`;
            console.log(msg);
            showSpeechBubbleInChunks(msg, 2000);
          }
        }
      });
      
      showSpeechBubbleInChunks("모델 학습 완료!", 3000);
    }
    
    // 더미 데이터 (실제 데이터셋으로 대체 가능)
    const dummyTrainingData = [
      {text: "오늘 너무 기분이 좋아", label: 0},
      {text: "정말 슬픈 일이 있었어", label: 1},
      {text: "짜증나는 하루였어", label: 2},
      {text: "놀라운 소식이야", label: 3},
      {text: "행복한 날이야", label: 0},
      {text: "불안하고 초조해", label: 1}
    ];
    
    // 채팅 입력 처리 함수 (GPT처럼 능동적 응답)
    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (!input) return;
      let response = "";
      const lowerInput = input.toLowerCase();
      
      // 관련 키워드가 포함되었는지 확인 (다중 키워드)
      if (lowerInput.includes("학습 시작") || 
          lowerInput.includes("학습 모델학습") || 
          lowerInput.includes("학습해줘")) {
        response = "알겠습니다! 지금부터 데이터를 분석하고, 모델을 학습하도록 하겠습니다. 잠시만 기다려 주세요.";
        showSpeechBubbleInChunks(response);
        await trainModelWithTFJS(dummyTrainingData);
      } else {
        // 그 외 일반 채팅 처리
        response = "채팅: " + input;
        showSpeechBubbleInChunks(response);
      }
      
      inputEl.value = "";
    }
    
    // Three.js 3D 씬 초기화
    let scene, camera, renderer;
    function initThree() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.position.set(5, 5, 10);
      camera.lookAt(0, 0, 0);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7).normalize();
      scene.add(directionalLight);
      scene.add(new THREE.AmbientLight(0x333333));
      
      // 간단한 바닥 메쉬
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(400,400, 32,32),
                                   new THREE.MeshStandardMaterial({color: 0x808080, roughness: 1}));
      floor.rotation.x = -Math.PI/2;
      floor.position.y = -2;
      scene.add(floor);
    }
    
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      updateBubblePosition();
    }
    
    // 말풍선 위치 업데이트 (여기서는 고정 위치로 처리)
    function updateBubblePosition() {
      const bubble = document.getElementById("speech-bubble");
      bubble.style.left = "50px";
      bubble.style.top = "50px";
    }
    
    // 말풍선에 텍스트 출력 (간단 버전)
    function showSpeechBubbleInChunks(text, delay=3000) {
      const bubble = document.getElementById("speech-bubble");
      bubble.textContent = text;
      bubble.style.display = "block";
      setTimeout(() => {
        bubble.style.display = "none";
      }, delay);
    }
    
    // 간단한 달력 구현
    let currentYear, currentMonth;
    function initCalendar() {
      const now = new Date();
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
      renderCalendar(currentYear, currentMonth);
    }
    function renderCalendar(year, month) {
      const grid = document.getElementById("calendar-grid");
      grid.innerHTML = "";
      const daysInMonth = new Date(year, month+1, 0).getDate();
      for(let d = 1; d <= daysInMonth; d++){
        const cell = document.createElement("div");
        cell.innerHTML = `<div class="day-number">${d}</div>`;
        cell.addEventListener("click", () => {
          const eventText = prompt(`${year}-${month+1}-${d} 일정 입력:`);
          if(eventText) {
            alert(`${year}-${month+1}-${d} 일정: ${eventText}`);
          }
        });
        grid.appendChild(cell);
      }
    }
    
    // 초기화 및 이벤트 리스너 등록
    window.addEventListener("DOMContentLoaded", function() {
      document.getElementById("chat-input").addEventListener("keydown", function(e) {
        if(e.key === "Enter") sendChat();
      });
      initThree();
      initCalendar();
      animate();
    });
    
    // 창 크기 변경 대응
    window.addEventListener("resize", function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</head>
<body>
  <!-- 오른쪽 HUD: 채팅창 -->
  <div id="right-hud">
    <h3>채팅창</h3>
    <input type="text" id="chat-input" placeholder="채팅 입력... (예: 학습 시작)" />
  </div>
  <!-- 왼쪽 HUD: 달력 -->
  <div id="left-hud">
    <h3>캘린더</h3>
    <div id="calendar-grid"></div>
  </div>
  <!-- 말풍선 -->
  <div id="speech-bubble"></div>
  <!-- Three.js 캔버스 -->
  <canvas id="canvas"></canvas>
</body>
</html>
