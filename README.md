<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 캘린더, 음성 채팅 & 말풍선</title>
  <style>
    /* 스타일은 기존과 동일하므로 생략 */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    #right-hud { position: fixed; top: 10%; right: 1%; width: 20%; padding: 1%; background: rgba(255,255,255,0.8); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 20; }
    #region-select { width: 100%; padding: 5px; font-size: 14px; margin-bottom: 10px; }
    #chat-log { display: none; height: 100px; overflow-y: scroll; border: 1px solid #ccc; padding: 5px; margin-top: 10px; border-radius: 3px; background: #fff; }
    #chat-input-area { display: flex; margin-top: 10px; }
    #chat-input { flex: 1; padding: 5px; font-size: 14px; }
    #hud-6 { position: fixed; top: 45%; right: 1%; width: 20%; padding: 5px; background: rgba(255,255,255,0.95); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 25; text-align: center; }
    #hud-6 button { padding: 8px 12px; font-size: 14px; border: none; border-radius: 4px; background: #00ffcc; color: #000; cursor: pointer; transition: background 0.3s; }
    #hud-6 button:hover { background: #00cc99; }
    #left-hud { position: fixed; top: 10%; left: 1%; width: 20%; padding: 1%; background: rgba(0, 0, 0, 0.7); border: 2px solid #00ffcc; border-radius: 10px; box-shadow: 0 0 15px rgba(0,255,204,0.5); z-index: 20; max-height: 80vh; overflow-y: auto; color: #00ffcc; }
    #left-hud h3 { margin-bottom: 5px; text-shadow: 0 0 5px #00ffcc; }
    #calendar-container { margin-top: 10px; }
    #calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
    #calendar-header button { padding: 2px 6px; font-size: 12px; cursor: pointer; background: #00ffcc; color: #000; border: none; border-radius: 3px; box-shadow: 0 0 5px #00ffcc; transition: all 0.3s; }
    #calendar-header button:hover { background: #00cc99; box-shadow: 0 0 10px #00ffcc; }
    #month-year-label { font-weight: bold; font-size: 14px; text-shadow: 0 0 5px #00ffcc; }
    #year-select { font-size: 12px; padding: 2px; margin-left: 5px; background: #333; color: #00ffcc; border: 1px solid #00ffcc; border-radius: 3px; }
    #calendar-actions { margin-top: 5px; text-align: center; }
    #calendar-actions button { margin: 2px; padding: 5px 8px; font-size: 12px; cursor: pointer; background: #00ffcc; color: #000; border: none; border-radius: 3px; box-shadow: 0 0 5px #00ffcc; transition: all 0.3s; }
    #calendar-actions button:hover { background: #00cc99; box-shadow: 0 0 10px #00ffcc; }
    #calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    #calendar-grid div { background: rgba(255,255,255,0.1); border: 1px solid #00ffcc; border-radius: 4px; min-height: 25px; font-size: 10px; padding: 2px; position: relative; cursor: pointer; transition: all 0.3s; }
    #calendar-grid div:hover { background: rgba(0,255,204,0.3); box-shadow: 0 0 5px #00ffcc; }
    .day-number { position: absolute; top: 2px; left: 2px; font-weight: bold; font-size: 10px; color: #00ffcc; text-shadow: 0 0 3px #00ffcc; }
    .event { margin-top: 14px; font-size: 8px; color: #00ffcc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 0 3px #00ffcc; }
    #hud-7 { position: fixed; bottom: 0; left: 0; width: 100%; height: 30px; background: rgba(0, 0, 0, 0.8); color: #00ffcc; text-align: center; line-height: 30px; font-size: 14px; z-index: 50; box-shadow: 0 -2px 5px rgba(0,255,204,0.3); }
    #canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; display: block; }
    #speech-bubble { position: fixed; background: white; padding: 5px 10px; border-radius: 10px; font-size: 12px; display: none; z-index: 30; white-space: pre-line; pointer-events: none; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    #hud-3 { position: fixed; top: 70%; right: 1%; width: 20%; height: 20%; padding: 1%; background: rgba(255,255,255,0.9); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 20; overflow: hidden; }
    @media (max-width: 480px) { #right-hud, #left-hud, #hud-3, #hud-6 { width: 90%; left: 5%; right: 5%; top: 5%; } }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script>
    // 키워드와 URL 매핑 객체
    const SITE_LINKS = {
      "구글": "https://www.google.com",
      "빙": "https://www.bing.com",
      "네이버": "https://www.naver.com",
      "다음": "https://www.daum.net",
      "유튜브": "https://www.youtube.com",
      "넷플릭스": "https://www.netflix.com",
      "트위치": "https://www.twitch.tv",
      "틱톡": "https://www.tiktok.com",
      "인스타": "https://www.instagram.com",
      "페이스북": "https://www.facebook.com",
      "트위터": "https://x.com",
      "링크드인": "https://www.linkedin.com",
      "레딧": "https://www.reddit.com",
      "아마존": "https://www.amazon.com",
      "쿠팡": "https://www.coupang.com",
      "11번가": "https://www.11st.co.kr",
      "지마켓": "https://www.gmarket.co.kr",
      "bbc": "https://www.bbc.com",
      "cnn": "https://edition.cnn.com",
      "ytn": "https://www.ytn.co.kr",
      "연합뉴스": "https://www.yna.co.kr",
      "깃허브": "https://github.com",
      "스택오버플로우": "https://stackoverflow.com",
      "mdn": "https://developer.mozilla.org",
      "스포티파이": "https://www.spotify.com",
      "멜론": "https://www.melon.com",
      "벅스": "https://music.bugs.co.kr",
      "imdb": "https://www.imdb.com",
      "유데미": "https://www.udemy.com",
      "코세라": "https://www.coursera.org",
      "칸아카데미": "https://www.khanacademy.org",
      "위키피디아": "https://www.wikipedia.org",
      "네이버지도": "https://map.naver.com",
      "구글맵": "https://www.google.com/maps"
    };

    /* 전역 키워드 객체 (기존 유지) */
    const KEYWORDS = {
      greetings: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네"],
      sleep: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
      weather: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
      calendar: ["일정 알려줘"],
      time: ["시간 알려줘"],
      delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"]
    };

    /* 전역 변수 및 기존 함수들 (생략 가능) */
    document.addEventListener("contextmenu", event => event.preventDefault());
    let blockUntil = 0;
    let currentCity = "서울";
    let currentWeather = "";
    const weatherKey = "2caa7fa4a66f2f8d150f1da93d306261";
    const regionMap = {
      "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
      "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
      "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
      "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
      "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
    };
    const regionList = Object.keys(regionMap);

    // 기존 함수들 (speakText, saveCalendar 등)은 생략하고 핵심만 수정
    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (Date.now() < blockUntil) {
        showSpeechBubbleInChunks("1시간동안 차단됩니다.");
        inputEl.value = "";
        return;
      }
      if (!input) return;
      let response = "";
      const lowerInput = input.toLowerCase();

      // 외부 링크 이동 로직 추가
      for (let keyword in SITE_LINKS) {
        if (lowerInput.includes(keyword)) {
          response = `${keyword} 사이트로 이동할게요! 잠시만 기다려 주세요.`;
          showSpeechBubbleInChunks(response);
          setTimeout(() => { window.location.href = SITE_LINKS[keyword]; }, 2000);
          inputEl.value = "";
          return;
        }
      }

      // 기존 NLP 및 응답 로직 (간략히 유지)
      const nlpResponse = processNLP(input);
      if (nlpResponse) {
        response = nlpResponse;
      } else {
        if (lowerInput.includes("파일 저장해줘") || lowerInput.includes("캘린더 저장해줘")) {
          saveCalendar();
          speakText("캘린더를 저장했습니다.");
          inputEl.value = "";
          return;
        }
        if (lowerInput.startsWith("지역 ")) {
          const newCity = lowerInput.replace("지역", "").trim();
          if (regionList.includes(newCity)) {
            currentCity = newCity;
            document.getElementById("region-select").value = newCity;
            response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
            updateMap();
            await updateWeatherAndEffects();
          } else {
            response = "죄송해요, 그 지역은 지원하지 않아요.";
          }
        }
        if (!response && KEYWORDS.weather.some(keyword => lowerInput.includes(keyword))) {
          await updateWeatherAndEffects();
          inputEl.value = "";
          return;
        }
        if (!response && KEYWORDS.time.some(keyword => lowerInput.includes(keyword))) {
          const now = new Date();
          response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
        }
        if (!response) {
          response = activeSpeech("neutral");
        }
      }

      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }

    // 기존 함수들 (생략된 부분은 그대로 유지)
    function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 3000) {
      const bubble = document.getElementById("speech-bubble");
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      let index = 0;
      function showNextChunk() {
        if (index < chunks.length) {
          bubble.textContent = chunks[index];
          bubble.style.display = "block";
          speakText(chunks[index]);
          index++;
          setTimeout(showNextChunk, delay);
        } else {
          setTimeout(() => { bubble.style.display = "none"; }, 3000);
        }
      }
      showNextChunk();
    }

    // Three.js 및 캘린더 초기화 등 기존 로직은 생략
  </script>
</head>
<body>
  <!-- HTML 구조는 기존과 동일 -->
  <div id="right-hud">
    <h3>채팅창</h3>
    <select id="region-select" onchange="changeRegion(this.value)"></select>
    <div id="chat-input-area">
      <input type="text" id="chat-input" placeholder="채팅 입력..." />
    </div>
  </div>
  <div id="hud-6">
    <button onclick="startSpeechRecognition()">🎤 음성 입력</button>
  </div>
  <div id="hud-3">
    <iframe id="map-iframe" src="https://www.google.com/maps?q=Seoul&output=embed" frameborder="0" style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
  </div>
  <div id="left-hud">
    <h3>캘린더</h3>
    <div id="calendar-container">
      <div id="calendar-header">
        <button id="prev-month">◀</button>
        <span id="month-year-label"></span>
        <button id="next-month">▶</button>
        <select id="year-select"></select>
      </div>
      <div id="calendar-actions">
        <button id="delete-day-event">하루일정 삭제</button>
        <button id="save-calendar">바탕화면 저장</button>
      </div>
      <div id="calendar-grid"></div>
    </div>
  </div>
  <div id="speech-bubble"></div>
  <div id="hud-7">버전 2.0 베타</div>
  <canvas id="canvas"></canvas>
  <!-- Three.js 및 캘린더 스크립트는 생략 -->
</body>
</html>
