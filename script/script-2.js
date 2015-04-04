//Set up Canvas
var margin = {t:100,r:50,b:200,l:50},
	width = $('.canvas').width() - margin.l - margin.r,
	height = $('.canvas').height() - margin.t - margin.b,
	radius = Math.min(width,height)/2,
	x = d3.scale.linear()
		.range([0,2*Math.PI]),
	y = d3.scale.sqrt()
		.range([0,radius]),
	duration = 1000,
	padding = 5;

var svg = d3.select('.canvas')
	.append('svg')
	.attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

var map = d3.map(),
	metaDataMap = d3.map();



var sunburst = d3.layout.partition()
        .children(function(d){
            return d.values;
        })
        .value(function(d){
            return d.goalsFor;
        })
        .size([width,height]);


//arc generator
var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, d.y ? y(d.y) : d.y); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });



queue()
    .defer(d3.csv, "DataSheets/Teams_Everything.csv",parse)
    .defer(d3.tsv, "DataSheets/Teams_Metadata.txt",parseMetaData)
    .await(dataLoaded);

function dataLoaded (err, data, metaData){

	var data = d3.nest()
        .key(function(d){
            return d.era;
        })
        .key(function(d){
            return d.year;
        })
        .key(function(d){
            return d.conference;
        })
        .key(function(d){
            return d.division;
        })
        .entries(data);

    var root = {
        key:"NHL",
        values: data
    };
    console.log(root);

    draw(root);
}

function draw (root){	

	console.log(root);


/*	var nodes = sunburst.nodes({children: root});
console.log(nodes);*/
	var slice = svg.selectAll('.slice')
		.data(sunburst.nodes(root))
		.enter()
		.append('path')
		.attr('class', 'slice')
		.attr ('transform','translate('+width/2+','+height/2+')')
		.attr('d',arc)
		.attr('fill-rule','evenodd')
        .style('fill',function(d){
            var team = (metaDataMap.get(d.team))

            if (!team) {return 'gray'}
            else {return ( 'rgb(' + (team.teamPrimaryColor) + ')')}
        })
        .style('stroke',function(d){
            var team = (metaDataMap.get(d.team))

            if (!team) {return 'green'}
            else {return ( 'rgb(' + (team.teamSecondaryColor) + ')')}
        })
		.on('click',click);

	var text = svg.selectAll("text")
		.data(sunburst.nodes(root))
    	.enter()
    	.append("text")
      	.style("fill-opacity", 1)
      	.style("fill", function(d) {
        return brightness(d3.rgb(color(d))) < 125 ? "#eee" : "#000";
      })
      .attr("text-anchor", function(d) {
        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
      })
      .attr("dy", ".2em")
      .attr("transform", function(d) {
      	//console.log(d.team);
        var multiline = (d.team || "").split(" ").length > 1,
            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
            rotate = angle + (multiline ? -0.5 : 0);
        return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
      })
      .on("click", click);
  text.append("tspan")
      .attr("x", 0)
      .text(function(d) { return d.depth ? d.team.split(" ")[0] : ""; });
  text.append("tspan")
      .attr("x", 0)
      .attr("dy", "1em")
      .text(function(d) { return d.depth ? d.team.split(" ")[1] || "" : ""; });

  function click(d) {
    slice.transition()
      .duration(duration)
      .attrTween("d", arcTween(d));

	text.style("visibility", function(e) {
          return isParentOf(d, e) ? null : d3.select(this).style("visibility");
        })
      .transition()
        .duration(duration)
        .attrTween("text-anchor", function(d) {
          return function() {
            return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
          };
        })
        .attrTween("transform", function(d) {
          var multiline = (d.name || "").split(" ").length > 1;
          return function() {
            var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                rotate = angle + (multiline ? -0.5 : 0);
            return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
          };
        })
        .style("fill-opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
        .each("end", function(e) {
          d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
        });
  }



}

function parse(d){
        return {
            era: d.Era,
            year: d.Year,
            team: d.TeamName,
            conference: d.Conference,
            division: d.Division,
            wins: +d.Wins,
            goalsFor: +d.GF,
            goalsAgainst: +d.GA,
            penaltyMinutes: +d.PIM,
            powerPlayPercent: d["PP%"],
            penaltyKillPercent: d["PK%"],
       };

}

function parseMetaData(d){
//     console.log(d.teamName,d.primaryColor);

    var team = d.teamName;
      
    var teamInfo ={

            teamAbrrv: d.teamAbbreviation,
            teamPrimaryColor: d.primaryColor,
            teamSecondaryColor: d.secondaryColor
    };
    
    metaDataMap.set(team, teamInfo);
}

function color(d){
  if (d.children) {
    // There is a maximum of two children!
    var colors = d.children.map(color),
        a = d3.hsl(colors[0]),
        b = d3.hsl(colors[1]);
    // L*a*b* might be better here...
    return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
  }
  return d.color || "#fff";
}



function isParentOf(p, c) {
  if (p === c) return true;
  if (p.children) {
    return p.children.some(function(d) {
      return isParentOf(d, c);
    });
  }
  return false;
}


// Interpolate the scales!
function arcTween(d) {
  var my = maxY(d),
      xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, my]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
  return function(d) {
    return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}

function maxY(d) {
  return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
}

function brightness(rgb) {
  return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
}



