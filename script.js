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

const ecoReminders = [
  "Turn off the lights when you leave the room.",
  "Unplug chargers and devices not in use to save energy.",
  "Carry a reusable water bottle instead of buying plastic ones.",
  "Reduce paper waste — go digital whenever possible.",
  "Use public transport, carpool, or cycle to lower carbon emissions.",
  "Sort and recycle your household waste properly.",
  "Plant a tree or nurture a small garden at home.",
  "Avoid fast fashion — choose sustainable clothing.",
  "Take shorter showers to conserve water.",
  "Bring your own bags when shopping.",
  "Buy local and seasonal produce to cut transport emissions.",
  "Compost kitchen scraps instead of throwing them away.",
  "Repair or donate items instead of discarding them.",
  "Use energy-efficient bulbs and appliances.",
  "Keep reusable cutlery or straws with you for meals on the go.",
  "Switch to eco-friendly cleaning products.",
  "Set your thermostat a few degrees lower in winter and higher in summer.",
  "Educate friends and family about sustainable habits.",
  "Choose products with minimal or recyclable packaging.",
  "Spend time in nature and appreciate the environment you’re protecting."
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

  const randomFact = ecoReminders[Math.floor(Math.random() * ecoReminders.length)];
  const notification = new Notification("🌱 EcoSathi Reminder", {
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
    date: new Date().toLocaleString('en-US', {
      weekday: 'long',    // e.g. Monday
      year: 'numeric',    // e.g. 2025
      month: 'long',      // e.g. November
      day: 'numeric',     // e.g. 3
      hour: '2-digit',    // e.g. 07
      minute: '2-digit',  // e.g. 45
    }),
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
    <p><b>Date:</b> ${result.date}</p>
    <p><b>Estimated Daily CO₂:</b> ${result.totalCO2} g</p>
    <p><b>Rating:</b> ${result.scoreText}</p>`
  );
}

//#endregion



//#region Facts Display

const ecoAwarenessFacts = [
  "Turning off lights when not in use can cut your electricity bill by 10%.",
  "One reusable water bottle can save over 1,500 plastic bottles per year.",
  "Recycling one aluminum can saves enough energy to run a TV for three hours.",
  "If every household replaced one incandescent bulb with an LED, billions of kilowatts could be saved annually.",
  "A dripping tap can waste over 5,000 litres of water in a year.",
  "Composting reduces the amount of waste sent to landfills and enriches the soil.",
  "Using public transport just once a week significantly reduces your carbon footprint.",
  "An idle car engine for 10 minutes wastes enough fuel to drive several kilometres.",
  "Planting trees helps combat climate change and improves air quality.",
  "Every piece of plastic ever made still exists somewhere on Earth.",
  "Producing recycled paper uses 70% less energy than producing new paper.",
  "Air-drying clothes can save hundreds of kilograms of CO₂ each year.",
  "Recycling a glass bottle saves enough energy to power a computer for 30 minutes.",
  "If everyone recycled their newspapers, millions of trees could be saved annually.",
  "Meat production contributes to more greenhouse gases than all transport combined.",
  "Turning off the tap while brushing your teeth can save up to 6 litres of water per minute.",
  "Walking or cycling short distances improves health and reduces pollution.",
  "Buying local produce reduces transportation emissions and supports farmers.",
  "Every tonne of recycled paper saves 17 trees and over 26,000 litres of water.",
  "Fast fashion is the second largest polluter after the oil industry.",
  "Switching to a laptop uses up to 80% less energy than a desktop computer.",
  "Reusing shopping bags can prevent hundreds of plastic bags from polluting oceans.",
  "Electronic waste is one of the fastest-growing waste streams globally.",
  "Producing one cotton shirt can require over 2,700 litres of water — enough for one person’s drinking needs for two years.",
  "Over 90% of the world’s seabirds have plastic in their stomachs.",
  "Eating more plant-based meals can cut your carbon footprint almost in half.",
  "Air pollution kills more people globally each year than tobacco smoking.",
  "Deforestation destroys an area roughly the size of a football field every second.",
  "Only about 9% of all plastic waste ever produced has been recycled.",
  "You have the power to change the world by changing just one daily habit."
];

const sustainabilityFacts = [
  "A mature tree can absorb more than 20 kilograms of carbon dioxide every year.",
  "Solar power could provide enough energy to power the entire Earth many times over.",
  "Bamboo can grow up to 3 feet in a single day — and absorbs more CO₂ than most trees.",
  "Wind energy has become the cheapest source of new power in many parts of the world.",
  "Recycling just one plastic bottle can save enough energy to power a light bulb for six hours.",
  "Tesla’s Gigafactories are designed to run entirely on renewable energy.",
  "Vertical gardens can reduce city temperatures and improve air quality.",
  "Some species of mushrooms can digest plastic waste naturally.",
  "Oceans absorb about 30% of the carbon dioxide produced by humans.",
  "Algae can produce 30 times more energy per acre than traditional biofuel crops.",
  "A single beehive can pollinate up to 300 million flowers a day.",
  "Hydroelectric power produces 16% of the world’s total electricity.",
  "There are over 1 billion bicycles in use worldwide — the most sustainable vehicle ever created.",
  "Some countries recycle over 90% of their plastic bottles — proving zero waste is possible.",
  "Every ton of recycled steel saves 1.8 barrels of oil and 2.5 tonnes of iron ore.",
  "Composting organic waste can reduce landfill volume by up to 30%.",
  "Electric vehicles emit up to 70% less CO₂ over their lifetime than petrol cars.",
  "Cities with more trees are up to 7°C cooler during summer heatwaves.",
  "Recycled aluminum retains 100% of its quality, no matter how many times it’s reused.",
  "Sweden recycles almost 99% of its household waste.",
  "Some modern buildings use rainwater harvesting systems to supply all their water needs.",
  "Green roofs can lower energy costs by up to 40%.",
  "Biodegradable plastics made from corn starch can break down in months instead of centuries.",
  "Wind turbines now power over 400 million homes globally.",
  "Solar rooftops could generate 25% of the world’s electricity demand.",
  "Seagrass meadows capture carbon 35 times faster than tropical rainforests.",
  "Urban farms can produce enough vegetables to feed entire neighbourhoods.",
  "Hydrogen fuel cells emit only water and warm air as by-products.",
  "Recycling rates are increasing globally thanks to youth-led movements.",
  "The future is circular — sustainability is not a trend, but a necessity."
];

function showEcoFact() {
  const fact = ecoAwarenessFacts[Math.floor(Math.random() * ecoAwarenessFacts.length)];
  document.getElementById("ecoFact").textContent = fact;
}

function showSustainFact() {
  const fact = sustainabilityFacts[Math.floor(Math.random() * sustainabilityFacts.length)];
  document.getElementById("sustainFact").textContent = fact;
}

// Show one of each when the page loads
document.addEventListener("DOMContentLoaded", () => {
  showEcoFact();
  showSustainFact();
});

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

// ----- DAILY ECO CHALLENGE LOGIC -----
const challengeList = document.getElementById("challengeList");
const ecoStreakDisplay = document.getElementById("ecoStreak");

document.addEventListener("DOMContentLoaded", () => {
  resetChallengesIfNewDay();
  loadChallenges();
});

// Toggle a single challenge
function toggleChallenge(input) {
  const li = input.closest("li");
  li.classList.toggle("completed", input.checked);
  saveChallenges();

  // If all are done, increment streak once per day
  if (areAllChallengesDone()) {
    incrementStreak();
  }
}

// Save current challenge states
function saveChallenges() {
  const states = Array.from(challengeList.querySelectorAll("input")).map(
    (input) => input.checked
  );
  localStorage.setItem("challengeStates", JSON.stringify(states));
  localStorage.setItem("lastCompletedDate", new Date().toDateString());
}

// Load saved challenge states and apply CSS
function loadChallenges() {
  const savedStates = JSON.parse(localStorage.getItem("challengeStates")) || [];
  const inputs = challengeList.querySelectorAll("input");

  inputs.forEach((input, i) => {
    input.checked = savedStates[i] || false;
    input.closest("li").classList.toggle("completed", input.checked);
  });

  ecoStreakDisplay.textContent = localStorage.getItem("ecoStreak") || 0;
}

// Check if all challenges are complete
function areAllChallengesDone() {
  return Array.from(challengeList.querySelectorAll("input")).every(
    (input) => input.checked
  );
}

// Increment streak
function incrementStreak() {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem("lastCompletedDate");

  // Prevent multiple increments in one day
  if (lastDate === today) return;

  let streak = parseInt(localStorage.getItem("ecoStreak") || "0", 10);
  streak++;
  localStorage.setItem("ecoStreak", streak);
  ecoStreakDisplay.textContent = streak;
  localStorage.setItem("lastCompletedDate", today);
}

// Reset all challenges if it’s a new day
function resetChallengesIfNewDay() {
  const lastDate = localStorage.getItem("lastCompletedDate");
  const today = new Date().toDateString();

  if (lastDate !== today) {
    localStorage.removeItem("challengeStates");
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
// ----- SHARE ECO TIP (copy to clipboard version) -----

function shareEcoTip() {
  // Combine facts and "did you know" lists
  const facts = [
    "Every ton of recycled paper saves 17 trees 🌳.",
    "LED bulbs use 80% less energy than incandescent lights 💡.",
    "A running tap wastes up to 6 litres of water per minute 🚰.",
    "Coral reefs support over 25% of marine species 🐠.",
    "Composting reduces landfill waste by up to 30% 🌾.",
    "Turning off electronics overnight saves up to 10% energy ⚡.",
    "One reusable bottle can replace 167 single-use bottles per year 🧴.",
    "Public transport cuts carbon emissions by 45% compared to driving 🚍.",
    "Planting just one tree can absorb about 22 kg of CO₂ per year 🌳.",
    "A four-minute shower uses about 40 litres of water 🚿."
  ];

  const didYouKnows = [
    "Did you know? Recycling one glass bottle saves enough energy to power a computer for 25 minutes 💻.",
    "Did you know? Only 9% of all plastic ever made has been recycled ♻️.",
    "Did you know? Bees are responsible for pollinating one-third of our food 🌸.",
    "Did you know? 80% of ocean pollution comes from land-based sources 🌊.",
    "Did you know? One mature tree can cool the air by up to 10°C 🌳.",
    "Did you know? If every household replaced one light bulb with an LED, billions of kWh could be saved yearly 💡.",
    "Did you know? Producing meat creates up to 10× more CO₂ than plants 🌱.",
    "Did you know? Air drying clothes saves energy and extends fabric life ☀️.",
    "Did you know? Fast fashion is responsible for 10% of global carbon emissions 👕.",
    "Did you know? Walking or cycling just 1 km instead of driving prevents 250g of CO₂ 🚶‍♀️."
  ];

  // Merge both lists
  const allTips = [...facts, ...didYouKnows];

  // Pick a random one
  const randomTip = allTips[Math.floor(Math.random() * allTips.length)];

  // Copy to clipboard
  navigator.clipboard.writeText(randomTip)
    .then(() => {
      alert(`✅ Copied to clipboard:\n\n"${randomTip}"`);
    })
    .catch(() => {
      alert("❌ Could not copy to clipboard — please try again.");
    });
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

// ----- PERSONAL ECO REMINDER (setTimeout version) -----

function addReminder() {
  const text = document.getElementById("reminderText").value.trim();
  const time = document.getElementById("reminderTime").value;

  if (!text || !time) {
    alert("Please enter both a reminder text and time!");
    return;
  }

  const reminders = JSON.parse(localStorage.getItem("ecoReminders")) || [];
  reminders.push({ text, time, triggered: false });
  localStorage.setItem("ecoReminders", JSON.stringify(reminders));

  document.getElementById("reminderText").value = "";
  document.getElementById("reminderTime").value = "";

  renderReminders();
  scheduleReminder(text, time);
}

// Display reminders
function renderReminders() {
  const list = document.getElementById("reminderList");
  const reminders = JSON.parse(localStorage.getItem("ecoReminders")) || [];

  if (reminders.length === 0) {
    list.innerHTML = "<li>No reminders set yet 🌿</li>";
    return;
  }

  list.innerHTML = reminders
    .map(
      (r, i) => `
      <li>
        <p>🕒 ${formatTime(r.time)} — ${r.text}</p>
        <button onclick="deleteReminder(${i})">❌</button>
      </li>`
    )
    .join("");
}

// Delete a reminder
function deleteReminder(index) {
  const reminders = JSON.parse(localStorage.getItem("ecoReminders")) || [];
  reminders.splice(index, 1);
  localStorage.setItem("ecoReminders", JSON.stringify(reminders));
  renderReminders();
}

// Schedule reminder to fire at the correct time
function scheduleReminder(text, time) {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);

  const target = new Date();
  target.setHours(h, m, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target - now; // milliseconds
  console.log(`⏰ Scheduling "${text}" in ${Math.round(delay / 1000 / 60)} min`);

  setTimeout(() => {
    showNotification("🌱 Eco Reminder", text);
    markReminderTriggered(time);
  }, delay);
}

// Mark reminder as triggered (to prevent duplicates)
function markReminderTriggered(time) {
  const reminders = JSON.parse(localStorage.getItem("ecoReminders")) || [];
  const updated = reminders.map(r => 
    r.time === time ? { ...r, triggered: true } : r
  );
  localStorage.setItem("ecoReminders", JSON.stringify(updated));
}

// Restore reminders after page refresh
document.addEventListener("DOMContentLoaded", () => {
  renderReminders();
  const reminders = JSON.parse(localStorage.getItem("ecoReminders")) || [];
  reminders.forEach(r => scheduleReminder(r.text, r.time));
});

// Show notification (handles permission)
function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  }
}

// Format time in AM/PM
function formatTime(time) {
  const [h, m] = time.split(":");
  const hours = ((+h + 11) % 12) + 1;
  const ampm = +h >= 12 ? "PM" : "AM";
  return `${hours}:${m} ${ampm}`;
}




// Initialise when Impact tab opens
function initImpactTab() {
  loadChallenges();
  renderPledges();
  renderMessages();
  renderMoodChart();
}

// ----- RESET IMPACT TAB -----
function resetImpactTab() {
  if (!confirm("Are you sure you want to reset all your eco progress?")) return;

  // Clear stored data
  localStorage.removeItem("challengeStates");
  localStorage.removeItem("ecoStreak");
  localStorage.removeItem("lastCompletedDate");
  localStorage.removeItem("ecoPledges");
  localStorage.removeItem("ecoMessages");
  localStorage.removeItem("ecoMoods");

  // Reset UI immediately
  challengeList.querySelectorAll("input").forEach((input) => {
    input.checked = false;
    const li = input.closest("li");
    if (li) li.classList.remove("completed");
  });

  ecoStreakDisplay.textContent = "0";

  // Refresh all eco tab elements
  renderPledges();
  renderMessages();
  renderMoodChart();
  updateOffsetDisplay(0);
  loadChallenges(); // ensures UI re-syncs

  alert("All eco progress has been reset 🌿");
}

//#endregion