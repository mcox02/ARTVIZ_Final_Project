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

var radius = Math.min(width, height) / 2;


//Scales
var scaleX = d3.scale.linear()
    .range([0, 2* Math.PI]);

var scaleY = d3.scale.sqrt()
    .range([0,radius]);

//d3 map
 var map = d3.map(),
     metaDataMap = d3.map();

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
    .defer(d3.csv, "DataSheets/Teams_Everything.csv",parse)
    .defer(d3.tsv, "DataSheets/Teams_Metadata.txt",parseMetaData)
    .await(dataLoaded);

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

};

function parseMetaData(d){
//     console.log(d.teamName,d.primaryColor);

    var team = d.teamName;
      
    var teamInfo ={

            teamAbrrv: d.teamAbbreviation,
            teamPrimaryColor: d.primaryColor,
            teamSecondaryColor: d.secondaryColor
    };
    
    metaDataMap.set(team, teamInfo);
};



function dataLoaded(err, rows, rows0){

scaleX.domain([0,width]);
scaleY.domain([0,height]);

//console.log(rows, rows0);
    var rows = d3.nest()
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
        .entries(rows);

    var root = {
        key:"NHL",
        values: rows
    };

//console.log(root);

    draw(root);

}

function draw(root){
  var slice = svg
        .selectAll('.slice')
        .data(sunburst.nodes(root))
        .enter()
        .append('path')
        .attr('class','slice')
        .attr ('transform','translate('+width/2+','+height/2+')')
        .attr('d', function(d){
            return arc(d);
        })
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
        .style('stroke-width','.5px')
        .on('click',click);

    slice.each(function(d){
            if(!d.children){
                d3.select(this).append('text')
                    .text(d.team)
                    .attr('x', d.x)
                    .attr('y', d.y)
                    .attr('text-anchor','middle')
                    .style('color','black');
                    //.style('font-size','50%')
                };
            });


        //.style('fill-opacity','.25');
    


    function click (d){
    slice.transition()
        .duration(1500)
        .attrTween('d',arcTween(d));
    }


}



function arcTween(d){

    var xd = d3.interpolate(scaleX.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(scaleY.domain(), [d.y, 1]),
        yr = d3.interpolate(scaleY.range(), [ d.y ? 150 : 0 , radius]);

    return function(d,i){
        return i 
            ? function (t){ return arc(d);}
            : function (t){ 
                scaleX.domain(xd(t));
                scaleY.domain(yd(t));
                scaleY.range(yr(t));
                return arc (d);
            };
    };

}



