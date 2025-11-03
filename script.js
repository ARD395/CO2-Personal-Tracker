//#region Tab Switching Logic

// ----- Tab Switching -----
function switchTabs(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab'));
  document.querySelectorAll('.nav-icon').forEach(icon => icon.classList.remove('active-icon'));
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active-tab');
  const targetIcon = document.querySelector(`.nav-icon[data-tab="${tabId}"]`);
  if (targetIcon) targetIcon.classList.add('active-icon');
  if (tabId === "tab-profile") {
    renderHistoryTable();
    setTimeout(renderCO2Graph, 100); // Give it 100ms to become visible
  }
  if (tabId === "tab-profile") renderCO2Graph();
  if (tabId === "tab-impact") initImpactTab();
}

document.querySelectorAll('.nav-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const targetTab = icon.getAttribute('data-tab');
    switchTabs(targetTab);
  });
});

//#endregion



//#region Eco Notifications Feature

// ----- Eco Notifications Feature -----
const ecoFacts = [
  "A single tree can absorb about 21 kg of CO₂ per year.",
  "Switching to LED bulbs can reduce your carbon footprint by up to 40 kg annually.",
  "Shortening your shower by 2 minutes can save up to 40 liters of water each time.",
  "Using public transport once a week can cut emissions by over 400 kg per year.",
  "Planting native trees supports biodiversity and reduces CO₂ levels.",
  "Turning off devices completely can save 10% of household electricity.",
  "An electric vehicle emits 50% less CO₂ than a petrol car over its lifetime.",
  "Composting organic waste reduces methane emissions from landfills.",
  "Producing 1 kg of beef emits nearly 27 kg of CO₂ — try a plant-based meal!",
  "Using reusable bottles and cups can save 100+ plastic items per person yearly."
];

// Ask for permission to send notifications
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Sorry, your browser does not support notifications.");
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      console.log("Eco notifications enabled.");
      startEcoNotifications();
    } else {
      console.log("Notifications denied or ignored by user.");
    }
  });
}

// Send a random eco fact as notification
function sendRandomNotification() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const randomFact = ecoFacts[Math.floor(Math.random() * ecoFacts.length)];
  const notification = new Notification("🌱 EcoSathi Tip", {
    body: randomFact,
    icon: "Images/earth.png"
  });

  notification.onclick = () => window.focus();
}

// Automatically show eco tips periodically
function startEcoNotifications() {
  sendRandomNotification(); // Show one immediately
  setInterval(sendRandomNotification, 720000); // Every 2 hours
}

// Automatically ask permission on page load
window.addEventListener("load", () => {
  requestNotificationPermission();
});

//#endregion



//#region Result Popup Handling

// ----- Result Popup Handling -----
function showPopup(contentHTML) {
  document.getElementById("popupResult").innerHTML = contentHTML;
  document.getElementById("resultPopup").style.display = "block";
}

function closePopup() {
  document.getElementById("resultPopup").style.display = "none";
}

//#endregion



//#region CO2 Calculation and History Management

// ----- Calculate CO2 Emissions and EcoScore -----
function calculateCO2() {
  // Collect inputs
  let electricity = parseFloat(document.getElementById("electricity").value);
  let water = parseFloat(document.getElementById("water").value);
  let distance = parseFloat(document.getElementById("distance").value);
  let transport = document.getElementById("transport").value;
  let trees = parseInt(document.getElementById("trees").value);
  let reuse = document.getElementById("reuse").value;
  let solar = document.getElementById("solar").value;
  let segregate = document.getElementById("segregate").value;
  let lights = document.getElementById("lights").value;

  // --- Emission Factors ---
  let EF_elec = 757, EF_water = 0.4, EF_tree = 1800;

  let EF_walk = 0, EF_bike = 60, EF_car = 210, EF_bus = 15, EF_train = 50, EF_ev = 110;
  let EF_transport = 0;
  if (transport === "Walking / Bicycle") EF_transport = EF_walk;
  else if (transport === "Two-Wheeler") EF_transport = EF_bike;
  else if (transport === "Car") EF_transport = EF_car;
  else if (transport === "Bus") EF_transport = EF_bus;
  else if (transport === "Train") EF_transport = EF_train;
  else if (transport === "Electric Vehicle") EF_transport = EF_ev;

  // --- CO₂ Calculation ---
  let dailyElecCO2 = (electricity/30) * EF_elec;
  let waterCO2 = water * EF_water;
  let travelCO2 = distance * EF_transport;
  let treeOffset = trees * (EF_tree/30);
  let totalCO2 = dailyElecCO2 + waterCO2 + travelCO2 - treeOffset;
  if (solar === "Yes") totalCO2 -= (83000/30);
  if (segregate === "Yes") totalCO2 -= (10000/30);
  if (reuse === "Yes") totalCO2 -= (6300/30);
  if (lights === "Always") totalCO2 -= (2200/30);
  else if (lights === "Sometimes") totalCO2 -= ((2200/3)/30);
  if (totalCO2 < 0) totalCO2 = 0;

  // --- Tier Message ---
  let scoreText = "";
  if (totalCO2 < 3000) scoreText = "🌿 Excellent (Very Low Emissions)";
  else if (totalCO2 < 6000) scoreText = "😊 Good (Low Emissions)";
  else if (totalCO2 < 9000) scoreText = "😐 Moderate (Room for Improvement)";
  else if (totalCO2 < 12000) scoreText = "⚠️ Poor (High Emissions)";
  else scoreText = "🚨 Very Poor (Very High Emissions)";

  // Update Profile Score Display
  document.getElementById("lastCalculatedCO2").innerText = Math.round(totalCO2);

  // ----- Creating Result Object to Store in JSON -----
  const result = {
    date: new Date().toISOString(),
    electricity, water, distance, transport, trees,
    reuse, solar, segregate, lights,
    totalCO2: Math.round(totalCO2),
    scoreText
  };

  // Save to LocalStorage
  let history = JSON.parse(localStorage.getItem("ecoHistory")) || [];
  history.push(result);
  localStorage.setItem("ecoHistory", JSON.stringify(history));

  // Show Popup
  showPopup(
    `<h3>Your Eco Score</h3>
    <p><b>Estimated Daily CO₂:</b> ${result.totalCO2} g</p>
    <p><b>Rating:</b> ${result.scoreText}</p>`
  );
}

//#endregion



//#region Table and Graph Rendering

// Table Rendering
function renderHistoryTable() {
  const tableBody = document.querySelector("#historyTable tbody");
  tableBody.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("ecoHistory")) || [];
  history.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.totalCO2}</td>
      <td>${entry.transport}</td>
      <td>${entry.electricity}</td>
      <td>${entry.water}</td>
      <td>${entry.trees}</td>`;
    tableBody.appendChild(row);
  });
}

// Render Graph
function renderCO2Graph() {
  ctx = document.getElementById("co2Chart");
  Chart.defaults.global.defaultFontColor = 'rgba(54, 34, 1, 1)';
  const history = JSON.parse(localStorage.getItem("ecoHistory")) || [];
  const dates = history.map(entry => {
    const d = new Date(entry.date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  });
  const co2Values = history.map(entry => Number(entry.totalCO2));

// New Chart Instance
new Chart(ctx, {
  type: 'line',
  data: {
    labels: dates,
    datasets: [{
      label: 'Daily CO₂ (g)',
      data: co2Values,
      backgroundColor: '#331900ff',
      borderColor: '#0e5300ff',
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    scales: {
      yAxes: [{ticks: {min: 0, max:20000, stepSize: 2000},}]
    },
    legend: {                  
      labels: {
        fontSize: 18,          
      }
    },
  }
});
}

//#endregion



//#region JSON Download and Clear History

// JSON Download
function downloadJSONFile() {
  const data = localStorage.getItem("ecoHistory");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eco_history.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Clear History
function clearHistory() {
  if (confirm("Are you sure you want to delete your eco history?")) {
    localStorage.removeItem("ecoHistory");
    renderHistoryTable();
  }
}

//#endregion



//#region AI Chat Integration

// Function to send user input to backend and display the AI response
document.getElementById("send-btn").addEventListener("click", async () => {
  const userInput = document.getElementById("user-input").value.trim();
  if (!userInput) return;

  // Display user message
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML += `
    <div class="message user-message">
      <div class="message-content">${userInput}</div>
    </div>
  `;
  document.getElementById("user-input").value = "";

  // Send message to backend API
  try {
    const response = await fetch("https://ecosathi-project-backend.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userInput }),
    });

    const data = await response.json();

    // Display AI message
    chatBox.innerHTML += `
      <div class="message ai-message">
        <div class="message-content">${data.reply}</div>
      </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
  } catch (error) {
    chatBox.innerHTML += `
      <div class="message ai-message">
        <div class="message-content error">Error contacting AI service.</div>
      </div>
    `;
    console.error("Error:", error);
  }
});


// Format AI reply with line breaks
const formattedReply = data.reply.replace(/\n/g, "<br>");
chatBox.innerHTML += `
  <div class="message ai-message">
    <div class="message-content">${formattedReply}</div>
  </div>
`;

//#endregion



//#region Impact Tab Features

// ----- IMPACT TAB FEATURES -----

// 1️⃣ Daily Eco Challenge
const challengeList = document.getElementById("challengeList");
const ecoStreakDisplay = document.getElementById("ecoStreak");

document.addEventListener("DOMContentLoaded", () => {
  loadChallenges();
  resetChallengesIfNewDay();
});

function toggleChallenge(input) {
  const li = input.closest("li");
  li.classList.toggle("completed", input.checked);
  saveChallenges();

  if (areAllChallengesDone()) {
    incrementStreak();
  }
}

function saveChallenges() {
  const states = Array.from(challengeList.querySelectorAll("input")).map(
    (input) => input.checked
  );
  localStorage.setItem("challengeStates", JSON.stringify(states));
  localStorage.setItem("lastCompletedDate", new Date().toDateString());
}

function loadChallenges() {
  const savedStates = JSON.parse(localStorage.getItem("challengeStates"));
  if (savedStates) {
    const inputs = challengeList.querySelectorAll("input");
    inputs.forEach((input, i) => {
      input.checked = savedStates[i];
      input.closest("li").classList.toggle("completed", input.checked);
    });
  }
  ecoStreakDisplay.textContent = localStorage.getItem("ecoStreak") || 0;
}

function areAllChallengesDone() {
  return Array.from(challengeList.querySelectorAll("input")).every(
    (input) => input.checked
  );
}

function incrementStreak() {
  let streak = parseInt(localStorage.getItem("ecoStreak") || "0");
  streak++;
  localStorage.setItem("ecoStreak", streak);
  ecoStreakDisplay.textContent = streak;
}

function resetChallengesIfNewDay() {
  const lastDate = localStorage.getItem("lastCompletedDate");
  const today = new Date().toDateString();

  if (lastDate !== today) {
    const inputs = challengeList.querySelectorAll("input");
    inputs.forEach((input) => {
      input.checked = false;
      input.closest("li").classList.remove("completed");
    });
    localStorage.setItem("challengeStates", JSON.stringify([]));
  }
}


// 2️⃣ Eco Pledge Board
function addPledge() {
  const input = document.getElementById("pledgeInput");
  if (!input.value.trim()) return;
  const pledges = JSON.parse(localStorage.getItem("ecoPledges")) || [];
  pledges.push(input.value.trim());
  localStorage.setItem("ecoPledges", JSON.stringify(pledges));
  input.value = "";
  renderPledges();
}

function renderPledges() {
  const list = document.getElementById("pledgeList");
  const pledges = JSON.parse(localStorage.getItem("ecoPledges")) || [];
  list.innerHTML = pledges.map(p => `<li>• ${p}</li>`).join("");
}

// 3️⃣ Water Saver Reminder
function sendWaterReminder() {
  if (Notification.permission !== "granted") return;
  new Notification("💧 Water Reminder", { body: "Turn off the tap while brushing or washing dishes!" });
}
setInterval(sendWaterReminder, 10800000); // every 3 hours

// 4️⃣ Eco Tip Sharing
function shareEcoTip() {
  const randomTip = challenges[Math.floor(Math.random() * challenges.length)];
  if (navigator.share) {
    navigator.share({ title: "EcoSathi Tip 🌱", text: randomTip });
  } else {
    alert(randomTip);
  }
}

// 5️⃣ Carbon Offset Tracker
function updateOffsetDisplay(value = 0) {
  document.getElementById("offsetText").textContent =
    `You’d need approximately ${Math.ceil(value / 1800)} tree(s) to offset your daily footprint.`;
}

// Hook into your CO2 calculator result
const oldCalculate = calculateCO2;
calculateCO2 = function() {
  oldCalculate();
  const last = JSON.parse(localStorage.getItem("ecoHistory"))?.slice(-1)[0];
  if (last) updateOffsetDisplay(last.totalCO2);
};

// 6️⃣ Community Message Board
function postMessage() {
  const input = document.getElementById("messageInput");
  if (!input.value.trim()) return;
  const messages = JSON.parse(localStorage.getItem("ecoMessages")) || [];
  messages.push({ text: input.value.trim(), date: new Date().toLocaleString() });
  localStorage.setItem("ecoMessages", JSON.stringify(messages.slice(-10))); // keep last 10
  input.value = "";
  renderMessages();
}

function renderMessages() {
  const list = document.getElementById("messageList");
  const messages = JSON.parse(localStorage.getItem("ecoMessages")) || [];
  list.innerHTML = messages.map(m => `<li><b>${m.date}:</b> ${m.text}</li>`).join("");
}

// 7️⃣ Eco Mood Tracker
function setMood(icon) {
  const moods = JSON.parse(localStorage.getItem("ecoMoods")) || [];
  moods.push({ icon, date: new Date().toLocaleDateString() });
  localStorage.setItem("ecoMoods", JSON.stringify(moods.slice(-7)));
  renderMoodChart();
}

function renderMoodChart() {
  const ctx = document.getElementById("moodChart").getContext("2d");
  const moods = JSON.parse(localStorage.getItem("ecoMoods")) || [];
  const labels = moods.map(m => m.date);
  const values = moods.map(m => ["😔","😐","🌿","😊"].indexOf(m.icon)+1);
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Eco Mood", data: values, borderColor: "#2e7d32", fill: false }]
    },
    options: { scales: { yAxes: [{ ticks: { stepSize: 1, min: 0, max: 4 } }] } }
  });
}

// Initialise when Impact tab opens
function initImpactTab() {
  loadDailyChallenge();
  renderPledges();
  renderMessages();
  renderMoodChart();
}

//#endregion