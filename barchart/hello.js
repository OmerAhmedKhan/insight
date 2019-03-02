var width = 800,
    height = 300;
var subfield = height / 8;

var margin = {top: 20, right: 20, bottom: 25, left: 30},
    graphWidth = width - margin.left - margin.right,
    graphHeight = height - margin.top - margin.bottom;

//create svg canvases
var svg = d3.select("#tradeDiv").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "canvas")
  .attr("id", "canvas1");
var svg2 = d3.select("#shortDiv").append("svg")
  .attr("width", width)
  .attr("height", subfield)
  .attr("class", "canvas")
  .attr("id", "canvas2");

//create actual graph surfaces
var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "graph");
var g2 = svg2.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "shortGraph");

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

//define X axis scale
var xScale = d3.scaleBand()
  .range([margin.left, graphWidth])
  .round([0.05])
  .padding(0.3)

//define Y axis scale
var useLogScale = false;
var yLogScale = d3.scaleLog()
  .range([graphHeight, 0])
var yLinearScale = d3.scaleLinear()
  .range([graphHeight, 0])
var yScale = yLinearScale;

var insightLocal = "insight.json"
var shortposLocal = "curpos.json"
var insightURL = "http://ivis.southeastasia.cloudapp.azure.com:5000/insync2018/"
var shortposURL = "http://ivis.southeastasia.cloudapp.azure.com:5000/currentPosition/"

limit = 10
insightURL += ("?limit=" + limit)
shortposURL += ("?limit=" + limit)

var useLocalData = true
var insightSource = insightURL
var shortposSource = shortposURL
if (useLocalData) {
  insightSource = insightLocal
  shortposSource = shortposLocal
}

//draw initial/default graph
update(insightSource, shortposSource)

//load data and draw a graph
function update(i, s){
  Promise.all([
    d3.json(i),
    d3.json(s)
  ]).then(function(data){
    var trades = data[0]
    var curpos = data[1]

    //set scaling domains
    xScale.domain(trades.map(function (d, i) { return i }));
    yScale.domain(d3.extent(trades, function(d) {
      var val = +d.volume
      if (d.trade == "Avyttring") {
        return -val
      } else {
        return val
      }
    })).nice();

    //perform joins
    var bars = d3.select("#graph")
      .append("g")
        .attr("id", "trades")
        .selectAll("rect")
        .data(trades)
    var shorts = d3.select("#shortGraph")
      .append("g")
        .attr("id", "shorts")
        .selectAll("circle")
          .data(curpos);

    bars.enter().append("rect")
      .attr("class", function(d) {
        var type;
        if (d.trade == "Avyttring") {
          type = "negative"
        } else {
          type = "positive"
        }
        return "bar bar-" + type;
      })
      .attr("x", function(d, i) {
        return xScale(i);
      })
      .attr("y", function(d){
        if (d.trade == "Avyttring") {
          return yScale(0)
        } else {
          return (yScale(+d.volume))
        }
      })
      .attr("width", xScale.bandwidth())
      .attr("height", function(d) {
        return (yScale(0) - yScale(+d.volume))
      })

    shorts.enter().append("circle")
      .attr("class", "short")
      .attr("cx", function(d, i){
        return (xScale(i) + (xScale.bandwidth() / 2))
      })
      .attr("cy", function() {
        return 0
      })
      .attr("r", xScale.bandwidth() / 3)
      .attr("opacity", 1)
      .on("mouseover", function(d) {
        var value = d.position_holder + ": " + d.position_in_percent + "%"
        var date = "Aquired: " + d.position_date
        var numLines = 2
        tooltip.html(value + "<br/>" + date)
          .style("width", (value.length * 8) + "px")
          .style("height", (numLines * 14) + "px")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        })
    .on("mouseout", function(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
});

      bars.exit().remove()
      shorts.exit().remove()

      var yAxisCall = d3.axisLeft(yScale)
        .tickSize(3)
        .tickPadding(10)  //offset away from axis
      var yAxis = d3.select("#graph").append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(" + xScale(0) + "," + 0 + ")")
        .call(yAxisCall)

      var xAxisCall = d3.axisBottom(xScale)
        .tickSize(3)
        .tickPadding(3)
      var xAxis = d3.select("#graph").append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(" + 0 + "," + yScale(0) + ")")
        .call(xAxisCall)

      //axis labels
      d3.select("#canvas1").append("text")
        .attr("id", "x-axis-title")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (width * (7/8)) + "," + (height-(margin.bottom/2)) +")")
        .text("X AXIS LABEL")
      d3.select("#canvas1").append("text")
        .attr("id", "y-axis-title")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (margin.left / 2) + "," + (graphHeight/2 + margin.top) +"), rotate(-90)")
      .text("Y AXIS LABEL")
      d3.select("#canvas2").append("text")
        .attr("id", "short-axis-title")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + margin.left + "," + subfield/2 +")")
      .text("Shorts")
  });
}
