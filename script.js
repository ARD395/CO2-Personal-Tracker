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
