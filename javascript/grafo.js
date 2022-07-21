// Variables definitions
var nodeRadius = 20;
var margin = { top: 80, right: 20, bottom: 80, left: 40 }; // to memorize the margins
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;
var updateTime = 1000; // time for transitions
var imageSize = 40;
var chapterNumber = 1;

// Scales definitions
var svgHeightScale = d3.scaleLinear();
var svgWidthScale = d3.scaleLinear();

// Select the svg from HTML
var svg = d3.selectAll("#graph")
    .attr("width", width)
    .attr("height", height);

d3.json('/dataset/characters_nodes.json').then(function (nodesData) {
    d3.json('/dataset/characters_edges.json').then(function (edgesData) {
        d3.json('/dataset/actions.json').then(function (actionsData) {
            d3.json('/dataset/gender_codes.json').then(function (gendersData) {

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


                function isFamily(actions) {
                    parental_actions = [];

                    actions.forEach(function (azione) {
                        if (azione["isFamily"] == 1) {
                            parental_actions.push(azione["action"]);
                            //console.log(azione);
                        }
                    });

                    families = [];
                    edgesData.forEach(function (general_actions) {
                        //console.log(general_actions["action"])
                        if (parental_actions.indexOf(general_actions["action"]) != -1) {

                            if (families.length == 0) {
                                family = [];
                                family.push(general_actions["source"]);
                                family.push(general_actions["target"]);
                                families.push(family);
                            }

                            else {
                                aggiunto = 0;
                                for (i in families) {
                                    if (families[i].indexOf(general_actions["source"]) != -1) {
                                        if (families[i].indexOf(general_actions["target"]) != -1) {
                                            aggiunto = 1
                                            continue;
                                        }
                                        else
                                            families[i].push(general_actions["target"])
                                        aggiunto = 1
                                    }

                                    else if (families[i].indexOf(general_actions["target"]) != -1) {
                                        if (families[i].indexOf(general_actions["source"]) != -1) {
                                            aggiunto = 1
                                            continue;
                                        }
                                        else
                                            families[i].push(general_actions["source"])
                                        aggiunto = 1
                                    }
                                }
                                if (aggiunto == 0) {
                                    family = [];
                                    family.push(general_actions["source"]);
                                    family.push(general_actions["target"]);
                                    families.push(family);
                                }
                            }
                        }
                    });
                    console.log(families)
                    return families;
                }

                function found_family(families, id_character) {
                    for (i in families) {
                        if (families[i].indexOf(id_character) != -1) {
                            //console.log("id: "+ id_character)
                            //console.log("famiglia: "+i)
                            return i;
                        }
                    }

                    alone = families.length + parseInt(id_character);
                    //console.log("id: "+ id_character)
                    //console.log("famiglia: "+alone)

                    return alone;
                }

                function createclique(families) {
                    edges = [];
                    for (i in families) {

                        for (j in families[i]) {
                            source = families[i][j];

                            for (h in families[i]) {
                                target = families[i][h]
                                if (j < h) {
                                    var edge = {
                                        "source": source,
                                        "target": target,
                                        "distance": 1
                                    }
                                    //console.log(edge)
                                    edges.push(edge);
                                }
                            }
                        }

                    }
                    //console.log(edges);
                    return edges;
                }

                function setDistance(source, target, families) {
                    source_family = found_family(families, source);
                    target_family = found_family(families, target);
                    if (source_family == target_family) {
                        return 1;
                    }
                    else return 10;
                }

                function createGraphTopologyArray(nodesData, edgesData, actions, genderCodes) {
                    var result = [];

                    var characterNodes = [];
                    var characterEdges = [];
                    var familyEdges = [];

                    families = isFamily(actions);

                    nodesData.forEach(function (character) {
                        genderCodes.forEach(function (gender) {
                            if (character["gender"] == gender["gender"]) {
                                var resolvedCharacter = {
                                    "id": character["id"],
                                    "label": character["label"],
                                    "gender": gender["gender description"],
                                    "chapter": character["chapter"],
                                    "page": character["page"]
                                };
                                characterNodes.push(resolvedCharacter);
                            }
                        })
                    });
                    edgesData.forEach(function (edge) {
                        actions.forEach(function (action) {
                            if (edge["action"] == action["action"]) {
                                var resolvedEdge = {
                                    "source": edge["source"],
                                    "target": edge["target"],
                                    "action": action["action description"],
                                    "chapter": edge["chapter"],
                                    "distance": setDistance(edge["source"], edge["target"], families),
                                    "page": edge["page"],
                                    "isFamily": action["isFamily"],
                                    "hostilityLevel": action["hostilityLevel"]
                                };
                                characterEdges.push(resolvedEdge);
                            }
                        })
                    })

                    familyEdges = createclique(families);

                    result[0] = characterNodes;
                    result[1] = characterEdges;
                    result[2] = familyEdges;
                    return result;
                }


                /**
                 * @param {characterId} the unique identifier for a character
                 * @returns a new Array filled with all the nodes near to the given one
                 */
                function getLinkedNodes(characterId) {
                    var linkedNodesIds = [];
                    edgesData.forEach(e => {
                        if (e.source == characterId) {
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
                function getCharacterById(characterId, nodes) {
                    return find(nodes, characterId);
                }


                /**
                 * This function changes the color of a particular given node
                 * @param {node} the unique identifier for a node
                 * @param {color} a string related to a color (in RGB)
                 */
                function updateNodesColor(node, color) {
                    for (var i = 0; i < nodesData.length; i++) {
                        var tmp = nodesData[i];
                        if (tmp.id == node) {
                            tmp.color = color;
                        }
                    }
                }


                /**
                 * Starting from a circle list, this function gets the maximum and the minimum values of
                 * circles' centers' horizontal position and sets the corresponding scale's domain and range
                 * @param {circles} the list of circles
                 */
                function setWidthScaleDomainAndRange(circles) {
                    console.log(circles);
                    maxCoordX = d3.max(circles, function (d) { return d.x });
                    minCoordX = d3.min(circles, function (d) { return d.x });
                    console.log(minCoordX + "   " + maxCoordX);
                    svgWidthScale.domain([minCoordX - 100, maxCoordX + 100]);
                    svgWidthScale.range([minCoordX, width - maxCoordX - 40]);
                }


                /**
                 * Starting from a circle list, this function gets the maximum and the minimum values of
                 * circles' centers' vertical position and sets the corresponding scale's domain and range
                 * @param {circles} the list of circles
                 */
                function setHeightScaleDomainAndRange(circles) {
                    console.log(circles);

                    maxCoordY = d3.max(circles, function (d) { return d.y });
                    minCoordY = d3.min(circles, function (d) { return d.y });
                    console.log(minCoordY + "   " + maxCoordX);
                    svgHeightScale.domain([minCoordY, maxCoordY])
                    svgHeightScale.range([0, height - nodeRadius - 40]);
                }

                function updateGraph() {
                    chapterNumber = document.querySelector('#rangeField').value;
                    svg.selectAll(".node").remove();
                    chart = ForceGraph({ nodes, links, family, chapterNumber }, {
                        nodeId: d => d.id,
                        nodeGroup: d => d.group,
                        nodeTitle: d => `${d.id}\n${d.group}`,
                        linkStrokeWidth: l => Math.sqrt(l.value),
                        width,
                        height: 600,
                    });
                }

                function selectNodesInChapter(nodesInChapter){
                    var temp = []
                    for(i in nodesInChapter){
                        if(nodesInChapter[i][1] == null || nodesInChapter[i][1] <= chapterNumber){
                            temp.push({id: nodesInChapter[i][0]});
                        }
                    }
                    return temp;
                }

                function selectLinksInChapter(linksInChapter){
                    var temp = [];
                    for(i in linksInChapter){
                        if(linksInChapter[i][2] <= chapterNumber){
                            temp.push({source: linksInChapter[i][0], target: linksInChapter[i][1]});
                        }
                    }
                    return temp;
                }

                function selectFamilyLinksInChapter(familyLinksInChapter, nodesInChapter){
                    var temp = [];
                    var nodesIds = [];

                    for(i in nodesInChapter){
                        nodes = parseInt(nodesInChapter[i].id)
                        nodesIds.push(nodes)
                    }

                    //console.log("nodi del capitolo: "+ nodesIds)
                    for(i in familyLinksInChapter){

                      source = familyLinksInChapter[i][0]
                      target = familyLinksInChapter[i][1]

                      //console.log("arco "+i+": "+source+","+target)
                        if((nodesIds.indexOf(parseInt(source)) != -1) && (nodesIds.indexOf(parseInt(target)) != -1)){
                            //console.log("è dentro")
                            temp.push({source: source, target: target});
                        }
                    }
                    //console.log(temp);
                    return temp;
                }

                function ForceGraph({ nodes, links, family, chapterNumber}, {
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
                    nodeChapter = ({chapter}) => chapter,
                    linkSource = ({ source }) => source, // given d in links, returns a node identifier string
                    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
                    linkDistance = ({ distance }) => distance,
                    linkStroke = function (links) {

                        if (links.isFamily === 1)
                            return "";
                        switch (links.hostilityLevel) {
                            case 0:
                                return "white";
                            case 1:
                                return "yellow";
                            case 2:
                                return "#orange";
                            case 3:
                                return "red";
                            default:
                                return "black"
                        }
                    }, // link stroke color, scale based on hostility level (from 0 to 3)
                    linkStrokeOpacity = 0.6, // link stroke opacity
                    linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
                    linkStrokeLinecap = "round", // link stroke linecap
                    linkStrength,
                    linkChapter = ({chapter}) => chapter,
                    colors = d3.schemeTableau10, // an array of color strings, for the node groups
                    width = 640, // outer width, in pixels
                    height = 400, // outer height, in pixels
                    invalidation, // when this promise resolves, stop the simulation
                    familySource = ({ source }) => source,
                    familyTarget = ({ target }) => target,
                    familyDistance = ({ distance }) => distance
                } = {}) {

                    // Compute values.
                    const N = d3.map(nodes, nodeId).map(intern);
                    const NC = d3.map(nodes, nodeChapter).map(intern);
                    const LS = d3.map(links, linkSource).map(intern);
                    const LT = d3.map(links, linkTarget).map(intern);
                    const LD = d3.map(links, linkDistance).map(intern);
                    const LC = d3.map(links, linkChapter).map(intern);
                    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
                    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
                    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
                    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
                    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);
                    const FD = d3.map(family, familyDistance).map(intern);
                    const FS = d3.map(family, familySource).map(intern);
                    const FT = d3.map(family, familyTarget).map(intern);

                    // Replace the input nodes and links with mutable objects for the simulation.

                    nodesInChapter = d3.map(nodes, (_, i) => ([N[i], NC[i]]));
                    linksInChapter = d3.map(links, (_, i) => ([LS[i], LT[i], LC[i]]));
                    familyLinks = d3.map(family, (_, i) => ([FS[i], FT[i]]));

                    nodesInChapter = selectNodesInChapter(nodesInChapter);
                    linksInChapter = selectLinksInChapter(linksInChapter);
                    familyLinkInChapter = selectFamilyLinksInChapter(familyLinks, nodesInChapter);

                    console.log(nodesInChapter)
                    console.log(linksInChapter)
                    console.log(familyLinkInChapter)

                    // Compute default domains.
                    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

                    // Construct the scales.
                    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

                    // Construct the forces.
                    const forceNode = d3.forceManyBody();
                    const forceLink = d3.forceLink(linksInChapter).id(({ index: i }) => nodesInChapter[i].id);
                    const forceFamilyLink = d3.forceLink(familyLinkInChapter).id(({ index: i }) => nodesInChapter[i].id).distance(1).strength(0.1);
                    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
                    if (linkStrength !== undefined) {
                        forceLink.strength(linkStrength);
                        forceFamilyLink.strength(linkStrength);
                    }

                    const simulation = d3.forceSimulation(nodesInChapter)
                        .force("link", forceLink)
                        .force("link", forceFamilyLink)
                        .force("charge", forceNode)
                        .force("center", d3.forceCenter())
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
                        .data(linksInChapter)
                        .join("line");

                    const node = svg.append("g")
                        .attr("fill", nodeFill)
                        .attr("stroke", nodeStroke)
                        .attr("stroke-opacity", nodeStrokeOpacity)
                        .attr("stroke-width", nodeStrokeWidth)
                        .selectAll("circle")
                        .data(nodesInChapter)
                        .join("circle")
                        .attr("r", nodeRadius);

                    setWidthScaleDomainAndRange(nodesInChapter);
                    setHeightScaleDomainAndRange(nodesInChapter);
                    console.log(svgHeightScale(10));

                    if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
                    if (L) link.attr("stroke", ({ index: i }) => L[i]);
                    if (G) node.attr("fill", ({ index: i }) => color(G[i]));
                    if (T) node.append("title").text(({ index: i }) => T[i]);
                    if (invalidation != null) invalidation.then(() => simulation.stop());

                    function intern(value) {
                        return value !== null && typeof value === "object" ? value.valueOf() : value;
                    }

                    function ticked() {
                        link
                            .attr("x1", d => (d.source.x))
                            .attr("y1", d => (d.source.y))
                            .attr("x2", d => (d.target.x))
                            .attr("y2", d => (d.target.y))
                            .attr("hostilityLevel", function (d) {
                                return d.hostilityLevel;
                            });

                        node
                            .attr("cx", d => (d.x))
                            .attr("cy", d => (d.y));
                    }

                    return Object.assign(svg.node(), { scales: { color } });
                }
                //--------------------------------------------------------------------------------------------
                // INPUT ADJUSTEMENTS
                //--------------------------------------------------------------------------------------------

                //Creates the graph topology starting from json files
                var result = createGraphTopologyArray(nodesData, edgesData, actionsData, gendersData);
                var nodes = result[0];
                var links = result[1];
                var family = result[2];


                chart = ForceGraph({ nodes, links, family, chapterNumber}, {
                    nodeId: d => d.id,
                    nodeGroup: d => d.group,
                    nodeTitle: d => `${d.id}\n${d.group}`,
                    linkStrokeWidth: l => Math.sqrt(l.value),
                    width,
                    height: 600,
                });

                document.body.addEventListener("change", updateGraph);
            });
        });
    });
});
