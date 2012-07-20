/**
 * TkMap is a JS class to make it easy to place a Google Maps API map into a
 * given DOM object.
 * @param array Args
 */
function TkMap(Args)
{
	/*
	 * PROPERTIES ***************************************************************
	 */
	/*
	 * PRIVATE properties from Required Arguments
	 */
	/** Latitude in decimal degrees */
	var Lat = typeof Args.lat !== 'undefined' ? Args.lat : null;
	/** Longitude in decimal degrees */
	var Lng = typeof Args.lng !== 'undefined' ? Args.lng : null;
	/** The ID of the DOM object in which to place the map */
	var DomId = typeof Args.domid !== 'undefined' ? Args.domid : null;
	/*
	 * PRIVATE Properties from Optional Arguments
	 */
	/** Google Maps zoom level */
	var Zoom = typeof Args.zoom !== 'undefined' ? Args.zoom : 15;
	/** Show the map as soom as this map object is created */
	var Init = typeof Args.init !== 'undefined' ? Args.init : false;
	/*
	 * Other PRIVATE Properties
	 */
	/** Google Maps map options */
	var MapOptions = {
			center : new google.maps.LatLng(Lat,Lng),
			draggable : true,
			mapTypeControl : false,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			panControl : false,
			streetViewControl : false,
			styles : [],
			zoom: Zoom,
			zoomControl : true
	};
	/*
	 * Variables used to control touch events
	 */
	/** Are we currently dragging? */
	var dragFlag = false;
	/** touchstart Y location */
	var touchstart = null;
	/** touchend Y location */
	var touchend = null;
	/*
	 * PUBLIC Properties
	 */
	/** The Google Map object */
	this.Map = null;
	/**
	 * CODE TO RUN AT INSTANTIATION *********************************************
	 */
	if(Init === true)
	{
		this.initMap();
	}
	/* 
	 * METHODS ****************************************************************
	 */
	/*
	 * PRIVATE methods
	 */
	/** Begin calculation of vertical scroll on touchstart event */
	var touchStart =  function(e)
	{
		dragFlag = true;
		touchstart = e.touches[0].pageY; 
	};
	/** End calculation of vertical scroll on touchend event */
	var touchEnd = function()
	{
		dragFlag = false;
	};
	/** Calculate vertical scroll on touchmove event */
	var touchMove = function(e)
	{
		if ( ! dragFlag) return;
		touchend = e.touches[0].pageY;
		window.scrollBy(0,(touchstart - touchend ));
	};
	/*
	 * PUBLIC methods
	 */
	/** Place the map in the DOM object */
	this.initMap = function()
	{
		if (this.Map === null)
		{
			this.Map = new google.maps.Map(
				document.getElementById(DomId),
				MapOptions
			);
		}
	};
	/** Set more map options */
	this.setMapOptions = function(options)
	{
		$.extend(MapOptions,options);
	};
	/** Set map zoom level based on the map's DOM object width */
	this.setResponsive = function()
	{
		/** The width of the map DOM object */
		var theWidth = $("#"+DomId).width();
		if(theWidth < 481)
		{
			MapOptions.zoom--;
		}
		else if (theWidth > 980)
		{
			MapOptions.zoom++;
		}
	};
	/** Turn on and off map's pan and zoom capabilities.
	 * When off (FALSE), listen for touch events to allow for scrolling past map 
	 * on touch devices.
	 */
	this.setTouchPanZoom = function(PZBoolean)
	{
		var dblclick;
		if(PZBoolean)
		{
			dblclick = false;
			document.getElementById(DomId).removeEventListener("touchstart", touchStart, true);
			document.getElementById(DomId).removeEventListener("touchend", touchEnd, true);
			document.getElementById(DomId).removeEventListener("touchmove", touchMove, true);
		}
		else
		{
			dblclick = true;
			document.getElementById(DomId).addEventListener("touchstart", touchStart, true);
			document.getElementById(DomId).addEventListener("touchend", touchEnd, true);
			document.getElementById(DomId).addEventListener("touchmove", touchMove, true);
		}
		this.Map.setOptions({
			disableDoubleClickZoom : dblclick,
			draggable : PZBoolean,
			keyboardShortcuts : PZBoolean,
			scrollwheel : PZBoolean,
			zoomControl : PZBoolean
		});
	};
	/** Choose a pre-built map styles. */
	this.setCustomStyles = function(options)
	{
		if (options.styles !== 'undefined')
		{
			var Styles = options.styles.split(' ');
			for (i in Styles)
			{
				if(Styles[i] === 'satellite')
				{
					MapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE;
				}
				else
				{
					if (Styles[i] === 'hybrid')
					{
						MapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
					}
					else if (Styles[i] === 'road')
					{
						MapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
					}
					else if (Styles[i] === 'terrain')
					{
						MapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
					}
					else if (Styles[i] === 'minlabels')
					{
						MapOptions.styles.push 
						(
							{
								featureType : "all",
								elementType : "labels",
								stylers: [{ visibility: "off" }]
							},
							{
								featureType : "administrative",
								elementType : "labels",
								stylers: [{ visibility: "on" }]
							},
							{
								featureType : "road",
								elementType : "labels",
								stylers: [{ visibility: "on" }]
							}
						);
					}
					else if (Styles[i] === 'grey')
					{
						MapOptions.backgroundColor = '#C5C5C5';
						MapOptions.styles.push 
						(
							{
								stylers: [{ saturation: -99 }]
							},
							{
								featureType: "road.arterial",
								elementType: "geometry",
								stylers: [{ lightness: 85 }]
							},
							{
								featureType: "water",
								stylers: [{ lightness: -40 }]
							}
						);
					}
				}
			}
		}
	};
};