// var isin = "SE0000202624";
var isin = getQueryVariable("isin");
// For development, just use an arbitrary isin if none has been specified
if (isin == false) {
  isin = "SE0000202624";
}

d3.select("#heading")
  .text("Insight: " + isin)

var months = ["January", "February", "Mars", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function convertInsightDate(insightDate) {
  var splot = insightDate.split(" ")[0].split("/");  // mm-dd-yyyy
  return new Date(parseInt(splot[2]), parseInt(splot[0])-1, parseInt(splot[1]));
}

// Year is currently a bit unecessary since we only seem to have 2018 insync data
var options = d3.select("#year").selectAll("option")
  .data([2019, 2018, 2017, 2016])
	.enter().append("option")
  .text(d => d)
  .property("selected", function(d){ return d === 2018; }) // Select 2018 by default (useful for dev since we only have 2018 insync)

var width = 800,
    height = 300;
var subfield = height / 8;

var margin = {top: 20, right: 20, bottom: 100, left: 30},
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

var trades = d3.select("#graph")
  .append("g")
  .attr("id", "trades")

var shorts = d3.select("#shortGraph")
  .append("g")
  .attr("id", "shorts")

//define X axis scale
var xScale = d3.scaleBand()
  .range([margin.left, graphWidth])
  .round([0.05])
  .padding(0.3)
  .domain(months)

//define Y axis scale
var useLogScale = false;

var yLinearScale = d3.scaleLinear()
  .range([graphHeight, 0])
var yScale = yLinearScale;

var yAxisCall = d3.axisLeft(yScale)
  .tickSize(3)
  .tickPadding(10)  //offset away from axis

var xAxisCall = d3.axisBottom(xScale)
  .tickSize(3)
  .tickPadding(3)

var xAxis = d3.select("#graph").append("g")
  .attr("class", "x-axis")
  .call(xAxisCall)
  .selectAll("text")
  .style("text-anchor", "start")
  .attr("transform", "rotate(65), translate(10, -10)")

var yAxis = d3.select("#graph").append("g")
  .attr("class", "y-axis")

//axis labels
d3.select("#canvas1").append("text")
.attr("id", "x-axis-title")
.attr("class", "axis-title")
.attr("text-anchor", "middle")
.attr("transform", "translate(" + (width * (7/8)) + "," + (height - 10) +")")
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

var insightLocal = "insightGetinge.json"
var shortposLocal = "curposGetinge.json"
var insightURL = "http://ivis.southeastasia.cloudapp.azure.com:5000/insync2018/"
var shortposURL = "http://ivis.southeastasia.cloudapp.azure.com:5000/currentPosition/"

limit = 500
insightURL += ("?limit=" + limit) + ("&filter={\"isin\":\"" + isin + "\"}")
shortposURL += ("?limit=" + limit) + ("&filter={\"isin\":\"" + isin + "\"}")

var useLocalData = false
var insightSource = insightURL
var shortposSource = shortposURL
if (useLocalData) {
  insightSource = insightLocal
  shortposSource = shortposLocal
}

//draw initial/default graph
update(insightSource, shortposSource)

function chart(data) {
    var trades = data[0]
    var curpos = data[1]

    // Create a new array with the accumulated data
    var accumulatedTrades = [];
    for (var i = 0; i < 12; i++){
      accumulatedTrades.push({"month":months[i], "value":0});
    }

    trades.forEach(function(d) {
      var date = convertInsightDate(d.transaction_date);
      d.month = date.getMonth();
      d.year = date.getFullYear();
    });

    var year = d3.select("#year").property("value")
    trades = trades.filter(function(d){return d.year == year})
    curpos = curpos.filter(function(d){return d.position_date.split("-")[0] == year})

    trades.forEach(function(d) {
      accumulatedTrades[d.month].value += d.trade == "Avyttring"? -d.volume : d.volume;
    })

    var accumulatedCurpos = [];
    for (var i = 0; i < 12; i++){
      accumulatedCurpos.push({"month":i, "positions":[]});
    }

    curpos.forEach(function (d) {
      var month = parseInt(d.position_date.split("-")[1]);
      accumulatedCurpos[month-1].positions.push(d);
    })

    // accumulatedCurpos = accumulatedCurpos.filter(function (d) { return d.positions.length != 0})

    //set scaling domains
    xScale.domain(accumulatedTrades.map(function (d, i) {
      return i;
    }));
    yScale.domain(d3.extent(accumulatedTrades, function(d) {
      return d.value
    })).nice();

    //perform joins
    var bars = d3.select("#trades")
      .selectAll("rect")
      .data(accumulatedTrades)

    var circles = d3.select("#shorts")
      .selectAll("circle")
      .data(accumulatedCurpos)

    bars.exit().remove()
    circles.exit().remove()

    bars.enter().append("rect")
      .attr("class", function(d) {
        var type;
        type = d.value < 0? "negative" : "positive";
        return "bar bar-" + type;
      })
      .attr("x", function(d, i) {
        return xScale(i);
      })
      .attr("width", xScale.bandwidth())
      .merge(bars)
      .transition().duration(750)
      .attr("y", function(d){
        if (d.value < 0) {
          return yScale(0)
        } else {
          return (yScale(+d.value))
        }
      })
      .attr("height", function(d) {
        return (yScale(0) - yScale(+ Math.abs(d.value)))
      })

    circles.enter().append("circle")
      .attr("class", "short")
      .attr("cx", function(d, i){
        return (xScale(d.month) + (xScale.bandwidth() / 2))
      })
      .attr("cy", function() {
        return 0
      })
      .attr("opacity", 1)
      .on("mouseover", function(d) {
        var tip = ""
        d.positions.forEach(e => {
          tip += e.position_holder + ": " + e.position_in_percent + "% <br>"
          tip += "Aquired: " + e.position_date + "<br><br>"
        });

        tooltip.html(tip)
          .style("width", "auto")
          .style("height", "auto")
          .style("padding", "10px")
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
      })
      .merge(circles)
      .transition()
      .duration(750)
      .attr("r", function(d){
        return xScale.bandwidth() / 3 * (d.positions.length == 0? 0 : 1)
      });

      d3.select(".y-axis")
        .transition()
        .duration(750)
        .attr("transform", "translate(" + xScale(0) + "," + 0 + ")")
        .call(yAxisCall)

      xScale.domain(months);

      d3.select(".x-axis")
        .transition()
        .duration(750)
        .attr("transform", "translate(" + 0 + "," + yScale(0) + ")")

}

//load data and draw a graph
function update(i, s){
  // ugly and slow clear variant, should preferrably be reworked to use merging with pretty animations
  // d3.selectAll(".short").remove()

  Promise.all([
    d3.json(i),
    d3.json(s)
  ]).then(d=>chart(d));
}

d3.select("#logscale").on("click", function() {
  update(insightSource, shortposSource);
});
var select = d3.select("#year")
    .style("border-radius", "5px")
    .on("change", function() {
      update(insightSource, shortposSource);
  });
