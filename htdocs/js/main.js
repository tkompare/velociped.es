$(document).ready(function() {
	// What step am I currently diplaying
	var thisStep = 0;
	var totalsteps = 0;
	var allsteps = new Array();
	var RackMarkers = [];
	var MapBounds = null;
	var StepLine = null; 
	// The directions service
	var directionsService = new google.maps.DirectionsService();
	// Make the map.
	var Map = new TkMap({
		lat:42.01048,
		lng:-87.6652,
		domid:'map',
		init:false
	});
	// Check for touch events
	var rendererOptions;
	if (Modernizr.touch)
	{
		rendererOptions = {};
		Map.setMapOptions({
			disableDoubleClickZoom : true,
			scrollwheel : false,
			zoomControlOptions : {
				style : google.maps.ZoomControlStyle.SMALL,
				position : google.maps.ControlPosition.LEFT_TOP
			}
		});
	}
	else
	{
		rendererOptions = {
			draggable: true
		};
	}
	Map.initMap();
	var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	directionsDisplay.setMap(Map.Map);
	// Add Google Bicycle Layer
	var GoogleBikeLayer = new google.maps.BicyclingLayer();
	GoogleBikeLayer.setMap(Map.Map);
	// Add City Bike layer
	var CityBikeLayer = new TkMapFusionLayer({
		geo:'geometry',
		map:Map.Map,
		tableid:'4329179'
	});
	var BikeRackLayer = new TkSocrataView({
		viewid : 'cbyb-69xx',
		domain : 'data.cityofchicago.org',
	});
	// Add map lock listener
	$('#maplock').click(function(){
		if ($("#maplock").is(':checked')) {
			Map.setLock(true);
		} else {
			Map.setLock(false);
		}
	});
	// Routing listener
	$('#route').click(function(){
		var origin = $('#origin').val() + ' Chicago, IL';
		var destination = $('#destination').val() + ' Chicago, IL';
		var waypts = [];
		if($('#stop1').val() != '')
		{
			waypts.push({
				location : $('#stop1').val() + ', Chicago, IL',
				stopover : true
			});
		}
		
		if($('#stop2').val() != '')
		{
			waypts.push({
				location : $('#stop2').val() + ', Chicago, IL',
				stopover : true
			});
		}
		
		var request = {
			origin : origin,
			destination : destination,
			waypoints : waypts,
			optimizeWaypoints : true,
			// Note that Javascript allows us to access the constant
			// using square brackets and a string value as its
			// "property."
			travelMode: google.maps.TravelMode.BICYCLING
		};
		directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
			}
		});
	});
	// Set the directions text
	function setDirectionsText(response)
	{
		$('#directions').text('');
		// Text for Routing here.
		var distance = 0;
		$('#directions').append('<br>'+response.routes[0].copyrights+' ');
		var legcount = response.routes[0].legs.length;
		var l = 0;
		thisStep = 0;
		totalsteps = 0;
		allsteps = new Array();
		$('#directions-text').text('');
		for (var leg in response.routes[0].legs)
		{
			l++;
			var stepcount = response.routes[0].legs[leg].steps.length;
			var s = 0;
			for(var x in response.routes[0].legs[leg].steps)
			{
				s++;
				var thisstep = x;
				thisstep++;
				var stepmiles = response.routes[0].legs[leg].steps[x].distance.value /1609.334;
				stepmiles = Math.round(stepmiles*100)/100;
				distance = distance + response.routes[0].legs[leg].steps[x].distance.value;
				allsteps[totalsteps] = new Object();
				allsteps[totalsteps].text = (totalsteps+1)+'. '+response.routes[0].legs[leg].steps[x].instructions+', and go '+stepmiles+' miles';
				allsteps[totalsteps].latlng = response.routes[0].legs[leg].steps[x].start_location;
				allsteps[totalsteps].latlngEnd = response.routes[0].legs[leg].steps[x].end_location;
				allsteps[totalsteps].path = response.routes[0].legs[leg].steps[x].path;
				totalsteps++;
			}
			//$('#directions').append('<br>');
		}
		var miles = distance / 1609.344;
		miles = Math.round(miles*100)/100;
		$('#directions').append(' - <b>'+miles+' total miles.</b><br><br>');
		if($(window).width() < 769)
		{
			$('#show-directions').text('Show Directions');
			$('#show-directions').removeClass('hide');
			$('#alert-directions').addClass('hide');
			$('#btn-dir').addClass('hide');
		}
		else
		{
			$('#show-directions').text('Hide Directions');
			$('#show-directions').removeClass('hide');
			$('#alert-directions').removeClass('hide');
			$('#btn-dir').removeClass('hide');
		}
	}
	// Directions Change listener
	google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
		thisStep = 0;
		setDirectionsText(directionsDisplay.directions);
	});
	// btn-dir-start listener
	$('#btn-dir-start').click(function(){
		thisStep = 0;
		MapBounds = new google.maps.LatLngBounds();
		MapBounds.extend(allsteps[thisStep].latlng);
		MapBounds.extend(allsteps[thisStep].latlngEnd);
		Map.Map.fitBounds(MapBounds);
		if(StepLine !== null)
		{
			StepLine.setMap(null);
		}
		StepLine = new google.maps.Polyline({
			path: allsteps[thisStep].path,
			strokeColor: "#FF0000",
			strokeOpacity: 1.0,
			strokeWeight: 4 
		});
		StepLine.setMap(Map.Map);
		$('#directions-text').html(allsteps[thisStep].text);
		showBikeRacks(allsteps[thisStep].latlngEnd);
	});
	$('#btn-dir-back').click(function(){
		if(thisStep > 0)
		{
			thisStep--;
			MapBounds = new google.maps.LatLngBounds();
			MapBounds.extend(allsteps[thisStep].latlng);
			MapBounds.extend(allsteps[thisStep].latlngEnd);
			Map.Map.fitBounds(MapBounds);
			if(StepLine !== null)
			{
				StepLine.setMap(null);
			}
			StepLine = new google.maps.Polyline({
				path: allsteps[thisStep].path,
				strokeColor: "#FF0000",
				strokeOpacity: 1.0,
				strokeWeight: 4 
			});
			StepLine.setMap(Map.Map);
		}
		$('#directions-text').html(allsteps[thisStep].text);
		showBikeRacks(allsteps[thisStep].latlngEnd);
	});
	$('#btn-dir-forward').click(function(){
		if(thisStep < (allsteps.length - 1))
		{
			thisStep++;
			MapBounds = new google.maps.LatLngBounds();
			MapBounds.extend(allsteps[thisStep].latlng);
			MapBounds.extend(allsteps[thisStep].latlngEnd);
			Map.Map.fitBounds(MapBounds);
			if(StepLine !== null)
			{
				StepLine.setMap(null);
			}
			StepLine = new google.maps.Polyline({
				path: allsteps[thisStep].path,
				strokeColor: "#FF0000",
				strokeOpacity: 1.0,
				strokeWeight: 4
			});
			StepLine.setMap(Map.Map);
		}
		$('#directions-text').html(allsteps[thisStep].text);
		showBikeRacks(allsteps[thisStep].latlngEnd);
	});
	$('#btn-dir-end').click(function(){
		thisStep = allsteps.length - 1;
		MapBounds = new google.maps.LatLngBounds();
		MapBounds.extend(allsteps[thisStep].latlng);
		MapBounds.extend(allsteps[thisStep].latlngEnd);
		Map.Map.fitBounds(MapBounds);
		if(StepLine !== null)
		{
			StepLine.setMap(null);
		}
		StepLine = new google.maps.Polyline({
			path: allsteps[thisStep].path,
			strokeColor: "#FF0000",
			strokeOpacity: 1.0,
			strokeWeight: 4
		});
		StepLine.setMap(Map.Map);
		$('#directions-text').html(allsteps[thisStep].text);
		showBikeRacks(allsteps[thisStep].latlngEnd);
	});
	// Show Directions listener
	$('#show-directions').click(function(){
		if($('#alert-directions').hasClass('hide'))
		{
			$('#show-directions').text('Hide Directions');
			$('#alert-directions').removeClass('hide');
		}
		else
		{
			$('#show-directions').text('Show Directions');
			$('#alert-directions').addClass('hide');
		}
		if($('#btn-dir').hasClass('hide'))
		{
			$('#btn-dir').removeClass('hide');
		}
		else
		{
			$('#btn-dir').addClass('hide');
		}
	});
	// More button listener
	$('#btn-more').click(function(){
		if($('#div-more').hasClass('hide'))
		{
			$('#btn-more').text('Less');
			$('#div-more').removeClass('hide');
		}
		else
		{
			$('#btn-more').text('More');
			$('#div-more').addClass('hide');
		}
	});
	// Stop1 clear button
	$('#btn-stop1').click(function(){
		$('#stop1').val('');
	});
	// Stop2 clear button
	$('#btn-stop2').click(function(){
		$('#stop2').val('');
	});
	// Window size check
	if($(window).width() > 767)
	{
		$('#maplock').prop('checked', true);
		Map.setLock(true);
	}
	else
	{
		$('#maplock').prop('checked', false);
		Map.setLock(false);
	}
	// Geolocation
	$('#gps').click(function(){
		if(navigator.geolocation)
		{
			navigator.geolocation.getCurrentPosition(
				function(position)
				{
					var pos = new google.maps.LatLng(
						position.coords.latitude,
						position.coords.longitude
					);
					Map.Map.setCenter(pos);
					codeLatLng(pos);
				}, 
				function()
				{
					handleNoGeolocation(true);
				}
			);
		}
		else
		{
			// Browser doesn't support Geolocation
			handleNoGeolocation(false);
		}
	});
	// No GPS?
	function handleNoGeolocation(errorFlag)
	{
		if (errorFlag)
		{
			$('#gpsfail').text('Error: The Geolocation service failed.');
			$('#alert-gpsfail').removeClass('hide');
		}
		else
		{
			$('#gpsfail').text('Error: Your browser doesn\'t support geolocation.');
			$('#alert-gpsfail').removeClass('hide');
		}
	}
	// The Geocoder function
	function codeLatLng(latlng)
	{
		geocoder = new google.maps.Geocoder();
		geocoder.geocode(
			{'latLng': latlng},
			function(results, status)
			{
				if (status == google.maps.GeocoderStatus.OK)
				{
					if (results[1])
					{
						$('#origin').val(results[0].address_components[0].long_name + ' ' + results[0].address_components[1].long_name);
					} else {
						alert("No results found");
					}
				} else {
					alert("Geocoder failed due to: " + status);
				}
			}
		);
	}
	function showBikeRacks(LatLng)
	{
		if(RackMarkers.length > 0)
		{
			for(var x in RackMarkers)
			{
				RackMarkers[x].setMap(null);
			}
		}
		var TheseRacks = BikeRackLayer.getData();
		var RackLatLng = [];
		var rackcount = 0;
		for(var x in TheseRacks)
		{
			if(
				TheseRacks[x].latitude < LatLng.lat() + 0.0019 &&
				TheseRacks[x].latitude > LatLng.lat() - 0.0019 &&
				TheseRacks[x].longitude < LatLng.lng() + 0.00245 &&
				TheseRacks[x].longitude > LatLng.lng() - 0.00245
			)
			{
				RackLatLng[rackcount] = new google.maps.LatLng(TheseRacks[x].latitude,TheseRacks[x].longitude);
				RackMarkers[rackcount] = new google.maps.Marker({
					position: RackLatLng[rackcount],
					map: Map.Map,
				});
				MapBounds.extend(RackLatLng[rackcount]);
				Map.Map.fitBounds(MapBounds);
				rackcount++;
			}
		}
	}
});