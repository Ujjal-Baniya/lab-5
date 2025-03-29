
let map;
let marker;

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

function init() {
    topicInput.value = 'ENGO651/ujjal_baniya/my_temperature';
    
    initMap();
    
    console.log("Application initialized");
}

document.addEventListener('DOMContentLoaded', init);