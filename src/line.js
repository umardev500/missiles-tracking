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
                    [-97.14222482244848, 4.6396632037767915], [-97.14795714462329, 4.634813211332556], [-97.16466918260669, 4.620541979881978], [-97.22812283476357, 4.565406961276366], [-97.32676663644159, 4.477597896047229], [-97.45478144516264, 4.360451699726042], [-97.60634811845095, 4.217304177369755], [-97.77564751382839, 4.051491530765944], [-97.95686048881747, 3.8663515962603725], [-98.14416790094182, 3.665224783111668], [-98.51378946668505, 3.2283885047374667], [-98.68446533535004, 2.999376925315673], [-98.83795907124018, 2.767774116957895], [-98.96845153187915, 2.536937273394031], [-99.07012357478882, 2.3102261208635895], [-99.13715605749282, 2.091002323837401], [-99.16372983751306, 1.8826288600386931], [-99.15541498069685, 1.6749469236957282], [-99.1239306193514, 1.45998487314408], [-99.07280140615313, 1.2388803491423772], [-99.0055519937797, 1.012771912381126], [-98.83679118221427, 0.5501014494915069], [-98.64584540607083, 0.08109550671755983], [-98.46091188676567, -0.38511864226215664], [-98.31018784571333, -0.8394143933063276], [-98.25646601122473, -1.0592424155099707], [-98.22187050433013, -1.2726715399545299], [-98.20992597770719, -1.4785635201975396], [-98.22415708403236, -1.6757810141515534], [-98.2680645162341, -1.861319588045987], [-98.34329816967302, -2.0556198074639127], [-98.44514471620701, -2.2558137133382843], [-98.56889082769288, -2.459034279798473], [-98.70982317598737, -2.6624158231723527], [-98.8632284329484, -2.863094385835552], [-99.1886043602961, -3.2448972175768347], [-99.351148374398, -3.4203046105905486], [-99.50731198459356, -3.5815753178343073], [-99.65238186274127, -3.725856510362931], [-99.78164468069788, -3.850297023554532], [-99.89038711031961, -3.952046729636109], [-99.97389582346494, -4.02825571739703], [-100.02745749199009, -4.076073299264664], [-100.04635878775241, -4.092646881580407]
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
