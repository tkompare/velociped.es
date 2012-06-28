$(document).ready(function() {
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
		alert('touch!');
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
		console.log('no touch!');
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
				//setDirectionsText(response);
			}
		});
	});
	// Set the directions text
	function setDirectionsText(response)
	{
		$('#directions').text('');
		var lastwaypt = null;
		// Text for Routing here.
		$('#directions').text('');
		var distance = 0;
		$('#directions').append('<br>'+response.routes[0].copyrights+'<br>');
		var legcount = response.routes[0].legs.length;
		console.log('legcount = '+legcount);
		var l = 0;
		for (var leg in response.routes[0].legs)
		{
			l++;
			var stepcount = response.routes[0].legs[leg].steps.length;
			console.log('stepcount = '+stepcount);
			var s = 0;
			for(var x in response.routes[0].legs[leg].steps)
			{
				s++;
				var thisstep = x;
				thisstep++;
				var stepmiles = response.routes[0].legs[leg].steps[x].distance.value /1609.334;
				stepmiles = Math.round(stepmiles*100)/100;
				$('#directions').append(thisstep +'. '+response.routes[0].legs[leg].steps[x].instructions+' - '+stepmiles+' miles<br>');
				distance = distance + response.routes[0].legs[leg].steps[x].distance.value;
				if(l == legcount && s == stepcount)
				{
					lastwaypt = response.routes[0].legs[leg].steps[x].end_location;
					//Map.Map.setCenter(lastwaypt);
					var lastlat = lastwaypt.lat();
					var lastlng = lastwaypt.lng();
					var BikeRackLayer = new TkSocrataView({
						viewid : 'cbyb-69xx',
						domain : 'data.cityofchicago.org',
					});
				}
			}
			$('#directions').append('<br>');
		}
		var miles = distance / 1609.344;
		miles = Math.round(miles*100)/100;
		$('#directions').append(miles+' total miles.');
		if($(window).width() < 769)
		{
			$('#show-directions').text('Show Directions');
			$('#show-directions').removeClass('hide');
			$('#alert-directions').addClass('hide');
		}
		else
		{
			$('#show-directions').text('Hide Directions');
			$('#show-directions').removeClass('hide');
			$('#alert-directions').removeClass('hide');
		}
	}
	// Directions Change listener
	google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
		setDirectionsText(directionsDisplay.directions);
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
//Stop1 clear button
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
	function codeLatLng(latlng) {
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
});