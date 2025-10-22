// --- Tab Switching (unchanged) ---
function switchTabs(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab'));
  document.querySelectorAll('.nav-icon').forEach(icon => icon.classList.remove('active-icon'));
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active-tab');
  const targetIcon = document.querySelector(`.nav-icon[data-tab="${tabId}"]`);
  if (targetIcon) targetIcon.classList.add('active-icon');
  if (tabId === "tab-profile") renderHistoryTable();
}

document.querySelectorAll('.nav-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const targetTab = icon.getAttribute('data-tab');
    switchTabs(targetTab);
  });
});

// --- Popup Handling ---
function showPopup(contentHTML) {
  document.getElementById("popupResult").innerHTML = contentHTML;
  document.getElementById("resultPopup").style.display = "block";
}
function closePopup() {
  document.getElementById("resultPopup").style.display = "none";
}

// --- CO₂ Calculator ---
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
  let EF_elec = 713, EF_water = 0.15, EF_tree = 10000;
  let EF_walk = 0, EF_bike = 55, EF_car = 122, EF_bus = 80, EF_train = 45, EF_ev = 40;

  let EF_transport = 0;
  if (transport === "Walking / Bicycle") EF_transport = EF_walk;
  else if (transport === "Two-Wheeler") EF_transport = EF_bike;
  else if (transport === "Car") EF_transport = EF_car;
  else if (transport === "Bus") EF_transport = EF_bus;
  else if (transport === "Train") EF_transport = EF_train;
  else if (transport === "Electric Vehicle") EF_transport = EF_ev;

  // --- CO₂ Calculation ---
  let dailyElecCO2 = (electricity / 30) * EF_elec;
  let waterCO2 = water * EF_water;
  let travelCO2 = distance * EF_transport;
  let treeOffset = trees * (EF_tree / 365);
  let totalCO2 = dailyElecCO2 + waterCO2 + travelCO2 - treeOffset;

  if (solar === "Yes") totalCO2 *= 0.9;
  if (segregate === "Yes") totalCO2 *= 0.95;
  if (reuse === "Yes") totalCO2 *= 0.95;
  if (lights === "Always") totalCO2 *= 0.9;
  else if (lights === "Sometimes") totalCO2 *= 0.95;
  if (totalCO2 < 0) totalCO2 = 0;

  // --- Tier Message ---
  let scoreText = "";
  if (totalCO2 < 3000) scoreText = "🌿 Excellent (Very Low Emissions)";
  else if (totalCO2 < 6000) scoreText = "😊 Good (Low Emissions)";
  else if (totalCO2 < 9000) scoreText = "😐 Moderate (Room for Improvement)";
  else if (totalCO2 < 12000) scoreText = "⚠️ Poor (High Emissions)";
  else scoreText = "🚨 Very Poor (Very High Emissions)";

  // --- Result Object ---
  const result = {
    date: new Date().toLocaleString(),
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
  showPopup(`<h3>Your Eco Score</h3>
    <p><b>Estimated Daily CO₂:</b> ${result.totalCO2} g</p>
    <p><b>Rating:</b> ${result.scoreText}</p>`);
}

// --- Table Rendering ---
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

// --- JSON Download ---
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

// --- Clear History ---
function clearHistory() {
  if (confirm("Are you sure you want to delete your eco history?")) {
    localStorage.removeItem("ecoHistory");
    renderHistoryTable();
  }
}


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




const formattedReply = data.reply.replace(/\n/g, "<br>");
chatBox.innerHTML += `
  <div class="message ai-message">
    <div class="message-content">${formattedReply}</div>
  </div>
`;
