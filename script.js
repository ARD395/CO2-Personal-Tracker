// Switches tabs dynamically
function switchTabs(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active-tab');
  });

  // Remove active icon highlight
  document.querySelectorAll('.nav-icon').forEach(icon => {
    icon.classList.remove('active-icon');
  });

  // Show the selected tab
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active-tab');

  // Highlight the corresponding icon
  const targetIcon = document.querySelector(`.nav-icon[data-tab="${tabId}"]`);
  if (targetIcon) targetIcon.classList.add('active-icon');
}

// Attach click handlers
document.querySelectorAll('.nav-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const targetTab = icon.getAttribute('data-tab');
    switchTabs(targetTab);
  });
});

function calculateCO2() {
// Collect input values
let electricity = parseFloat(document.getElementById("electricity").value);
let water = parseFloat(document.getElementById("water").value);
let distance = parseFloat(document.getElementById("distance").value);
let transport = document.getElementById("transport").value;
let trees = parseInt(document.getElementById("trees").value);
let reuse = document.getElementById("reuse").value;
let solar = document.getElementById("solar").value;
let segregate = document.getElementById("segregate").value;
let lights = document.getElementById("lights").value;

// --- Emission Factors (approx. India averages) ---
let EF_elec = 713;       // g CO₂ per kWh
let EF_water = 0.15;     // g CO₂ per litre (150 g/m³)
let EF_tree = 10000;     // g CO₂ absorbed per tree/year (~10 kg)
let EF_walk = 0;
let EF_bike = 55;        // g/km (two-wheeler)
let EF_car = 122;        // g/km (average petrol car)
let EF_bus = 80;         // g/km (per passenger)
let EF_train = 45;       // g/km (per passenger)
let EF_ev = 40;          // g/km (electric vehicle, considering grid)


// --- Select emission factor based on transport ---
let EF_transport = 0;
if (transport === "Walking / Bicycle") EF_transport = EF_walk;
else if (transport === "Two-Wheeler") EF_transport = EF_bike;
else if (transport === "Car") EF_transport = EF_car;
else if (transport === "Bus") EF_transport = EF_bus;
else if (transport === "Train") EF_transport = EF_train;
else if (transport === "Electric Vehicle") EF_transport = EF_ev;


// --- Core CO₂ Calculation (grams) ---
// Assume electricity usage is monthly → convert to daily (divide by 30)
let dailyElecCO2 = (electricity / 30) * EF_elec;
let waterCO2 = water * EF_water;
let travelCO2 = distance * EF_transport;
let treeOffset = trees * (EF_tree / 365); // per day
let totalCO2 = dailyElecCO2 + waterCO2 + travelCO2 - treeOffset;
// --- Adjust for habits (reductions) ---
if (solar === "Yes") totalCO2 *= 0.9;
if (segregate === "Yes") totalCO2 *= 0.95;
if (reuse === "Yes") totalCO2 *= 0.95;
if (lights === "Always") totalCO2 *= 0.9;
else if (lights === "Sometimes") totalCO2 *= 0.95;


// --- Ensure non-negative ---
if (totalCO2 < 0) totalCO2 = 0;


// --- Determine Eco Score Tier ---
let scoreText = "";
if (totalCO2 < 3000) scoreText = "🌿 Excellent (Very Low Emissions)";
else if (totalCO2 < 6000) scoreText = "😊 Good (Low Emissions)";
else if (totalCO2 < 9000) scoreText = "😐 Moderate (Room for Improvement)";
else if (totalCO2 < 12000) scoreText = "⚠️ Poor (High Emissions)";
else scoreText = "🚨 Very Poor (Very High Emissions)";


document.getElementById("result").innerHTML =
 `<b>Your estimated daily CO₂ emission:</b> ${Math.round(totalCO2)} grams<br>
  <b>Eco Score:</b> ${scoreText}`;
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
