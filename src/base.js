(function() {
	var errorOccurred = false;

	window.onerror = function(msg, url, line) {
		if (errorOccurred) {
			return;
		}

		errorOccurred = true;
		alert(["There was an error on this page.\n\n", url, " (", line, ") : ", msg].join(""));		
	}
})();

function addEvent(obj, name, fn) {
	if (obj.addEventListener) { // W3C DOM
		obj.addEventListener(name, fn, false);
	}
	else if (obj.attachEvent) // IE DOM
	{
		obj["e" + name + fn] = fn;
		obj[name + fn] = function() { obj["e" + name + fn](window.event); }
		obj.attachEvent("on" + name, obj[name + fn]);
	}
	else { // No much to do
		obj["on" + name] = fn;
	}
}

var ready = (function () {
	function ready(f) {
		if (ready.done) {
			return f();
		}

		if (ready.timer) {
			ready.ready.push(f);
		} 
		else {
			addEvent(window, "load", isDOMReady);
			ready.ready = [f];
			ready.timer = setInterval(isDOMReady, 13);
		}
	};

	function isDOMReady() {
		if (ready.done) {
			return false;
		}

		if (document && document.getElementsByTagName && document.getElementById && document.body) {
			clearInterval(ready.timer);
			ready.timer = null;
			for (var i = 0; i < ready.ready.length; i++) {
				ready.ready[i]();
			}
			ready.ready = null;
			ready.done = true;
		}
	}

	return ready;
})();

function isAppleMobileDevice() {
	return navigator.userAgent.match(/iPhone|iPod|iPad/gi) ? true : false;
}

function isEmptyObject(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
}

function httpGetText(uri, async, callback) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (request.readyState == 4 && request.status == 200) {
			var text = request.responseText;
			callback(text);
		}
	}

	request.open("GET", uri, async);
	//request.overrideMimeType("text/plain");
	request.setRequestHeader("Content-Type", "text/plain");
	request.send();
}

function httpPostText(uri, async, text, callback) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (request.readyState == 4 && request.status == 200) {
			var text = request.responseText;
			callback(text);
		}
	}

	request.open("POST", uri, async);
	//request.overrideMimeType("text/plain");
	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	request.setRequestHeader("Content-length", text.length);
	request.setRequestHeader("Connection", "close");
	request.send(text);
}