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
    
    /* ML 파이프라인 관련 기능은 제거되었습니다 */
    
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
      /* 여기서는 별도 설명 추가하지 않음 */
      white-space: pre-wrap;
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
    /* ------------------------------ 감정 키워드 (기존) ------------------------------ */
    const emotionKeywords = {
      "슬픔": [
        "슬프","구슬픔","구슬퍼","구픔","눈물","우울","울적","공허",
        "슬퍼와","슬퍼이","슬퍼야","슬퍼라","슬퍼런","슬퍼서"
      ],
      "미안": ["미안", "미안했", "몰랏", "모르겠", "죄송", "사과"],
      "기쁨": ["기쁘", "행복", "웃", "기분좋아", "좋아", "설레", "벅차"],
      "분노": ["화난", "분노", "짜증", "폭발", "열받", "빡쳐"],
      "놀람": ["놀라", "깜짝", "신기", "대박", "당황", "충격", "믿기지 않"],
      "인사": ["안녕", "인사", "반가워"],
      "잘자": ["잘자", "편안한 밤"],
      "불안": ["불안", "걱정", "초조", "심장이 떨려", "앞이 캄캄", "근심"],
      "두려움": ["무서워", "두려움", "겁이 나", "소름", "떨려", "도망가고"],
      "사랑": ["사랑해", "보고 싶", "애틋", "마음 다 주고", "당신만 생각", "소중해"],
      "감사": ["감사", "감동", "고마워", "힘이 나", "큰 힘", "잊지 않을게"]
    };

    /* ------------------------------ 기존 감정별 원본 문장들 ------------------------------ */
    const emotionResponsesOriginal = {
      "슬픔": [
        "정말로 슬퍼... 😢 눈물이 절로 나네요.",
        "마음이 너무 아파요... 😭",
        "슬픔이 깊게 느껴져요... 😔",
        "그 슬픔, 함께 나누고 싶어요... 😢",
        "마음이 너무 아파요.",
        "울적해요.",
        "눈물이 나려고 해요.",
        "마음이 공허해요.",
        "위로가 필요해요.",
        "무엇 때문인지 모르게 가슴 한편이 먹먹하고 텅 빈 것 같아서 쉽게 웃음이 나오지 않아요.",
        "오늘따라 작은 일에도 눈물이 차올라서, 이 감정을 어떻게 달래야 할지 모르겠어요.",
        "슬픈 감정이 파도처럼 밀려와서 온몸을 덮어버린 듯한 느낌에 벗어나기가 힘드네요.",
        "슬퍼와 무기력이 한꺼번에 밀려오니 숨 쉴 틈도 없네요.",
        "슬퍼이 울부짖는 마음을 도무지 다스릴 수가 없어요.",
        "슬퍼야 할 것 같은 순간인데도 오히려 눈물이 안 나서 더 답답해요.",
        "아, 슬퍼라... 마음이 무너지는 기분이에요.",
        "슬퍼런 추억들이 문득 떠올라 밤새 마음이 무거웠어요.",
        "너무 슬퍼서 오늘은 아무것도 손에 잡히지 않아요."
      ],
      "미안": [
        "정말 미안해요... 🙇‍♀️ 진심으로 사과드립니다.",
        "미안했어요... 🙇‍♂️",
        "내 잘못이에요... 정말 죄송해요. 😞",
        "미안하다는 말로는 부족하지만, 정말 죄송합니다. 🙏",
        "정말 미안해요.",
        "다 제 잘못이에요.",
        "용서해 주세요.",
        "마음이 너무 무거워요.",
        "어떻게 사과해야 할지 모르겠어요.",
        "나 때문에 당신이 아파했다는 사실을 생각하면 가슴이 너무 아파서, 스스로가 용서되지 않을 만큼 죄책감이 들어요.",
        "제대로 해주지 못했던 것이 너무 후회되고 마음 아파서, 아무리 사과해도 충분하지 않을 것 같다는 생각에 괴로워요.",
        "당신에게 상처를 준 내 자신이 원망스럽고 미워서, 시간이 지나도 마음이 편하지 않고 늘 미안한 마음이 가득해요."
      ],
      "기쁨": [
        "기분 좋아~ 😄 정말 행복해요!",
        "웃음이 절로 나네요! 😊",
        "오늘은 너무 즐거워요! 😆",
        "행복한 하루 보내세요! 😁",
        "너무 좋아요!",
        "정말 기뻐요.",
        "마음이 설레요.",
        "이보다 더 좋을 수는 없어요.",
        "행복해서 날아갈 것 같아요.",
        "지금 이 순간이 너무 행복해서 이 시간이 영원히 멈췄으면 좋겠다고 생각할 정도예요.",
        "오늘처럼 마음이 따뜻하고 가슴 벅찬 날이 앞으로도 계속된다면 세상에 부러울 것이 없을 것 같아요.",
        "오랜만에 이렇게 좋은 소식을 듣게 되어서, 마음이 들뜨고 설레서 어디론가 뛰어나가고 싶은 기분이 들어요."
      ],
      "분노": [
        "정말 화가 나네요... 😡 잠시 진정해보세요.",
        "분노가 치밀어요! 😠 조금 숨 고르세요.",
        "짜증이 가득해요... 😤 마음을 진정시키세요.",
        "화가 나요.",
        "정말 짜증 나네요.",
        "참을 수가 없어요.",
        "폭발할 것 같아요.",
        "더는 못 참겠어요.",
        "참으려고 해도 자꾸 화가 끓어올라서 마음이 차분해지지 않고, 이러다가 스스로를 놓쳐버릴까 봐 두려워요.",
        "정말 이해할 수 없는 일이 자꾸 벌어지니까 짜증과 분노가 뒤엉켜 마음을 진정시키기가 쉽지 않아요.",
        "이 감정이 내 이성을 집어삼켜 버릴까 봐 걱정되지만, 아직도 가슴 깊숙이 화가 끓고 있는 것을 어쩔 수 없네요."
      ],
      "놀람": [
        "정말 놀라워요! 😲",
        "깜짝 놀랐어요! 😮",
        "세상이 참 신기하네요! 😳",
        "놀라움이 가득해요! 😯",
        "깜짝 놀랐어요!",
        "믿기지 않아요.",
        "정말 당황스럽네요.",
        "충격적이에요.",
        "예상치 못했어요.",
        "전혀 예상하지 못한 일이 갑자기 일어나서 무슨 말을 해야 할지 몰라 머릿속이 하얗게 변해버렸어요.",
        "너무 갑작스러운 일이라 당황스럽기도 하고, 현실감이 느껴지지 않을 만큼 충격이 커서 말이 쉽게 나오지 않아요.",
        "믿기 어려운 상황이 눈앞에서 벌어져서 심장이 터질 듯 놀랐고, 지금도 정신이 제대로 돌아오지 않은 것 같아요."
      ],
      "인사": [
        "안녕하세요, 주인님! 오늘 기분은 어떠세요? 😊",
        "반갑습니다, 주인님! 언제나 환영해요~ 😊",
        "안녕하십니까? 항상 곁에 있겠습니다. 🙂"
      ],
      "잘자": [
        "잘 자요, 좋은 꿈 꾸세요! 😴",
        "편안한 밤 되세요... 😌",
        "내일도 멋진 하루 되길 바랍니다! 🌙",
        "달콤한 꿈 꾸세요! 😴"
      ],
      "불안": [
        "너무 걱정돼요.",
        "불안해요.",
        "심장이 떨려요.",
        "초조해 죽겠어요.",
        "앞이 캄캄해요.",
        "이러면 안 된다는 걸 알면서도 머릿속에 온갖 안 좋은 생각들만 가득 차서 점점 불안감에 빠져드는 것 같아요.",
        "내가 걱정한다고 달라지는 건 없다는 걸 알면서도 마음속에 끊임없이 걱정이 솟구쳐서 잠이 오지 않아요.",
        "혹시 무슨 문제가 생길까 봐 자꾸만 신경이 쓰이고 마음이 초조해서, 이러지도 저러지도 못하고 있어요."
      ],
      "두려움": [
        "무서워요.",
        "소름 끼쳐요.",
        "온몸이 떨려요.",
        "겁이 나요.",
        "도망가고 싶어요.",
        "막연한 두려움이 마음속에서 커져서 마치 어둠 속에 혼자 버려진 것처럼 온몸이 떨리고 가슴이 조여와요.",
        "지금의 상황이 너무 무섭고 불확실해서 앞으로 한 발짝도 내딛기가 어렵고 두렵기만 해요.",
        "두려움이 머릿속을 채워버려서 어떻게 해야 할지 판단이 서지 않고 그냥 도망치고 싶은 생각만 들어요."
      ],
      "사랑": [
        "정말 사랑해요.",
        "보고 싶어요.",
        "내 마음을 다 주고 싶어요.",
        "당신만 생각나요.",
        "애틋해요.",
        "당신을 생각하면 마음 깊은 곳에서부터 따뜻함이 솟아나서, 다른 어떤 것도 중요하지 않을 만큼 내 마음을 가득 채워요.",
        "그 사람과 함께 있으면 온 세상이 다르게 보일 만큼 설레고, 지금 이 마음을 평생 간직하고 싶다는 생각이 들어요.",
        "사랑이라는 감정이 이렇게나 깊고 소중한 것인지 당신을 만나기 전에는 미처 알지 못했던 것 같아요."
      ],
      "감사": [
        "진심으로 감사해요.",
        "덕분에 힘이 나요.",
        "감동받았어요.",
        "정말 큰 힘이 됐어요.",
        "잊지 않을게요.",
        "당신의 따뜻한 말 한마디가 내 지친 마음에 큰 위로가 되어줘서, 어떻게 감사의 마음을 표현해야 할지 모르겠어요.",
        "내가 힘들 때 곁에서 힘이 되어준 당신에게 고마워서 마음 깊이 울컥하며 눈물이 날 것 같아요.",
        "작은 배려 하나하나가 모여서 내 마음에 잔잔한 감동을 주었고, 이 마음을 평생 잊지 않고 간직하고 싶어요."
      ]
    };

    /* --------------------------------------------------------------------
       (추가) 감정 문장을 토큰화하고, 재조합해서 말할 수 있도록 하는 로직
    -------------------------------------------------------------------- */
    // 감정별 "토큰화된 문장들" 저장소
    const emotionResponsesTokens = {};

    // 간단한 토큰화 예: 공백과 문장부호를 기준으로 split
    function tokenizeSentence(line) {
      return line
        .split(/(\s+|[\.\,\!\?\:\;]+|…|ㅋ|ㅠ|~|[\u{1F600}-\u{1F6FF}]+)/u)
        .map(token => token.trim())
        .filter(token => token.length > 0);
    }

    // 원본 문장들 전체를 토큰 배열로 변환
    for (const [emo, lines] of Object.entries(emotionResponsesOriginal)) {
      emotionResponsesTokens[emo] = lines.map(line => tokenizeSentence(line));
    }

    // 토큰 배열을 랜덤 순서로 섞어 간단히 합치는 함수
    function combineTokensRandomly(tokenArray) {
      // Fisher-Yates shuffle
      for (let i = tokenArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tokenArray[i], tokenArray[j]] = [tokenArray[j], tokenArray[i]];
      }
      return tokenArray.join(" ");
    }

    // 감정 응답 문장 생성: 토큰화한 결과를 임의로 재조합
    function getEmotionResponse(emotion) {
      const tokenArrays = emotionResponsesTokens[emotion];
      if (!tokenArrays || tokenArrays.length === 0) return "";
      // 한 줄을 골라서 랜덤 섞기
      const pick = tokenArrays[Math.floor(Math.random() * tokenArrays.length)];
      // 원본 그대로를 쓰고 싶다면: return pick.join(" ");
      // 여기서는 토큰을 섞어서 조합
      return combineTokensRandomly([...pick]);
    }

    // 감정 감지 함수 (기존)
    function detectEmotion(input) {
      const detected = [];
      const lower = input.toLowerCase();
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        for (const word of keywords) {
          if (lower.includes(word)) {
            detected.push(emotion);
            break;
          }
        }
      }
      return detected;
    }

    /**************************************************************
     * 이하: 기존 코드 (지도, 날씨, 캘린더 등) 유지
     **************************************************************/
    
    let currentCity = "서울";
    let currentWeather = "";
    let danceInterval = null;
    let blockUntil = 0;
    const weatherKey = "YOUR_OPENWEATHERMAP_API_KEY"; // 날씨 API 키를 여기에 넣어주세요.

    const regionMap = {
      "서울": "Seoul",
      "인천": "Incheon",
      "부산": "Busan",
      "대구": "Daegu",
      "광주": "Gwangju",
      "대전": "Daejeon",
      "울산": "Ulsan",
      "세종": "Sejong",
      "제주": "Jeju"
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
    
    // >>> 감정 반응 처리 (주요 변경: 토큰화된 문장 재조합)
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
      
      // 지역 변경 등 기존 처리
      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (newCity) {
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

      // 감정 키워드 분석
      if (!response) {
        const detectedEmotions = detectEmotion(input);
        if (detectedEmotions.length > 0) {
          // 첫 번째 감정에 대한 응답 문장(토큰 재조합)
          const emotion = detectedEmotions[0];
          response = getEmotionResponse(emotion);
        }
      }
      
      // 감정 없을 경우, 기존 기능
      if (!response) {
        if (lowerInput.includes("날씨") &&
            (lowerInput.includes("알려") || lowerInput.includes("어때") ||
             lowerInput.includes("뭐야") || lowerInput.includes("어떻게") || lowerInput.includes("맑아"))) {
          await updateWeatherAndEffects();
          return;
        }
        else if (lowerInput.includes("시간") || lowerInput.includes("몇시") || lowerInput.includes("현재시간")) {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();
          response = `현재 시간은 ${hours}시 ${minutes}분입니다.`;
        }
        else if (lowerInput.includes("파일 저장해줘")) {
          response = "파일 저장하겠습니다.";
          saveFile();
        }
        else if ((lowerInput.includes("캘린더") && lowerInput.includes("저장")) ||
                 lowerInput.includes("일정저장") ||
                 lowerInput.includes("하루일과저장")) {
          response = "캘린더 저장하겠습니다.";
          saveCalendar();
        }
        else if (lowerInput.includes("일정 삭제") || 
                 lowerInput.includes("하루일정 삭제") || 
                 lowerInput.includes("일정 삭제해줘") || 
                 lowerInput.includes("하루 일정 삭제")) {
          const dayStr = prompt("삭제할 일정의 날짜(일)를 입력하세요 (예: 15):");
          if (dayStr) {
            const dayNum = parseInt(dayStr);
            if (dayNum >= 1 && dayNum <= new Date(currentYear, currentMonth+1, 0).getDate()) {
              response = deleteCalendarEvent(dayNum);
            } else {
              response = "유효한 날짜를 입력해주세요.";
            }
          } else {
            response = "날짜를 입력하지 않으셨습니다.";
          }
        }
        else if (lowerInput.includes("일정 알려줘") || 
                 lowerInput.includes("일정 알려") || 
                 lowerInput.includes("일정 확인")) {
          const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
          if (dateMatch) {
            const dateStr = dateMatch[0];
            response = getCalendarEvents(dateStr);
          } else {
            response = getCalendarEvents();
          }
        }
        else if (lowerInput.includes("안녕")) {
          response = "안녕하세요, 주인님! 오늘 기분은 어떠세요?";
          characterGroup.children[7].rotation.z = Math.PI / 4;
          setTimeout(() => { characterGroup.children[7].rotation.z = 0; }, 1000);
        }
        else if (lowerInput.includes("캐릭터 넌 누구야")) {
          response = "저는 당신의 부드럽고 다정한 비서입니다.";
        }
        else if (lowerInput.includes("일정")) {
          response = "캘린더는 왼쪽에서 확인하세요.";
        }
        else if (lowerInput.includes("캐릭터 춤춰줘") ||
                 lowerInput.includes("춤") ||
                 lowerInput.includes("춤춰") ||
                 lowerInput.includes("춤춰줘") ||
                 lowerInput.includes("춤춰봐") ||
                 lowerInput.includes("춤사위")) {
          response = "춤추겠습니다! 잠시만 기다려 주세요.";
          if (danceInterval) clearInterval(danceInterval);
          danceInterval = setInterval(() => {
            characterGroup.children[7].rotation.z = Math.sin(Date.now() * 0.01) * Math.PI / 4;
            head.rotation.y = Math.sin(Date.now() * 0.01) * Math.PI / 8;
          }, 50);
          setTimeout(() => {
            clearInterval(danceInterval);
            characterGroup.children[7].rotation.z = 0;
            head.rotation.y = 0;
          }, 3000);
        }
        else {
          if (!response) {
            response = "죄송합니다. 잘 이해하지 못했습니다. 다시 말씀해주시겠어요?";
          }
        }
      }
      
      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }
    
    async function getWeather() {
      try {
        const englishCity = regionMap[currentCity] || "Seoul";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(englishCity)}&appid=${weatherKey}&units=metric&lang=kr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("날씨 API 호출 실패");
        const data = await res.json();
        const description = data.weather[0].description;
        const temp = data.main.temp;
        currentWeather = description;
        let extraComment = "";
        if (description.indexOf("흐림") !== -1 || description.indexOf("구름") !== -1) {
          extraComment = " 오늘은 약간 흐린 날씨네요 ☁️";
        } else if (description.indexOf("맑음") !== -1) {
          extraComment = " 오늘은 맑은 날씨네요 ☀️";
        } else if (description.indexOf("비") !== -1 || description.indexOf("소나기") !== -1) {
          extraComment = " 오늘은 비가 오네요 ☔";
        }
        return {
          message: `오늘 ${currentCity}의 날씨는 ${description}이며, 온도는 ${temp}°C입니다.${extraComment}`
        };
      } catch (err) {
        currentWeather = "";
        return { message: `날씨 정보를 가져오지 못했습니다: ${currentCity}` };
      }
    }
    
    function updateWeatherEffects() {
      if (!currentWeather) return;
      if (currentWeather.indexOf("비") !== -1 || currentWeather.indexOf("소나기") !== -1) {
        rainGroup.visible = true;
        houseCloudGroup.visible = false;
      } else if (currentWeather.indexOf("구름") !== -1 || currentWeather.indexOf("흐림") !== -1) {
        rainGroup.visible = false;
        houseCloudGroup.visible = true;
      } else {
        rainGroup.visible = false;
        houseCloudGroup.visible = false;
      }
    }
    
    function updateLightning() {
      if (currentWeather.indexOf("번개") !== -1 || currentWeather.indexOf("뇌우") !== -1) {
        if (Math.random() < 0.001) {
          lightningLight.intensity = 5;
          setTimeout(() => { lightningLight.intensity = 0; }, 100);
        }
      }
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
          index++;
          setTimeout(showNextChunk, delay);
        } else {
          setTimeout(() => { bubble.style.display = "none"; }, 3000);
        }
      }
      showNextChunk();
    }
    
    window.addEventListener("DOMContentLoaded", function() {
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
    
    window.addEventListener("resize", function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    window.addEventListener("load", async () => {
      initCalendar();
      showTutorial();
      updateMap();
      await updateWeatherAndEffects();
    });
    
    function changeVersion(version) {
      if (version === "1.3") {
        window.location.href = "https://aipersonalassistant.neocities.org/";
      } else if (version === "latest") {
        window.location.reload();
      }
    }
  </script>

</head>
<body>
  <div id="right-hud">
    <h3>채팅창</h3>
    <select id="region-select" onchange="changeRegion(this.value)">
      <option value="" disabled>지역 선택</option>
    </select>
    <div id="chat-log"></div>
    <div id="chat-input-area">
      <input type="text" id="chat-input" placeholder="채팅 입력..." />
    </div>
    <!-- 파일 업로드 관련 요소는 제거되었습니다 -->
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
  
  <div id="tutorial-overlay">
    <div id="tutorial-content">
      <h2>사용법 안내</h2>
      <p><strong>캐릭터:</strong> 채팅창에 "안녕", "캐릭터 춤춰줘" 등 입력해 보세요.</p>
      <p>
        <strong>채팅창:</strong> 상단 드롭다운 메뉴에서 지역을 선택하면 지도와 날씨가 즉시 업데이트됩니다.<br>
        또는 "지역 [지역명]" (예: "지역 인천" 또는 "인천") 입력으로도 변경 가능합니다.<br>
        "날씨 알려줘"로 현재 지역의 날씨를 다시 확인할 수 있습니다.<br>
        "일정 삭제" 또는 "하루일정 삭제"를 입력해 캘린더 일정을 삭제할 수 있습니다.<br>
        "일정 알려줘"를 입력해 저장된 일정을 확인할 수 있습니다 (예: "2025-4-15 일정 알려줘").
      </p>
      <p><strong>캘린더:</strong> 왼쪽에서 날짜 클릭해 일정을 추가하거나, 버튼으로 저장/삭제하세요.</p>
      <p><strong>버전 선택:</strong> 하단 드롭다운에서 "구버전 1.3" 또는 "최신 버전 (1.7)"을 선택해 해당 페이지로 이동하세요.</p>
    </div>
  </div>
  
  <div id="version-select">
    <select onchange="changeVersion(this.value)">
      <option value="latest">최신 버전 (1.7)</option>
      <option value="1.3">구버전 1.3</option>
    </select>
  </div>
  
  <canvas id="canvas"></canvas>

  <script>
    /* (기존 3D 초기화, animate(), initCalendar(), showTutorial() 등 함수 전부) */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7).normalize();
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0x333333));
    
    const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, transparent: true, opacity: 0 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), sunMaterial);
    scene.add(sun);
    
    const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222, transparent: true, opacity: 1 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), moonMaterial);
    scene.add(moon);
    
    const stars = [], fireflies = [];
    for (let i = 0; i < 200; i++) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      star.position.set((Math.random()-0.5)*100, (Math.random()-0.5)*60, -20);
      scene.add(star);
      stars.push(star);
    }
    for (let i = 0; i < 60; i++) {
      const firefly = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff99 }));
      firefly.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*20, -10);
      scene.add(firefly);
      fireflies.push(firefly);
    }
    
    const floorGeometry = new THREE.PlaneGeometry(400, 400, 128, 128);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1, metalness: 0 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -2;
    scene.add(floor);
    
    const backgroundGroup = new THREE.Group();
    scene.add(backgroundGroup);
    function createBuilding(width, height, depth, color) {
      const buildingGroup = new THREE.Group();
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
      const building = new THREE.Mesh(geometry, material);
      buildingGroup.add(building);
      
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
      for (let y = 3; y < height - 1; y += 2) {
        for (let x = -width/2 + 0.5; x < width/2; x += 1) {
          const window = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), windowMat);
          window.position.set(x, y - height/2, depth/2 + 0.01);
          buildingGroup.add(window);
        }
      }
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), doorMat);
      door.position.set(0, -height/2 + 1, depth/2 + 0.01);
      buildingGroup.add(door);
      
      return buildingGroup;
    }
    function createHouse(width, height, depth, baseColor, roofColor) {
      const houseGroup = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth),
                                  new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 }));
      base.position.y = -2 + height/2;
      houseGroup.add(base);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.8, height * 0.6, 4),
                                  new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 }));
      roof.position.y = -2 + height + (height * 0.6)/2;
      roof.rotation.y = Math.PI/4;
      houseGroup.add(roof);
      
      const windowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFE0 });
      const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
      window1.position.set(-width/4, -2 + height/2, depth/2 + 0.01);
      const window2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
      window2.position.set(width/4, -2 + height/2, depth/2 + 0.01);
      houseGroup.add(window1, window2);
      
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), doorMat);
      door.position.set(0, -2 + height/4, depth/2 + 0.01);
      houseGroup.add(door);
      
      return houseGroup;
    }
    for (let i = 0; i < 20; i++) {
      const width = Math.random() * 4 + 4;
      const height = Math.random() * 20 + 20;
      const depth = Math.random() * 4 + 4;
      const building = createBuilding(width, height, depth, 0x555555);
      const col = i % 10;
      const row = Math.floor(i / 10);
      const x = -50 + col * 10;
      const z = -30 - row * 20;
      building.position.set(x, -2 + height/2, z);
      backgroundGroup.add(building);
    }
    for (let i = 0; i < 10; i++) {
      const width = Math.random() * 4 + 6;
      const height = Math.random() * 4 + 6;
      const depth = Math.random() * 4 + 6;
      const house = createHouse(width, height, depth, 0xa0522d, 0x8b0000);
      const x = -40 + i * 10;
      const z = -10;
      house.position.set(x, 0, z);
      backgroundGroup.add(house);
    }
    function createStreetlight() {
      const lightGroup = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
                                    new THREE.MeshBasicMaterial({ color: 0x333333 }));
      pole.position.y = 2;
      lightGroup.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
                                    new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
      lamp.position.y = 4.2;
      lightGroup.add(lamp);
      const lampLight = new THREE.PointLight(0xffcc00, 1, 10);
      lampLight.position.set(0, 4.2, 0);
      lightGroup.add(lampLight);
      return lightGroup;
    }
    const characterStreetlight = createStreetlight();
    characterStreetlight.position.set(1, -2, 0);
    scene.add(characterStreetlight);
    
    let rainGroup = new THREE.Group();
    scene.add(rainGroup);
    function initRain() {
      const rainCount = 2000;
      const rainGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount; i++) {
        positions[i * 3] = Math.random() * 200 - 100;
        positions[i * 3 + 1] = Math.random() * 100;
        positions[i * 3 + 2] = Math.random() * 200 - 100;
      }
      rainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaee, size: 0.1, transparent: true, opacity: 0.6 });
      const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
      rainGroup.add(rainParticles);
    }
    initRain();
    rainGroup.visible = false;
    
    let houseCloudGroup = new THREE.Group();
    function createHouseCloud() {
      const cloud = new THREE.Group();
      const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat);
      sphere1.position.set(0, 0, 0);
      const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), cloudMat);
      sphere2.position.set(0.6, 0.2, 0);
      const sphere3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat);
      sphere3.position.set(-0.6, 0.1, 0);
      cloud.add(sphere1, sphere2, sphere3);
      cloud.userData.initialPos = cloud.position.clone();
      return cloud;
    }
    const singleCloud = createHouseCloud();
    houseCloudGroup.add(singleCloud);
    houseCloudGroup.position.set(0, 2, 0);
    scene.add(houseCloudGroup);
    function updateHouseClouds() {
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      houseCloudGroup.position.x = headWorldPos.x + Math.sin(Date.now() * 0.001) * 1;
      houseCloudGroup.position.y = headWorldPos.y + 1;
      houseCloudGroup.position.z = headWorldPos.z;
    }
    
    let lightningLight = new THREE.PointLight(0xffffff, 0, 500);
    lightningLight.position.set(0, 50, 0);
    scene.add(lightningLight);
    
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
    const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), eyeMat);
    const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), eyeMat);
    leftBrow.position.set(-0.2, 1.45, 0.45);
    rightBrow.position.set(0.2, 1.45, 0.45);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
    leftArm.position.set(-0.7, 0.4, 0);
    rightArm.position.set(0.7, 0.4, 0);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), legMat);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), legMat);
    leftLeg.position.set(-0.35, -1, 0);
    rightLeg.position.set(0.35, -1, 0);
    characterGroup.add(charBody, head, leftEye, rightEye, mouth, leftBrow, rightBrow, leftArm, rightArm, leftLeg, rightLeg);
    characterGroup.position.y = -1;
    scene.add(characterGroup);
    const characterLight = new THREE.PointLight(0xffee88, 1, 15);
    scene.add(characterLight);
    
    function createTree() {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      trunk.position.y = -1;
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
      foliage.position.y = 0.5;
      treeGroup.add(trunk, foliage);
      return treeGroup;
    }
    
    for (let i = 0; i < 10; i++) {
      const tree = createTree();
      tree.position.set(-50 + i * 10, -2, -15);
      scene.add(tree);
    }
    
    function animate() {
      requestAnimationFrame(animate);
      
      const now = new Date();
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      const totalMin = now.getHours() * 60 + now.getMinutes();
      const angle = (totalMin / 1440) * Math.PI * 2;
      const radius = 3;
      const sunPos = new THREE.Vector3(
        headWorldPos.x + Math.cos(angle) * radius,
        headWorldPos.y + Math.sin(angle) * radius,
        headWorldPos.z
      );
      sun.position.copy(sunPos);
      
      const moonAngle = angle + Math.PI;
      const moonPos = new THREE.Vector3(
        headWorldPos.x + Math.cos(moonAngle) * radius,
        headWorldPos.y + Math.sin(moonAngle) * radius,
        headWorldPos.z
      );
      moon.position.copy(moonPos);
      
      const t = now.getHours() + now.getMinutes() / 60;
      let sunOpacity = 0, moonOpacity = 0;
      if (t < 6) { sunOpacity = 0; moonOpacity = 1; }
      else if (t < 7) { let factor = (t - 6); sunOpacity = factor; moonOpacity = 1 - factor; }
      else if (t < 17) { sunOpacity = 1; moonOpacity = 0; }
      else if (t < 18) { let factor = (t - 17); sunOpacity = 1 - factor; moonOpacity = factor; }
      else { sunOpacity = 0; moonOpacity = 1; }
      sun.material.opacity = sunOpacity;
      moon.material.opacity = moonOpacity;
      
      const isDay = (t >= 7 && t < 17);
      scene.background = new THREE.Color(isDay ? 0x87CEEB : 0x000033);
      stars.forEach(s => s.visible = !isDay);
      fireflies.forEach(f => f.visible = !isDay);
      
      characterStreetlight.traverse(child => {
        if (child instanceof THREE.PointLight) {
          child.intensity = isDay ? 0 : 1;
        }
      });
      characterLight.position.copy(characterGroup.position).add(new THREE.Vector3(0, 5, 0));
      characterLight.intensity = isDay ? 0 : 1;
      characterGroup.position.y = -1;
      characterGroup.rotation.x = 0;
      
      updateWeatherEffects();
      updateHouseClouds();
      updateLightning();
      characterStreetlight.position.set(characterGroup.position.x + 1, -2, characterGroup.position.z);
      updateBubblePosition();
      
      renderer.render(scene, camera);
    }
    animate();
    
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
        if(dayStr) {
          const dayNum = parseInt(dayStr);
          const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${dayNum}`);
          if(eventDiv) {
            eventDiv.textContent = "";
            alert(`${currentYear}-${currentMonth+1}-${dayNum} 일정이 삭제되었습니다. 다시 입력할 수 있습니다.`);
          }
        }
      });
      
      document.getElementById("save-calendar").addEventListener("click", () => {
        saveCalendar();
      });
    }
    function populateYearSelect() {
      const yearSelect = document.getElementById("year-select");
      yearSelect.innerHTML = "";
      for(let y = 2020; y <= 2070; y++){
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if(y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
    }
    function renderCalendar(year, month) {
      const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      document.getElementById("month-year-label").textContent = `${year}년 ${monthNames[month]}`;
      const grid = document.getElementById("calendar-grid");
      grid.innerHTML = "";
      const daysOfWeek = ["일","월","화","수","목","금","토"];
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
      const daysInMonth = new Date(year, month+1, 0).getDate();
      for(let i = 0; i < firstDay; i++){
        grid.appendChild(document.createElement("div"));
      }
      for(let d = 1; d <= daysInMonth; d++){
        const cell = document.createElement("div");
        cell.innerHTML = `<div class="day-number">${d}</div>
                          <div class="event" id="event-${year}-${month+1}-${d}"></div>`;
        cell.addEventListener("click", () => {
          const eventText = prompt(`${year}-${month+1}-${d} 일정 입력:`);
          if(eventText) {
            const eventDiv = document.getElementById(`event-${year}-${month+1}-${d}`);
            if(eventDiv.textContent) {
              eventDiv.textContent += "; " + eventText;
            } else {
              eventDiv.textContent = eventText;
            }
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
    
    function showTutorial() {
      const overlay = document.getElementById("tutorial-overlay");
      overlay.style.display = "flex";
      setTimeout(() => {
        overlay.style.opacity = "1";
      }, 10);
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
        }, 1000);
      }, 4000);
    }
  </script>
</body>
</html>
