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
//Scales

//d3 map
    var 
//arc generator
    var arcGenerator = d3.svg.arc();

//layout Functions
    var sunburst = d3.layout.partition()
        .children(function(d){
            return d.values;
        })
        .value(function(d){
            return d.data.get(y1);
        })
        .size([width,height]);





//START!
queue()
    .defer(d3.csv, "DataSheets/IndividualYears/leagues_NHL_2004_teams.csv",parse)
    .defer(d3.csv, "DataSheets/IndividualYears/leagues_NHL_1964_teams.csv",parse)
    .await(dataLoaded);


function dataLoaded(err, 1694, 2004){


}

function draw(root){


}

function parse(d){
    if(d.Team && d.GF){
        return {
            team: d.Team,
            goalsFor: +d.GF,
            wins: +d.W,
            goalsAgainst: +d.GA,

            }
    }else{
        return;
    }

}



