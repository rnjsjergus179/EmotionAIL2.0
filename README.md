
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 달력 & 말풍선 채팅</title>
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
    
    /* 파일 업로드 관련 기능은 삭제됨 → 파일 업로드 입력란도 제거 */
    
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
    
    #tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
      opacity: 0;
      transition: opacity 1s ease-in-out;
      pointer-events: none;
    }
    #tutorial-content {
      text-align: center;
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      max-width: 600px;
    }
    #tutorial-content h2 { margin-bottom: 15px; }
    #tutorial-content p { margin: 10px 0; font-size: 14px; }
    
    #version-select {
      position: fixed;
      bottom: 10px;
      left: 10px;
      z-index: 50;
    }
    #version-select select {
      padding: 5px;
      font-size: 12px;
    }

    @media (max-width: 480px) {
      #right-hud, #left-hud, #hud-3 { width: 90%; left: 5%; right: 5%; top: 5%; }
    }
  </style>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  
  <script>
    document.addEventListener("contextmenu", event => event.preventDefault());
    let blockUntil = 0;
    let danceInterval;
    let currentCity = "서울";
    let currentWeather = "";
    
    document.addEventListener("copy", function(e) {
      e.preventDefault();
      let selectedText = window.getSelection().toString();
      selectedText = selectedText.replace(/2caa7fa4a66f2f8d150f1da93d306261/g, "HIDDEN");
      e.clipboardData.setData("text/plain", selectedText);
      if (Date.now() < blockUntil) return;
      blockUntil = Date.now() + 3600000;
      showSpeechBubbleInChunks("1시간동안 차단됩니다.");
    });
    
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
      const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
      const calendarData = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${d}`);
        if (eventDiv && eventDiv.textContent.trim() !== "") {
          calendarData[`${currentYear}-${currentMonth+1}-${d}`] = eventDiv.textContent;
        }
      }
      localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
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
      const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${day}`);
      if (eventDiv) {
        eventDiv.textContent = "";
        const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
        delete calendarData[`${currentYear}-${currentMonth+1}-${day}`];
        localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
        return `${currentYear}-${currentMonth+1}-${day} 일정이 삭제되었습니다.`;
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
        const currentMonthStr = `${currentYear}-${currentMonth+1}`;
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
    
    function updateMap() {
      const englishCity = regionMap[currentCity] || "Seoul";
      document.getElementById("map-iframe").src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
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
      showSpeechBubbleInChunks(`지역이 ${value}(으)로 변경되었습니다.`);
    }
    
    // 채팅 입력 처리 – 감정 표현, 반가움 및 "유튜브 보여줘" 키워드 처리
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
      
      // 지역 변경 처리
      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if(newCity) {
          if (regionList.includes(newCity)) {
            currentCity = newCity;
            document.getElementById("region-select").value = newCity;
            response = `지역이 ${newCity}(으)로 변경되었습니다.`;
            updateMap();
            await updateWeatherAndEffects();
          } else {
            response = "지원하지 않는 지역입니다. 드롭다운 메뉴에서 선택해주세요.";
          }
        } else {
          response = "변경할 지역을 입력해주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        document.getElementById("region-select").value = input;
        response = `지역이 ${input}(으)로 변경되었습니다.`;
        updateMap();
        await updateWeatherAndEffects();
      }
      
      // "유튜브 보여줘" 키워드 처리 – 페이지 전체를 유튜브로 리디렉션
      if (!response && lowerInput.includes("유튜브 보여줘")) {
        response = "유튜브로 이동합니다.";
        showSpeechBubbleInChunks(response);
        // 잠시 후 페이지 전체를 유튜브로 변경
        setTimeout(() => {
          window.location.href = "https://www.youtube.com/";
        }, 2000);
        inputEl.value = "";
        return;
      }
      
      // 반갑 관련 키워드 처리
      if (!response && lowerInput.indexOf("반갑") !== -1) {
        response = "반가워요~😉";
      }
      
      // 감정 표현 및 일반 대화 처리
      if (!response) {
        if (lowerInput.includes("기분") || 
            lowerInput.includes("슬프") || 
            lowerInput.includes("우울") || 
            lowerInput.includes("짜증") || 
            lowerInput.includes("화난") ||
            lowerInput.includes("분노")) {
          const sadResponses = [
            "정말 슬프네요. 마음이 많이 아프실 것 같아요.",
            "힘들어 보이시네요. 제가 조금이나마 위로가 될 수 있으면 좋겠어요.",
            "이런 날도 있죠. 괜찮으실 거예요.",
            "마음이 아프실 때는 충분히 쉬어가세요. 응원할게요."
          ];
          const happyResponses = [
            "정말 기쁘고 행복해 보이세요! 오늘 좋은 일이 많으시길 바랍니다.",
            "당신의 미소가 주변을 환하게 만드네요.",
            "행복한 기분을 함께 나눌 수 있어 저도 기뻐요!",
            "오늘 하루도 즐겁게 보내세요. 당신은 소중한 존재입니다."
          ];
          const angryResponses = [
            "화가 나셨군요. 잠시 심호흡을 해보세요.",
            "분노가 느껴지네요. 조금 진정하고 다시 시작해보세요.",
            "당신의 감정이 전달되네요. 괜찮으실 거예요.",
            "화날 때는 잠깐 쉬어가는 것도 좋습니다."
          ];
          const neutralResponses = [
            "당신의 감정이 조금씩 느껴지네요.",
            "무슨 말씀을 하시는지 잘 알 것 같아요.",
            "그렇군요. 좀 더 자세히 말씀해 주실 수 있을까요?"
          ];
          
          if (lowerInput.includes("슬프") || lowerInput.includes("우울")) {
            response = sadResponses[Math.floor(Math.random() * sadResponses.length)];
          } else if (lowerInput.includes("기쁘") || lowerInput.includes("행복")) {
            response = happyResponses[Math.floor(Math.random() * happyResponses.length)];
          } else if (lowerInput.includes("화난") || lowerInput.includes("분노") || lowerInput.includes("짜증")) {
            response = angryResponses[Math.floor(Math.random() * angryResponses.length)];
          } else {
            response = neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
          }
        }
        else if (lowerInput.includes("날씨") &&
                 (lowerInput.includes("알려") || lowerInput.includes("어때") ||
                  lowerInput.includes("뭐야") || lowerInput.includes("어떻게") || lowerInput.includes("맑아"))) {
          await updateWeatherAndEffects();
          inputEl.value = "";
          return;
        }
        else if (lowerInput.includes("시간") || lowerInput.includes("몇시") || lowerInput
