// 전역 변수 선언
let currentYear, currentMonth;

// 캘린더 이벤트 삭제 함수
function deleteCalendarEvent(day) {
    if (typeof currentYear === 'undefined' || typeof currentMonth === 'undefined') {
        const now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth();
    }
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

// 캘린더 이벤트 조회 함수
function getCalendarEvents(dateStr = null) {
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
        if (typeof currentYear === 'undefined' || typeof currentMonth === 'undefined') {
            const now = new Date();
            currentYear = now.getFullYear();
            currentMonth = now.getMonth();
        }
        const currentMonthStr = `${currentYear}-${currentMonth + 1}`;
        let events = [];
        for (let key in calendarData) {
            if (key.startsWith(currentMonthStr)) {
                events.push(`${key}: ${calendarData[key]}`);
            }
        }
        return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}` : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
    }
}

// 캘린더 초기화 함수
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
            if (currentMonth < 0) { 
                currentMonth = 11; 
                currentYear--; 
            }
            renderCalendar(currentYear, currentMonth);
        });
    }
    if (nextMonth) {
        nextMonth.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) { 
                currentMonth = 0; 
                currentYear++; 
            }
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
                    // 주의: showSpeechBubbleInChunks는 main.js에 정의되어 있으므로, 별도로 정의 필요
                    if (typeof showSpeechBubbleInChunks === "function") {
                        showSpeechBubbleInChunks(message);
                    } else {
                        console.log(message); // 임시 출력
                    }
                    let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
                    delete calendarData[`${currentYear}-${currentMonth + 1}-${dayNum}`];
                    localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
                }
            }
        });
    }
}

// 연도 선택 드롭다운 채우기 함수
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

// 캘린더 렌더링 함수
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
                    const message = `${year}-${month + 1}-${d}에 ${eventText} 일정이 추가되었습니다.`;
                    // 주의: showSpeechBubbleInChunks는 main.js에 정의되어 있으므로, 별도로 정의 필요
                    if (typeof showSpeechBubbleInChunks === "function") {
                        showSpeechBubbleInChunks(message);
                    } else {
                        console.log(message); // 임시 출력
                    }
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

// DOM이 로드될 때 캘린더 초기화
document.addEventListener("DOMContentLoaded", function() {
    initCalendar();
});
