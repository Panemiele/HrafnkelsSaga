var nodeRadius = 50;
var margin = {top: 80, right: 20, bottom: 80, left: 40}; // to memorize the margins
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;
var updateTime = 1000; // time for transitions
var imageSize = 40;

var svgHeightScale = d3.scaleLinear();
var svgWidthScale = d3.scaleLinear();

var svgSelection = d3.selectAll("#graph")
    .attr("width", width)
    .attr("height", height);

d3.json('/dataset/characters_nodes.json').then(function(nodesData) {
    d3.json('/dataset/characters_edges.json').then(function(edgesData) {
        d3.json('/dataset/actions.json').then(function(actionsData) {
            d3.json('/dataset/gender_codes.json').then(function(gendersData) {

//--------------------------------------------------------------------------------------------
// FUNCTIONS DEFINITIONS
//--------------------------------------------------------------------------------------------
                /**
                 * Creates the graph topology (nodes and edges) with resolved nodes and edges;
                 * in this way, there is no need to use actions and genders codes.
                 */
                function createGraphTopologyArray(nodesData, edgesData, actions, genderCodes){
                    var result = [];
                    
                    var characterNodes = [];
                    var characterEdges = [];

                    nodesData.forEach(function(character) {
                        genderCodes.forEach(function(gender) {
                            if(character["gender"] == gender["gender"]){
                                var resolvedCharacter = {
                                    "id":character["id"],
                                    "label":character["label"],
                                    "gender":gender["gender description"],
                                    "chapter":character["chapter"],
                                    "page":character["page"]};
                                characterNodes.push(resolvedCharacter);
                            }
                        })
                    });
                    edgesData.forEach(function(edge) {
                        actions.forEach(function(action) {
                            if(edge["action"] == action["action"]){
                                var resolvedEdge = {
                                    "source":edge["source"],
                                    "target":edge["target"],
                                    "action":action["action description"],
                                    "chapter":edge["chapter"],
                                    "page":edge["page"]};
                                characterEdges.push(resolvedEdge);
                            }
                        })
                    })
                    result[0] = characterNodes;
                    result[1] = characterEdges;
                    return result;
                }

                function getLinkedNodes(characterId){
                    var linkedNodesIds = [];
                    edgesData.forEach(e => {
                        if(e.source == characterId){
                            linkedNodesIds.push(e.target);
                        }
                    })
                    return linkedNodesIds;
                }

                function getCharacterById(characterId, nodes){
                    return find(nodes, characterId);
                }

                function updateNodesColor(node,color){
                    for(var i=0; i<nodesData.length;i++){
                        var tmp = nodesData[i];
                        if(tmp.id==node){
                            tmp.color = color;
                        }	
                    }
                }

                function setWidthScaleDomainAndRange(circles){
                    maxCoordX = d3.max(circles, function(d){return d.cx});
                    minCoordX = d3.min(circles, function(d){return d.cx});
                    console.log(minCoordX + "   " + maxCoordX);
                    svgWidthScale.domain([minCoordX, maxCoordX]);
                    svgWidthScale.range([0, width - nodesDiameter - 40]);
                }
                
                function setHeightScaleDomainAndRange(circles){
                    maxCoordY = d3.max(circles, function(d){return d.cy});
                    minCoordY = d3.min(circles, function(d){return d.cy});
                    console.log(minCoordY + "   " + maxCoordX);
                    svgHeightScale.domain([minCoordY, maxCoordY])
                    svgHeightScale.range([0, height - nodesDiameter - 40]);
                }






//--------------------------------------------------------------------------------------------
// INPUT ADJUSTEMENTS
//--------------------------------------------------------------------------------------------

                //Creates the graph topology starting from json files
                var result = createGraphTopologyArray(nodesData, edgesData, actionsData, gendersData);
                var nodes = result[0];
                var edges = result[1];

                //lines and nodes diameters
                var nodesDiameter=6;
                var arrowDimension = "1";
                var arrowCoordX = 5;
                var arrowCoordY = 3;
                var connectingLineThickness = 0.4;
                var connectingPointFill = "none";
                var bundle = 0;

                
                
                // Draws nodes based on characters array's order
                var nodeDataArray =[];
                
                var chactersNumber = nodes.length;
                var xspacing = width/chactersNumber;
                var yspacing = height/chactersNumber;

                for (var i = 0; i < chactersNumber; i++) {
                    //mettiamo lo start x in mezzo a due nodi della diagonale
                    var startx = 0+nodesDiameter;
                    var starty = height-nodesDiameter;
                    nodeDataArray.push({"cx": svgWidthScale(startx+(i*xspacing)), "cy": svgHeightScale(starty-(i*yspacing)), "radius": nodesDiameter, "color" : "red", "id":nodes[i].id});
                }

                
                // define tooltip
                // create a tooltip
                var newTooltip = d3.select("#graph")
                .append("div")
                .attr("class", "tooltip")

                newTooltip.append('div')                           
                .attr('class', 'descr');   
                        
                var circles = svgSelection.selectAll(".circle")
                    .data(nodeDataArray)
                    .enter()
                    .append("circle")
                    .attr("class", "circle")
                    .attr("id", function (d) { return d.id; })
                    .attr("cx", function (d) { return svgWidthScale(d.cx); })
                    .attr("cy", function (d) { return svgHeightScale(d.cy); })
                    .attr("r", function (d) { return d.radius; })
                    .style("fill", function (d) { return d.color; })
                    .on('mouseover', function(d){                          
                        newTooltip.select('.descr').html(d.id.bold());        
                        newTooltip.style('display', 'block');
                        var linkedNodes = getLinkedNodes(d.id);
                        if(linkedNodes != null && !(linkedNodes.length == 0) ){
                            for(var i=0; i<linkedNodes.length; i++){
                                    updateNodesColor(linkedNodes[i],"green");
                                    svgSelection.selectAll(".circle")
                                    .style("fill",function (d) { return d.color; }
                                );
                            }
                            svgSelection.append("circle").attr("id","circle_selected").attr("cx",0).attr("cy",120).attr("r", 10).style("fill", "orange");
                            svgSelection.append("text").attr("id","text_selected").attr("x", 20).attr("y", 120).attr("font-weight",600).text("Related characters: ("+linkedNodes.length+")").style("font-size", "15px").attr("alignment-baseline","middle");    
                        }
                        svgSelection.append("circle").attr("id","character_selected").attr("cx",0).attr("cy",90).attr("r", 10).style("fill", "green");
                        svgSelection.append("text").attr("id","text_character_selected").attr("x", 20).attr("y", 90).attr("font-weight",600).text("Character: ("+d.id+")").style("font-size", "15px").attr("alignment-baseline","middle");    
                    })
                    .on('mouseout', function() {                     
                        newTooltip.style('display', 'none'); 
                    })
                    .on('mousemove', function() { 
                        newTooltip.style('top', (d3.event.layerY + 10) + 'px') 
                            .style('left', (d3.event.layerX + 10) + 'px'); 
                    })
                    .on("mouseenter", function() {
                        d3.select(this)
                            .style("stroke-width", 2)
                            .attr("stroke","white")
                            .transition()
                    })
                    .on("mouseleave", function(d) {
                        d3.select(this).transition()            
                            .attr("d", d)
                            .attr("stroke","none");
                        var tmp = getLinkedNodes(d.id);
                        for(var i=0; i<tmp.length; i++){
                                updateNodesColor(tmp[i],"blue");
                                svgSelection.selectAll(".circle")
                                .style("fill",function (d) { return d.color; });
                        }
                        d3.select("#circle_selected").remove();
                        d3.select("#text_selected").remove();
                        d3.select("#character_selected").remove();
                        d3.select("#text_character_selected").remove();
                    })

                    // var circleAttributes = circles
					// 			.attr("id", function (d) { return d.id; })
	 				// 			.attr("cx", function (d) { return svgWidthScale(d.cx); })
	 				// 			.attr("cy", function (d) { return svgHeightScale(d.cy); })
	 				// 			.attr("r", function (d) { return d.radius; })
	 				// 			.style("fill", function (d) { return d.color; })


                // Draws edges
                var source=[];
                var destination=[];
                var circles=document.getElementsByTagName("circle");
                // Calculate max coords for d3 scales
                setWidthScaleDomainAndRange(nodeDataArray);
                setHeightScaleDomainAndRange(nodeDataArray);

                for (var j = 0; j < edges.length; j++) {
                    for (var i = 0; i < (circles.length); i++) {
                        if (circles[i].getAttribute("id")==edges[j].source){
                            source.push({"id":circles[i].getAttribute("id"),"cx":parseInt(circles[i].getAttribute("cx"),10),"cy":parseInt(circles[i].getAttribute("cy"),10)});
                        }
                        if (circles[i].getAttribute("id")==edges[j].target){
                            destination.push({"id":circles[i].getAttribute("id"),"cx":parseInt(circles[i].getAttribute("cx"),10),"cy":parseInt(circles[i].getAttribute("cy"),10)});
                        }
                    }
                }	






//--------------------------------------------------------------------------------------------
// GRAPH CREATIONS
//--------------------------------------------------------------------------------------------
                var segmentedData = [];
                var connectionPoints = new Array();
                var polygonData = [];

                for (var i = 0; i < source.length; i++) {


                    // If source node is lower than the target one
                    if ((source[i].cx < destination[i].cx) && (source[i].cy < destination[i].cy)){
                        console.log("caso 1");
                        segmentedData.push({"x1":parseInt(source[i].cx,10),"y1":parseInt(source[i].cy,10)+nodesDiameter,"x2":(source[i].cx),"y2":parseInt(destination[i].cy,10)-nodesDiameter});
                        segmentedData.push({"x1":parseInt(source[i].cx,10)+nodesDiameter,"y1":destination[i].cy,"x2":parseInt(destination[i].cx,10)-nodesDiameter,"y2":destination[i].cy});
                        connectionPoints.push({"x":parseInt(source[i].cx,10),"y":parseInt(destination[i].cy,10)-nodesDiameter});
                        connectionPoints.push({"x":parseInt(source[i].cx,10),"y":parseInt(destination[i].cy,10)});
                        connectionPoints.push({"x":parseInt(source[i].cx,10)+nodesDiameter,"y":parseInt(destination[i].cy,10)});
                        
                        // Arrows attributes
                        var arrowPoints = ((parseInt(destination[i].cx)-nodesDiameter-arrowCoordX).toString())+","+((parseInt(destination[i].cy)-arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)-nodesDiameter-arrowCoordX).toString())+","+((parseInt(destination[i].cy)+arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)-nodesDiameter).toString())+","+((parseInt(destination[i].cy)).toString())+" ";
                        polygonData.push({ "fill":  "black", "stroke": "black" ,"stroke-width":arrowDimension, "points": arrowPoints})
                        
                        //Connection turns
                        var connectionLines = d3.line()
                                                .x(function(d) { return svgWidthScale(d.x); })
                                                .y(function(d) { return svgHeightScale(d.y); })
                                                .curve(d3.curveBundle.beta(bundle));
                        //The line SVG Path we draw
                        var lineGraph = svgSelection.append("path")
                                            .attr("d", connectionLines(connectionPoints))
                                            .attr("stroke", "black")
                                            .attr("stroke-width", connectingLineThickness)
                                            .attr("fill", connectingPointFill);
                        
                        connectionPoints.pop();
                        connectionPoints.pop();
                        connectionPoints.pop();
                    }

                    
                    // If source node is higher than the target one
                    if ((source[i].cx > destination[i].cx) && (source[i].cy > destination[i].cy)){
                        console.log("caso 2");
                        segmentedData.push({"x1":parseInt(source[i].cx,10),"y1":parseInt(source[i].cy,10)-nodesDiameter,"x2":(source[i].cx),"y2":parseInt(destination[i].cy,10)+nodesDiameter});
                        segmentedData.push({"x1":parseInt(source[i].cx,10)-nodesDiameter,"y1":destination[i].cy,"x2":parseInt(destination[i].cx,10)+nodesDiameter,"y2":destination[i].cy});
                        connectionPoints.push({"x":parseInt(source[i].cx,10),"y":parseInt(destination[i].cy,10)+nodesDiameter});
                        connectionPoints.push({"x":parseInt(source[i].cx,10),"y":parseInt(destination[i].cy,10)});
                        connectionPoints.push({"x":parseInt(source[i].cx,10)-nodesDiameter,"y":parseInt(destination[i].cy,10)});
                        
                        // Arrows attributes
                        var arrowPoints = ((parseInt(destination[i].cx)+nodesDiameter+arrowCoordX).toString())+","+((parseInt(destination[i].cy)-arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)+nodesDiameter+arrowCoordX).toString())+","+((parseInt(destination[i].cy)+arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)+nodesDiameter).toString())+","+((parseInt(destination[i].cy)).toString())+" ";
                        polygonData.push({ "fill":  "black", "stroke": "black" ,"stroke-width":arrowDimension, "points": arrowPoints})
                        
                        //Connection turns
                        var connectionLines = d3.line()
                                                .x(function(d) { return svgWidthScale(d.x); })
                                                .y(function(d) { return svgHeightScale(d.y); })
                                                .curve(d3.curveBundle.beta(bundle));
                        //The line SVG Path we draw
                        var lineGraph = svgSelection.append("path")
                                            .attr("d", connectionLines(connectionPoints))
                                            .attr("stroke", "black")
                                            .attr("stroke-width", connectingLineThickness)
                                            .attr("fill", connectingPointFill);
                        
                        connectionPoints.pop();
                        connectionPoints.pop();
                        connectionPoints.pop();
                        //console.log("caso2")
                    }


                    if((source[i].cx>destination[i].cx)&& (source[i].cy<destination[i].cy)){
                        console.log("caso 3");
                        segmentedData.push({"x1":svgWidthScale(parseInt(source[i].cx,10)),"y1":svgHeightScale(parseInt(source[i].cy,10)+nodesDiameter),"x2":svgWidthScale(source[i].cx),"y2":svgHeightScale(parseInt(destination[i].cy,10)-nodesDiameter)});
                        segmentedData.push({"x1":svgWidthScale(parseInt(source[i].cx,10)-nodesDiameter),"y1":svgHeightScale(destination[i].cy),"x2":svgWidthScale(parseInt(destination[i].cx,10)+nodesDiameter),"y2":svgHeightScale(destination[i].cy)});
                        connectionPoints.push({"x":svgWidthScale(parseInt(source[i].cx,10)),"y":svgHeightScale(parseInt(destination[i].cy,10)-nodesDiameter)});
                        connectionPoints.push({"x":svgWidthScale(parseInt(source[i].cx,10)),"y":svgHeightScale(parseInt(destination[i].cy,10))});
                        connectionPoints.push({"x":svgWidthScale(parseInt(source[i].cx,10)-nodesDiameter),"y":svgHeightScale(parseInt(destination[i].cy,10))});

                        var arrowPoints = ((parseInt(destination[i].cx)+nodesDiameter+arrowCoordX).toString())+","+((parseInt(destination[i].cy)-arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)+nodesDiameter+arrowCoordX).toString())+","+((parseInt(destination[i].cy)+arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)+nodesDiameter).toString())+","+((parseInt(destination[i].cy)).toString())+" ";
                        polygonData.push({ "fill":  "black", "stroke": "black" ,"stroke-width":arrowDimension, "points": arrowPoints})
                        
                        //Connection turns
                        var connectionLines = d3.line()
                                                .x(function(d) { return svgWidthScale(d.x); })
                                                .y(function(d) { return svgHeightScale(d.y); })
                                                .curve(d3.curveBundle.beta(bundle));
                        //The line SVG Path we draw
                        var lineGraph = svgSelection.append("path")
                                            .attr("d", connectionLines(connectionPoints))
                                            .attr("stroke", "black")
                                            .attr("stroke-width", connectingLineThickness)
                                            .attr("fill", connectingPointFill);
                        
                        connectionPoints.pop();
                        connectionPoints.pop();
                        connectionPoints.pop();
                    }


                    if((source[i].cx<destination[i].cx)&& (source[i].cy>destination[i].cy)){
                        console.log("caso 4");
                        segmentedData.push({"x1":svgWidthScale(parseInt(source[i].cx,10)),"y1":svgHeightScale(parseInt(source[i].cy,10)-nodesDiameter),"x2":svgWidthScale(source[i].cx),"y2":svgHeightScale(parseInt(destination[i].cy,10)+nodesDiameter)});
                        segmentedData.push({"x1":svgWidthScale(parseInt(source[i].cx,10)+nodesDiameter),"y1":svgHeightScale(destination[i].cy),"x2":svgWidthScale(parseInt(destination[i].cx,10)-nodesDiameter),"y2":svgHeightScale(destination[i].cy)});
                        connectionPoints.push({"x":svgWidthScale(parseInt(source[i].cx,10)),"y":svgHeightScale(parseInt(destination[i].cy,10)+nodesDiameter)});
                        connectionPoints.push({"x":svgWidthScale(parseInt(source[i].cx,10)),"y":svgHeightScale(parseInt(destination[i].cy,10))});
                        connectionPoints.push({"x":svgWidthScale(parseInt(source[i].cx,10)+nodesDiameter),"y":svgHeightScale(parseInt(destination[i].cy,10))});

                        var arrowPoints = ((parseInt(destination[i].cx)-nodesDiameter-arrowCoordX).toString())+","+((parseInt(destination[i].cy)-arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)-nodesDiameter-arrowCoordX).toString())+","+((parseInt(destination[i].cy)+arrowCoordY).toString())+" "+
                                        ((parseInt(destination[i].cx)-nodesDiameter).toString())+","+((parseInt(destination[i].cy)).toString())+" ";
                        polygonData.push({ "fill":  "black", "stroke": "black" ,"stroke-width":arrowDimension, "points": arrowPoints})
                        
                        //Connection turns
                        var connectionLines = d3.line()
                                                .x(function(d) { return svgWidthScale(d.x); })
                                                .y(function(d) { return svgHeightScale(d.y); })
                                                .curve(d3.curveBundle.beta(bundle));

                        //The line SVG Path we draw
                        var lineGraph = svgSelection.append("path")
                                            .attr("d", connectionLines(connectionPoints))
                                            .attr("stroke", "black")
                                            .attr("stroke-width", connectingLineThickness)
                                            .attr("fill", connectingPointFill);
                        
                        connectionPoints.pop();
                        connectionPoints.pop();
                        connectionPoints.pop();
                    }
                }

                //segmenti
                var lines = svgSelection.selectAll("line")
                                        .data(segmentedData)
                                        .enter()
                                        .append("line")
                                        .attr("x1", function (d) { return svgWidthScale(d.x1); })
                                        .attr("y1", function (d) { return svgHeightScale(d.y1); })
                                        .attr("x2", function (d) { return svgWidthScale(d.x2); })
                                        .attr("y2", function (d) { return svgHeightScale(d.y2); })
                                        .attr("stroke-width", 0.5)
                                        .attr("stroke", "black")
                                        .attr("fill", "none");

                
                var Polygons = svgSelection.selectAll("polygon")
                                            .data(polygonData)
                                            .enter()
                                            .append("polygon")
                                            .attr("points", function (d) { return d.points; })
                                            .style("fill", function (d) { return d.fill; })

                //add legend
                // svgSelection.append("circle").attr("cx",30).attr("cy",30).attr("r", 10).style("fill", "red")
                // svgSelection.append("circle").attr("cx",30).attr("cy",60).attr("r", 10).style("fill", "blue")
                // svgSelection.append("text").attr("x", 50).attr("y", 30).attr("font-weight",600).text("Piatti ("+nodes.length+")").style("font-size", "15px").attr("alignment-baseline","middle")
                d3.selectAll("circle").raise();
            });
        });
    });
});