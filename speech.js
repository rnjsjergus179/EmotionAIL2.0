export function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.volume = 1;
  utterance.rate = 1.5;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function startSpeechRecognition(sendChat) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.trim();
    if (confirm(`"${transcript}" 맞나요?`)) {
      const chatInput = document.getElementById("chat-input");
      if (chatInput) {
        chatInput.value = transcript;
        sendChat();
      }
    }
  };
  recognition.onerror = function(event) {
    console.error("음성 인식 오류:", event.error);
  };
}
