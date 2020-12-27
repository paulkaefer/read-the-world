/* change page theme based on scaled day of year: */
function set_theme_color() {
    var meta_element = document.getElementsByClassName("mobile_tab_color");

    var d = new Date();
    var red = Math.floor(d.getMonth() * 256 / 12);
    var green = Math.floor(d.getDate() * 256 / 31);
    var blue = Math.floor((d.getYear() - 100) * 256 / 100);

    meta_element[0].content = "#" + red.toString(16) + green.toString(16) + blue.toString(16);
}

set_theme_color();

var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Book(s): </strong><span class='details'>" + d.book +"</span>";
            })

var margin = {top: -250, right: 0, bottom: 0, left: 100},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

/*var color = d3.scaleThreshold()
    .domain([10000,100000,500000,1000000,5000000,10000000,50000000,100000000,500000000,1500000000])
    .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(3,19,43)"]);*/
var color = ["rgb(0, 0, 0)", "rgb(255, 0, 0)", "rgb(0, 0, 255)", "rgb(128, 0, 128)"]

var path = d3.geoPath();

var svg = d3.select("map")
            .append("svg")
            .attr("style", "border: 5px solid gold;")
            .attr("width", width)
            .attr("height", height)
            .append('g')
            .attr('class', 'map');

var projection = d3.geoMercator()
                   .scale(130)
                  .translate( [width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
    .defer(d3.json, "data/world_countries.json")
    .defer(d3.csv, "data/read_the_world.csv")
    .await(ready);

function ready(error, data, book_list) {
  //console.log(book_list);
  var bookList = {};
  var colors = {};
  var countries_and_codes = {};

  var completed_table = d3.select("#completed-table");
  var recommendations_table = d3.select("#recommendations-table");

  /* TODO: need to ensure countries not double-counted... */
  var countries_read = 0;
  var countries_visited = 0;

  book_list.forEach(function(d) {
    /* hacky, but ensure colors are initialized by country;
       in the case of having read multiple books, I want the "max" color to persist */
    if ( (colors[d.id] == null) || (colors[d.id] == NaN) ) {
        colors[d.id] = 0;
    }
    if (bookList[d.id] == null) {
        bookList[d.id] = "";
    }

    if (d.Read == 1) {
        bookList[d.id] += "&bull; <em>" + d.Book + "</em>, by " + d.Author + "<br>";

        if (d.visited_country == 1) {
            /* purple: red + blue */
            colors[d.id] = Math.max(3, colors[d.id]);
        } else {
            /* red since I "read" the book */
            colors[d.id] = Math.max(1, colors[d.id]);
        }
        /* this works: */
        //console.log("I've read " + bookList[d.id] + " from " + d.Country);

        var row = completed_table.append("tr");

        var cell = row.append("td");
        cell.text(d.Country);

        var cell = row.append("td");
        var book = cell.append("em");
        book.text(d.Book);

        var cell = row.append("td");
        cell.text(d.Author);

        var cell = row.append("td");
        cell.text(d.Notes);
    } else {
        /* only append a row if a book is found: */
        if (d.Book) {
            var row = recommendations_table.append("tr");

            var cell = row.append("td");
            cell.text(d.Country);

            var cell = row.append("td");
            var book = cell.append("em");
            book.text(d.Book);

            var cell = row.append("td");
            cell.text(d.Author);

            var cell = row.append("td");
            cell.text(d.Notes);
        }
    }


    if ((d.Read == 0) && (d.visited_country == 1)) {
        /* blue */
        colors[d.id] = Math.max(2, colors[d.id]);
    }
  });
  /* this also works: */
  /*console.log(bookList);*/

  data.features.forEach(function(d) { d.book = bookList[d.id] });

 /*console.log(data);*/

    // for adding three-digit codes to csv:
 /*data.features.forEach(d => console.log(d.id + " "  + d.properties.name));
 console.log(countries_and_codes);*/

    /*svg.append("text").attr("x", 250).attr("y", 25).text("Hover for country names and books!").style("font-size", "20px").style("font-family", "Helvetica").style("opacity", "0.5").attr("alignment-baseline","middle")*/

    svg.append("circle").attr("cx",20).attr("cy",30).attr("r", 6).style("fill", "#FF0000")
    svg.append("circle").attr("cx",20).attr("cy",60).attr("r", 6).style("fill", "#0000FF")
    svg.append("circle").attr("cx",20).attr("cy",90).attr("r", 6).style("fill", "#800080")
    svg.append("text").attr("x", 40).attr("y", 30).text("Read a book").style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 40).attr("y", 60).text("Visited the country").style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 40).attr("y", 90).text("Both").style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline","middle")

  /* draw countries */
  svg.append("g")
      .attr("class", "countries")
    .selectAll("path")
      .data(data.features)

    .enter().append("path")
      .attr("d", path)
      .style("fill", function(d) { return color[colors[d.id]]; })
      .style('stroke', 'white')
      .style('stroke-width', 1.5)
      .style("opacity",0.8)

      // tooltips
      .style("stroke","white")
      .style('stroke-width', 0.3)
      .on('mouseover',function(d){
        tip.show(d);

        d3.select(this)
          .style("opacity", 1)
          .style("stroke","white")
          .style("stroke-width",3);
      })
      .on('mouseout', function(d){
        tip.hide(d);

        d3.select(this)
          .style("opacity", 0.8)
          .style("stroke","white")
          .style("stroke-width",0.3);
      });

  svg.append("path")
     .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
     .attr("class", "names")
     .attr("d", path);
}

function expand_table0() {
    /*d3.select("#expand0").remove();*/

    d3.select("#header0").style("display", "");
    d3.select("#expand0").style("display", "none");
    d3.select("#table0").style("display", "");
}

function expand_table1() {
    d3.select("#header1").style("display", "");
    d3.select("#expand1").style("display", "none");
    d3.select("#table1").style("display", "");
}

function collapse_table0() {
    d3.select("#header0").style("display", "none");
    d3.select("#expand0").style("display", "");
    d3.select("#table0").style("display", "none");
}

function collapse_table1() {
    d3.select("#header1").style("display", "none");
    d3.select("#expand1").style("display", "");
    d3.select("#table1").style("display", "none");
}

