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
  popupAnchor: [0, -40],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// === Ask for Geolocation Permission (Mobile-safe) ===
const allowLocationBtn = document.getElementById("allowLocationBtn");
const denyLocationBtn = document.getElementById("denyLocationBtn");

if (allowLocationBtn) {
  allowLocationBtn.addEventListener("click", () => {
    document.getElementById("locationModal").classList.add("hidden");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userLat = pos.coords.latitude;
          const userLon = pos.coords.longitude;
    
          map.setView([userLat, userLon], 13);
    
          L.circleMarker([userLat, userLon], {
            radius: 8,
            fillColor: "#FFD700",
            color: "#000",
            weight: 2,
            fillOpacity: 1
          }).addTo(map)
            .bindPopup("📍 You are here")
            .bringToFront();
        },
        err => {
          console.warn("Geolocation failed:", err);
          alert("We couldn't access your location. You can still explore centers manually.");
        },
        {
          enableHighAccuracy: false,   // 🛠 faster by default
          timeout: 5000,               // 🛠 lower timeout (5 sec)
          maximumAge: 60000            // 🛠 only accept location within last minute
        }
      );
    }
  });
} // 🛠 CLOSE the allowLocationBtn block here!

if (denyLocationBtn) {
  denyLocationBtn.addEventListener("click", () => {
    document.getElementById("locationModal").classList.add("hidden");
    alert("No problem! You can scroll around the map manually.");
  });
}

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

      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <strong>${center.name}</strong><br/>
        ${center.address}<br/>
        <em>${center.incentive}</em><br/>
        <a href="${center.signup}" target="_blank">Sign Up</a>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', trackPinClick);

      popupContent.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          trackUrlClick();
        }
      });

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

// === 🚀 Site Visit Tracking (local storage fallback) ===
if (!localStorage.getItem('plaswave_firstVisit')) {
  localStorage.setItem('plaswave_firstVisit', Date.now());
}
if (localStorage.getItem('plaswave_visits')) {
  localStorage.setItem('plaswave_visits', Number(localStorage.getItem('plaswave_visits')) + 1);
} else {
  localStorage.setItem('plaswave_visits', 1);
}

// === 🚀 Pin and URL Tracking (local storage + Umami) ===
function trackPinClick() {
  if (localStorage.getItem('plaswave_pinClicks')) {
    localStorage.setItem('plaswave_pinClicks', Number(localStorage.getItem('plaswave_pinClicks')) + 1);
  } else {
    localStorage.setItem('plaswave_pinClicks', 1);
  }

  if (typeof umami !== "undefined") {
    umami.track("Pin Click");
  }
}

function trackUrlClick() {
  if (localStorage.getItem('plaswave_urlClicks')) {
    localStorage.setItem('plaswave_urlClicks', Number(localStorage.getItem('plaswave_urlClicks')) + 1);
  } else {
    localStorage.setItem('plaswave_urlClicks', 1);
  }

  if (typeof umami !== "undefined") {
    umami.track("Sign Up URL Click");
  }
}
