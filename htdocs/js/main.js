$(document).ready(function() {
	// What step am I currently diplaying
	var thisStep = 0;
	var totalsteps = 0;
	var allsteps = new Array();
	var RackMarkers = [];
	var RackInfoBox = [];
	var RackInfoBoxViz = {
			open : function(map,marker,box)
			{
					return function() { box.open(map,marker); };
			},
			close : function(map,marker,box)
			{
					return function() { box.close(map,marker); };
			}
	};
	var PlaceMarkers = [];
	var PlaceInfoBox = [];
	var PlaceInfoBoxViz = {
			open : function(map,marker,box)
			{
					return function() { box.open(map,marker); };
			},
			close : function(map,marker,box)
			{
					return function() { box.close(map,marker); };
			}
	};
	var MapBounds = null;
	var StepLine = null; 
	// The directions service
	var directionsService = new google.maps.DirectionsService();
	// Make the map.
	var Map = new TkMap({
		domid:'map',
		init:true,
		lat:41.882103,
		lng:-87.627793,
		responsive:true,
		styles:'grey'
	});
	var PlaceService = new google.maps.places.PlacesService(Map.Map);
	// Check for touch events
	var rendererOptions = {};
	if (Modernizr.touch)
	{
		$('#maplock').prop('checked', false);
		Map.setPanZoom(false);
		Map.setTouchScroll(true);
	}
	else
	{
		$('#maplock').prop('checked', true);
		Map.setPanZoom(true);
		Map.setTouchScroll(false);
		rendererOptions = {
				draggable: true,
				suppressInfoWindows: true
			};
	}
	var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	directionsDisplay.setMap(Map.Map);
	// Add Google Bicycle Layer
	var GoogleBikeLayer = new google.maps.BicyclingLayer();
	GoogleBikeLayer.setMap(Map.Map);
	// Add City Bike layer
	var CityBikeLayer = new TkMapFusionLayer({
		geo:'geometry',
		map:Map.Map,
		tableid:'4329179',
		style: [{
			where: "description CONTAINS 'RECOMMENDED BIKE ROUTE'",
			polylineOptions: {
				strokeColor: '#55BB22',
				strokeWeight: '4',
				strokeOpacity: '0.75'
			}
		},{
			where: "description DOES NOT CONTAIN 'RECOMMENDED BIKE ROUTE'",
			polylineOptions: {
				strokeColor: '#004400',
				strokeWeight: '4',
				strokeOpacity: '0.75'
			}
		}]
	});
	// City Bike Racks from CDOT
	var BikeRackLayer = new TkSocrataView({
		viewid: '3jcw-ywxj',
		domain : 'data.cityofchicago.org',
	});
	// Add distance div to map
	var myControl = document.getElementById('myTextDiv');
	Map.Map.controls[google.maps.ControlPosition.RIGHT_TOP].push(myControl);
	// Add map lock listener
	$('#maplock').click(function(){
		if ($("#maplock").is(':checked')) {
			Map.setPanZoom(true);
			Map.setTouchScroll(false);
		} else {
			Map.setPanZoom(false);
			Map.setTouchScroll(true);
		}
	});
	// Routing listener
	$('#route').click(function(){
		if(StepLine !== null)
		{
			StepLine.setMap(null);
		}
		if(RackMarkers.length > 0)
		{
			for(var x in RackMarkers)
			{
				RackMarkers[x].setMap(null);
			}
		}
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
		var request = null;
		if($('#transit').is(':checked') == true)
		{
			request = {
				origin : origin,
				destination : destination,
				waypoints : waypts,
				optimizeWaypoints : true,
				travelMode: google.maps.TravelMode.TRANSIT
			};
		}
		else
		{
			request = {
				origin : origin,
				destination : destination,
				waypoints : waypts,
				optimizeWaypoints : true,
				travelMode: google.maps.TravelMode.BICYCLING
			};
		}
		directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				for (var leg in response.routes[0].legs)
				{
					for(var x in response.routes[0].legs[leg].steps)
					{
						if(response.routes[0].legs[leg].steps[x].travel_mode == 'WALKING')
						{
							response.routes[0].legs[leg].steps[x].travel_mode = '';
						}
					}
				}
				directionsDisplay.setDirections(response);
				removePlaceMarkers();
				if($('#place').val().length > 0)
				{
					console.log($('#place').val());
					console.log(response.routes[0].bounds);
					var PlaceRequest = {
						bounds: response.routes[0].bounds,
						query: $('#place').val()
					};
					PlaceService.textSearch(PlaceRequest, placeCallback);
				}
			}
		});
	});
	// Set the directions text
	function setDirectionsText(response)
	{
		// Text for Routing here.
		var distance = 0;
		var l = 0;
		thisStep = 0;
		totalsteps = 0;
		allsteps = new Array();
		for (var leg in response.routes[0].legs)
		{
			l++;
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
				allsteps[totalsteps].text = (totalsteps+1)+'. '+response.routes[0].legs[leg].steps[x].instructions+' (Go '+stepmiles+' miles)';
				allsteps[totalsteps].text = allsteps[totalsteps].text.replace(/walk/g, 'bike');
				allsteps[totalsteps].text = allsteps[totalsteps].text.replace(/Walk/g, 'Bike');
				if(response.routes[0].legs[leg].steps[x].travel_mode == 'TRANSIT')
				{
					allsteps[totalsteps].text = allsteps[totalsteps].text.replace(/Bus/g, '#'+response.routes[0].legs[leg].steps[x].transit.line.short_name+' Bus');
					allsteps[totalsteps].text = allsteps[totalsteps].text.replace(/Subway/g, response.routes[0].legs[leg].steps[x].transit.line.name);
				}
				allsteps[totalsteps].latlng = response.routes[0].legs[leg].steps[x].start_location;
				allsteps[totalsteps].latlngEnd = response.routes[0].legs[leg].steps[x].end_location;
				allsteps[totalsteps].path = response.routes[0].legs[leg].steps[x].path;
				totalsteps++;
			}
		}
		var miles = distance / 1609.344;
		miles = Math.round(miles*100)/100;
		$('#myTextDiv').html('<b>Total Distance: '+miles+' miles.</b>');
		if($('#directions').hasClass('alert-error'))
		{
			$('#directions').removeClass('alert-error');
			$('#directions').addClass('alert-info');
		}
		$('#directions-text').html('<b>Total Distance: '+miles+' miles</b><br>Click above to step through your route.');
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
	// Places search callback
	function placeCallback(results, status) {
		removePlaceMarkers();
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {
				createPlaceMarker(results[i],i);
			}
		}
	};
	// Create Place Markers
	function createPlaceMarker(place,i) {
		var placeAddressArray = place.formatted_address.split(',');
		PlaceMarkers[i] = new google.maps.Marker({
		map: Map.Map,
		position: place.geometry.location
		});
		var isOpenText = '';
		var isOpen = typeof place.opening_hours !== 'undefined' ? place.opening_hours.open_now : null;
		var PlaceInfoBoxText = null;
		if(isOpen)
		{
			isOpenText = ' (Open)';
		}
		else if(isOpen === false)
		{
			isOpenText = ' (Closed)';
		}
		PlaceInfoBoxText = '<div id="placeinfobox'+i+'" class="placeInfoBox" style="border:3px solid rgb(0,128,128); margin-top:8px; background:rgb(247,247,247); padding:5px; font-size:85%;">'+
			place.name+isOpenText+'<br>'+placeAddressArray[0]+'</div>';
		console.log(PlaceInfoBoxText);
		InfoBoxOptions = {
			content: PlaceInfoBoxText
			,disableAutoPan: false
			,maxWidth: 0
			,pixelOffset: new google.maps.Size(-84, 0)
			,zIndex: 10000
			,boxStyle: { 
				background: "url('img/tipbox.gif') no-repeat"
				,opacity: 0.95
				,width: "160px"
			}
			,closeBoxMargin: "13px 5px 5px 5px"
			,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
			,infoBoxClearance: new google.maps.Size(1, 1)
			,isHidden: false
			,pane: "floatPane"
			,enableEventPropagation: false
		};
		PlaceInfoBox[i] = new InfoBox(InfoBoxOptions);
		google.maps.event.addListener(PlaceMarkers[i], 'click', PlaceInfoBoxViz.open(Map.Map,PlaceMarkers[i],PlaceInfoBox[i]));
	}
	// Remove Place Markers
	function removePlaceMarkers() {
		if(PlaceMarkers.length > 0)
		{
			for(var x in PlaceMarkers)
			{
				google.maps.event.clearInstanceListeners(PlaceMarkers[x]);
				PlaceMarkers[x].setMap(null);
			}
			PlaceMarkers = [];
		}
	}
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
			strokeWeight: 5,
			zIndex: 100000
		});
		StepLine.setMap(Map.Map);
		$('#directions-text').fadeOut(function(){
			$('#directions-text').html(allsteps[thisStep].text);
			if($('#directions').hasClass('alert-info'))
			{
				$('#directions').removeClass('alert-info');
				$('#directions').addClass('alert-error');
			}
			$('#directions-text').fadeIn();
		});
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
				strokeWeight: 5,
				zIndex: 100000
			});
			StepLine.setMap(Map.Map);
		}
		$('#directions-text').fadeOut(function(){
			$('#directions-text').html(allsteps[thisStep].text);
			if($('#directions').hasClass('alert-info'))
			{
				$('#directions').removeClass('alert-info');
				$('#directions').addClass('alert-error');
			}
			$('#directions-text').fadeIn();
		});
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
				strokeWeight: 5,
				zIndex: 100000
			});
			StepLine.setMap(Map.Map);
		}
		$('#directions-text').fadeOut(function(){
			$('#directions-text').html(allsteps[thisStep].text);
			if($('#directions').hasClass('alert-info'))
			{
				$('#directions').removeClass('alert-info');
				$('#directions').addClass('alert-error');
			}
			$('#directions-text').fadeIn();
		});
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
			strokeWeight: 5,
			zIndex: 100000
		});
		StepLine.setMap(Map.Map);
		$('#directions-text').fadeOut(function(){
			$('#directions-text').html(allsteps[thisStep].text);
			if($('#directions').hasClass('alert-info'))
			{
				$('#directions').removeClass('alert-info');
				$('#directions').addClass('alert-error');
			}
			$('#directions-text').fadeIn();
		});
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
	// Help button listener
	$('#btn-help').click(function(){
		if($('#div-help').hasClass('hide'))
		{
			$('#btn-help').text('Close Help');
			$('#div-help').removeClass('hide');
		}
		else
		{
			$('#btn-help').text('Help');
			$('#div-help').addClass('hide');
		}
	});
	// Close Help Button Listener
	$('#btn-close-help').click(function(){
		$('#btn-help').text('Help');
		$('#div-help').addClass('hide');
	});
	// Stop1 clear button
	$('#btn-stop1').click(function(){
		$('#stop1').val('');
	});
	// Stop2 clear button
	$('#btn-stop2').click(function(){
		$('#stop2').val('');
	});
	// Place clear button
	$('#btn-place').click(function(){
		$('#place').val('');
	});
	$('#origin, #stop1, #stop2, #destination').change(function(){
		google.maps.event.clearListeners(Map.Map, 'click');
	});
	// Start a one-time listener for a map click to fill in the START input
	$('#btn-origin').click(function(){
		if($('#maplock').is(':checked'))
		{
			addTheListenerOnce(true,'origin');
		}
		else
		{
			addTheListenerOnce(false,'origin');
		}
	});
	//Start a one-time listener for a map click to fill in the STOP1 input
	$('#btn-stop1').click(function(){
		if($('#maplock').is(':checked'))
		{
			addTheListenerOnce(true,'stop1');
		}
		else
		{
			addTheListenerOnce(false,'stop1');
		}
	});
	//Start a one-time listener for a map click to fill in the STOP2 input
	$('#btn-stop2').click(function(){
		if($('#maplock').is(':checked'))
		{
			addTheListenerOnce(true,'stop2');
		}
		else
		{
			addTheListenerOnce(false,'stop2');
		}
	});
	//Start a one-time listener for a map click to fill in the DESTINATION input
	$('#btn-destination').click(function(){
		if($('#maplock').is(':checked'))
		{
			addTheListenerOnce(true,'destination');
		}
		else
		{
			addTheListenerOnce(false,'destination');
		}
	});
	// Add a listener to the map
	function addTheListenerOnce(checked,domobject)
	{
		google.maps.event.clearListeners(Map.Map, 'click');
		if(checked)
		{
			google.maps.event.addListenerOnce(Map.Map, 'click', function(event){
				var pos = new google.maps.LatLng(
						event.latLng.lat(),
						event.latLng.lng()
					);
				codeLatLng(pos,domobject);
			});
		}
		else
		{
			Map.setTouchScroll(false);
			Map.setPanZoom(true);
			$('#maplock').prop("checked", true);
			google.maps.event.addListenerOnce(Map.Map, 'click', function(event){
				var pos = new google.maps.LatLng(
						event.latLng.lat(),
						event.latLng.lng()
					);
				codeLatLng(pos,domobject);
			});
		}
	};
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
					codeLatLng(pos,'origin');
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
	function codeLatLng(latlng,id)
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
						$('#'+id).val(results[0].address_components[0].long_name + ' ' + results[0].address_components[1].long_name);
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
				google.maps.event.clearInstanceListeners(RackMarkers[x]);
				RackMarkers[x].setMap(null);
			}
			for(var x in RackInfoBox)
			{
				RackInfoBox[x].close();
			}
			RackInfoBox = [];
			RackMarkers = [];
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
				// Make the Rack Marker
				RackLatLng[rackcount] = new google.maps.LatLng(TheseRacks[x].latitude,TheseRacks[x].longitude);
				RackMarkers[rackcount] = new google.maps.Marker({
					position: RackLatLng[rackcount],
					map: Map.Map,
					icon : 'img/bikelock20.png'
				});
				// And now the infobox for each bike rack...
				var InfoBoxText = '<div id="infobox'+rackcount+'" class="infoBox" style="border:3px solid rgb(0,0,0); margin-top:8px; background:rgb(247,247,247); padding:5px; font-size:85%;">'+
				TheseRacks[x].address+'<br>Number of Racks: '+Math.round(TheseRacks[x].totinstall)+'</div>';
				InfoBoxOptions = {
					content: InfoBoxText
					,disableAutoPan: false
					,maxWidth: 0
					,pixelOffset: new google.maps.Size(-84, 0)
					,zIndex: 10000
					,boxStyle: { 
						background: "url('img/tipbox.gif') no-repeat"
						,opacity: 0.95
						,width: "160px"
					}
					,closeBoxMargin: "13px 5px 5px 5px"
					,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
					,infoBoxClearance: new google.maps.Size(1, 1)
					,isHidden: false
					,pane: "floatPane"
					,enableEventPropagation: false
				};
				RackInfoBox[rackcount] = new InfoBox(InfoBoxOptions);
				MapBounds.extend(RackLatLng[rackcount]);
				Map.Map.fitBounds(MapBounds);
				google.maps.event.addListener(RackMarkers[rackcount], 'click', RackInfoBoxViz.open(Map.Map,RackMarkers[rackcount],RackInfoBox[rackcount]));
				// Reset zoom and position
				rackcount++;
			}
		}
	}
});