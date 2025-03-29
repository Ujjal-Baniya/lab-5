
let map;
let marker;
let watchId;

const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const topicInput = document.getElementById('topic');
const connectBtn = document.getElementById('connectBtn');
const shareBtn = document.getElementById('shareBtn');
const statusDiv = document.getElementById('status');

function initMap() {
    map = L.map('map').setView([51.0447, -114.0719], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    console.log("Map initialized successfully");
}

function startWatchingPosition() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const coords = position.coords;
                console.log("Current position: ", coords.latitude, coords.longitude);
                
                map.setView([coords.latitude, coords.longitude], 15);
                
                if (!marker) {
                    marker = L.marker([coords.latitude, coords.longitude]).addTo(map);
                    marker.bindPopup("My current location").openPopup();
                } else {
                    marker.setLatLng([coords.latitude, coords.longitude]);
                }
            },
            (error) => {
                console.error("Geolocation error: ", error);
                updateStatus("Geolocation error: " + error.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            }
        );
    } else {
        updateStatus("Geolocation is not supported by this browser.");
    }
}

function updateStatus(message) {
    statusDiv.textContent = "Status: " + message;
    console.log("Status updated:", message);
}

function init() {
    topicInput.value = 'ENGO651/ujjal_baniya/my_temperature';
    initMap();
    
    startWatchingPosition();
    
    console.log("Application initialized with geolocation");
}

document.addEventListener('DOMContentLoaded', init);