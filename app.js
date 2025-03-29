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

function updateStatus(message, statusType) {
    statusDiv.textContent = "Status: " + message;
    console.log("Status updated:", message);
    
    statusDiv.classList.remove(
        "alert-success", "alert-danger", "alert-warning", 
        "connected-status", "disconnected-status", "connecting-status"
    );
    
    switch(statusType) {
        case "connected":
            statusDiv.classList.add("alert-success", "connected-status");
            break;
        case "disconnected":
            statusDiv.classList.add("alert-danger", "disconnected-status");
            break;
        case "connecting":
            statusDiv.classList.add("alert-warning", "connecting-status");
            break;
        default:
            statusDiv.classList.add("alert-secondary");
    }
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
        useSSL: port === 8081,
        keepAliveInterval: 60,
        cleanSession: true
    };
    
    try {
        client.connect(connectOptions);
        updateStatus("Connecting...", "connecting");
    } catch (error) {
        updateStatus("Connection error: " + error.message, "disconnected");
        hostInput.disabled = false;
        portInput.disabled = false;
        topicInput.disabled = false;
    }
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
    
    setTimeout(() => {
        if (!isConnected) {
            updateStatus("Attempting to reconnect...", "connecting");
            connect();
        }
    }, 5000);
}

function onMessageArrived(message) {
    console.log("Message received: ", message.payloadString);
    try {
        const payloadString = message.payloadString.trim();
        const data = JSON.parse(payloadString);
        if (data.type === "Feature" && data.geometry && data.geometry.type === "Point") {
            updateMapWithData(data);
        }
    } catch (e) {
        console.error("Error parsing message: ", e);
    }
}

function shareStatus() {
    if (!isConnected) return;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = position.coords;
                const temperature = getRandomTemperature();
                
                const geoJson = {
                    type: "Feature",
                    properties: {
                        temperature: temperature,
                        timestamp: new Date().toISOString(),
                        student: "Ujjal Baniya",
                        course: "ENGO651"
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [coords.longitude, coords.latitude]
                    }
                };
                
                const payload = JSON.stringify(geoJson);
                const message = new Paho.MQTT.Message(payload);
                message.destinationName = topicInput.value;
                client.send(message);
                
                updateStatus(`Status shared (${temperature}°C)`, "connected");
                
                if (marker) {
                    marker.setIcon(getTemperatureIcon(temperature));
                    marker.bindPopup(`Current temperature: ${temperature}°C`).openPopup();
                }
            },
            (error) => {
                console.error("Geolocation error: ", error);
                updateStatus("Geolocation error: " + error.message, "disconnected");
            }
        );
    }
}

function getRandomTemperature() {
    return Math.floor(Math.random() * 100) - 40;
}

function getTemperatureIcon(temperature) {
    let color;
    if (temperature < 10) {
        color = 'blue';
    } else if (temperature < 30) {
        color = 'green';
    } else {
        color = 'red';
    }
    
    return L.divIcon({
        className: 'temperature-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

function updateMapWithData(data) {
    const coords = data.geometry.coordinates;
    const temperature = data.properties.temperature;
    
    map.setView([coords[1], coords[0]], 15);
    
    if (!marker) {
        marker = L.marker([coords[1], coords[0]], {
            icon: getTemperatureIcon(temperature)
        }).addTo(map);
    } else {
        marker.setLatLng([coords[1], coords[0]]);
        marker.setIcon(getTemperatureIcon(temperature));
    }
    
    const popupContent = `
        <div>
            <strong>Temperature:</strong> ${temperature}°C<br>
            <strong>Student:</strong> Ujjal Baniya<br>
            <strong>Course:</strong> ENGO651<br>
            <small>${new Date(data.properties.timestamp).toLocaleString()}</small>
        </div>
    `;
    marker.bindPopup(popupContent);
}

function init() {
    topicInput.value = 'ENGO651/ujjal_baniya/my_temperature';
    
    initMap();
    
    connectBtn.addEventListener('click', toggleConnection);
    shareBtn.addEventListener('click', shareStatus);
    
    shareBtn.disabled = true;
    updateStatus("Ready to connect", "disconnected");
    
    console.log("Application fully initialized");
}

document.addEventListener('DOMContentLoaded', init);