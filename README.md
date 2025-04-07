<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 캘린더, 음성 채팅 & 말풍선</title>
  <style>
    /* 기본 스타일 */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    
    /* 오른쪽 채팅창 HUD */
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
    #chat-log {
      display: none;
      height: 100px;
      overflow-y: scroll;
      border: 1px solid #ccc;
      padding: 5px;
      margin-top: 10px;
      border-radius: 3px;
      background: #fff;
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
    
    /* HUD-6: 음성 입력 영역 */
    #hud-6 {
      position: fixed;
      top: 45%;
      right: 1%;
      width: 20%;
      padding: 5px;
      background: rgba(255,255,255,0.95);
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 25;
      text-align: center;
    }
    #hud-6 button {
      padding: 8px 12px;
      font-size: 14px;
      border: none;
      border-radius: 4px;
      background: #00ffcc;
      color: #000;
      cursor: pointer;
      transition: background 0.3s;
    }
    #hud-6 button:hover {
      background: #00cc99;
    }
    
    /* 왼쪽 캘린더 HUD */
    #left-hud {
      position: fixed;
      top: 10%;
      left: 1%;
      width: 20%;
      padding: 1%;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #00ffcc;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0,255,204,0.5);
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
      background: rgba(255,255,255,0.1);
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
      background: rgba(0,255,204,0.3);
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
    
    /* HUD-7: 버전 정보 바 */
    #hud-7 {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 30px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ffcc;
      text-align: center;
      line-height: 30px;
      font-size: 14px;
      z-index: 50;
      box-shadow: 0 -2px 5px rgba(0,255,204,0.3);
    }
    
    /* 메인 캔버스와 말풍선 */
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
    
    /* 지도 또는 유튜브 영역 */
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
      #right-hud, #left-hud, #hud-3, #hud-6 { width: 90%; left: 5%; right: 5%; top: 5%; }
    }
  </style>
  
  <!-- Three.js 라이브러리 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  
  <script>
    /* 전역 키워드 객체 – 자동완성과 채팅 처리용 */
    const KEYWORDS = {
      greetings: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네"],
      sleep: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
      youtube: ["유튜브", "유트브", "유튜브알려줘", "유튭", "유튜브랑", "유튜브나와줘"],
      twitter: ["트위터", "트위터 보여주게", "트위터 틔위터검색", "트위터보여", "트위터보여줘봐"],
      naver: ["네이버", "네이버 보여줘", "네이버 보여주게", "네이버 검색"],
      weather: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
      calendar: ["일정 알려줘"],
      time: ["시간 알려줘"],
      map: ["지도 보여줘", "교통정보"],
      delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"],
      instagram: ["인스타", "인스타 보여줘", "인스타 나오게", "인스타 검색", "인스타그램"]
    };

    /* 감정 키워드 */
    const EMOTION_KEYWORDS = {
      positive: ["기쁘", "행복", "좋아", "즐거", "최고"],
      negative: ["슬프", "우울", "화난", "짜증", "피곤", "힘들"]
    };

    /* 기억 저장소 초기화 */
    let memory = JSON.parse(localStorage.getItem("chatMemory")) || {};

    /* 전역 변수 */
    document.addEventListener("contextmenu", event => event.preventDefault());
    let blockUntil = 0;
    let currentCity = "서울";
    let currentWeather = "";
    const weatherKey = "2caa7fa4a66f2f8d150f1da93d306261";
    const regionMap = {
      "서울": "Seoul",
      "인천": "Incheon",
      "수원": "Suwon",
      "고양": "Goyang",
      "성남": "Seongnam",
      "용인": "Yongin",
      "부천": "Bucheon",
      "안양": "Anyang",
      "의정부": "Uijeongbu",
      "광명": "Gwangmyeong",
      "안산": "Ansan",
      "파주": "Paju",
      "부산": "Busan",
      "대구": "Daegu",
      "광주": "Gwangju",
      "대전": "Daejeon",
      "울산": "Ulsan",
      "제주": "Jeju",
      "전주": "Jeonju",
      "청주": "Cheongju",
      "포항": "Pohang",
      "여수": "Yeosu",
      "김해": "Gimhae"
    };
    const regionList = Object.keys(regionMap);

    document.addEventListener("copy", function(e) {
      e.preventDefault();
      let selectedText = window.getSelection().toString();
      selectedText = selectedText.replace(/2caa7fa4a66f2f8d150f1da93d306261/g, "HIDDEN");
      e.clipboardData.setData("text/plain", selectedText);
      if (Date.now() < blockUntil) return;
      blockUntil = Date.now() + 3600000;
      showSpeechBubbleInChunks("1시간동안 차단됩니다.");
    });

    /* 음성 출력 함수 */
    function speakText(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }

    /* 캘린더, 파일 저장 관련 함수들 */
    function saveFile() {
      const content = "파일 저장 완료";
      const filename = "saved_file.txt";
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function saveCalendar() {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const calendarData = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${d}`);
        if (eventDiv && eventDiv.textContent.trim() !== "") {
          calendarData[`${currentYear}-${currentMonth + 1}-${d}`] = eventDiv.textContent;
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calendarData, null, 2));
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", "calendar_events.json");
      dlAnchorElem.style.display = "none";
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      document.body.removeChild(dlAnchorElem);
    }

    function deleteCalendarEvent(day) {
      const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${day}`);
      if (eventDiv) {
        eventDiv.textContent = "";
        const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
        delete calendarData[`${currentYear}-${currentMonth + 1}-${day}`];
        localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
        return `${currentYear}-${currentMonth + 1}-${day} 일정이 삭제되었습니다.`;
      } else {
        return "해당 날짜에 일정이 없습니다.";
      }
    }

    function getCalendarEvents(dateStr = null) {
      const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
      if (!Object.keys(calendarData).length) {
        return "저장된 일정이 없습니다. 먼저 캘린더를 저장해주세요.";
      }
      
      if (dateStr) {
        if (calendarData[dateStr]) {
          return `${dateStr}의 일정: ${calendarData[dateStr]}`;
        } else {
          return `${dateStr}에는 일정이 없습니다.`;
        }
      } else {
        const currentMonthStr = `${currentYear}-${currentMonth + 1}`;
        let events = [];
        for (let key in calendarData) {
          if (key.startsWith(currentMonthStr)) {
            events.push(`${key}: ${calendarData[key]}`);
          }
        }
        if (events.length) {
          return `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}`;
        } else {
          return `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
        }
      }
    }

    /* 자연어 처리 함수 */
    function tokenize(input) {
      return input.split(/[\s,.!?]+/).filter(token => token.length > 0);
    }

    function detectIntent(tokens) {
      let intent = "unknown";
      for (let token of tokens) {
        if (KEYWORDS.weather.some(k => token.includes(k))) intent = "weather";
        else if (KEYWORDS.calendar.some(k => token.includes(k))) intent = "calendar";
        else if (KEYWORDS.time.some(k => token.includes(k))) intent = "time";
        else if (KEYWORDS.greetings.some(k => token.includes(k))) intent = "greeting";
        else if (KEYWORDS.sleep.some(k => token.includes(k))) intent = "sleep";
        else if (KEYWORDS.youtube.some(k => token.includes(k))) intent = "youtube";
        else if (KEYWORDS.twitter.some(k => token.includes(k))) intent = "twitter";
        else if (KEYWORDS.naver.some(k => token.includes(k))) intent = "naver";
        else if (KEYWORDS.map.some(k => token.includes(k))) intent = "map";
        else if (KEYWORDS.instagram.some(k => token.includes(k))) intent = "instagram";
        else if (KEYWORDS.delete.some(k => token.includes(k))) intent = "delete";
        else if (token.includes("지역")) intent = "changeRegion";
      }
      return intent;
    }

    function detectEmotion(tokens) {
      for (let token of tokens) {
        if (EMOTION_KEYWORDS.positive.some(k => token.includes(k))) return "positive";
        if (EMOTION_KEYWORDS.negative.some(k => token.includes(k))) return "negative";
      }
      return "neutral";
    }

    /* 기억 저장 및 학습 함수 */
    function saveToMemory(input, response) {
      if (!memory[input]) {
        memory[input] = { response, count: 1 };
      } else {
        memory[input].count += 1;
        memory[input].response = response; // 최신 응답으로 업데이트
      }
      localStorage.setItem("chatMemory", JSON.stringify(memory));
    }

    function getFromMemory(input) {
      return memory[input] ? memory[input].response : null;
    }

    /* 날씨 관련 함수 */
    function updateMap() {
      const englishCity = regionMap[currentCity] || "Seoul";
      document.getElementById("map-iframe").src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
    }

    async function getWeather() {
      try {
        const englishCity = regionMap[currentCity] || "Seoul";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(englishCity)}&appid=${weatherKey}&units=metric&lang=kr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("날씨 API 호출 실패");
        const data = await res.json();
        currentWeather = data.weather[0].description;
        const message = `오늘 ${currentCity}의 날씨는 ${data.weather[0].description}이고, 기온은 ${data.main.temp}°C입니다.`;
        return { message };
      } catch (error) {
        console.error(error);
        currentWeather = "";
        return { message: "날씨 정보를 가져오는데 실패했습니다." };
      }
    }

    function updateWeatherEffects() {
      if (!currentWeather) return;
      if (currentWeather.includes("비") || currentWeather.includes("소나기")) {
        rainGroup.visible = true;
        cloudRainGroup.visible = true;
      } else {
        rainGroup.visible = false;
        cloudRainGroup.visible = false;
      }
      if (currentWeather.includes("구름") || currentWeather.includes("흐림")) {
        houseCloudGroup.visible = true;
      } else {
        houseCloudGroup.visible = false;
      }
    }

    function updateLightning() {
      if (currentWeather.includes("번개") || currentWeather.includes("뇌우")) {
        if (Math.random() < 0.001) {
          lightningLight.intensity = 5;
          setTimeout(() => { lightningLight.intensity = 0; }, 100);
        }
      }
    }

    async function updateWeatherAndEffects(sendMessage = true) {
      const weatherData = await getWeather();
      if (sendMessage) {
        showSpeechBubbleInChunks(weatherData.message);
      }
      updateWeatherEffects();
    }

    function changeRegion(value) {
      currentCity = value;
      updateMap();
      updateWeatherAndEffects();
      const englishCity = regionMap[currentCity] || "Seoul";
      const message = `지역이 ${currentCity} (${englishCity})로 변경되었습니다.`;
      showSpeechBubbleInChunks(message);
    }

    /* 음성 인식 함수 */
    function startSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window)) {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
        return;
      }
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.start();
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim();
        document.getElementById("chat-input").value = transcript;
        sendChat();
      };
      recognition.onerror = function(event) {
        console.error("음성 인식 오류:", event.error);
      };
    }

    /* 대화 처리 함수 */
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
      const tokens = tokenize(lowerInput);
      const intent = detectIntent(tokens);
      const emotion = detectEmotion(tokens);

      // 기억에서 먼저 확인
      const rememberedResponse = getFromMemory(input);
      if (rememberedResponse) {
        response = rememberedResponse;
        showSpeechBubbleInChunks(response);
        inputEl.value = "";
        return;
      }

      if (lowerInput.includes("파일 저장해줘") || lowerInput.includes("캘린더 저장해줘")) {
        saveCalendar();
        speakText("캘린더를 저장했습니다.");
        inputEl.value = "";
        return;
      }

      if (intent === "changeRegion" || lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (newCity) {
          if (regionList.includes(newCity)) {
            currentCity = newCity;
            document.getElementById("region-select").value = newCity;
            response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
            updateMap();
            await updateWeatherAndEffects();
          } else {
            response = "죄송해요, 그 지역은 지원하지 않아요. 드롭다운 메뉴에서 선택해주세요.";
          }
        } else {
          response = "변경할 지역을 입력해 주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        document.getElementById("region-select").value = input;
        response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
        updateMap();
        await updateWeatherAndEffects();
      }

      if (!response && intent === "delete") {
        const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
        if (dayStr) {
          const dayNum = parseInt(dayStr);
          response = deleteCalendarEvent(dayNum);
        } else {
          response = "삭제할 날짜를 입력하지 않으셨습니다.";
        }
      }

      if (!response && intent === "youtube") {
        response = "유튜브를 보여드릴게요! 잠시만 기다려 주세요.";
        showSpeechBubbleInChunks(response);
        setTimeout(() => { window.location.href = "https://www.youtube.com/"; }, 2000);
        inputEl.value = "";
        return;
      }
      if (!response && intent === "twitter") {
        response = "트위터(현재 X)를 보여드릴게요! 잠시만 기다려 주세요.";
        showSpeechBubbleInChunks(response);
        setTimeout(() => { window.location.href = "https://x.com/login?lang=ko"; }, 2000);
        inputEl.value = "";
        return;
      }
      if (!response && intent === "naver") {
        response = "네이버를 보여드릴게요! 잠시만 기다려 주세요.";
        showSpeechBubbleInChunks(response);
        setTimeout(() => { window.location.href = "https://m.naver.com/"; }, 2000);
        inputEl.value = "";
        return;
      }
      if (!response && intent === "greeting") {
        response = "안녕하세요! 만나서 반갑습니다. 오늘 하루 어떠셨나요?";
      }
      if (!response && intent === "sleep") {
        response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
      }
      if (!response && intent === "weather") {
        await updateWeatherAndEffects();
        inputEl.value = "";
        return;
      }
      if (!response && intent === "calendar") {
        const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
        if (dateMatch) {
          const dateStr = dateMatch[0];
          response = getCalendarEvents(dateStr);
        } else {
          response = getCalendarEvents();
        }
      }
      if (!response && intent === "time") {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        response = `현재 시간은 ${hours}시 ${minutes}분입니다.`;
      }
      if (!response && intent === "map") {
        response = "지도를 보여드릴게요!";
        showSpeechBubbleInChunks(response);
        setTimeout(() => { window.location.href = "https://www.google.com/maps"; }, 2000);
        inputEl.value = "";
        return;
      }
      if (!response && intent === "instagram") {
        response = "인스타그램을 보여드릴게요! 잠시만 기다려 주세요.";
        showSpeechBubbleInChunks(response);
        setTimeout(() => { window.location.href = "https://www.instagram.com/"; }, 2000);
        inputEl.value = "";
        return;
      }

      // 감정 기반 응답 또는 학습 기반 응답
      if (!response) {
        if (emotion === "positive") {
          response = `기쁘다니 저도 덩달아 기뻐요! ${tokens.join(" ")}에 대해 더 이야기해 볼까요?`;
        } else if (emotion === "negative") {
          response = `힘들어 보이시네요… ${tokens.join(" ")} 때문에 그런가요? 제가 위로가 될 수 있으면 좋겠어요.`;
        } else {
          response = `${tokens.join(" ")}라니 흥미롭네요. 조금 더 설명해 주시면 제가 더 잘 이해할게요!`;
        }
        // 기억에 저장
        saveToMemory(input, response);
      }

      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }

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

    window.addEventListener("DOMContentLoaded", function() {
      const chatInput = document.getElementById("chat-input");
      chatInput.setAttribute("list", "chat-keywords");
      const autoCompleteList = document.createElement("datalist");
      autoCompleteList.id = "chat-keywords";
      const allKeywords = Object.values(KEYWORDS).flat();
      allKeywords.forEach(kw => {
        const option = document.createElement("option");
        option.value = kw;
        autoCompleteList.appendChild(option);
      });
      document.body.appendChild(autoCompleteList);
      
      document.getElementById("chat-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") sendChat();
      });
      
      const regionSelect = document.getElementById("region-select");
      regionList.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = `${region} (${regionMap[region]})`;
        if (region === currentCity) option.selected = true;
        regionSelect.appendChild(option);
      });
    });

    window.addEventListener("resize", function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("load", async () => {
      initCalendar();
      updateMap();
      await updateWeatherAndEffects();
    });

    let currentYear, currentMonth;
    function initCalendar() {
      const now = new Date();
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
      populateYearSelect();
      renderCalendar(currentYear, currentMonth);
      document.getElementById("prev-month").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
      });
      document.getElementById("next-month").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
      });
      document.getElementById("year-select").addEventListener("change", (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar(currentYear, currentMonth);
      });
      document.getElementById("delete-day-event").addEventListener("click", () => {
        const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
        if (dayStr) {
          const dayNum = parseInt(dayStr);
          const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${dayNum}`);
          if (eventDiv) {
            eventDiv.textContent = "";
            const message = `${currentYear}-${currentMonth + 1}-${dayNum} 일정이 삭제되었습니다. 다시 입력할 수 있습니다.`;
            alert(message);
            speakText(message);
          }
        }
      });
      document.getElementById("save-calendar").addEventListener("click", () => {
        saveCalendar();
        speakText("캘린더를 바탕화면에 저장했습니다.");
      });
    }

    function populateYearSelect() {
      const yearSelect = document.getElementById("year-select");
      yearSelect.innerHTML = "";
      for (let y = 2020; y <= 2070; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
    }

    function renderCalendar(year, month) {
      const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
      document.getElementById("month-year-label").textContent = `${year}년 ${monthNames[month]}`;
      const grid = document.getElementById("calendar-grid");
      grid.innerHTML = "";
      const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
      daysOfWeek.forEach((day) => {
        const th = document.createElement("div");
        th.style.fontWeight = "bold";
        th.style.textAlign = "center";
        th.textContent = day;
        th.style.color = "#00ffcc";
        th.style.textShadow = "0 0 3px #00ffcc";
        grid.appendChild(th);
      });
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement("div"));
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.innerHTML = `<div class="day-number">${d}</div>
                          <div class="event" id="event-${year}-${month + 1}-${d}"></div>`;
        cell.addEventListener("click", () => {
          const eventText = prompt(`${year}-${month + 1}-${d} 일정 입력:`);
          if (eventText) {
            const eventDiv = document.getElementById(`event-${year}-${month + 1}-${d}`);
            if (eventDiv.textContent) {
              eventDiv.textContent += "; " + eventText;
            } else {
              eventDiv.textContent = eventText;
            }
            speakText(`${year}-${month + 1}-${d}에 ${eventText} 일정을 추가했습니다.`);
          }
        });
        grid.appendChild(cell);
      }
    }

    function updateBubblePosition() {
      const bubble = document.getElementById("speech-bubble");
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      const screenPos = headWorldPos.project(camera);
      bubble.style.left = ((screenPos.x * 0.5 + 0.5) * window.innerWidth) + "px";
      bubble.style.top = ((1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight - 50) + "px";
    }
  </script>
</body>
</html>
