/**
 *
 * NodePlot
 *
 *
 *
 * will generate a plot either in a window (using NodeWebkit) or in an iframe 
 *
 * parameters = {
 *		window : boolean - if set to true, Figure returns a new FigureWindow object
 *			otherwise, it returns a   
 * }
 *
 * Figure uses websockets to connect to a front end figure window that's launched with node-webkit
 *
 */



var spawn = require("child_process").spawn,
	fs = require("fs"),
	io = require('socket.io')(3333),
	Q = require('q');



function Figure( options ) {
	if (!(this instanceof Figure)) {
		return new Figure();
	}

	// this.handle - returns either a handle to the either the nwprocess or a link to the iframe

	this.data = {
		x : [],
		y : [],
	};

	// spawn node-webkit as a child process
	this.nwprocess = spawn( 
		__dirname + "/../node_modules/nodewebkit/bin/nodewebkit", 
		[ __dirname + "/figure/templates/" ] );

	// exit handler
	this.exitDefer = Q.defer();
	this.nwprocess.on('exit', function ( code, signal ) {
		this.exitDefer.resolve({ "code" : code, signal : signal });
	}.bind(this));

	io.sockets.on('connection', function ( socket ) {

		socket.on('message', function( data, callback ) {
			callback(this.data)
		}.bind(this))

	}.bind(this));

};

Figure.prototype = {

	// Plot should be passed a plot object
	// 	- or a JSON object describing the plot
	// 
	// Class PlotInterface
	// 	- Plot2D
	// 	- Plot3D
	// 	- Histogram
	// 	- Contour
	// 	- BarChart
	// 	- PieChart
	// 	- DonutChart
	// 	- RadarChart
	// 	- Area
	// 	- Density Matrix
	// 	- Sunburst Plot
	// Class AxisInterface
	// 

	/**
	 * Asynchronously plot the data to the figure
	 *
	 * Waits for the figure window to be loaded before plotting.
	 *
	 */

	plot : function ( x, y ) {
		if ( y && Object.prototype.toString.call( y ) === '[object Array]' ) {
			this.data.y = y;
			this.data.x = x;
		}
		else {
			this.data.y = x;
			this.data.x = (function(a,b){ while(b--) { a[b] = b; } return a})([],x.length)
		}
		return this
	},

	axes : function ( options ) {

	},

	/**
	 * 
	 * execute a callback function when the NodeWebkit process closes
	 *
	 */
	close : function ( callback ) {
		this.exitDefer.promise.then( callback );
	}
};


module.exports.Figure = Figure;	

