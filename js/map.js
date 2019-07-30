var currentYear;

var fadeQueue = [];

var fading = false;

var opactityDelta = 0.1;

var fadeInQueue = [];
var fadeOutQueue = [];

function fadeMarkers(markers, fadeIn) {
    var delta = fadeIn ? opactityDelta : -opactityDelta;

    for(var i = 0; i < markers.length; ++i) {
        var marker = markers[i];

        marker.setOpacity(marker.getOpacity() + delta);

        if(fadeIn && marker.getOpacity() >= 1.0) {
            marker.setOpacity(1.0);
            markers.splice(i, 1);
            i -= 1;
        } else if(!fadeIn && marker.getOpacity() <= 0.0) {
            marker.setOpacity(0.0);
            markers.splice(i, 1);
            i -= 1;
        } else {
            done = false;
        }
    }
}

function checkMoreWork() {
    fadeMarkers(fadeInQueue, true);
    fadeMarkers(fadeOutQueue, false);

    if(fadeInQueue.length > 0 || fadeOutQueue.length > 0) {
        setTimeout(function() {
            checkMoreWork();
        }, 50);
    }
}

function queueFade(fadeInMarkers, fadeOutMarkers) {
    if(fadeInMarkers != undefined) {
        for(var i = 0; i < fadeInMarkers.length; ++i) {
            var marker = fadeInMarkers[i];
            if(!fadeInQueue.includes(marker)) {
                fadeInQueue.push(marker);
            }

            //Remove any on the fade out queue
            var index = fadeOutQueue.indexOf(marker);
            if(index > -1) {
                fadeOutQueue.splice(index, 1);
            }
        }
    }

    if(fadeOutMarkers != undefined) {
        for(var i = 0; i < fadeOutMarkers.length; ++i) {
            var marker = fadeOutMarkers[i];
            if(!fadeOutQueue.includes(marker)) {
                fadeOutQueue.push(marker);
            }

            //Remove any on the fade in queue
            var index = fadeInQueue.indexOf(marker);
            if(index > -1) {
                fadeInQueue.splice(index, 1);
            }
        }
    }

    checkMoreWork();
}

var timeLapsing = false;
var stopTimeLapse = false;
function timeLapse(yearSlider) {
    if(stopTimeLapse) {
        stopTimeLapse = false;
        timeLapsing = false;
        return;
    }

    if(yearSlider.value == yearSlider.max) {
        return;
    }

    yearSlider.value = parseInt(yearSlider.value) + 1;
    yearSlider.oninput();

    setTimeout(function() {
        timeLapse(yearSlider);
    }, 500);
}

function formatTitle(element) {
    var result = element.address;
    result += "\n\n";

    for(var i = 0; i < element.people.length; ++i) {
        result += element.people[i].surname;
        result += ", ";
        result += element.people[i].firstName;
        result += "\n";
    }

    return result;
}

function initMap() {
  var markersByYear = new Map();
  var allMarkers = new Array();

  var yearSlider = document.getElementById('yearSlider');
  var yearLabel = document.getElementById('yearLabel');
  //var countLabel = document.getElementById('countLabel');

  var playButton = document.getElementById('play');
  playButton.onclick = function() {
      if(timeLapsing) {
          stopTimeLapse = true;
      } else {
          timeLapsing = true;
          timeLapse(yearSlider);
      }
  }

  currentYear = undefined;

  yearLabel.innerHTML = yearSlider.value;
  yearSlider.oninput = function() {
    yearLabel.innerHTML = this.value;

    var markersForYear = markersByYear[this.value];
    /*var count = 0;
    if(markersForYear != undefined) {
        for(var i = 0; i < markersForYear.length; ++i) {
            count += 1;
        }
    }

    countLabel.innerHTML = count;*/

    var markersForCurrentYear;
    if(currentYear != undefined) {
        markersForCurrentYear = markersByYear[currentYear];
    }

    queueFade(markersForYear, markersForCurrentYear);

    currentYear = this.value;
  };

  var center = {lat: -33.871799, lng: 151.208209};
  var map = new google.maps.Map(document.getElementById('map'),
                    {
                      zoom: 14,
                      center: center
                    });

  var bounds = new google.maps.LatLngBounds();

  Object.keys(map_data).forEach(function(key) {
    var location_data_for_year = map_data[key];

    var markerList = markersByYear[key];
    if(markerList == undefined) {
        markerList = new Array();
        markersByYear[key] = markerList;
    }

    for (var i = 0; i < location_data_for_year.length; ++i) {
        var location_data = location_data_for_year[i];

        var marker = new google.maps.Marker({
          position: {
            lat: location_data.latLong.lat,
            lng: location_data.latLong.lng
          },
          map: map,
          title: formatTitle(location_data)
        });

        marker.setOpacity(0);

        markerList.push(marker);
        allMarkers.push(marker);

        bounds.extend(marker.getPosition());
      }
  });

  yearSlider.oninput();
}
