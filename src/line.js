import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./main.scss";

// Set the Mapbox access token
mapboxgl.accessToken =
    "pk.eyJ1IjoidW1hcmRldjUwMCIsImEiOiJjbGhibWMwbWIwbnBxM3JwY2xkOWU0c2hsIn0.nPV5Omkf8bSFoG0N3QFutQ";

// GeoJSON data for the line
const lineData = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [
                    [
                        6.437242318843829,
                        0.2184366253244292
                    ],
                    [
                        5.634441549807484,
                        0.3830445174890471
                    ],
                    [
                        5.292891695827521,
                        1.1707147804883107
                    ],
                    [
                        4.204749482021477,
                        0.9158949955678892
                    ],
                    [
                        3.5859503045884367,
                        1.4296767208585237
                    ]
                ],
            },
            properties: {},
        },
    ],
};

// Access initial coordinates
const initialCoordinates = lineData.features[0].geometry.coordinates[0];

// Initialize the Mapbox map
const map = new mapboxgl.Map({
    container: "map", // ID of the HTML element where the map will be rendered
    style: "mapbox://styles/mapbox/streets-v12", // Map style
    center: initialCoordinates, // Set the map center to the coordinates (longitude, latitude)
    zoom: 7, // Initial zoom level
});

// Global variables to hold the animation state
let animationFrameId;
let startTime = null;
let marker;
let speedKmh = 12080; // Set the speed (in km/h)

// Function to animate the marker with speed control in km/h
function animateMarker(marker, lineCoordinates, speedKmh) {
    const totalDistance = calculateLineLength(lineCoordinates);

    // Convert speed from km/h to m/s
    const speedMs = speedKmh * 0.27778; // km/h to m/s conversion

    // Calculate duration in seconds
    const durationSeconds = totalDistance / speedMs; // Total distance in meters / speed in meters per second

    // Log the total distance, speed, and duration (in seconds)
    console.log("Total distance: ", totalDistance / 1000, " km"); // Total distance in km
    console.log("Speed: ", speedKmh, " km/h"); // Speed in km/h
    console.log("Estimated duration: ", Math.ceil(durationSeconds).toFixed(0), " seconds"); // Rounded duration in seconds

    // Function to calculate the distance between two coordinates (Haversine formula)
    function calculateLineLength(coords) {
        let totalLength = 0;
        for (let i = 1; i < coords.length; i++) {
            totalLength += getDistance(coords[i - 1], coords[i]);
        }
        return totalLength;
    }

    // Function to calculate distance between two points (Haversine formula)
    function getDistance([lng1, lat1], [lng2, lat2]) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    }

    // Function to interpolate the position of the marker based on elapsed time and speed
    function moveMarker(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsedTime = timestamp - startTime;

        // Calculate the distance the marker should travel based on speed (in meters per second)
        const distanceTravelled = speedMs * (elapsedTime / 1000); // Speed * time (in seconds)

        // Loop through the line coordinates to find the position
        let distanceCovered = 0;
        for (let i = 1; i < lineCoordinates.length; i++) {
            const [lng1, lat1] = lineCoordinates[i - 1];
            const [lng2, lat2] = lineCoordinates[i];
            const segmentDistance = getDistance([lng1, lat1], [lng2, lat2]);

            if (distanceCovered + segmentDistance >= distanceTravelled) {
                const ratio = (distanceTravelled - distanceCovered) / segmentDistance;
                const lng = lng1 + ratio * (lng2 - lng1);
                const lat = lat1 + ratio * (lat2 - lat1);
                marker.setLngLat([lng, lat]);

                break;
            } else {
                distanceCovered += segmentDistance;
            }
        }

        // Calculate remaining time in seconds and round up
        const remainingTimeSecs = Math.ceil(durationSeconds - elapsedTime / 1000);
        console.log(`Time left: ${remainingTimeSecs} seconds`);

        // Stop the animation when the marker reaches the end
        if (distanceTravelled < totalDistance) {
            animationFrameId = requestAnimationFrame(moveMarker); // Request next frame
        } else {
            // Finalize the marker position exactly on the last coordinate
            const lastCoordinate = lineCoordinates[lineCoordinates.length - 1];
            marker.setLngLat(lastCoordinate);

            // Log the final position
            console.log("Animation complete!");
            console.log(`Final position: [${lastCoordinate[0].toFixed(6)}, ${lastCoordinate[1].toFixed(6)}]`);
        }
    }


    animationFrameId = requestAnimationFrame(moveMarker); // Start animation
}

// Restart animation function
function restartAnimation() {
    console.clear();
    console.log("Restarting animation...");

    // Remove the old marker from the map
    marker.remove();

    // Create a new marker at the starting point
    marker = new mapboxgl.Marker({ color: '#ea580c' })
        .setLngLat(lineData.features[0].geometry.coordinates[0]) // Start coordinates of the line
        .addTo(map);

    // Restart the animation
    startTime = null;
    cancelAnimationFrame(animationFrameId); // Stop any ongoing animation
    animateMarker(marker, lineData.features[0].geometry.coordinates, speedKmh);
}

// Initialize the Mapbox map and add the line layer
function initialize() {
    // Add a GeoJSON source
    map.addSource("line-source", {
        type: "geojson",
        data: lineData, // The line data
    });

    // Add a line layer to the map
    map.addLayer({
        id: "line-layer",
        type: "line",
        source: "line-source",
        paint: {
            "line-color": "rgba(0, 0, 0, 0.15)", // Line color
            "line-width": 2, // Line width
        },
    });

    // Add a marker at the start coordinates of the line
    marker = new mapboxgl.Marker({ color: '#ea580c' })
        .setLngLat(lineData.features[0].geometry.coordinates[0]) // Start coordinates of the line
        .addTo(map);

    // Animate the marker along the line after a short delay
    setTimeout(() => {
        animateMarker(marker, lineData.features[0].geometry.coordinates, speedKmh);
    }, 1000);
}

// Initialize the Mapbox map and add the line layer
map.on("load", function () {
    initialize();
});

// Add the button for restarting the animation
const button = document.createElement("button");
button.innerText = "Restart Animation";
button.classList.add("restart-button");
document.body.appendChild(button);

// Add click event to restart animation
button.addEventListener("click", restartAnimation);
