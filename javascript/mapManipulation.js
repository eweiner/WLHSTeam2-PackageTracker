var markers = {};
var infoWindows = {};
var userMode = false;
var adminMode = false;
var populateUUIDView = true;
var uuidToView = [];
var myCenter = new google.maps.LatLng(0, 0);
var map;
var travelTime;
var packageList;
var packagesAttributeLists = {};
var toChangeIcon = {};
var boundsForPackage;
var directionsService = new google.maps.DistanceMatrixService();
var directionsDisplay = new google.maps.DirectionsRenderer;


/**
* Initializes google map, displays on html
*/
function initialize() {
    var mapProp = {
        center: myCenter,
        zoom: 1,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    map = new google.maps.Map($("#googleMap")[0],mapProp);


}

/**
* Creates a get request that runs update with the result of the get request, an object
* that contains all of the packages matched to their UUID as their key
*/
function getAllPackages() {
    $.get("http://127.0.0.1:8080/packages", function(packagesObject) {
        update(packagesObject);
    });
}

/**
* Zooms google map out to a view of the whole world
*/
function zoomOut() {
    map.setCenter(new google.maps.LatLng(0,0));
    map.setZoom(1);
    
}

/**
* Creates a list element in list parent, based on parameters given
* @param {jQuery object} parent - The parent list that the li is inserted into
* @param {String} htmlClass - The class that the li should have
* @param {String} contentName - The label for the content, will be displayed to user
* @param {String} content - The content to be displayed to the user
*/
function createListElement(parent, htmlClass, contentName, content) {

    parent.append('<li class="' + htmlClass + '"> ' + contentName + ": " + content);
    
}

/**
* Creates a list element in list parent, based on parameters given
* @param {jQuery object} parent - The parent list that the li is inserted into
* @param {String} htmlClass - The class that the li should have
* @param {String} contentName - The label for the content, will be displayed to user
* @param {String} content - The content to be displayed to the user
* @param {String} id - The id that the li should have
*/
function createListElementWithId(parent, htmlClass, contentName, content, id) {
    parent.append("<li class=" + htmlClass + '" id= ' + id + '> ' + contentName + ": " + content);
}

/**
* Sets admin mode to true, cleans up elements from user mode, and triggers the population of uuidToView 
*/
function setAdminMode() {
    userMode = false;
    adminMode = true;
    populateUUIDView = true;
    $("#userMode").prop('checked', false);
    $("#userModeHandler").remove();
}

/**
* Sets user mode to true, cleans up elements from admin mode, and creates an interface for user to
* enter UUIDs that they wish to view on a map
*/
function setUserMode() {
    uuidToView = [];
    adminMode = false;
    $("#adMode").prop('checked', false);
    if (!userMode) {
        $("#buttonDiv").append('<div id="userModeHandler"></div>')
        $("#userModeHandler").append('<button onclick="addUUIDBox()" id="addUUID">Click To Add UUID Field</button>');
        $("#userModeHandler").append('<button onclick="deleteUUIDBox()" id="addUUID">Delete Field</button>');
        $("#userModeHandler").append('<button onclick="submitUUIDs()" id="submitUUID">TRACK</button><br>');
        resetMap();
    }
    userMode = true;
    
}


/**
* Deletes the last UUID input box in the list of input boxes for user mode
*/
function deleteUUIDBox() {
    $("#userModeHandler input").last().remove();
    $("#userModeHandler br").last().remove();
    $("#userModeHandler p").remove();
}

/**
* Tests to see whether or not the input is 36 characters long with 4 hyphons within the string
* @param {String} valueToTest - A String that is submitted by the user as a UUID
*/
function uuidTest(valueToTest) {
    if (valueToTest.length === 36 && valueToTest.split("-").length === 5) {
        return true;
    }
    return false;
}

/**
* Submits any UUIDs in the input boxes in the user mode interface. Any input that does not meet the quick uuidTest check
* creates a paragraph element that tells the user which box did not work
*/
function submitUUIDs() {
    var uuidFields = $(".UUIDField");
    $("#userModeHandler p").remove();
    $.each(uuidFields, function(index, val) {
        if (uuidTest(val.value)) {
            uuidToView.push(val.value);
        } else {
            $("#userModeHandler").append("<p>UUID in box " + (index + 1) + " is not valid</p>");
        }
    });
}

/**
* The click function that when triggered adds an input box in the user mode interface
*/
function addUUIDBox() {
    if ($("#userModeHandler input").last().val() || $("#userModeHandler input").length === 0) {
        $("#userModeHandler").append('<input type="text" class="UUIDField"><br>')
    }
}

/**
* Function that creates a google latitude longitude object, used in much of the functionality of Google Maps Javascript API
* @param {Number} lat - The latitude of a point
* @param {Number} long - The longitude of a point
* @returns {LatLng} Google LatLng object with desired latitude and longitude
*/
function createGoogleLatLng(lat, long) {
    return new google.maps.LatLng(lat, long)
}

/**
* Returns the number of minutes of a date object, with a 0 before the units as a digital clock would have if
* the number of minutes is less than 10
* @param {Date} time - The date to be formatted
* @returns {String} Formatted minutes string
*/
function formatMinutes(time) {
    var minutes = (time.getMinutes() + "").length === 2 ? minutes = time.getMinutes() :
                "0" + time.getMinutes();
    return minutes;
}

/**
* Adds timeToArrival to the current date, returns an updated date object
* @param {Date} date - The date to which time should be added
* @param {String} timeToArrival - A string with the format "x hours y min" or "x min"
* @returns {Date} New date with the desired time added
*/
function addTime(date, timeToArrival) {
    var mins = 0;
    var hours;
    hours = timeToArrival.indexOf("hours") === -1 ? 0 : timeToArrival.substring(0, timeToArrival.indexOf("hours"));
    mins = timeToArrival.indexOf("hours") === -1 ? timeToArrival.substring(0, timeToArrival.indexOf("min") - 1) :
        timeToArrival.substring(timeToArrival.indexOf("hours") + 6, timeToArrival.indexOf("min") - 1);

    return new Date(date.getTime() + Number(mins)*60000 + Number(hours)*60000*60);
}

/**
 * Zooms in on a package's start and end locations
 * @param {JSON} pckg - The package that you wish to zoom in on
 */
function zoomIn(pckg) {

    latlngbounds = new google.maps.LatLngBounds();
    latlngbounds.extend(new google.maps.LatLng(pckg.lat, pckg.long));
    latlngbounds.extend(new google.maps.LatLng(pckg.destLat, pckg.destLong));
    map.setCenter(latlngbounds.getCenter());
    map.fitBounds(latlngbounds);
    
}

/**
 * Takes a UTC format string and converts it into a date object
 * @param {String} dateString - A string formatted as a UTC time
 * @returns {Date} The date object that corresponds with the inputted time
 */
function parseDate(dateString){
    var time = Date.parse(dateString);
    if(!time){
        time = Date.parse(dateString.replace("T"," "));
        if(!time){
            bound = dateString.indexOf('T');
            var dateData = dateString.slice(0, bound).split('-');
            var timeData = dateString.slice(bound+1, -1).split(':');

            time = Date.UTC(dateData[0],dateData[1]-1,dateData[2],timeData[0],timeData[1],timeData[2]);
        }
    }

    return time;
}

/**
 * Calculates a package's average speed over the course of its trip
 * @param {JSON} pckg - The package whose speed needs to be found
 * @returns {Number} The total displacement of the package divided by the time to get an average speed
 */
function packageSpeed(pckg) {
    var distance = google.maps.geometry.spherical.computeDistanceBetween(createGoogleLatLng(pckg.lat, pckg.long),
                    createGoogleLatLng(pckg.startLat, pckg.startLong));

    var time = Math.floor((parseDate(pckg.time) - parseDate(pckg.startTime))/1000);
    return distance/time;
}

/**
 * Makes an estimate of a package's arrival time based on it's average speed
 * @param {JSON} pckg - A package object with an unknown trip duration
 * @returns A string in the format "x hours y min" or "x min" of the duration of the rest of a package's journey
 */
function findDurationVelocityEstimate(pckg) {
    var distanceToGo = google.maps.geometry.spherical.computeDistanceBetween(createGoogleLatLng(pckg.lat, pckg.long),
                    createGoogleLatLng(pckg.destLat, pckg.destLong));
    var timeLeft = distanceToGo/packageSpeed(pckg)/60;
    if (Math.floor(timeLeft/60) === 0) {
        return Math.floor(timeLeft) + " min";
    }
    return Math.floor(timeLeft/60) + " hours " + Math.floor(timeLeft % 60) + " min";
}

/**
  * Finds an estimate of the time remaining in a package's journey using Google maps geometry API, unless google is unable to calculate
  * the time remaining, in which case an estimate is made based on a package's average speed
  * @param {LatLng} start - The current coordinate for a package in the form of a google object
  * @param {LatLng} end - The destination coordinate for a package in the form of a google object
  * @param {jQuery} element - The jquery element that the ETA should be displayed in
  * @param {JSON} pckg - A package object to have it's trip duration found
  */
function findDurationOfTrip(start, end, element, pckg) {
    directionsService.getDistanceMatrix({
        origins: [start],
        destinations: [end],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function(response, status) {
        var currentTime = new Date(pckg.time);
        if (status == google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status != "ZERO_RESULTS") {
            travelTime = response.rows[0].elements[0].duration.text;
            
            if (Number(travelTime.substring(0,1)) === 1) {         
                element.text('ETA: ' + $.datepicker.formatDate("M d, yy", currentTime) + ' ' + currentTime.getHours() + ":" + formatMinutes(currentTime));
            } else {
                var addedTime = addTime(currentTime, travelTime);
                element.text('ETA: ' + $.datepicker.formatDate("M d, yy", addTime(currentTime, travelTime)) + " " + addedTime.getHours() + ":" + formatMinutes(addedTime));
            }

 
        } else {
            travelTime = findDurationVelocityEstimate(pckg);
            addedTime = addTime(currentTime, travelTime);
            element.text('ETA: ' +$.datepicker.formatDate("M d, yy", addTime(currentTime, travelTime + " min")) + " " + currentTime.getHours() + ":" + formatMinutes(addedTime));
        }       
        
    });
}

/**
 * Creates a list element containing the name of a package and an unordered list that contains information about a package and hides it
 * @param {String} packageID - The UUID of a package
 * @param {JSON} packageObj - A package object that should be added to the parentUL
 * @param {jQuery object} - The UL that should contain the new information
 * @param {LatLng} location - A google LatLng object that refers to a package's current location
 * @param {LatLng} destination - A google LatLng object that refers to a package's destination 
 */
function initializePackageList(packageID, packageObj, parentUL, location, destination) {
    createListElement(parentUL, 'name ' + packageID, 'Name', packageObj.name);
    parentUL.append('<ul id=' + packageID + ' class="expList"></ul>');
    parentUL.append('<br>')
    childUL = $("#" + packageID);
    createListElement(childUL, 'distance', 'Distance',
                     google.maps.geometry.spherical.computeDistanceBetween(location, destination));
    createListElement(childUL, 'duration', 'ETA', '');
    if (packageObj.delivered) {
        createListElement(childUL, 'status', 'Status', 'Delivered');
    } else {
        createListElement(childUL, 'status', 'Status', 'Shipped');
    }
    createListElement(childUL, 'uuid', 'Package UUID', packageID);
    childUL.toggle();
     
    
}

/**
 * Updates the information about a package in the display
 * @param {String} packageID - The UUID of a package
 * @param {JSON} pckg - A package object that should be added to the parentUL
 * @param {LatLng} location - A google LatLng object that refers to a package's current location
 * @param {LatLng} destination - A google LatLng object that refers to a package's destination 
 */
function updatePackageInfo(packageID, pckg, location, destination) {
    var Destination = $("#" + packageKey).find('.distance');
    var Duration = $("#" + packageKey).find('.duration');
    var Status = $("#" + packageKey).find('.status');
    if (pckg.delivered) {
        Status.text(' Status: Delivered');
    } else {
        Status.text(' Status: Shipped');
    }
    Destination.text("Distance To Destination: " + 
                     Math.floor(google.maps.geometry.spherical.computeDistanceBetween(location, destination)/100)/10 + 
                               " km");

    findDurationOfTrip(location, destination, Duration, pckg);
    
        
}

/**
 * A helper function that returns whether or not a jQuery selector has found an element
 * @returns {bool} true if the jQuery selector has found an object, false if it has not
 */
$.fn.exists = function () {
    return this.length !== 0;
}

/**
 * Gets the number of packages that the server has received updates on in the last session
 * @param {JSON} packageObject - The JSON that the server gives at 127.0.0.1:8080/packages
 * @returns The number of packages in that object
 */
function getNumPackages(packageObject) {
    return Object.keys(packageObject).length;
}

/**
 * Creates a google marker at a desired location that corresponds to a package with a click listener function to zoomIn(pckg)
 * @param {LatLng} location - A google LatLng object that refers to a package's current location
 * @param {String} icon - A string that corresponds to the image of a google pin
 * @param {JSON} pckg - A package object that should be added to the parentUL
 * @param {String} packageKey - The UUID of a package
 */
function createPackageMarker(location, icon, pckg, packageKey) {
    newMarker = new google.maps.Marker({
                    position: location,
                    icon: icon
                });
    google.maps.event.addListener(newMarker, 'click', function() {
                    $("#" + packageKey).toggle(true);
                    markers[packageKey].setIcon('smallboxglow.png');
                    zoomIn(pckg);
                })
    return newMarker;
}

/**
 * Deletes all of the package information lists and markers on a map, primes the map to be repopulated
 */
function resetMap() {
    uuidToView = [];
    $("#packages").empty();
    for (key in markers) {
        if (markers[key] !== null) {
            markers[key].setMap(null);
            markers[key] = null;
        }
    }
    for (key in toChangeIcon) {
        toChangeIcon[key] = undefined;
    }
}

/**
 * Creates a google marker at a desired location that corresponds to a package with a click listener that zooms
 * in a set distance away
 * @param {LatLng} location - A google LatLng object that refers to a package's current location
 * @param {String} icon - A string that corresponds to the image of a google pin
 * @param {String} packageKey - The UUID of a package
 */
function createOpenPackageMarker(location, icon, packageKey) {
    newMarker = new google.maps.Marker({
                    position: location,
                    icon: icon
                });
    google.maps.event.addListener(newMarker, 'click', function() {
                    $("#" + packageKey).toggle(true);
                    markers[packageKey].setIcon('smallboxopenglow.png')
                    map.setCenter(location);
                    map.setZoom(9);
                })
    return newMarker;
}

/**
 * The main function that is run in order to update the map and info lists to reflect new information either
 * from the server or from user input. In user mode, the list of UUID's that the user has entered is used to
 * determine which packages to display on the map and on the side bar, and in admin mode all packages are
 * displayed in both locations.
 * @param {JSON} packageObjects - An object containing all of the packages that should be updated or initialized
 */
function update(packageObjects) {
    var pckg;
    if (adminMode && uuidToView.length < getNumPackages(packageObjects)) {
        populateUUIDView = true;
    }
    if (adminMode && populateUUIDView) {
        for(packageKey in packageObjects) {
            uuidToView.push(packageKey);
            populateUUIDView = false;
        }    
    }
    for(keyIndex in uuidToView) {
        packageKey = uuidToView[keyIndex]
        pckg = packageObjects[packageKey];
        if (pckg) {
            var location = new google.maps.LatLng(pckg.lat, pckg.long);
            var destination = new google.maps.LatLng(pckg.destLat, pckg.destLong);
            
            if (!markers[destination]) {
                markers[destination] = createPackageMarker(destination, 'house.png', pckg, packageKey);
                markers[destination].setMap(map);
            }

            if (!markers[packageKey]) {
                markers[packageKey] = createPackageMarker(location, 'smallbox.png', pckg, packageKey);
                markers[packageKey].setMap(map);
                initializePackageList(packageKey, pckg, packageList, location, destination);
                
                

            } else {
                updatePackageInfo(packageKey, pckg, location, destination);
                markers[packageKey].setPosition(location);
            }
            if (pckg.delivered && toChangeIcon[packageKey] === undefined ) {
                toChangeIcon[packageKey] = true;
            }
            if (pckg.delivered && toChangeIcon[packageKey]) {
                markers[destination].setMap(null);
                markers[packageKey].setMap(null);
                markers[packageKey] = createOpenPackageMarker(location, 'smallboxopen.png', packageKey);
                
                markers[packageKey].setMap(map);
                toChangeIcon[packageKey] = false;
            }
            
        }
    }
}


/**
 * Function that smoothly hides or shows information about a package on the click of the name of a package
 */
$(document).on('click', '.name', function() {
    if ($("#" + this.classList[1]).is(":hidden")) {
        if (packageList.find("#" + this.classList[1]).find(".status").text() === " Status: Delivered") {
            markers[this.classList[1]].setIcon('smallboxopenglow.png');
        } else {
            markers[this.classList[1]].setIcon('smallboxglow.png');
        }
    } else {
        if (packageList.find("#" + this.classList[1]).find(".status").text() === " Status: Delivered") {
            markers[this.classList[1]].setIcon('smallboxopen.png');
        } else {
            markers[this.classList[1]].setIcon('smallbox.png');
        }
    }
    $("#" + this.classList[1]).toggle(200);

    
    
    
});

/**
 * Function that smoothly hides information about a package on the click of that information
 */
$(document).on('click', '.expList', function() {
    $("#" + this.id).toggle(200);
    if (packageList.find("#" + this.id).find(".status").text() === " Status: Delivered") {
        markers[this.id].setIcon('smallboxopen.png');
    } else {
        markers[this.id].setIcon('smallbox.png');
    }
});

/**
 * On document ready, initialize map and then run get all packages every second
 */
$(document).ready(function() {
    packageList = $("#packages");
    initialize();
    setInterval(getAllPackages, 1000);
});


