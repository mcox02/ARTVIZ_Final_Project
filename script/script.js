/*Start by setting up the canvas */
var margin = {t:100,r:50,b:200,l:50},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');


//Global Variables
var yVariable = "GF",
        y0 = 1964,
        y1 = 2004;

var radius = Math.min(25, 300);


//Scales
var scaleX = d3.scale.linear()
    .range([0, 2* Math.PI]);

var scaleY = d3.scale.sqrt()
    .range([0,radius]);

//d3 map
 var map = d3.map();

//arc generator
    var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, scaleX(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, scaleX(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, scaleY(d.y)); })
    .outerRadius(function(d) { return Math.max(0, scaleY(d.y + d.dy)); });

//layout Functions
    var sunburst = d3.layout.partition()
        .children(function(d){
            return d.values;
        })
        .value(function(d){
            return d.goalsFor;
        })
        .size([width,height]);





//START!
queue()
    .defer(d3.csv, "DataSheets/IndividualYears/leagues_NHL_2004_teams.csv",parse)
    .defer(d3.csv, "DataSheets/IndividualYears/leagues_NHL_1964_teams.csv",parse)
    .await(dataLoaded);


function dataLoaded(err, rows0){

 scaleX.domain( d3.extent(rows0,function(d){ return d.goalsFor; }));
 scaleY.domain( d3.extent(rows0, function(d){ return d.wins; }));

    var rows0 = d3.nest()
        .key(function(d){
            return d.conference;
        })
        .entries(rows0);

    var root = {
        key:"conference",
        values: rows0
    };
console.log(rows0);
console.log(root);

    draw(root);

}

function draw(root){
    svg.append('g')
        .attr ('transform','translate('+width/2+','+height/2+')')
        .selectAll('.slice')
        .data(sunburst(root))
        .enter()
        .append('path')
        .attr('class','slice')
        .attr('d', function(d){
            return arc(d);
        })
        .style('fill', 'gray')
        .style('stroke','green')
        .style('stroke-width','2px')
        .style('fill-opacity','.25');
}

function parse(d){
    if(d.Team && d.GF){
        return {
            team: d.Team,
            goalsFor: +d.GF,
            wins: +d.W,
            goalsAgainst: +d.GA,
            conference: d.Conference,

            }
    }else{
        return;
    }

}



