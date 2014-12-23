(function ( mod ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) // CommonJS, Node
		module.exports = mod(window.$,window.d3);
	else
		throw "This module is only supported on Node.js.";

}(function ($,d3) {

	var figurejs = figurejs || { meta : "figurejs version 0.0.1" };

	// TODO also check for typed Arrays
	figurejs.isArray = function ( array ) {
		return Object.prototype.toString.call( array ) == '[object Array]';
	}

	/**
	 *
	 * Figure
	 *
	 * :param selector = (string) selector for the DOM (SVG) element on which to append the plot
	 *
	 */
	figurejs.Figure = function ( selector ) {
		this.selector = selector;
		this.svg = d3.select(this.selector);
		this.$element = $(selector);

		this.width = this.$element.parent().width();
		this.height = this.$element.parent().height();
		this.margins = {
			top: 20,
			right: 20,
			bottom: 20,
			left: 50
		};

		this.$element
			.width(this.width)
			.height(this.height);

		this.subElements = [];

		// TODO most everything that goes below this should be in the axes object *************

		// axis ranges
		this.xRange = d3.scale
			.linear()
			.range([this.margins.left, this.width - this.margins.right]);

		this.yRange = d3.scale
			.linear()
			.range([this.height - this.margins.top, this.margins.bottom])

		// axis appearance
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

		// clears lines from the figure; does not clear axes
		clear : function () {
			while ( this.subElements.length ) {
				var element = this.subElements.pop();
				element.clear();
			}
		},

		plot : function ( figureElement ) {
			figureElement.appendTo(this);
		},

		axes : function ( axes ) {
			axes.appendTo(this);
		},

		update : function () {
			this.yAxis.scale(this.yRange);
			this.xAxis.scale(this.xRange);
			this.yAxisSVG.call(this.yAxis);
			this.xAxisSVG.call(this.xAxis);
		},

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
	 * FigureElement base class **************** TODO
	 *
	 */
	figurejs.FigureElement = function () {

	};

	figurejs.FigureElement.prototype = {
		appendTo : function ( figure ) {
			// this should be extended in subclasses ***************************
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

		figurejs.FigureElement.call(this);

	};
	figurejs.Line.prototype = Object.create( figurejs.FigureElement.prototype );

	figurejs.Line.prototype.appendTo = function ( figure ) {

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
	}

	figurejs.Line.prototype.resize = function ( event ) {

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
	}


	figurejs.Line.prototype.area = function ( bool ) {

		if ( bool || typeof bool == "undefined" ) { // enable area
			this.__area = true;
		}
		else { // disable area
			this.__area = false;
		}

	}

	figurejs.Line.prototype.clear = function () {
		if ( this.__area ) {
			$(this.svgArea[0]).remove();
		}
		$(this.svgLine[0]).remove();
	}


	/**
	 *
	 * Axes
	 *
	 * inherits from FigureElement
	 *
	 */
	figurejs.Axes = function () {


		figurejs.FigureElement.call(this);

	};
	figurejs.Axes.prototype = Object.create( figurejs.FigureElement.prototype );

	return figurejs;

}));