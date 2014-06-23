requirejs.config({
	paths : {
		jquery : "../../../bower_components/jquery/dist/jquery.min",
		jqueryui : "../../../bower_components/jquery-ui/ui/minified/jquery-ui.min", 
		socketio : '../../../node_modules/socket.io-client/socket.io',
		d3 : '../../../bower_components/d3/d3.min' 
	},
	shim : {
		jquery : {
			exports : "$"
		},
		jqueryui : {
			exports : '$',
			deps : [ 'jquery' ]
		},
	}
});

requirejs([ "socketio", "d3", "jqueryui" ], function ( io, d3, $ ) {

	var socket = io.connect("http://localhost:3333");

	socket.on('connect', function () {
		socket.emit( 'message', '', function ( data ) {

			// define dimensions of graph
			var graph = $("#graph"),
				m = { top: 50, right: 50, bottom: 50, left: 50 },
				w = graph.width() - (m.left + m.right),
				h = graph.height() - (m.top + m.bottom);

			var x = d3.scale.linear().domain([0, data.x.length]).range([0, w]);
			// Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
			// var y = d3.scale.linear().domain([0, 10]).range([h, 0]);
			// automatically determining max range can work something like this
			var y = d3.scale.linear().domain([0, d3.max(data.y)]).range([h, 0]);


			var line = d3.svg.line()
				.x( function (d,i) { return x(i); })
				.y( function (d) { return y(d); })

			var graph = d3.select("#graph").append("svg:svg")
				.attr("width", w + m.top + m.bottom)
				.attr("height", h + m.left + m.right)
				.append("svg:g")
				.attr("transform", "translate(" + m.left + "," + m.top + ")")

			var xAxis = d3.svg.axis().scale(x).tickSize(-h);
			graph.append("svg:g")
				.attr("class", "x-axis")
				.attr("transform", "translate(0," + h + ")")
				.call(xAxis);

			var yAxis = d3.svg.axis().scale(y).ticks(4).orient("left");
			graph.append("svg:g")
				.attr("class", "y-axis")
				.attr("transform", "translate(-15,0)")
				.call(yAxis);

			graph.append("svg:path").attr("d", line(data.y));
		});
	});

	window.onresize = function ( event ) {

	};

	// var socket = io( "http://localhost:3333" );

	// socket.on('connect', function () {
	// 	socket.emit('message',{},function (data) {
	// 		if ( Object.prototype.toString.call( data ) === '[object Array]' ) {

	// 		}
	// 	});
	// });

});