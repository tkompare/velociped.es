$(document).ready(function() {
	// Make the map.
	var Map = new TkMap({
		lat:42.01048,
		lng:-87.6652,
		domid:'map',
		init:true
	});
	// Add Google Bicycle Layer
	var GoogleBikeLayer = new google.maps.BicyclingLayer();
	GoogleBikeLayer.setMap(Map.Map);
	// Add City Bike layer
	var CityBikeLayer = new TkMapFusionLayer({
		map:Map.Map,
		tableid:'4329179',
		geo:'geometry'
	});
//	CityBikeRoutes = new google.maps.FusionTablesLayer('4329179', {
//		query : "SELECT geometry FROM 4329179"
//	});
//	CityBikeRoutes.setMap(Map.Map);
});