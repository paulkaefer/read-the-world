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
              var tooltip_message = "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Book(s): </strong><span class='details'>" + d.book +"</span>";
              //console.log(tooltip_message);
              return tooltip_message;
            });

// for honorable mentions:
var box_tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              console.log(d);
              return "<div style='color:white'>" + d + "</div>";
            });

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
svg.call(box_tip);

queue()
    .defer(d3.json, "data/world_countries.json")
    .defer(d3.csv, "data/read_the_world.csv")
    .await(ready);

/* makes it easier to save a variable for viewing in the console.
   See below for assignment example(s). */
debug = {};

function ready(error, data, book_list) {
  //console.log(book_list);
  var bookList = {};
  var honorable_mentions = "";
  var colors = {};
  var countries_and_codes = {};

  var completed_table = d3.select("#completed-table-body");
  var honorable_mentions_table = d3.select("#honorable-mentions-table-body");
  var recommendations_table = d3.select("#recommendations-table-body");
    
  var completed_count = 0;
  var queue_count = 0;

  /* need to ensure countries not double-counted */
  /* a dictionary could also be useful for other purposes */
  var countries_read = {};
  var countries_visited = {};
  var read_and_visited = {};

  book_list.forEach(function(d) {
    /* hacky, but ensure colors are initialized by country;
       in the case of having read multiple books, I want the "max" color to persist */
    if ( (colors[d.id] == null) || (colors[d.id] == NaN) ) {
        colors[d.id] = 0;
    }
    if (bookList[d.id] == null) {
        bookList[d.id] = "";
    }

    if (d.id == "ZZZ") {
        honorable_mentions += "&bull; <em>" + d.Book + "</em>, " + d.Author + " (" + d.Notes + ")<br>";
        //console.log(honorable_mentions);
        
        var row = honorable_mentions_table.append("tr");

        var cell = row.append("td");
        var book = cell.append("em");
        book.text(d.Book);

        var cell = row.append("td");
        cell.text(d.Author);

        var cell = row.append("td");
        cell.text(d.Notes);
    } else if (d.Read == 1) {
        bookList[d.id] += "&bull; <em>" + d.Book + "</em>, by " + d.Author + "<br>";
        completed_count++;

        if (d.visited_country == 1) {
            /* purple: red + blue */
            colors[d.id] = Math.max(3, colors[d.id]);
            
            /* add dictionary entry for countries both visited & read */
            if (read_and_visited[d.Country] == null) {
                read_and_visited[d.Country] = 1;
            }
        } else {
            /* red since I "read" the book */
            colors[d.id] = Math.max(1, colors[d.id]);
        }
        /* debugging: */
        //console.log("I've read " + bookList[d.id] + " from " + d.Country);
        
        /* add dictionary entry for each unique country read */
        if (countries_read[d.Country] == null) {
            countries_read[d.Country] = 1;
        }

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
        /* only append a row to the reading queue if a book is found: */
        if (d.Book) {
            queue_count++;
            
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

    /* if I've visited the country at all, add to the dictionary */
    if (d.visited_country == 1) {
        if (countries_visited[d.Country] == null) {
            countries_visited[d.Country] = 1;
        }
    }
      
    //debug = book_list;
  });
  /* this also works: */
  /*console.log(bookList);*/
  /*console.log(honorable_mentions);*/

  data.features.forEach(function(d) { d.book = bookList[d.id] });

  //debug = data;
  /*console.log(data);*/

  // for adding three-digit codes to csv:
  /*data.features.forEach(d => console.log(d.id + " "  + d.properties.name)); console.log(countries_and_codes);*/

  /*svg.append("text").attr("x", 250).attr("y", 25).text("Hover for country names and books!").style("font-size", "20px").style("font-family", "Helvetica").style("opacity", "0.5").attr("alignment-baseline","middle")*/

  total_countries_read = Object.keys(countries_read).length;
  total_countries_visited = Object.keys(countries_visited).length;
  total_with_both = Object.keys(read_and_visited).length;
    
  // update the counts in the table headers:
  d3.select("#completed-count").text(`Books I've completed reading (${completed_count} total books):`);
  d3.select("#queue-count").text(`In my reading queue (${queue_count} total books):`);

  // read; visited; both
  svg.append("circle").attr("cx", 20).attr("cy", 30).attr("r", 6).style("fill", "#FF0000")
  svg.append("circle").attr("cx", 20).attr("cy", 60).attr("r", 6).style("fill", "#0000FF")
  svg.append("circle").attr("cx", 20).attr("cy", 90).attr("r", 6).style("fill", "#800080")
  svg.append("text").attr("x", 40).attr("y", 30)
     .text(`Read a book (${total_countries_read} countries/territories)`).style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline", "middle")
  svg.append("text").attr("x", 40).attr("y", 60)
     .text(`Visited the country/territory (${total_countries_visited})`).style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline", "middle")
  svg.append("text").attr("x", 40).attr("y", 90)
     .text(`Both (${total_with_both})`).style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline", "middle")
    
  // note duplication of mouseover for hover:
  // rectangle and two text elements
  svg.append("rect").attr("class", "honorable-mentions-box")
     .attr("x", 650).attr("y", 30).attr("width", 150).attr("height", 65)
     // forest green:
     .style("fill", "#228B22")
     .on('mouseover', function(d) {
        box_tip.show(honorable_mentions);
      }).on('mouseout', function(d) {
        box_tip.hide(honorable_mentions);
      });
  svg.append("text").attr("x", 660).attr("y", 50)
     .text("Honorable mentions").style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline", "middle").style("fill", "white").on('mouseover', function(d) {
        box_tip.show(honorable_mentions);
      }).on('mouseout', function(d) {
        box_tip.hide(honorable_mentions);
      });
  svg.append("text").attr("x", 700).attr("y", 75)
     .text("(hover)").style("font-size", "15px").style("font-family", "Helvetica").attr("alignment-baseline", "middle").style("fill", "white").on('mouseover', function(d) {
        box_tip.show(honorable_mentions);
      }).on('mouseout', function(d) {
        box_tip.hide(honorable_mentions);
      });

  /* draw countries */
  svg.append("g")
      .attr("class", "countries")
    .selectAll("path")
      .data(data.features)

    .enter().append("path")
      .attr("d", path)
      .style("fill", function(d) { return color[colors[d.id]]; })
      .style("stroke", "white")
      .style("stroke-width", 1.5)
      .style("opacity", 0.8)

      // tooltips
      .style("stroke", "white")
      .style("stroke-width", 0.3)
      .on("mouseover", function(d){
        tip.show(d);

        d3.select(this)
          .style("opacity", 1)
          .style("stroke", "white")
          .style("stroke-width", 3);
      })
      .on('mouseout', function(d) {
        tip.hide(d);

        d3.select(this)
          .style("opacity", 0.8)
          .style("stroke", "white")
          .style("stroke-width", 0.3);
      });

  svg.append("path")
     .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
     .attr("class", "names")
     .attr("d", path);
}

function expand_completed_table() {
    d3.select("#collapse_completed_table").style("display", "");
    d3.select("#expand_completed_table").style("display", "none");
    d3.select("#completed-table").style("display", "");
    
    d3.select("#honorable-mentions-div").style("display", "");
}

function expand_reading_queue() {
    d3.select("#collapse_reading_queue").style("display", "");
    d3.select("#expand_reading_queue").style("display", "none");
    d3.select("#recommendations-table").style("display", "");
}

function collapse_completed_table() {
    d3.select("#collapse_completed_table").style("display", "none");
    d3.select("#expand_completed_table").style("display", "");
    d3.select("#completed-table").style("display", "none");
    
    d3.select("#honorable-mentions-div").style("display", "none");
}

function collapse_reading_queue() {
    d3.select("#collapse_reading_queue").style("display", "none");
    d3.select("#expand_reading_queue").style("display", "");
    d3.select("#recommendations-table").style("display", "none");
}

