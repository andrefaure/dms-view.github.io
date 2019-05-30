// set up the margins in the plot
// at one point the `svg_dy` was too small and the curve was under the
// axis and the brush box was not showing up.
var margin = {
    top: 20,
    right: 20,
    bottom: 150,
    left: 40
  },
  margin2 = {
    top: 400,
    right: 20,
    bottom: 20,
    left: 40
  },
  svg_dx = 1050,
  svg_dy = 500,
  plot_dx = svg_dx - margin.right - margin.left,
  plot_dy = svg_dy - margin.top - margin.bottom,
  plot_dy2 = svg_dy - margin2.top - margin2.bottom;

var x = d3.scaleLinear().range([margin.left, plot_dx]),
  x2 = d3.scaleLinear().range([margin.left, plot_dx]),
  y = d3.scaleLinear().range([plot_dy, margin.top])
y2 = d3.scaleLinear().range([plot_dy2, margin.top]);

// actually create the chart
var svg = d3.select("#line_plot")
  .append("svg")
  .attr("width", svg_dx)
  .attr("height", svg_dy);

// define the axis. There are two xAxes for the two plots but the context plot
// does not have a y axis
var xAxis = d3.axisBottom(x),
  xAxis2 = d3.axisBottom(x2),
  yAxis = d3.axisLeft(y);

// This defines the brush. It should only be on the context plot
var brush = d3.brushX()
  .extent([
    [0, 0],
    [plot_dx, plot_dy2]
  ])
  .on("brush end", brushed);

// This defines the zoom. The zoom should on the min/max of the context plot?
var zoom = d3.zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([
    [0, 0],
    [plot_dx, plot_dy]
  ])
  .extent([
    [0, 0],
    [plot_dx, plot_dy2]
  ])
  .on("zoom", zoomed);

// define context which is the smaller plot underneath
var context = svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

// the context plot is an area plot right now
var area2 = d3.area()
  .curve(d3.curveMonotoneX)
  .x(function(d) {
    return x2(d.site);
  })
  .y0(plot_dy2)
  .y1(function(d) {
    return y2(d.abs_diffsel);
  });

// this defines the focus (large) portion of the graph
var focus = svg.append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// define the line
var valueline = d3.line()
  .x(function(d) {
    return x(d.site);
  })
  .y(function(d) {
    return y(d.abs_diffsel);
  });

// define tooltip not working currently
var tooltip = d3.select("#line_plot")
  .append("div")
  .style("font-family", "'Open Sans', sans-serif")
  .style("position", "relative")
  .style("font-size", "20px")
  .style("z-index", "10")
  .style("visibility", "hidden");


// Here is where we read in the data and create the plot
d3.csv("_data/line-data-PGT151.csv", d => {

  var n = d.length;

  // find the min and the max of x/y
  var d_extent_x = d3.extent(d, d => +d.site),
    d_extent_y = d3.extent(d, d => +d.abs_diffsel);

  // set the domains
  x.domain(d_extent_x);
  y.domain(d_extent_y);
  x2.domain(x.domain());
  y2.domain(y.domain());

  // make the context plot
  // Add the valueline path.
  focus.append("path")
    .data([d])
    .attr("class", "line")
    .attr("d", valueline);

var circlePoint = focus.append("g")
                 .selectAll("circle")
                 .data(d)
                 .enter()
                 .append("circle");

var circleAttributes = circlePoint
                 .attr("r", 5)
                 .attr("cx", (d) => x(+d.site))
                 .attr("cy", (d) => y(+d.abs_diffsel))
                 .attr("class", "non_brushed")
                 .on("mouseover", function(d){return tooltip.style("visibility", "visible").text(d.site + d.abs_diffsel);})
                 .on("mousemove", function(d){return tooltip.style("top", (event.pageY-250)+"px").style("left",(event.pageX-600)+"px").text("Immune selection of "+ d.site +": "+ d.abs_diffsel);})
                 .on("mouseout", function(d){return tooltip.style("visibility", "hidden");})
                 .on("click",function(d) {xx = d.site; console.log(xx);});

  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("id", "axis_x")
    .attr("transform", "translate(0," + plot_dy + ")")
    .call(xAxis);

  focus.append("g")
    .attr("class", "axis axis--y")
    .attr("id", "axis_y")
    .call(yAxis);

  d3.select("#axis_x")
    .append("text")
    .attr("transform", "translate(1000, 10)")
    .text("Site");

  d3.select("#axis_y")
    .append("text")
    .attr("transform", "rotate(-90) translate(-20, 15)")
    .text("abs_diffsel Value");



  // make the smaller plot (called context in the tutorial)
  context.append("path")
    .datum(d)
    .attr("class", "area")
    .attr("d", area2);

  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + plot_dy2 + ")")
    .call(xAxis2);

  // add in the brush
  context.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

  svg.append("rect")
    .attr("class", "zoom")
    .attr("width", plot_dx)
    .attr("height", plot_dy2)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);
});

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.select(".line").attr("d", valueline);
  focus.selectAll("circle")
                   .attr("cx", (d) => x(+d.site))
                   .attr("cy", (d) => y(+d.abs_diffsel))
  focus.select(".axis--x").call(xAxis);
  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
    .scale(plot_dx / (s[1] - s[0]))
    .translate(-s[0], 0));
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.select(".line").attr("d", valueline);
  focus.selectAll("circle")
                   .attr("cx", (d) => x(+d.site))
                   .attr("cy", (d) => y(+d.abs_diffsel))
                   .attr("class", "non_brushed")
                   .on("mouseover", function(d){return tooltip.style("visibility", "visible").text(d.site + d.abs_diffsel);})
                   .on("mousemove", function(d){return tooltip.style("top", (event.pageY-250)+"px").style("left",(event.pageX-600)+"px").text("Immune selection of "+ d.site +": "+ d.abs_diffsel);})
                   .on("mouseout", function(d){return tooltip.style("visibility", "hidden");})
                   .on("click",function(d) {xx = d.site; console.log(xx)});
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}
