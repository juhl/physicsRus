DemoSandBox = function() {
	var space;

	function init(s) {
		space = s;		
	}    

	function runFrame() {
	}

	function name() {
		return "SandBox";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();