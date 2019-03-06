
var years = []
for (var i = 2018; i >= 1991; i--)
{
  years.push(i)
}

// To be replaced with a query that finds all unique company names
var allCompanies = [
  "Getinge AB",
  "BIOARCTIC AB",
  "SAAB AKTIEBOLAG",
  "GSA CAPITAL PARTNERS LLP",
  "MARSHALL WACE LLP"
];

autocomplete(document.getElementById("companySearch"), allCompanies);

d3.select("#companySubmit")
  .on("click", function () {
    updateCompany();
  })
d3.select("#companySearch")
  .on("keydown", function() {
    if(d3.event.keyCode === 13){
      updateCompany();
  }
})

function updateCompany() {
  var inputName = document.getElementById('companySearch').value
  if (allCompanies.includes(inputName)) {
    console.log("Search for: " + inputName)
    fullUpdate(companyName);
  }
}

var companyName = getQueryVariable("company");
// For development, just use an arbitrary isin if none has been specified
if (companyName == false) {
  companyName = "GETINGE AB";
}
var year = parseInt(getQueryVariable("year"));

var transitionTime = 300;

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function convertInsightDate(insightDate) {
  var splot = insightDate.split(" ")[0].split("/");  // mm-dd-yyyy
  return new Date(parseInt(splot[2]), parseInt(splot[0])-1, parseInt(splot[1]));
}

// Year is currently a bit unecessary since we only seem to have 2018 insync data
var options = d3.select("#year").selectAll("option")
  .data(years)
	.enter().append("option")
  .text(d => d)
  .property("selected", function(d){ return d === year; }) // Select 2018 by default (useful for dev since we only have 2018 insync)

var width = 800,
    height = 300;
var subfield = height / 8;

var margin = {top: 20, right: 20, bottom: 60, left: 50},
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

var tradesNeg = d3.select("#graph")
  .append("g")
  .attr("id", "tradesNeg")

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
.attr("id", "y-axis-title")
.attr("class", "axis-title")
.attr("text-anchor", "middle")
.attr("transform", "translate(" + (margin.left / 2) + "," + (graphHeight/2 + margin.top) +"), rotate(-90)")
.text("Total volume")
d3.select("#canvas2").append("text")
.attr("id", "short-axis-title")
.attr("class", "axis-title")
.attr("text-anchor", "middle")
.attr("transform", "translate(" + margin.left + "," + subfield/2 +")")
.text("Shorts")

// This is probably not a very d3 way to do things, but it seems to work well enough
var trades = []
var curpos = []

fullUpdate(companyName)

function fullUpdate(newCompanyName) {
  companyName = newCompanyName;
  var insightLocal = "insight.json"
  var insightLocal2018 = "insight2018.json"
  var shortposLocal = "curpos.json"
  var insightURL = "http://ivis.southeastasia.cloudapp.azure.com:5000/insync1991/"
  var insightURL2018 = "http://ivis.southeastasia.cloudapp.azure.com:5000/insync2018/"
  var shortposURL = "http://ivis.southeastasia.cloudapp.azure.com:5000/histPosition/"

  limit = 10000
  insightURL += ("?limit=" + limit) + ("&filter={\"Issuer\":\"" + encodeURIComponent(companyName) + "\"}")
  insightURL2018 += ("?limit=" + limit) + ("&filter={\"Issuer\":\"" + encodeURIComponent(companyName) + "\"}")
  shortposURL += ("?limit=" + limit) + ("&filter={\"position_holder\":\"" + encodeURIComponent(companyName) + "\"}")

  var useLocalData = false
  var insightSource = insightURL
  var insightSource2018 = insightURL2018
  var shortposSource = shortposURL
  if (useLocalData) {
    insightSource = insightLocal
    insightSource2018 = insightLocal2018
    shortposSource = shortposLocal
  }

  Promise.all([
    d3.json(insightSource),
    d3.json(shortposSource),
    d3.json(insightSource2018)
  ]).then(function(data)
  {
    trades = data[0]
    curpos = data[1]
    trades = trades.concat(data[2]);
    update(trades, curpos)
  });

}

function update(trades, curpos) {
    // Create a new array with the accumulated data
    var accumulatedTrades = [];
    var accumulatedTradesNeg = [];
    for (var i = 0; i < 12; i++){
      accumulatedTrades.push({"month":months[i], "value":0});
      accumulatedTradesNeg.push({"month":months[i], "value":0});
    }

    trades.forEach(e => {
      if (e.isin == companyName) {
        var companyName = "";
        if (e.issuer) {
          companyName = e.issuer.split("\(")[0];
        }
        if (e.Issuer)
        {
          companyName = e.Issuer.split("\(")[0]
        }
        d3.select("#heading")
          .text("Insight: " + companyName + " (" + companyName + ")")
        d3.select("#title")
        .text("Insight: " + companyName + " (" + companyName + ")")
        return;
      }
    });

    trades.forEach(function(d) {
      var date = convertInsightDate(d.transaction_date);
      d.month = date.getMonth();
      d.year = date.getFullYear();
    });

    var year = d3.select("#year").property("value")
    trades = trades.filter(function(d){return d.Issuer == companyName && d.year == year})
    curpos = curpos.filter(function(d){return d.position_holder == companyName && d.position_date.split("-")[0] == year})



    trades.forEach(function(d) {
      var value = d.volume;
      if (d.trade == "Avyttring") {
        value = -value;
      }
      if (value >= 0) {
        accumulatedTrades[d.month].value += value;
      }
      else
      {
        accumulatedTradesNeg[d.month].value += value; // TODO change
      }
    })

    var accumulatedCurpos = [];
    for (var i = 0; i < 12; i++){
      accumulatedCurpos.push({"month":i, "positions":[]});
    }

    curpos.forEach(function (d) {
      var month = parseInt(d.position_date.split("-")[1]);
      accumulatedCurpos[month-1].positions.push(d);
    })

    //set scaling domains
    xScale.domain(accumulatedTrades.map(function (d, i) {
      return i;
    }));
    yScale.domain(d3.extent(accumulatedTrades.concat(accumulatedTradesNeg), function(d) {
      return d.value
    })).nice();

    //perform joins
    var bars = d3.select("#trades")
      .selectAll("rect")
      .data(accumulatedTrades)
    var barsNeg = d3.select("#tradesNeg")
      .selectAll("rect")
      .data(accumulatedTradesNeg)

    var circles = d3.select("#shorts")
      .selectAll("circle")
      .data(accumulatedCurpos)

    bars.exit().remove()
    barsNeg.exit().remove()
    circles.exit().remove()

    bars.enter().append("rect")
      .attr("x", function(d, i) {
        return xScale(i);
      })
      .attr("width", xScale.bandwidth())
      .merge(bars)
      .transition().duration(transitionTime)
      .attr("class", "bar bar-positive")
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

    barsNeg.enter().append("rect")
      .attr("x", function(d, i) {
        return xScale(i);
      })
      .attr("width", xScale.bandwidth())
      .merge(barsNeg)
      .transition().duration(transitionTime)
      .attr("class", "bar bar-negative")
      .attr("y", yScale(0))
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
        if (d.positions.length == 0) {
          return;
        }
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
      .duration(transitionTime)
      .attr("r", function(d){
        return xScale.bandwidth() / 3 * (d.positions.length == 0? 0.1 : 1)
      })
      .attr("fill", function (d) {
        return d.positions.length == 0? "#555555" : "#ff7000"
      })

      d3.select(".y-axis")
        .transition()
        .duration(transitionTime)
        .attr("transform", "translate(" + xScale(0)*0.8 + "," + 0 + ")")
        .call(yAxisCall)

      d3.select(".x-axis")
        .transition()
        .duration(transitionTime)
        .attr("transform", "translate(" + 0 + "," + yScale(0) + ")")
}

d3.select("#logscale").on("click", function() {
  update(trades, curpos);
});
var select = d3.select("#year")
    .style("border-radius", "5px")
    .on("change", function() {
      update(trades, curpos);
  });
