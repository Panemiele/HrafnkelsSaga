var svg = d3.select("#graph");
var radius = 50
var margin = {top: 80, right: 20, bottom: 80, left: 40}; // to memorize the margins
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;
var updateTime = 1000; // time for transitions
var imageSize = 40;

var svgHeightScale = d3.scaleLinear();
var svgWidthScale = d3.scaleLinear();






//--------------------------------------------------------------------------------------------
// FUNCTIONS
//--------------------------------------------------------------------------------------------

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

function drawNodes(nodeData, gendersData){

    
    var nodes = svg.selectAll(".node").data(nodeData);

    svgWidthScale.domain([0, 1000])
    svgWidthScale.range([radius, width - radius]);
    svgHeightScale.domain([0, 1000])
    svgHeightScale.range([radius, height - radius]);

    return nodes.enter()
        .append("circle")
        .attr("class", "node")
        .attr("id", function(d) {return d.id;})
        .attr('href', function(d) {return selectCharacterImageByCharacterId(d.id)})
        .attr("cx", function() {return svgWidthScale(getRandomInt(800));})
        .attr("cy", function() {return svgHeightScale(getRandomInt(800));})
        .attr("r", radius)
        .attr("xlink:href", function(d) {return selectCharacterImageByCharacterId(d.id);})
        .attr('width', 100)
        .attr('height', 100);
}

function printCharacterById(characterId){
    var node = svg.selectAll(".node").select("#" + characterId);
    console.log(characterId);
    return;
}






//--------------------------------------------------------------------------------------------
// SVG CREATION SECTION
//--------------------------------------------------------------------------------------------

svg.attr("width", width).attr("height", height);

//Read nodes data from characters_nodes.json file
d3.json('/dataset/characters_nodes.json').then(function(nodeData) {
    d3.json('/dataset/characters_edges.json').then(function(edgesData) {
        d3.json('/dataset/actions.json').then(function(actionsData) {
            d3.json('/dataset/gender_codes.json').then(function(gendersData) {

                var force = d3.layout.force()
                    .gravity(0.05)
                    .distance(100)
                    .charge(-100)
                    .size([width, height]);

                force.nodes(nodeData)
                    .links(edgesData)
                    .start();
            
                var link = svg.selectAll(".link")
                    .data(edgesData)
                .enter().append("line")
                    .attr("class", "link");
            
                var node = svg.selectAll(".node")
                    .data(nodeData)
                .enter().append("g")
                    .attr("class", "node")
                    .call(force.drag);


                node.append("image")
                    .attr("xlink:href", "https://github.com/favicon.ico")
                    .attr("x", -8)
                    .attr("y", -8)
                    .attr("width", 16)
                    .attr("height", 16);

                node.append("text")
                    .attr("dx", 12)
                    .attr("dy", ".35em")
                    .text(function(d) { return d.name });

                force.on("tick", function() {
                    link.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });
                
                    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
                });
            });
        });
    });
});

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

