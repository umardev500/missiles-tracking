import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./main.scss";

// Set the Mapbox access token
mapboxgl.accessToken =
    "pk.eyJ1IjoidW1hcmRldjUwMCIsImEiOiJjbGhibWMwbWIwbnBxM3JwY2xkOWU0c2hsIn0.nPV5Omkf8bSFoG0N3QFutQ";

// Define the path coordinates (array of [lng, lat] pairs)
const path: [number, number][] = [
    [-97.14222482244848, 4.6396632037767915],
    [-97.14795714462329, 4.634813211332556],
    [-97.16466918260669, 4.620541979881978],
    [-97.22812283476357, 4.565406961276366],
    [-97.32676663644159, 4.477597896047229],
    [-97.45478144516264, 4.360451699726042],
    [-97.60634811845095, 4.217304177369755],
    [-97.77564751382839, 4.051491530765944],
    [-97.95686048881747, 3.8663515962603725],
    [-98.14416790094182, 3.665224783111668],
    [-98.51378946668505, 3.2283885047374667],
    [-98.68446533535004, 2.999376925315673],
    [-98.83795907124018, 2.767774116957895],
    [-98.96845153187915, 2.536937273394031],
    [-99.07012357478882, 2.3102261208635895],
    [-99.13715605749282, 2.091002323837401],
    [-99.16372983751306, 1.8826288600386931],
    [-99.15541498069685, 1.6749469236957282],
    [-99.1239306193514, 1.45998487314408],
    [-99.07280140615313, 1.2388803491423772],
    [-99.0055519937797, 1.012771912381126],
    [-98.83679118221427, 0.5501014494915069],
    [-98.64584540607083, 0.08109550671755983],
    [-98.46091188676567, -0.38511864226215664],
    [-98.31018784571333, -0.8394143933063276],
    [-98.25646601122473, -1.0592424155099707],
    [-98.22187050433013, -1.2726715399545299],
    [-98.20992597770719, -1.4785635201975396],
    [-98.22415708403236, -1.6757810141515534],
    [-98.2680645162341, -1.861319588045987],
    [-98.34329816967302, -2.0556198074639127],
    [-98.44514471620701, -2.2558137133382843],
    [-98.56889082769288, -2.459034279798473],
    [-98.70982317598737, -2.6624158231723527],
    [-98.8632284329484, -2.863094385835552],
    [-99.1886043602961, -3.2448972175768347],
    [-99.351148374398, -3.4203046105905486],
    [-99.50731198459356, -3.5815753178343073],
    [-99.65238186274127, -3.725856510362931],
    [-99.78164468069788, -3.850297023554532],
    [-99.89038711031961, -3.952046729636109],
    [-99.97389582346494, -4.02825571739703],
    [-100.02745749199009, -4.076073299264664],
    [-100.04635878775241, -4.092646881580407],
];

// Initialize the Mapbox map
const map = new mapboxgl.Map({
    container: "map", // ID of the HTML element where the map will be rendered
    style: "mapbox://styles/mapbox/streets-v12", // Map style
    center: path[0], // Set the map center to the first coordinate
    zoom: 5, // Initial zoom level
});

// Add a marker at the initial coordinates (first point in the path)
const marker = new mapboxgl.Marker({
    color: "#F84C4C", // Set the marker color to red
})
    .setLngLat(path[0]) // Set the marker position using the first point in the path
    .addTo(map); // Add the marker to the map

// Function to interpolate between two points based on time
function interpolate(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

// Function to animate the marker along the path using requestAnimationFrame with time-based progression
function animateMarker(
    path: [number, number][],
    marker: mapboxgl.Marker,
    duration: number
) {
    let index = 0; // Track the current point in the path
    let startTime: number | null = null; // Start time for the animation

    function moveMarker(timestamp: number) {
        if (!startTime) startTime = timestamp; // Initialize startTime on the first frame

        const timeElapsed = (timestamp - startTime) / duration; // Calculate the progress based on time

        // Move between the current and next point in the path
        if (index < path.length - 1) {
            const currentCoords = path[index];
            const nextCoords = path[index + 1];

            // Interpolate latitude and longitude
            const lat = interpolate(
                currentCoords[1],
                nextCoords[1],
                timeElapsed
            );
            const lng = interpolate(
                currentCoords[0],
                nextCoords[0],
                timeElapsed
            );

            // Update the marker position
            marker.setLngLat([lng, lat]);

            // When timeElapsed reaches 1, move to the next point
            if (timeElapsed >= 1) {
                startTime = null; // Reset the start time for the next segment
                index++; // Move to the next point
            }

            // Request the next frame
            requestAnimationFrame(moveMarker);
        }
    }

    // Start the animation
    requestAnimationFrame(moveMarker);
}

// Function to restart the animation
function restartAnimation() {
    // Reset the marker position to the first point in the path
    marker.setLngLat(path[0]);

    // Restart the animation from the first point
    animateMarker(path, marker, 100);
}

// Animate the marker along the path with a duration of 2000ms between each segment
map.on("load", () => {
    animateMarker(path, marker, 100);
});

// Add the button for restarting the animation
const button = document.createElement("button");
button.innerText = "Restart Animation";
button.classList.add("restart-button");
document.body.appendChild(button);

// Add click event to restart animation
button.addEventListener("click", restartAnimation);
