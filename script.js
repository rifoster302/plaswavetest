let plasmaData = [];
let centerMarkers = [];

// === Initialize Leaflet map ===
const map = L.map('map').setView([38.89511, -77.03637], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// === Custom Pin ===
const customGreenPin = L.icon({
  iconUrl: 'assets/new_pin_icon.png',
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -40],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// === Load Center Data ===
fetch("dmv_plasma_centers.json")
  .then(response => response.json())
  .then(data => {
    plasmaData = data;
    renderCenters(plasmaData);
  })
  .catch(err => {
    console.error("Failed to load plasma center data:", err);
  });

// === Render Center Markers ===
function renderCenters(data, minIncentive = 0) {
  centerMarkers.forEach(marker => map.removeLayer(marker));
  centerMarkers = [];

  data.forEach(center => {
    const incentiveAmount = parseInt(center.incentive.replace(/\D/g, "")) || 0;

    if (incentiveAmount >= minIncentive) {
      const marker = L.marker([center.lat, center.lon], { icon: customGreenPin }).addTo(map);
      marker.bindPopup(`
        <strong>${center.name}</strong><br/>
        ${center.address}<br/>
        <em>${center.incentive}</em><br/>
        <a href="${center.signup}" target="_blank" onclick="trackUrlClick()">Sign Up</a>
      `);
      marker.on('click', trackPinClick);
      centerMarkers.push(marker);
    }
  });
}

// === Incentive Filter ===
const filterDropdown = document.getElementById("filter");
if (filterDropdown) {
  filterDropdown.addEventListener("change", (e) => {
    const min = parseInt(e.target.value) || 0;
    renderCenters(plasmaData, min);
  });
}

// === Location Access Button ===
const allowLocationBtn = document.getElementById("allowLocationBtn");

if (allowLocationBtn) {
  allowLocationBtn.addEventListener("click", () => {
    const locationModal = document.getElementById("locationModal");
    locationModal.classList.add("hidden");

    // ✅ Mark that the user has started a session
    localStorage.setItem('plaswave_sessionStarted', 'true');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          map.setView([userLat, userLon], 13);

          L.circleMarker([userLat, userLon], {
            radius: 8,
            fillColor: "#FFD700",
            color: "#000",
            weight: 2,
            fillOpacity: 1
          }).addTo(map)
            .bindPopup("📍 You are here")
            .openPopup()
            .bringToFront();

          openQuestionnaire();
        },
        error => {
          console.warn("Geolocation failed:", error);
          alert("We couldn't access your location. You can still browse centers manually!");
          openQuestionnaire();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      alert("Geolocation not supported. Proceeding manually.");
      openQuestionnaire();
    }
  });
}

// === Open Questionnaire Modal ===
function openQuestionnaire() {
  // Only allow questionnaire if session started and not already shown
  if (localStorage.getItem('plaswave_sessionStarted') !== 'true') {
    return; // user never clicked Allow
  }
  if (localStorage.getItem('plaswave_questionnaireShown') === 'true') {
    return; // questionnaire already shown
  }

  const locationModal = document.getElementById("locationModal");
  if (locationModal && !locationModal.classList.contains('hidden')) {
    locationModal.classList.add("hidden");
  }

  const qModal = document.getElementById("questionnaireModal");
  if (qModal) {
    qModal.classList.remove("hidden");
  }

  // ✅ Mark questionnaire as shown
  localStorage.setItem('plaswave_questionnaireShown', 'true');
}

// === Notification Modal Logic ===
const modal = document.createElement("div");
modal.id = "notificationModal";
modal.classList.add("hidden");
modal.innerHTML = `<img src="assets/PlasWave-FAQ1.png" alt="PlasWave FAQ">`;
document.body.appendChild(modal);

const notificationBtn = document.getElementById("notificationBtn");
const bubble = document.querySelector(".notification-bubble");

if (notificationBtn) {
  notificationBtn.addEventListener("click", () => {
    bubble.style.display = "none";
    modal.classList.remove("hidden");
  });
}

modal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// === 🚀 Site Visit Tracking ===
if (!localStorage.getItem('plaswave_firstVisit')) {
  localStorage.setItem('plaswave_firstVisit', Date.now());
}
if (localStorage.getItem('plaswave_visits')) {
  localStorage.setItem('plaswave_visits', Number(localStorage.getItem('plaswave_visits')) + 1);
} else {
  localStorage.setItem('plaswave_visits', 1);
}

// === 🚀 Pin and URL Tracking Functions ===
function trackPinClick() {
  if (localStorage.getItem('plaswave_pinClicks')) {
    localStorage.setItem('plaswave_pinClicks', Number(localStorage.getItem('plaswave_pinClicks')) + 1);
  } else {
    localStorage.setItem('plaswave_pinClicks', 1);
  }
}

function trackUrlClick() {
  if (localStorage.getItem('plaswave_urlClicks')) {
    localStorage.setItem('plaswave_urlClicks', Number(localStorage.getItem('plaswave_urlClicks')) + 1);
  } else {
    localStorage.setItem('plaswave_urlClicks', 1);
  }
}

// === 🚀 Secret Admin Activation (Ctrl+Alt+P) ===
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "p") {
    const adminBtn = document.getElementById("adminStatsBtn");
    if (adminBtn) {
      adminBtn.classList.remove("hidden");
      alert("Admin Mode Activated! 📈");
    }
  }
});

// === 🚀 Admin Stats Button Logic ===
const adminStatsBtn = document.getElementById("adminStatsBtn");
if (adminStatsBtn) {
  adminStatsBtn.addEventListener("click", () => {
    const password = prompt("Enter admin password:");
    if (password === "plaswave2025") {
      updateStatsDashboard();
      document.getElementById("adminStatsModal").classList.remove("hidden");
    } else {
      alert("Incorrect password.");
    }
  });
}

// === 🚀 Stats Dashboard Calculation ===
function updateStatsDashboard() {
  const firstVisit = Number(localStorage.getItem('plaswave_firstVisit')) || Date.now();
  const now = Date.now();
  const daysElapsed = Math.max((now - firstVisit) / (1000 * 60 * 60 * 24), 1);
  const weeksElapsed = daysElapsed / 7;
  const monthsElapsed = daysElapsed / 30;

  const visits = Number(localStorage.getItem('plaswave_visits')) || 0;
  const pins = Number(localStorage.getItem('plaswave_pinClicks')) || 0;
  const urls = Number(localStorage.getItem('plaswave_urlClicks')) || 0;

  document.getElementById('visitStats').innerHTML = `
    Total Visits: <strong>${visits}</strong><br/>
    Visits per Day: ${(visits / daysElapsed).toFixed(2)}<br/>
    Visits per Week: ${(visits / weeksElapsed).toFixed(2)}<br/>
    Visits per Month: ${(visits / monthsElapsed).toFixed(2)}
  `;

  document.getElementById('pinStats').innerHTML = `
    Total Pin Clicks: <strong>${pins}</strong><br/>
    Pins per Day: ${(pins / daysElapsed).toFixed(2)}<br/>
    Pins per Week: ${(pins / weeksElapsed).toFixed(2)}<br/>
    Pins per Month: ${(pins / monthsElapsed).toFixed(2)}
  `;

  document.getElementById('urlStats').innerHTML = `
    Total URL Clicks: <strong>${urls}</strong><br/>
    URLs per Day: ${(urls / daysElapsed).toFixed(2)}<br/>
    URLs per Week: ${(urls / weeksElapsed).toFixed(2)}<br/>
    URLs per Month: ${(urls / monthsElapsed).toFixed(2)}
  `;
}
