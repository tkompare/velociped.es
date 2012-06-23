$(document).ready(function() {
	// The directions service
	var directionsService = new google.maps.DirectionsService();
	// Make the map.
	var Map = new TkMap({
		lat:42.01048,
		lng:-87.6652,
		domid:'map',
		init:true
	});
	// Add Bike Routing renderer
	var directionsDisplay = new google.maps.DirectionsRenderer();
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
		var request = {
			origin : origin,
			destination : destination,
			// Note that Javascript allows us to access the constant
			// using square brackets and a string value as its
			// "property."
			travelMode: google.maps.TravelMode.BICYCLING
		};
		directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				// Text for Routing here.
				$('#directions').text('');
				var distance = 0;
				$('#directions').append('<br>'+response.routes[0].copyrights+'<br>');
				for(var x in response.routes[0].legs[0].steps)
				{
					var thisstep = x;
					thisstep++;
					$('#directions').append(thisstep +'. '+response.routes[0].legs[0].steps[x].instructions+'<br>');
					distance = distance + response.routes[0].legs[0].steps[x].distance.value;
				}
				var miles = distance / 1609.344;
				miles = Math.round(miles*100)/100;
				$('#directions').append(miles+' miles, apporoximately');
				if($(window).width() < 769)
				{
					$('#directions-text').text('Show Directions');
					$('#show-directions').removeClass('hide');
					$('#alert-directions').addClass('hide');
				}
				else
				{
					$('#directions-text').text('Hide Directions');
					$('#alert-directions').removeClass('hide');
					$('#show-directions').removeClass('hide');
				}
			}
		});
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
	// Window size check
	if($(window).width() > 767)
	{
		$('#maplock').prop('checked', true);
		Map.setLock(true);
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