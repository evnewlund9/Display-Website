//Places search functionality of the maps widget (dropdown and manual searches) modeled
//after tutorials from https://developers.google.com/maps/documentation/javascript/places
//Geolocation functionality of the maps widget (converting contacts table into markers)
//modeled after tutorials from https://developers.google.com/maps/documentation/javascript/geolocation
//Directions functionality of the maps widget modeled after tutorials from
// https://developers.google.com/maps/documentation/javascript/directions
//Note that the manual text searchs in MyContacts.html and MyForm.html feature
//autocomplete functionality that is included with the Google Places service

var map;
var latlong;
var places;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 44.9727,
      lng: -93.23540000000003
    },
    zoom: 15,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    }
  });

  const card = document.getElementById("pac-card");
  const input = document.getElementById("pac-input");
  const input2 = document.getElementById("directions-input");
  const biasInputElement = document.getElementById("use-location-bias");
  const strictBoundsInputElement = document.getElementById("use-strict-bounds");
  const options = {
    componentRestrictions: {
      country: "us"
    },
    fields: ["formatted_address", "geometry", "name"],
    origin: map.getCenter(),
    strictBounds: false,
    types: ["establishment"],
  };

  const autocomplete = new google.maps.places.Autocomplete(input, options);
  const autocomplete2 = new google.maps.places.Autocomplete(input2, options);
  autocomplete.bindTo("bounds", map);
  autocomplete2.bindTo("bounds", map);

  var infowindow = new google.maps.InfoWindow();
  var searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));
  var event = google.maps.event.addListener(searchBox, 'places_changed', function() {
    searchBox.set('map', null);
    markers = [];
    places = searchBox.getPlaces();

    var bounds = new google.maps.LatLngBounds();
    var i, place;
    for (i = 0; place = places[i]; i++) {
      (function(place) {
        var marker = new google.maps.Marker({

          position: place.geometry.location
        });
        markers.push(marker);
        marker.bindTo('map', searchBox, 'map');
        google.maps.event.addListener(marker, 'map_changed', function() {
          if (!this.getMap()) {
            this.unbindAll();
          }
        });
        bounds.extend(place.geometry.location);

        (function(marker, place) {
          marker.addListener('click', function() {
            var content = "<h2>" + place.name + "</h2>";
            content += "<p>" + place.formatted_address + "</p>";
            infowindow.setContent(content);
            infowindow.open(map, marker);
          });
        })(marker, place);

      }(place));

    }
    map.fitBounds(bounds);
    searchBox.set('map', map);
  });

  document.getElementById('search').addEventListener('click', function() {
    var selectInput = document.getElementById("dropdown");
    var type = selectInput.options[selectInput.selectedIndex].text;
    if (!(type.localeCompare("Other") == 0)) {
      document.getElementById('pac-input').disabled = false;
      document.getElementById('pac-input').value = type;

      google.maps.event.trigger(input, 'focus', {});
      google.maps.event.trigger(input, 'keydown', {
        keyCode: 13
      });
      google.maps.event.trigger(this, 'focus', {});
    }
  });

  var directionsService = new google.maps.DirectionsService();
  var directionsRenderer = new google.maps.DirectionsRenderer();
  var directionsRenderer2 = new google.maps.DirectionsRenderer({
    map: map
  });
  directionsRenderer.setMap(map);
  const panel = document.getElementById('panel');
  directionsRenderer.setPanel(panel);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(panel);


  var start;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    });
  }

  const geocoder = new google.maps.Geocoder();

  var final = document.getElementById("directions-input");
  var end;
  document.getElementById('go').addEventListener('click', function() {

    if ((final.value.localeCompare("")) != 0) {
      geocoder.geocode({
        address: final.value,
      }, function(results, status) {

        if (status == google.maps.GeocoderStatus.OK) {
          var latitude = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
          end = new google.maps.LatLng(latitude, longitude);
        }
      });

      var mode;
      var modes = document.getElementsByName('direction-type');
      if (modes[0].checked) {
        mode = "WALKING";
      }
      if (modes[1].checked) {
        mode = "DRIVING";
      }
      if (modes[2].checked) {
        mode = "TRANSIT";
      }

      var directionsRequest = {
        origin: start,
        destination: end,
        travelMode: mode
      };

      directionsRenderer.setMap(map);
      panel.style.display = "block";
      directionsService.route(directionsRequest, function(result, status) {
        if (status == 'OK') {
          directionsRenderer.setDirections(result);
        }
      });
    }
  });

  var addresses = [];
  var content = [];
  var table = document.getElementById('contacts');
  for (i = 1, l = table.rows.length; i < l; i++) {
    addresses.push(table.rows[i].cells[2].innerHTML);

    var info = '<div id="content">' +
      '<div id="siteNotice">' +
      "</div>" +
      '<h2 id="firstHeading" class="firstHeading">' + table.rows[i].cells[0].innerHTML + '</h2>' +
      '<div id="bodyContent">' +
      "<p><b>Contact Info: </b>" + table.rows[i].cells[3].innerText + "</p>" +
      "<p><b>Location: </b>" + table.rows[i].cells[2].innerHTML + "</p>" +
      '<p><b>Website: </b><a href="' + table.rows[i].cells[4].innerHTML +
      "</p>" +
      "</div>" +
      "</div>";
    content.push(info);
  }

  var markers = [];
  var marker;
  for (i = 0, l = addresses.length; i < l; i++) {
    var address = addresses[i];
    marker = getLocation(address, content[i]);
    markers.push(marker);
  }
}

//Alternative initializer used as callback on MyForm.html
//the map widget on that page is different from the one on MyContacts.html
function init() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 44.9727,
      lng: -93.23540000000003
    },
    zoom: 15,
  });

  const card = document.getElementById("pac-card");
  const input = document.getElementById("pac-input");
  const biasInputElement = document.getElementById("use-location-bias");
  const strictBoundsInputElement = document.getElementById("use-strict-bounds");
  const options = {
    componentRestrictions: {
      country: "us"
    },
    fields: ["formatted_address", "geometry", "name"],
    origin: map.getCenter(),
    strictBounds: false,
    types: ["establishment"],
  };
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);
  const autocomplete = new google.maps.places.Autocomplete(input, options);
  autocomplete.bindTo("bounds", map);

  var infowindow = new google.maps.InfoWindow();
  var searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));
  google.maps.event.addListener(searchBox, 'places_changed', function() {
    searchBox.set('map', null);


    var places = searchBox.getPlaces();

    var bounds = new google.maps.LatLngBounds();
    var i, place;
    for (i = 0; place = places[i]; i++) {
      (function(place) {
        var marker = new google.maps.Marker({

          position: place.geometry.location
        });
        marker.bindTo('map', searchBox, 'map');
        google.maps.event.addListener(marker, 'map_changed', function() {
          if (!this.getMap()) {
            this.unbindAll();
          }
        });
        bounds.extend(place.geometry.location);

        (function(marker, place) {
          marker.addListener('click', function() {
            var content = "<h2>" + place.name + "</h2>";
            content += "<p>" + place.formatted_address + "</p>";
            infowindow.setContent(content);
            infowindow.open(map, marker);

            var formAddress = document.getElementById("location");
            formAddress.value = place.formatted_address;


          });
        })(marker, place);


      }(place));

    }
    map.fitBounds(bounds);
    searchBox.set('map', map);
  });

}

function getLocation(address, content) {
  const geocoder = new google.maps.Geocoder();
  var marker;
  geocoder.geocode({
    address: address
  }, function(results, status) {

    if (status == google.maps.GeocoderStatus.OK) {
      var latitude = results[0].geometry.location.lat();
      var longitude = results[0].geometry.location.lng();
      myLatLng = new google.maps.LatLng(latitude, longitude);
      marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        clickable: true
      });

      var infowindow = new google.maps.InfoWindow();

      google.maps.event.addListener(marker, 'click', (function(marker, content, infowindow) {
        return function() {
          infowindow.setContent(content);
          infowindow.open(map, marker);
        };
      })(marker, content, infowindow));
    }
  });
  return marker;
}

function allowTextInput() {
  var dropdownVal = document.getElementById('dropdown').value;
  if (dropdownVal.localeCompare("other") == 0) {
    document.getElementById('pac-input').disabled = false;
  } else {
    document.getElementById('pac-input').disabled = true;
  }
}
