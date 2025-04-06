
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D 캐릭터 HUD, 캘린더, 음성 채팅 & 말풍선</title>
  <style>
    /* 기본 스타일 */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    #right-hud {
      position: fixed;
      top: 10%;
      right: 1%;
      width: 20%;
      padding: 1%;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 20;
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
    #speech-bubble {
      position: fixed;
      background: white;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 12px;
      display: none;
      z-index: 30;
      white-space: pre-line;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    #canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
  </style>
  <!-- Three.js 라이브러리 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <!-- spaCy 웹 버전 (가정) -->
  <script src="https://cdn.jsdelivr.net/npm/spacy-web@latest/dist/spacy.min.js"></script>
  <script>
    // spaCy 모델 로드 (가정)
    const nlp = spacy.load('ko_core_news_sm');

    // 의도 매핑
    const intentMap = {
      'weather': ['날씨', '기온', '비', '눈'],
      'map': ['지도', '위치', '길찾기'],
      'news': ['뉴스', '기사', '최신']
    };

    // 음성 출력 함수
    function speakText(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.speak(utterance);
    }

    // 말풍선 표시 함수
    function showSpeechBubble(text) {
      const bubble = document.getElementById("speech-bubble");
      bubble.textContent = text;
      bubble.style.display = "block";
      speakText(text);
      setTimeout(() => { bubble.style.display = "none"; }, 5000);
    }

    // 의도 파악 함수
    function getIntent(text) {
      const doc = nlp(text);
      for (let token of doc) {
        for (let intent in intentMap) {
          if (intentMap[intent].includes(token.text)) {
            return intent;
          }
        }
      }
      return 'general';
    }

    // 응답 생성 함수
    async function generateResponse(intent, text) {
      switch (intent) {
        case 'weather':
          const weather = await fetchWeather();
          return `현재 날씨는 ${weather}입니다.`;
        case 'map':
          return "지도를 보여드릴게요!";
        case 'news':
          const news = await fetchNews();
          return `최신 뉴스: ${news}`;
        default:
          return "무슨 말씀이신지 잘 모르겠어요. 다시 말씀해 주세요.";
      }
    }

    // 날씨 API 호출 (가정)
    async function fetchWeather() {
      // 실제 OpenWeatherMap API 호출 예시 (API 키 필요)
      // const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=YOUR_API_KEY&lang=ko');
      // const data = await response.json();
      // return `${data.weather[0].description}, ${Math.round(data.main.temp - 273.15)}도`;
      return "맑음, 25도"; // 임시 데이터
    }

    // 뉴스 API 호출 (가정)
    async function fetchNews() {
      // 실제 News API 호출 예시 (API 키 필요)
      // const response = await fetch('https://newsapi.org/v2/top-headlines?country=kr&apiKey=YOUR_API_KEY');
      // const data = await response.json();
      // return data.articles[0].title;
      return "오늘의 주요 뉴스입니다."; // 임시 데이터
    }

    // 채팅 처리 함수
    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (!input) return;

      const intent = getIntent(input);
      const response = await generateResponse(intent, input);
      showSpeechBubble(response);
      inputEl.value = "";
    }

    // DOM 로드 후 이벤트 설정
    window.addEventListener("DOMContentLoaded", function() {
      document.getElementById("chat-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") sendChat();
      });
    });

    // Three.js 초기화 및 애니메이션
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 5;

    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
  </script>
</head>
<body>
  <div id="right-hud">
    <h3>채팅창</h3>
    <div id="chat-input-area">
      <input type="text" id="chat-input" placeholder="채팅 입력..." />
    </div>
  </div>
  <div id="speech-bubble"></div>
  <canvas id="canvas"></canvas>
</body>
</html>
