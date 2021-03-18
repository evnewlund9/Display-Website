var currentImage = -1;
var rotating = false;

function initMap() {
    // The location of Uluru
        const UMN = { lat: 44.9727, lng: -93.23540000000003 };
    // The map, centered at Uluru
        const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: UMN,
    });
    
      var request = {
        query: 'Museum of Contemporary Art Australia',
        fields: ['name', 'geometry'],
      };

      var service = new google.maps.places.PlacesService(map);

      service.findPlaceFromQuery(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
          }
          map.setCenter(results[0].geometry.location);
        }
      });
}

function chgimg() {
    images = ['img/row1.png', 'img/row2.jpg', 'img/row3.jpg', 'img/row4.png', 'img/row5.jpg'];

    var theimage = document.getElementById("image");
    var n = Math.floor(Math.random() * 5);
    while(n == currentImage){
        n = Math.floor(Math.random() * 5);
    }
    theimage.src = images[n];
    currentImage = n;
}


function chgThumb(row, height) {
    var theThumb = document.getElementById(row);
    theThumb.height = height;
}
    
        
function rotateImg() {
    if(rotating){
        rotating = false;
        document.getElementById("image").style.animationPlayState = "paused"; 
    }
    else{
        rotating = true;
        document.getElementById("image").style.animationPlayState = "running"; 
    }
}

function extractTableData(){

    var tab = document.getElementById("tab");
    var rows = tab.rows.length;
    for(int i = 0; i < rows; i++){
        var cells = tab.rows.item(i).cells;
        var address = cells.item(2).innerHTML;
    }
    
    }


