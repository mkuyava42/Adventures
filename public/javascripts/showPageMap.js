mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/streets-v12", // style URL
  center: place.geometry.coordinates, // starting position [lng, lat]
  zoom: 8, // starting zoom
});

new mapboxgl.Marker()
  .setLngLat(place.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 10 }).setHTML(
      `<h3>${place.title}</h3><p>${place.location}</p>`
    )
  )
  .addTo(map);
