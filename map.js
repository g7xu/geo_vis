// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiZzd4dSIsImEiOiJjbTdrMjVyb2MwZDdiMnNvcGw4OHA2NHhmIn0.lrNw1t28q-7N8jsV6IpT2g';

// Define a common paint object for both layers
const paint = {
    'line-color': 'green',
    'line-width': 3,
    'line-opacity': 0.4
};

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will render
    style: 'mapbox://styles/mapbox/streets-v12', // Map style
    center: [-71.09415, 42.36027], // [longitude, latitude]
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18 // Maximum allowed zoom
});

const INPUT_BLUEBIKES_CSV_URL = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

const svg = d3.select('#map').select('svg');


// Function to convert station data to pixel coordinates
function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
    const { x, y } = map.project(point);  // Project to pixel coordinates
    return { cx: x, cy: y };  // Return as object for use in SVG attributes
}


map.on('load', async () => { 
    // getting data source for boston bike lanes
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
    });
    
    // getting data source for Cambridge bike lanes
    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });

    // Add the layers to the map
    map.addLayer({
        id: 'bike-lanes-boston',
        type: 'line',
        source: 'boston_route',
        paint: paint
    });

    map.addLayer({
        id: 'bike-lanes-cambridge',
        type: 'line',
        source: 'cambridge_route',
        paint: paint
    });

    // Load Bluebikes data
    let jsonData;

    try {
        const jsonurl = INPUT_BLUEBIKES_CSV_URL;
        
        // Await JSON fetch
        const jsonData = await d3.json(jsonurl);

        let stations = jsonData.data.stations;

        const circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 5)               // Radius of the circle
            .attr('fill', 'steelblue')  // Circle fill color
            .attr('stroke', 'white')    // Circle border color
            .attr('stroke-width', 1)    // Circle border thickness
            .attr('opacity', 0.8);      // Circle opacity

        // Function to update circle positions when the map moves/zooms
        function updatePositions() {
            circles
            .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
            .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
        }
    
        // Initial position update when map loads
        updatePositions();

        // Reposition markers on map interactions
        map.on('move', updatePositions);     // Update during map movement
        map.on('zoom', updatePositions);     // Update during zooming
        map.on('resize', updatePositions);   // Update on window resize
        map.on('moveend', updatePositions);  // Final adjustment after movement ends

    } catch (error) {
        console.error('Error loading JSON:', error); // Handle errors
    }
    
});


