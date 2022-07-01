var svg = d3.select("#canvas");
var margin = {top: 20, right: 20, bottom: 30, left: 40}; // to memorize the margins
var width = 500 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var updateTime = 1000; // time for transitions
var imageSize = 40;


var svgHeightScale = d3.scaleLinear();
var svgWidthScale = d3.scaleLinear();

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function setWidthScaleDomainAndRange(data){
    maxX1 = d3.max(data, function(d){return d.x1});
    maxX2 = d3.max(data, function(d){return d.x2});
    maxX3 = d3.max(data, function(d){return d.x3});

    minX1 = d3.min(data, function(d){return d.x1});
    minX2 = d3.min(data, function(d){return d.x2});
    minX3 = d3.min(data, function(d){return d.x3});
    svgWidthScale.domain([Math.min(minX1, minX2, minX3), Math.max(maxX1, maxX2, maxX3)])
    svgWidthScale.range([0, width - imageSize]);
}

function setHeightScaleDomainAndRange(data){
    maxY1 = d3.max(data, function(d){return d.y1});
    maxY2 = d3.max(data, function(d){return d.y2});
    maxY3 = d3.max(data, function(d){return d.y3});

    minY1 = d3.min(data, function(d){return d.y1});
    minY2 = d3.min(data, function(d){return d.y2});
    minY3 = d3.min(data, function(d){return d.y3});
    svgHeightScale.domain([Math.min(minY1, minY2, minY3), Math.max(maxY1, maxY2, maxY3)])
    svgHeightScale.range([0, height - imageSize]);
}

function selectCharacterImageByCharacterId(characterId){
    return "../assets/" + characterId + ".jpeg";
}

function drawNodes(nodeData){
    var nodes = svg.selectAll(".node").data(nodeData);

    return nodes.enter()
        .append("image")
        .attr("class", "node")
        .attr("id", function(d) {return d.id;})
        .attr('href', function(d) {return selectCharacterImageByCharacterId(d.id)})
        .attr("x", function(d) {return getRandomInt(d.id*100);})
        .attr("y", function(d) {return getRandomInt(d.id*100);})
        .attr('width', 100)
        .attr('height', 100);
}

function printCharacterById(characterId){
    var node = svg.select(".node").select("#" + characterId);
    console.log(node);
    return;
}


//--------------------------------------------------------------------------------------------
// SVG CREATION SECTION
//--------------------------------------------------------------------------------------------

svg.attr("width", width).attr("height", height);

//Read nodes data from characters_nodes.json file
d3.json('/dataset/characters_nodes.json')
    .then(function(nodeData) {
        drawNodes(nodeData);
    }
);

//Read edges data from characters_edges.json file
d3.json('/dataset/characters_edges.json')
    .then(function(edgesData) {
        edgesData;
    }
);

//Read actions data from actions.json file
d3.json('/dataset/actions.json')
    .then(function(actionsData) {
        actionsData;
    }
);

//Read nodes data from gender_codes.json file
d3.json('/dataset/gender_codes.json')
    .then(function(genderCodes) {
        genderCodes;
    }
);

printCharacterById(1);

