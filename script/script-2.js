/*
  Current Needs
    
    Simplifying code
        especially depth bar
  
    Color inside slices?

    Update data with last 2.5 years

    Tooltip
      Hide list values/titles when not in use
      Add thousands comma to make it easier to read

    !! - Combine depth bar and tooltip?
*/

/*
  Current Bugs
    
    Depth bar text is black
      Tried doing css styles, and in line changing

    Year slices not sorted chronologically

    Not all text showing up
      Conference/Division/Team is only writing text 
      for one year in each era

    When text would be Horizontal, it's rotating to Veritcal
*/

/*
  Ideas for Future

    Preselected historical teams
        Islanders Dynasty
        Broad Street Bullies
        Big Bad Bruins
        Wayne Gretzky teams

    Recap of each season selected
        President's Trophy
        Stanley Cup Winner   

    Bio for each team selected
        Founding Year
        Folding Year
        Stanley Cups
        A different name (Thrashers -> Jets)

    Comparison to average for that year    


*/



//Set up Canvas
var margin = {t:0,r:0,b:0,l:0},
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

var customTooltip = d3.select('.tooltip');

var currentDepth = 0;



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

x.domain([0,width]);
y.domain([0,height]);


  console.log(root);  

/*  var nodes = sunburst.nodes({children: root});
console.log(nodes);*/
  var slice = svg.selectAll('.slice')
    .data(sunburst.nodes(root))
    .enter();
  var sliceEnter =  slice.append('path')
    .attr('class', 'slice')
    .attr ('transform','translate('+width/2+','+height/2+')')
    .attr('d',arc)
    .attr('fill-rule','evenodd')
        .style('fill',function(d){
            var team = (metaDataMap.get(d.team))

            if (!team) {return 'white'}
            else {return ( 'rgb(' + (team.teamPrimaryColor) + ')')}
        })
        .style('stroke',function(d){
            var team = (metaDataMap.get(d.team))

            if (!team) {return 'gray'}
            else {return ( 'rgb(' + (team.teamSecondaryColor) + ')')}
        })
        .style('opacity',function(d){
            return  (d.depth * 0.2)
            
        })
        .style('stroke-width','4px')
    .on('click',click);

  var text = svg.selectAll(".text")
    .data(sunburst.nodes(root), function(d){return d.key})
      .enter()
      .append('g')
      .attr('class','text')
      .attr('transform','translate('+width/2+','+height/2+')')
      .append("text")
        .style("fill-opacity", 1)
        .style("fill", "rgb(250,250,250)")
      .attr("text-anchor", function(d) {
        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
      })
      .attr("dy", ".2em")
      .attr("transform", function(d) {
        //console.log(d.team);
        var multiline = (d.team || "").split(" ").length > 1,
            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
            rotate = angle + (multiline ? -0.5 : 0);
        return "rotate("+rotate+")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
      })
      .on("click", click);

    text.append("tspan")
      .attr("x", 0)
      .text(function(d) {
            if ((+d.depth)>((+currentDepth) + 1)){return}
              else if ((+d.depth) === 5){ return d.team}
                else {return d.key}
      });
  // text
  //     .attr("x", 0)
  //     .attr("dy", "1em")
  //     .text(function(d) { return d.depth ? d.key.split(" ")[1] || "" : ""; });

    var depthBar = d3.select('.depthBar')
      .append('svg')
      .attr('width', '100px')
      .attr('height', '700px')
      .append('g')
      .attr('transform','translate(0,25)');

    depthBar.append('rect')
      .attr('id','depth-1')
      .style('opacity','.25')
      .attr('width','25px')
      .attr('height','110px')
      .attr('x','0px')
      .attr('y','25px')
      .attr('fill','white');
      depthBar.append('text')
      .attr('text-anchor','left')
      .attr('x','30px')
      .attr('y','80px')
      .text('Era');

    depthBar.append('rect')
      .attr('id','depth-2')
      .style('opacity','.25')
      .attr('width','25px')
      .attr('height','110px')
      .attr('x','0px')
      .attr('y','150px')
      .attr('fill','white');      
    depthBar.append('text')
      .attr('text-anchor','left')
      .attr('x','30px')
      .attr('y','205px')
      .text('Year');

    depthBar.append('rect')
      .attr('id','depth-3')
      .style('opacity','.25')
      .attr('width','25px')
      .attr('height','110px')
      .attr('x','0px')
      .attr('y','275px')
      .attr('fill','white');
    depthBar.append('text')
      .attr('text-anchor','left')
      .attr('x','30px')
      .attr('y','330px')
      .text('Conf.');

    depthBar.append('rect')
      .attr('id','depth-4')
      .style('opacity','.25')
      .attr('width','25px')
      .attr('height','110px')
      .attr('x','0px')
      .attr('y','400px')
      .attr('fill','white');
    depthBar.append('text')
      .attr('text-anchor','left')
      .attr('x','30px')
      .attr('y','455px')
      .text('Division');

    depthBar.append('rect')
      .attr('id','depth-5')
      .style('opacity','.25')
      .attr('width','25px')
      .attr('height','110px')
      .attr('x','0px')
      .attr('y','525px')
      .attr('fill','white');
    depthBar.append('text')
      .attr('text-anchor','left')
      .attr('x','30px')
      .attr('y','580px')
      .text('Team');


function click(d) {
      //show tooltip if hidden
      function checkDepth(d) {
            if ((+d.depth)>((+currentDepth) + 1)){return}
              else if ((+d.depth) === 5){ return d.team}
                else {return d.key}};

    d3.select('.tooltip')
        .style('visibility','visible');
  
    console.log(d);
    currentDepth = (d.depth);

    var depthBar = d3.select('.depthBar');

    text.selectAll("tspan")
      .attr("x", 0)
      .text(checkDepth);

    //inject data into content of tooltip
    if(+currentDepth==1){
      depthBar.select('#depth-1')
      .style('opacity','1')
    }
    else{depthBar.select('#depth-1')
      .style('opacity','.25');
    }


    if(+currentDepth==2){
      depthBar.select('#depth-1')
      .style('opacity','1')
      depthBar.select('#depth-2')
      .style('opacity','1')
    }
    else{depthBar.select('#depth-2')
      .style('opacity','.25');
    }

    if(+currentDepth==3){
      depthBar.select('#depth-1')
      .style('opacity','1')
      depthBar.select('#depth-2')
      .style('opacity','1')
      depthBar.select('#depth-3')
      .style('opacity','1')
    }
    else{depthBar.select('#depth-3')
      .style('opacity','.25');
    }

        if(+currentDepth==4){
      depthBar.select('#depth-1')
      .style('opacity','1')
      depthBar.select('#depth-2')
      .style('opacity','1')
      depthBar.select('#depth-3')
      .style('opacity','1')
      depthBar.select('#depth-4')
      .style('opacity','1')
    }
    else{depthBar.select('#depth-4')
      .style('opacity','.25');
    }

        if(+currentDepth==5){
      depthBar.select('#depth-1')
      .style('opacity','1')
      depthBar.select('#depth-2')
      .style('opacity','1')
      depthBar.select('#depth-3')
      .style('opacity','1')
      depthBar.select('#depth-4')
      .style('opacity','1')
      depthBar.select('#depth-5')
      .style('opacity','1')
    }
    else{depthBar.select('#depth-5')
      .style('opacity','.25');
    }

    if(+currentDepth<5){
    customTooltip
        .select('.teamName')
        .html(d.key);
        }   
    else{customTooltip
        .select('.teamName')
        .html(d.team);
      }


    var table = customTooltip.select('.data-table')

      table.select('.era')
        .html('Era')
      table.select('.eraValue')
        .html(d.era)
      table.select('.year')
        .html('Year')
      table.select('.yearValue')
        .html(d.year)
      table.select('.conference')
        .html('Conference')
      table.select('.conferenceValue')
        .html(d.conference)
      table.select('.division')
        .html('Division')
      table.select('.divisionValue')
        .html(d.division)
      table.select('.gamesPlayed')
        .html('Games Played')
      table.select('.gamesPlayedValue')
        .html(d.gamesPlayed)
      table.select('.goalsScored')
        .html('Goals Scored')
      table.select('.goalsScoredValue')
        .html(d.value)


    sliceEnter.transition()
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
        if(d.TeamName){
            return {
              era: d.Era,
              year: d.Year,
              team: d.TeamName,
              conference: d.Conference,
              division: d.Division,
              gamesPlayed: +d.GP,
              wins: +d.Wins,
              goalsFor: +d.GF,
              goalsAgainst: +d.GA,
              penaltyMinutes: +d.PIM,
              powerPlayPercent: d["PP%"],
              penaltyKillPercent: d["PK%"],
       };

}}

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

  //console.log(d.children);
  if (d.children) {
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

