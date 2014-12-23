/**
 *
 * Basic plotting abstraction with d3
 *
 *
 *
 * WARNING: this utility is a work in progress and shouldn't be used in production yet
 *
 *
 * @author jonbrennecke
 * @link github.com/jonbrennecke/figure.js
 * @package figure.js
 *
 *
 */

(function ( mod ) {

	// @todo detect other module loaders

	// normal browser environment
	window.figurejs = mod($,d3);
		

}(function ( $, d3 ) {

	var figurejs = figurejs || { meta : "figurejs namespace" };

	// @todo also check for typed Arrays
	figurejs.isArray = function ( array ) {
		return Object.prototype.toString.call( array ) == '[object Array]';
	}

	/**
	 *
	 * Figure
	 *
	 * Main figure object
	 *
	 * @param selector = (string) selector for the DOM (SVG) element on which to append the plot
	 *
	 */
	figurejs.Figure = function ( selector ) {

		this.selector = selector;
		this.svg = d3.select(this.selector);
		this.$element = $(selector);
		this._axes = true;
		this.width = this.$element.parent().width();
		this.height = this.$element.parent().height();
		this.margins = {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};

		this.$element
			.width(this.width)
			.height(this.height);

		$(window).resize(this.resize.bind(this));

		this.subElements = [];

		// axis ranges
		this.xRange = d3.scale
			.linear()
			.range([this.margins.left, this.width - this.margins.right]);

		this.yRange = d3.scale
			.linear()
			.range([this.height - this.margins.top, this.margins.bottom])

		// axis objects
		this.xAxis = d3.svg
			.axis()
			.scale(this.xRange)
			.tickSize(5)
			.tickSubdivide(true),

		this.yAxis = d3.svg
			.axis()
			.scale(this.yRange)
			.tickSize(5)
			.orient("left")
			.tickSubdivide(true);

		// axis svg elements
		this.xAxisSVG = this.svg.append("svg:g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (this.height - this.margins.bottom) + ")")
			.call(this.xAxis);

		this.yAxisSVG = this.svg.append("svg:g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + (this.margins.left) + ",0)")
			.call(this.yAxis);

	};

	figurejs.Figure.prototype = {

		/**
		 * 
		 * getter/setter methods to turn axes on or off
		 *
		 */

		get axes () {
			return this._axes;
		},

		set axes ( bool ) {
			this._axes = bool;

			// remove axes from figure
			if ( ! bool ) {
				this.yAxisSVG.remove();
				this.xAxisSVG.remove();
			}
		},

		/**
		 * 
		 * Clear the figure
		 *
		 * Clears lines from the figure; does not clear axes
		 *
		 * @todo clear axes as well
		 *
		 */
		clear : function () {
			while ( this.subElements.length ) {
				var element = this.subElements.pop();
				element.clear();
			}
		},

		/**
		 *
		 * Plot the figureElement
		 *
		 *
		 * @todo check for function implementation before calling element.appendTo
		 *
		 */
		plot : function ( figureElement ) {
			figureElement.appendTo(this);
		},

		/**
		 *
		 * Update the figure
		 *
		 */
		update : function () {
			this.yAxis.scale(this.yRange);
			this.xAxis.scale(this.xRange);
			this.yAxisSVG.call(this.yAxis);
			this.xAxisSVG.call(this.xAxis);
		},

		/**
		 *
		 * Resize the figure
		 *
		 */
		resize : function ( event ) {

			this.width = this.$element.parent().width();
			this.height = this.$element.parent().height();
			this.$element.width(this.width).height(this.height)

			this.xRange.range([this.margins.left, this.width - this.margins.right]);
			this.yRange.range([this.height - this.margins.top, this.margins.bottom]);

			this.xAxis.scale(this.xRange);
			this.yAxis.scale(this.yRange);

			this.xAxisSVG.attr("transform", "translate(0," + (this.height - this.margins.bottom) + ")");
			this.yAxisSVG.attr("transform", "translate(" + (this.margins.left) + ",0)");

			for (var i = 0; i < this.subElements.length; i++) {
				this.subElements[i].resize(event);
			};

			this.update();
		}

	};



	/**
	 *
	 * Line
	 *
	 * inherits from FigureElement
	 *
	 */
	figurejs.Line = function ( x, y ) {

		// check arguments ******************************************

		// TODO check for typed array

		if ( !figurejs.isArray(x) || !figurejs.isArray(y) ) 
			throw "Error: figurejs.Line: the inputs 'x' and 'y' to must both be arrays.";

		if ( x.length != y.length )
			throw "Error: figurejs.Line: the inputs 'x' and 'y' must be the same length.";
		
		// assign variables ******************************************

		this.pts = x.map(function(x,i){
			return [x,y[i]];
		});

		this.max = { 
			'x' : d3.max(x), 
			'y' : d3.max(y) 
		};

		this.min = { 
			'x' : d3.min(x), 
			'y' : d3.min(y) 
		};

		this.__area = false;
		this.lineFunc = d3.svg.line();
		this.areaFunc = d3.svg.area();
	};

	figurejs.Line.prototype = {


		appendTo: function ( figure ) {

			this.figure = figure;

			figure.yRange.domain([ this.min.y, this.max.y ]);
			figure.xRange.domain([ this.min.x, this.max.x ]);

			this.lineFunc
				.x(function (d) { return figure.xRange(d[0]); })
				.y(function (d) { return figure.yRange(d[1]); })
				.interpolate('basis');

			// if enabled, display filled area under the curve
			if ( this.__area ) {
				this.areaFunc
					.x(function (d) { return figure.xRange(d[0]); })
					.y(function (d) { return figure.yRange(d[1]); })
					.y0(figure.height - figure.margins.bottom)
					.interpolate('basis');

				this.svgArea = figure.svg
					.append("svg:path")
					.attr("class", "area-plot")
					.attr("d", this.areaFunc(this.pts));
			}

			this.svgLine = figure.svg
				.append("svg:path")
				.attr("class", "line-plot")
				.attr("d", this.lineFunc(this.pts))

			figure.subElements.push(this);
			figure.update();
		},

		resize: function ( event ) {

			this.lineFunc
				.x(function (d) { return this.figure.xRange(d[0]); })
				.y(function (d) { return this.figure.yRange(d[1]); })

			this.svgLine.attr('d',this.lineFunc(this.pts));

			if ( this.__area ) {
				this.areaFunc
					.x(function (d) { return this.figure.xRange(d[0]); })
					.y(function (d) { return this.figure.yRange(d[1]); })
					.y0(this.figure.height - this.figure.margins.bottom)

				this.svgArea.attr('d',this.areaFunc(this.pts));
			}
		},

		area: function ( bool ) {
			if ( bool || typeof bool == "undefined" ) { // enable area
				this.__area = true;
			}
			else { // disable area
				this.__area = false;
			}
		},

		clear: function () {
			if ( this.__area ) {
				$(this.svgArea[0]).remove();
			}
			$(this.svgLine[0]).remove();
		}

	};



	return figurejs;

}));