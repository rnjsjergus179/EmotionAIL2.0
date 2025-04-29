// ui.js
function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.volume = 1;
  utterance.rate = 1.5;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function showSpeechBubbleInChunks(text, isHTML = false, chunkSize = 15, delay = 500) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  bubble.style.opacity = 0;
  bubble.style.display = "block";
  let parts = isHTML ? text.split("<br>") : [];
  if (!isHTML) {
    for (let i = 0; i < text.length; i += chunkSize) parts.push(text.slice(i, i + chunkSize));
  }
  let index = 0;
  bubble.innerHTML = "";

  function showNextPart() {
    if (index === 0) bubble.style.opacity = 1;
    if (index < parts.length) {
      if (isHTML) {
        bubble.innerHTML += parts[index] + "<br>";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = parts[index];
        speakText(tempDiv.textContent);
      } else {
        bubble.textContent += parts[index];
        speakText(parts[index]);
      }
      index++;
      requestAnimationFrame(showNextPart);
    } else {
      setTimeout(() => { bubble.style.opacity = 0; setTimeout(() => bubble.style.display = "none", 500); }, 2000);
    }
  }
  requestAnimationFrame(showNextPart);
}

function deleteCalendarEvent(day, currentYear, currentMonth) {
  const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${day}`);
  if (eventDiv) {
    eventDiv.textContent = "";
    let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
    delete calendarData[`${currentYear}-${currentMonth + 1}-${day}`];
    localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
    return `${currentYear}-${currentMonth + 1}-${day} 일정이 삭제되었습니다.`;
  } else {
    return "해당 날짜에 일정이 없습니다.";
  }
}

function getCalendarEvents(dateStr = null, currentYear, currentMonth) {
  const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
  if (!Object.keys(calendarData).length) {
    return "저장된 일정이 없습니다. 먼저 날짜 셀을 클릭하여 일정을 입력해주세요.";
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
    return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}`
                        : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
  }
}

function updateMap(currentCity) {
  const regionMap = {
    "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
    "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
    "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
    "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
    "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
  };
  const englishCity = regionMap[currentCity] || "Seoul";
  const mapIframe = document.getElementById("map-iframe");
  if (mapIframe) {
    mapIframe.src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
  }
}

let currentYear, currentMonth;
function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  populateYearSelect();
  renderCalendar(currentYear, currentMonth);

  const prevMonth = document.getElementById("prev-month");
  const nextMonth = document.getElementById("next-month");
  const yearSelect = document.getElementById("year-select");
  const deleteDayEvent = document.getElementById("delete-day-event");

  if (prevMonth) {
    prevMonth.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (nextMonth) {
    nextMonth.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      currentYear = parseInt(e.target.value);
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (deleteDayEvent) {
    deleteDayEvent.addEventListener("click", () => {
      const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
      if (dayStr) {
        const dayNum = parseInt(dayStr);
        const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${dayNum}`);
        if (eventDiv) {
          eventDiv.textContent = "";
          const message = `${currentYear}-${currentMonth + 1}-${dayNum} 일정이 삭제되었습니다.`;
          showSpeechBubbleInChunks(message);
          let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
          delete calendarData[`${currentYear}-${currentMonth + 1}-${dayNum}`];
          localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
        }
      }
    });
  }
}

function populateYearSelect() {
  const yearSelect = document.getElementById("year-select");
  if (!yearSelect) return;
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
  const monthYearLabel = document.getElementById("month-year-label");
  if (monthYearLabel) monthYearLabel.textContent = `${year}년 ${monthNames[month]}`;

  const grid = document.getElementById("calendar-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  daysOfWeek.forEach(day => {
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
    cell.innerHTML = `
      <div class="day-number">${d}</div>
      <div class="event" id="event-${year}-${month + 1}-${d}"></div>
    `;
    cell.addEventListener("click", () => {
      const eventText = prompt(`${year}-${month + 1}-${d} 일정 입력:`);
      if (eventText) {
        const eventDiv = document.getElementById(`event-${year}-${month + 1}-${d}`);
        if (eventDiv) {
          if (eventDiv.textContent) {
            eventDiv.textContent += "; " + eventText;
          } else {
            eventDiv.textContent = eventText;
          }
          showSpeechBubbleInChunks(`${year}-${month + 1}-${d}에 ${eventText} 일정이 추가되었습니다.`);
          let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
          calendarData[`${year}-${month + 1}-${d}`] = eventDiv.textContent;
          localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
        }
      }
    });
    let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
    const dateKey = `${year}-${month + 1}-${d}`;
    if (calendarData[dateKey]) {
      cell.querySelector(`#event-${year}-${month + 1}-${d}`).textContent = calendarData[dateKey];
    }
    grid.appendChild(cell);
  }
}

export {
  speakText, showSpeechBubbleInChunks, deleteCalendarEvent, getCalendarEvents,
  updateMap, initCalendar, currentYear, currentMonth
};
