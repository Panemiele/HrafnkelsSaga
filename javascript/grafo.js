// Variables definitions
var nodeRadius = 20;
var margin = {top: 80, right: 20, bottom: 80, left: 40}; // to memorize the margins
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;
var updateTime = 1000; // time for transitions
var imageSize = 40;

// Scales definitions
var svgHeightScale = d3.scaleLinear();
var svgWidthScale = d3.scaleLinear();

// Select the svg from HTML
var svg = d3.selectAll("#graph")
    .attr("width", width)
    .attr("height", height);

// Retrieve data from json files
d3.json('/dataset/characters_nodes.json').then(function(nodesData) {
    d3.json('/dataset/characters_edges.json').then(function(edgesData) {
        d3.json('/dataset/actions.json').then(function(actionsData) {
            d3.json('/dataset/gender_codes.json').then(function(gendersData) {

//--------------------------------------------------------------------------------------------
// FUNCTIONS DEFINITIONS
//--------------------------------------------------------------------------------------------
                /**
                 * Creates the graph topology with "resolved" nodes and edges;
                 * in this way, there is no need to use actions indexes and genders codes.
                 * 
                 * @param {nodesData} data that has been taken from characters_nodes.json
                 * @param {edgesData} data that has been taken from characters_edges.json
                 * @param {actions} data that has been taken from actions.json
                 * @param {genderCodes} data that has been taken from gender_codes.json
                 * @returns a new Array with two elements: 
                 *              - an Array for all the nodes (without genders codes)
                 *              - an Array for all the edges (without actions indexes)
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


                /**
                 * @param {characterId} the unique identifier for a character
                 * @returns a new Array filled with all the nodes near to the given one
                 */
                function getLinkedNodes(characterId){
                    var linkedNodesIds = [];
                    edgesData.forEach(e => {
                        if(e.source == characterId){
                            linkedNodesIds.push(e.target);
                        }
                    })
                    return linkedNodesIds;
                }


                /**
                 * @param {characterId} the unique identifier for a character 
                 * @param {nodes} the Array of nodes 
                 * @returns all the character's informations
                 */
                function getCharacterById(characterId, nodes){
                    return find(nodes, characterId);
                }


                /**
                 * This function changes the color of a particular given node
                 * @param {node} the unique identifier for a node 
                 * @param {color} a string related to a color (in RGB) 
                 */
                function updateNodesColor(node,color){
                    for(var i=0; i<nodesData.length;i++){
                        var tmp = nodesData[i];
                        if(tmp.id==node){
                            tmp.color = color;
                        }	
                    }
                }


                /**
                 * Starting from a circle list, this function gets the maximum and the minimum values of 
                 * circles' centers' horizontal position and sets the corresponding scale's domain and range
                 * @param {circles} the list of circles
                 */
                function setWidthScaleDomainAndRange(circles){
                    console.log(circles);
                    maxCoordX = d3.max(circles, function(d){return d.x});
                    minCoordX = d3.min(circles, function(d){return d.x});
                    console.log(minCoordX + "   " + maxCoordX);
                    svgWidthScale.domain([minCoordX-100, maxCoordX+100]);
                    svgWidthScale.range([minCoordX, width - maxCoordX - 40]);
                }
                

                /**
                 * Starting from a circle list, this function gets the maximum and the minimum values of 
                 * circles' centers' vertical position and sets the corresponding scale's domain and range
                 * @param {circles} the list of circles
                 */
                function setHeightScaleDomainAndRange(circles){
                  console.log(circles);

                    maxCoordY = d3.max(circles, function(d){return d.y});
                    minCoordY = d3.min(circles, function(d){return d.y});
                    console.log(minCoordY + "   " + maxCoordX);
                    svgHeightScale.domain([minCoordY, maxCoordY])
                    svgHeightScale.range([0, height - nodeRadius - 40]);
                }

                function ForceGraph({nodes,links}, {
                  nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
                  nodeGroup, // given d in nodes, returns an (ordinal) value for color
                  nodeGroups, // an array of ordinal values representing the node groups
                  nodeTitle, // given d in nodes, a title string
                  nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
                  nodeStroke = "#fff", // node stroke color
                  nodeStrokeWidth = 1.5, // node stroke width, in pixels
                  nodeStrokeOpacity = 1, // node stroke opacity
                  nodeRadius = 5, // node radius, in pixels
                  nodeStrength,
                  linkSource = ({source}) => source, // given d in links, returns a node identifier string
                  linkTarget = ({target}) => target, // given d in links, returns a node identifier string
                  linkStroke = "#999", // link stroke color
                  linkStrokeOpacity = 0.6, // link stroke opacity
                  linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
                  linkStrokeLinecap = "round", // link stroke linecap
                  linkStrength,
                  colors = d3.schemeTableau10, // an array of color strings, for the node groups
                  width = 640, // outer width, in pixels
                  height = 400, // outer height, in pixels
                  invalidation // when this promise resolves, stop the simulation
                  } = {}) {
                  // Compute values.
                  const N = d3.map(nodes, nodeId).map(intern);
                  const LS = d3.map(links, linkSource).map(intern);
                  const LT = d3.map(links, linkTarget).map(intern);
                  if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
                  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
                  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
                  const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
                  const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);
                
                  // Replace the input nodes and links with mutable objects for the simulation.
                  nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
                  links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));
                
                  // Compute default domains.
                  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
                
                  // Construct the scales.
                  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
                
                  // Construct the forces.
                  const forceNode = d3.forceManyBody();
                  const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
                  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
                  if (linkStrength !== undefined) forceLink.strength(linkStrength);
                
                  const simulation = d3.forceSimulation(nodes)
                      .force("link", forceLink)
                      .force("charge", forceNode)
                      .force("center",  d3.forceCenter())
                      .on("tick", ticked);
                
                  svg
                      .attr("viewBox", [-width / 2, -height / 2, width, height])
                      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
                
                  const link = svg.append("g")
                      .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
                      .attr("stroke-opacity", linkStrokeOpacity)
                      .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
                      .attr("stroke-linecap", linkStrokeLinecap)
                      .selectAll("line")
                      .data(links)
                      .join("line");
                
                  const node = svg.append("g")
                      .attr("fill", nodeFill)
                      .attr("stroke", nodeStroke)
                      .attr("stroke-opacity", nodeStrokeOpacity)
                      .attr("stroke-width", nodeStrokeWidth)
                      .selectAll("circle")
                      .data(nodes)
                      .join("circle")
                      .attr("r", nodeRadius)
                      .call(drag(simulation));
                  
                  setWidthScaleDomainAndRange(nodes);
                  setHeightScaleDomainAndRange(nodes);
                  console.log(svgHeightScale(10));
                
                  if (W) link.attr("stroke-width", ({index: i}) => W[i]);
                  if (L) link.attr("stroke", ({index: i}) => L[i]);
                  if (G) node.attr("fill", ({index: i}) => color(G[i]));
                  if (T) node.append("title").text(({index: i}) => T[i]);
                  if (invalidation != null) invalidation.then(() => simulation.stop());
                
                  function intern(value) {
                    return value !== null && typeof value === "object" ? value.valueOf() : value;
                  }
                
                  function ticked() {
                    link
                      .attr("x1", d => (d.source.x))
                      .attr("y1", d => (d.source.y))
                      .attr("x2", d => (d.target.x))
                      .attr("y2", d => (d.target.y));
                
                    node
                      .attr("cx", d => (d.x))
                      .attr("cy", d => (d.y));
                  }
                
                  function drag(simulation) {    
                    function dragstarted(event) {
                      if (!event.active) simulation.alphaTarget(0.3).restart();
                      event.subject.fx = event.subject.x;
                      event.subject.fy = event.subject.y;
                    }
                    
                    function dragged(event) {
                      event.subject.fx = event.x;
                      event.subject.fy = event.y;
                    }
                    
                    function dragended(event) {
                      if (!event.active) simulation.alphaTarget(0);
                      event.subject.fx = null;
                      event.subject.fy = null;
                    }
                    
                    return d3.drag()
                      .on("start", dragstarted)
                      .on("drag", dragged)
                      .on("end", dragended);
                  }
                
                  return Object.assign(svg.node(), {scales: {color}});
                }
//--------------------------------------------------------------------------------------------
// INPUT ADJUSTEMENTS
//--------------------------------------------------------------------------------------------

                //Creates the graph topology starting from json files
                var result = createGraphTopologyArray(nodesData, edgesData, actionsData, gendersData);
                var nodes = result[0];
                var links = result[1];


                chart = ForceGraph({nodes, links}, {
                  nodeId: d => d.id,
                  nodeGroup: d => d.group,
                  nodeTitle: d => `${d.id}\n${d.group}`,
                  linkStrokeWidth: l => Math.sqrt(l.value),
                  width,
                  height: 600,
                });
              
            });
        });
    });
});