
toxicity = {}

toxicity.checknames = [
	"nbMethods",
	"ccnMethodMax",
	"efferentCoupling",
	"lcom",
	"lloc"
];

toxicity.colors = [
	"#6D5A8D",
	"#989BFA",
	"#9C4B45",
	"#8EA252",
	"#5396AC",
	"#CE8743"
];

toxicity.thresholds = {
	nbMethods: 30,
	ccnMethodMax: 10,
	efferentCoupling: 30,
	lcom: 1,
	lloc: 500
}

toxicity.calc = function (jsonDoc) {
    const fileNames = Object.keys(jsonDoc);

	return fileNames.map((filename, index) => {
		const metricObject = jsonDoc[filename]

		const result = {
			_name: metricObject.name.split('\\').slice(-1)[0],
			_path: metricObject.name,
			total: 0
		}

		toxicity.checknames.forEach((checkname) => {
			const metric = orZero(metricObject[checkname]);
			const score = metric / toxicity.thresholds[checkname];
			result[checkname] = score;
			result.total += score;
		});

		return result;
	});
}

toxicity.draw = function(scores) {
	var CHEIGHT = 425;
	var BWIDTH = 6;
	var BGAP = 2;
	var LEFTSPACE = 25;

	scores.sort(function(da, db) { return db.total - da.total })
		
	var checks = d3.layout.stack()(toxicity.checknames.map(function(checkname) {
		return scores.map(function(d, i) {
			return { x: i, y: d[checkname] || 0, score: d };
		});
	}));

	d3.selectAll("svg").remove();
	var chart = d3.select("#chart-wrapper").append("svg")
		.attr("class", "chart")
		.attr("width", LEFTSPACE + (BWIDTH + BGAP) * scores.length + 10)
		.attr("height", CHEIGHT + 5); /* to accomodate bottom label */

	var xscale = d3.scale.linear()
		.domain([0, scores.length])
		.rangeRound([LEFTSPACE, (BWIDTH + BGAP) * scores.length + LEFTSPACE])

	var yscale = d3.scale.linear()
	//.domain([0, d3.max(scores, function(d) { return d.total })])
		.domain([0, 41])
		.rangeRound([CHEIGHT, 1]);

	var yaxis = d3.svg.axis()
		.scale(yscale)
		.orient("left")
		.ticks(10);

	var fscale = d3.scale.ordinal().range(toxicity.colors);

	chart.selectAll("line")
		.data(yscale.ticks(10))
		.enter().append("line")
		.attr("x1", function(td) { return xscale(0) })
		.attr("x2", function(td) { return xscale(scores.length) })
		.attr("y1", yscale)
		.attr("y2", yscale)
		.style("stroke", "#ccc");

  var groups = chart.selectAll("g.checks")
		.data(checks)
		.enter().append("g")
		.attr("class", "check")
		.style("fill", function(d, i) { return fscale(i); })
		.style("stroke", function(d, i) { return d3.rgb(fscale(i)).darker(); });

	groups.selectAll("rect")
		.data(Object)
		.enter().append("rect")
		.attr("x", function(d) { return xscale(d.x); })
		.attr("y", function(d) { return yscale(d.y + d.y0); })
		.attr("height", function(d) { return CHEIGHT - yscale(d.y); })
		.attr("width", function(d) { return BWIDTH; })
		.call(tooltip(function(d) { return d.score; }));

	chart.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + LEFTSPACE + ", 0)")
		.call(yaxis);
}


tooltip = function(a) {

	var accessor = arguments.length ? a : undefined;

	function tooltip(selection) {
		selection
			.on("mouseover", function(d) {
				if (accessor) {
					d = accessor(d);
				}
			 	var div = d3.select("#chart-wrapper").selectAll("div.tooltip");
				if (div.empty()) {
				 	div = d3.select("#chart-wrapper").append("div").attr("class", "tooltip").style("opacity", 0);
				}
			  div.html("");
				div.append("h2").text(d._name);
				div.append("p").attr("class", "filename").text(d._path.split("/").slice(0, -1).join("/"));
				$(toxicity.checknames.slice(0).reverse()).each(function(i, c) {
					if(d[c] > 0) {
						var color = toxicity.colors[toxicity.colors.length - i - 1];
						var p = div.append("p");
						p.append("span")
							.attr("class", "tooltip-swatch")
							.style("color", d3.rgb(color).darker())
							.style("background-color", color);
						p.append("span")
							.text(c + ": " + Math.round(d[c] * 10) / 10);
						}
				});
				var p = div.append("p");
					p.append("span")
						.attr("class", "tooltip-swatch");
					p.append("span")
						.attr("class", "total")
						.text("Total: " + Math.round(d.total * 10) / 10);
				var ttx = d3.event.pageX;
				var tty = d3.event.pageY - $("div.tooltip").height() - 15;
				var hclip = (ttx + $("div.tooltip").width() + 20) - ($(window).width() + $(window).scrollLeft())
				if (hclip > 0) {
					ttx -= hclip
				}
				div.style("left", Math.max(ttx + 4, $(window).scrollLeft() + 5) + "px")
					 .style("top", Math.max(tty, $(window).scrollTop() + 5) + "px");
				div.transition().duration(100).style("opacity", 0.95);
			})
			.on("mouseout", function(d) {
				div = d3.select("body").select("div.tooltip")
				div.transition().duration(250).style("opacity", 0);
			});
	}

	return tooltip;
};



