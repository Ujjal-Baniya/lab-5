
let map;
let marker;
let watchId;
let client;
let isConnected = false;

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

function toggleConnection() {
    if (isConnected) {
        disconnect();
    } else {
        connect();
    }
}

function connect() {
    const host = hostInput.value;
    const port = parseInt(portInput.value);
    const clientId = "clientId-" + Math.random().toString(16).substr(2, 8);
    
    hostInput.disabled = true;
    portInput.disabled = true;
    topicInput.disabled = true;
    
    client = new Paho.MQTT.Client(host, port, clientId);
    
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    
    const connectOptions = {
        onSuccess: onConnect,
        onFailure: onFailure,
        useSSL: true,
        reconnect: true
    };
    
    client.connect(connectOptions);
    
    updateStatus("Connecting...", "connecting");
}

function disconnect() {
    if (client && isConnected) {
        client.disconnect();
        isConnected = false;
        connectBtn.textContent = "Start Connection";
        connectBtn.classList.remove("btn-danger");
        connectBtn.classList.add("btn-success");
        shareBtn.disabled = true;
        updateStatus("Disconnected", "disconnected");
        
        hostInput.disabled = false;
        portInput.disabled = false;
        topicInput.disabled = false;
    }
}

function onConnect() {
    isConnected = true;
    connectBtn.textContent = "End Connection";
    connectBtn.classList.remove("btn-success");
    connectBtn.classList.add("btn-danger");
    shareBtn.disabled = false;
    
    const topic = topicInput.value;
    client.subscribe(topic);
    updateStatus(`Connected to ${topic}`, "connected");
    
    startWatchingPosition();
}

function onFailure(error) {
    updateStatus("Connection failed: " + error.errorMessage, "disconnected");
    hostInput.disabled = false;
    portInput.disabled = false;
    topicInput.disabled = false;
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        updateStatus("Connection lost: " + responseObject.errorMessage, "disconnected");
    }
    isConnected = false;
    connectBtn.textContent = "Start Connection";
    connectBtn.classList.remove("btn-danger");
    connectBtn.classList.add("btn-success");
    shareBtn.disabled = true;
    
    hostInput.disabled = false;
    portInput.disabled = false;
    topicInput.disabled = false;
}

function init() {
    topicInput.value = 'ENGO651/ujjal_baniya/my_temperature';
    initMap();
    
    connectBtn.addEventListener('click', toggleConnection);
    
    console.log("Application initialized with MQTT connection");
}

document.addEventListener('DOMContentLoaded', init);