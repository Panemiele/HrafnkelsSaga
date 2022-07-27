// Variables definitions
var nodeRadius = 20;
var margin = { top: 40, right: 20, bottom: 40, left: 20 }; // to memorize the margins
var width = "100%";
var height = 800;
var updateTime = 1000; // time for transitions
var imageSize = 40;
var chapterNumber = parseInt(document.querySelector('#rangeField').value);
var xCenter = 1000,
    yCenter = 400;
// Scales definitions
var svgHeightScale = d3.scaleLinear();
var svgWidthScale = d3.scaleLinear();

// Select the svg from HTML
var svg = d3.selectAll("#graph")
    .attr("width", width)
    .attr("height", height);

function reset() {
    svg.selectAll(".info").remove();
    svg.selectAll("#svgNodeInfo").remove();
    d3.select(this).remove();
    svg.style("box-shadow", "0 0 0 0px rgba(0,0,0,0.65)");
}

function init() {
    d3.json('./dataset/characters_nodes.json').then(function (nodesData) {
        d3.json('./dataset/characters_edges.json').then(function (edgesData) {
            d3.json('./dataset/actions.json').then(function (actionsData) {
                d3.json('./dataset/gender_codes.json').then(function (gendersData) {

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
                            }
                        });

                        families = [];
                        edgesData.forEach(function (general_actions) {
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
                        return families;
                    }

                    function found_family(families, id_character) {
                        for (i in families) {
                            if (families[i].indexOf(id_character) != -1) {
                                return i;
                            }
                        }

                        alone = families.length + parseInt(id_character);

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
                                            "distance": 5
                                        }
                                        edges.push(edge);
                                    }
                                }
                            }

                        }
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


                    // /**
                    //  * @param {characterId} the unique identifier for a character
                    //  * @returns a new Array filled with all the nodes near to the given one
                    //  */
                    // function getLinkedNodes(characterId) {
                    //     var linkedNodesIds = [];
                    //     edgesData.forEach(e => {
                    //         if (e.source == characterId) {
                    //             linkedNodesIds.push(e.target);
                    //         }
                    //     })
                    //     return linkedNodesIds;
                    // }


                    // /**
                    //  * @param {characterId} the unique identifier for a character
                    //  * @param {nodes} the Array of nodes
                    //  * @returns all the character's informations
                    //  */
                    // function getCharacterById(characterId, nodes) {
                    //     return find(nodes, characterId);
                    // }


                    // /**
                    //  * This function changes the color of a particular given node
                    //  * @param {node} the unique identifier for a node
                    //  * @param {color} a string related to a color (in RGB)
                    //  */
                    // function updateNodesColor(node, color) {
                    //     for (var i = 0; i < nodesData.length; i++) {
                    //         var tmp = nodesData[i];
                    //         if (tmp.id == node) {
                    //             tmp.color = color;
                    //         }
                    //     }
                    // }


                    /**
                     * Starting from a circle list, this function gets the maximum and the minimum values of
                     * circles' centers' horizontal position and sets the corresponding scale's domain and range
                     * @param {circles} the list of circles
                     */
                    function setWidthScaleDomainAndRange(circles) {
                        maxCoordX = d3.max(circles, function (d) {
                            return d.x
                        });
                        minCoordX = d3.min(circles, function (d) { return d.x });
                        svgWidthScale.domain([minCoordX, maxCoordX]);
                        svgWidthScale.range([-370, 370]);
                    }


                    /**
                     * Starting from a circle list, this function gets the maximum and the minimum values of
                     * circles' centers' vertical position and sets the corresponding scale's domain and range
                     * @param {circles} the list of circles
                     */
                    function setHeightScaleDomainAndRange(circles) {
                        maxCoordY = d3.max(circles, function (d) { return d.y });
                        minCoordY = d3.min(circles, function (d) { return d.y });
                        svgHeightScale.domain([minCoordY, maxCoordY])
                        svgHeightScale.range([-320, 320]);
                    }

                    function updateGraph() {
                        chapterNumber = parseInt(document.querySelector('#rangeField').value);
                        console.log("chapterNumber: " + chapterNumber);
                        svg.selectAll(".nodes").remove();
                        svg.selectAll(".links").remove();
                        chart = ForceGraph({ nodes, links, family }, {
                            nodeId: d => d.id,
                            nodeGroup: d => d.group,
                            nodeTitle: d => `${d.id}\n${d.group}`,
                            width,
                            height: 600,
                        });
                    }

                    function selectNodesInChapter(nodesInChapter) {
                        var temp = []
                        for (i in nodesInChapter) {
                            var nodeChapter = nodesInChapter[i][1];
                            if (nodeChapter == null || nodeChapter <= chapterNumber) {
                                temp.push({ id: nodesInChapter[i][0], chapter: nodesInChapter[i][1], label: nodesInChapter[i][2], gender: nodesInChapter[i][3] });
                            }
                        }
                        return temp;
                    }

                    function selectLinksInChapter(linksInChapter, nodesInChapter) {
                        var temp = [];
                        var temp2 = [];
                        var nodesIds = [];

                        for (i in nodesInChapter) {
                            nodesIC = parseInt(nodesInChapter[i].id)
                            nodesIds.push(nodesIC)
                        }

                        for (i in linksInChapter) {

                            source = linksInChapter[i][0];
                            target = linksInChapter[i][1];
                            chapter = linksInChapter[i][2];

                            if (linksInChapter[i][2] <= chapterNumber && (nodesIds.indexOf(parseInt(source)) != -1) && (nodesIds.indexOf(parseInt(target)) != -1)) {
                                temp.push({ source: linksInChapter[i][0], target: linksInChapter[i][1], chapter: linksInChapter[i][2], action: linksInChapter[i][3], hostilityLevel: linksInChapter[i][4], isFamily: linksInChapter[i][5] });
                            }
                        }
                        for (i in linksInChapter) {

                            source = linksInChapter[i][0];
                            target = linksInChapter[i][1];
                            chapter = linksInChapter[i][2];

                            if (linksInChapter[i][2] == chapterNumber && (nodesIds.indexOf(parseInt(source)) != -1) && (nodesIds.indexOf(parseInt(target)) != -1)) {
                                temp2.push({ source: linksInChapter[i][0], target: linksInChapter[i][1], chapter: linksInChapter[i][2], action: linksInChapter[i][3], hostilityLevel: linksInChapter[i][4], isFamily: linksInChapter[i][5] });
                            }
                        }
                        console.log(temp2);
                        return temp;
                    }

                    function selectFamilyLinksInChapter(familyLinksInChapter, nodesInChapter) {
                        var temp = [];
                        var nodesIds = [];

                        for (i in nodesInChapter) {
                            nodesIC = parseInt(nodesInChapter[i].id)
                            nodesIds.push(nodesIC)
                        }

                        for (i in familyLinksInChapter) {

                            source = familyLinksInChapter[i][0]
                            target = familyLinksInChapter[i][1]

                            if ((nodesIds.indexOf(parseInt(source)) != -1) && (nodesIds.indexOf(parseInt(target)) != -1)) {
                                temp.push({ source: source, target: target });
                            }
                        }
                        return temp;
                    }

                    function sortLinks(linksToSort) {
                        return linksToSort.sort(function (a, b) {
                            if (a.source > b.source) { return 1; }
                            else if (a.source < b.source) { return -1; }
                            else {
                                if (a.target > b.target) { return 1; }
                                if (a.target < b.target) { return -1; }
                                else { return 0; }
                            }
                        });
                    }

                    function ForceGraph({ nodes, links, family }, {
                        nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
                        nodeLabel = d => d.label,
                        nodeGender = d => d.gender,
                        nodeGroup, // given d in nodes, returns an (ordinal) value for color
                        nodeGroups, // an array of ordinal values representing the node groups
                        nodeTitle, // given d in nodes, a title string
                        nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
                        nodeStroke = "#fff", // node stroke color
                        nodeStrokeWidth = 1.5, // node stroke width, in pixels
                        nodeStrokeOpacity = 1, // node stroke opacity
                        nodeRadius = 5, // node radius, in pixels
                        nodeStrength,
                        nodeChapter = ({ chapter }) => chapter,
                        linkSource = ({ source }) => source, // given d in links, returns a node identifier string
                        linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
                        linkDistance = ({ distance }) => distance,
                        /*linkStroke = function (links) {
                            if (links.isFamily == 1)
                                return "transparent";
                           switch (links.hostilityLevel) {
                                case 0:
                                    return "green";
                                case 1:
                                    return "white";
                                case 2:
                                    return "orange";
                                case 3:
                                    return "red";
                                default:
                                    return "black"
                            }
                        },*/ // link stroke color, scale based on hostility level (from 0 to 3)
                        linkStrokeOpacity = (link) => Object.values(link["chapter"]) == parseInt(chapterNumber) ? 0.85 : 0.4, // link stroke opacity
                        // linkStrokeWidth = (link) => Object.values(link["chapter"]) == parseInt(chapterNumber) ? 8 : 3, // given d in links, returns a stroke width in pixels
                        linkStrokeLinecap = "round", // link stroke linecap
                        linkStrength,
                        linkChapter = ({ chapter }) => chapter,

                        linkIsFamily = ({ isFamily }) => isFamily,
                        linkHostilityLevel = ({ hostilityLevel }) => hostilityLevel,
                        linkAction = ({ action }) => action,

                        colors = d3.schemeTableau10, // an array of color strings, for the node groups
                        invalidation, // when this promise resolves, stop the simulation
                        familySource = ({ source }) => source,
                        familyTarget = ({ target }) => target,
                        familyDistance = ({ distance }) => distance
                    } = {}) {

                        // Compute values.
                        const N = d3.map(nodes, nodeId).map(intern);
                        const NLabel = d3.map(nodes, nodeLabel).map(intern);
                        const NGender = d3.map(nodes, nodeGender).map(intern);
                        const NC = d3.map(nodes, nodeChapter).map(intern);

                        const LF = d3.map(links, linkIsFamily).map(intern);
                        const LH = d3.map(links, linkHostilityLevel).map(intern);
                        const LA = d3.map(links, linkAction).map(intern);

                        const LS = d3.map(links, linkSource).map(intern);
                        const LT = d3.map(links, linkTarget).map(intern);
                        const LD = d3.map(links, linkDistance).map(intern);
                        const LC = d3.map(links, linkChapter).map(intern);
                        if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
                        const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
                        const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
                        const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, l => linkStrokeWidth(l));

                        //const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);
                        const FD = d3.map(family, familyDistance).map(intern);
                        const FS = d3.map(family, familySource).map(intern);
                        const FT = d3.map(family, familyTarget).map(intern);

                        // Replace the input nodes and links with mutable objects for the simulation.

                        nodesInChapter = d3.map(nodes, (_, i) => ([N[i], NC[i], NLabel[i], NGender[i]]));
                        linksInChapter = d3.map(links, (_, i) => ([LS[i], LT[i], LC[i], LA[i], LH[i], LF[i]]));
                        familyLinks = d3.map(family, (_, i) => ([FS[i], FT[i]]));

                        nodesInChapter = selectNodesInChapter(nodesInChapter);
                        linksInChapter = selectLinksInChapter(linksInChapter, nodesInChapter);
                        familyLinkInChapter = selectFamilyLinksInChapter(familyLinks, nodesInChapter);
                        familyLinkInChapter = sortLinks(familyLinkInChapter);

                        linksInChapter.sort(function (a, b) {
                            aSource = parseInt(a.source);
                            bSource = parseInt(b.source);
                            aTarget = parseInt(a.target);
                            bTarget = parseInt(b.target);
                            if (aSource > bSource) { return 1; }
                            else if (aSource < bSource) { return -1; }
                            else {
                                if (aTarget > bTarget) { return 1; }
                                if (aTarget < bTarget) { return -1; }
                                else { return 0; }
                            }
                        });
                        //any links with duplicate source and target get an incremented 'linknum'
                        for (var i = 0; i < linksInChapter.length; i++) {
                            if (i != 0 && linksInChapter[i].source == linksInChapter[i - 1].source && linksInChapter[i].target == linksInChapter[i - 1].target) {
                                linksInChapter[i].linknum = linksInChapter[i - 1].linknum + 5;
                            }
                            else { linksInChapter[i].linknum = 1; };
                        };



                        // Compute default domains.
                        if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

                        // Construct the scales.
                        const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

                        // Construct the forces.
                        const forceNode = d3.forceManyBody();
                        const forceLink = d3.forceLink(linksInChapter).id(({ index: i }) => nodesInChapter[i].id);
                        const forceFamilyLink = d3.forceLink(familyLinkInChapter).id(({ index: i }) => nodesInChapter[i].id).distance(5).strength(0.05);
                        if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
                        if (linkStrength !== undefined) {
                            forceLink.strength(linkStrength);
                            forceFamilyLink.strength(linkStrength);
                        }

                        const simulation = d3.forceSimulation(nodesInChapter)
                            .force("link", forceLink)
                            .force("link", forceFamilyLink)
                            .force("charge", forceNode)
                            .force("center", d3.forceCenter(xCenter, yCenter))
                            .on("tick", ticked);

                        svg
                            // .attr("viewBox", [-width / 2, -height / 2, width, height])
                            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

                        const link = svg.append("g")
                            .attr("class", "links")
                            //  .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
                            .attr("fill", "transparent")
                            .attr("stroke-linecap", linkStrokeLinecap)
                            .selectAll("path")
                            .data(linksInChapter)
                            .join("path")
                            .attr("stroke", function (d) {

                                if (d.isFamily == 1)
                                    return "transparent"
                                if (d.chapter < chapterNumber)
                                    return "gray"
                                if (d.hostilityLevel == 0)
                                    return "green"
                                if (d.hostilityLevel == 1)
                                    return "white"
                                if (d.hostilityLevel == 2)
                                    return "orange"
                                if (d.hostilityLevel == 3)
                                    return "red"
                            })
                            // .attr("stroke-width", link => linkStrokeWidth(link))
                            .attr("stroke-width", function (d) {
                                // console.log(d.chapter + " " + parseInt(d.chapter) + " " + typeof(d.chapter));
                                if (parseInt(d.chapter) == chapterNumber)
                                    return 8;
                                else return 3;
                            })
                            .attr("stroke-opacity", function (d) {
                                // console.log(d.chapter + " " + parseInt(d.chapter) + " " + typeof(d.chapter));
                                if (parseInt(d.chapter) == chapterNumber)
                                    return 0.84;
                                else return 0.4;
                            })
                            .on("mouseover", function (d) {
                                if (d.srcElement.__data__.chapter == chapterNumber) {
                                    console.log(d)
                                    var azione = d.srcElement.__data__.action;
                                    var source = d.srcElement.__data__.source;
                                    var target = d.srcElement.__data__.target;
                                    var isFamily = d.srcElement.__data__.isFamily;
                                    if (!isFamily) {
                                        var edgeInfo = d3.select("#graph");
                                        edgeInfo.append("rect")
                                            .attr("class", "edgeAction")
                                            .attr("id", "nodeInfo")
                                            .attr("x", "56%")
                                            .attr("y", "7%")
                                            .attr("width", () => {
                                                var text = edgeInfo.append("text")
                                                .attr("class", "edgeAction")
                                                .attr("id", "edgeActionText")
                                                .text(source.label + " --> " + azione + " --> " + target.label)
                                                .attr("x", "57%")
                                                .attr("y", "10%")
                                                .style("font-size", "20px");
                                                var bbox = text.node().getBBox();
                                                return bbox.width + 40;
                                            })
                                            .attr("height", 50)
                                            .style("fill", "gray");
                                        edgeInfo.append("text")
                                            .attr("class", "edgeAction")
                                            .text(source.label + " ---> " + azione + " ---> " + target.label)
                                            .attr("x", "58%")
                                            .attr("y", "10%")
                                            .style("font-size", "20px");
                                    }
                                }
                            })
                            .on("mouseleave", d => {
                                console.log("ciao")
                                svg.selectAll(".edgeAction").remove();
                            });
                        // d3.select(this).remove();
                        // .link.append("text")
                        // .text("Ao");
                        // console.log(azione);
                        // console.log(source);
                        // console.log(target);



                        const node = svg.append("g")
                            .attr("class", "nodes")
                            .attr("fill", nodeFill)
                            .attr("stroke", nodeStroke)
                            .attr("stroke-opacity", nodeStrokeOpacity)
                            .attr("stroke-width", nodeStrokeWidth)
                            .selectAll("circle")
                            .data(nodesInChapter)
                            .join("circle")
                            .attr("r", nodeRadius)
                            .on("click", d => {
                                reset();
                                var svgNodeInfo = d3.select("#graph")
                                    .append("svg")
                                    .attr("id", "svgNodeInfo")
                                    .attr("width", 1000)
                                    .attr("height", 250)
                                    .attr("y", 350);
                                svgNodeInfo.append("rect")
                                    .attr("class", "info")
                                    .attr("id", "nodeInfo")
                                    .attr("x", "7%")
                                    .attr("width", 400)
                                    .attr("height", 300)
                                    .style("fill", "gray");
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text("Name: " + d.srcElement.__data__.label)
                                    .attr("x", "8%")
                                    .attr("y", "10%")
                                    .style("font-size", "20px");
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text("ID: " + d.srcElement.__data__.id)
                                    .attr("x", "8%")
                                    .attr("y", "20%")
                                    .style("font-size", "20px");
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text("Gender: " + d.srcElement.__data__.gender)
                                    .attr("x", "8%")
                                    .attr("y", "30%")
                                    .style("font-size", "20px")
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text(function () {
                                        if (d.srcElement.__data__.chapter != "")
                                            return "First appearance: " + d.srcElement.__data__.chapter + " chapter"
                                    })
                                    .attr("x", "8%")
                                    .attr("y", "40%")
                                    .style("font-size", "20px")
                                svgNodeInfo.append("image")
                                    .attr("class", "info")
                                    .attr('x', "8%")
                                    .attr('y', "50%")
                                    .attr('width', 100)
                                    .attr('height', 100)
                                    .attr('href', 'assets/' + d.srcElement.__data__.id + '.jpeg')
                                svgNodeInfo.append("rect")
                                    .attr("class", "button")
                                    .attr("id", "resetButton")
                                    .attr("x", "30%")
                                    .attr("y", "60%")
                                    .attr("width", 40)
                                    .attr("height", 30)
                                    .style("fill", "white")
                                    .on("click", reset);
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text("Reset")
                                    .attr("x", "32%")
                                    .attr("y", "70%")
                                    .style("font-size", "20px");


                                svg.style("box-shadow", "0 0 0 1600px rgba(0,0,0,0.65)");
                            })

                        var options = d3.select("#graph");
                        options.append("rect")
                            .attr("class", "options")
                            .attr("id", "options")
                            .attr("x", "75%")
                            .attr("y", "7%")
                            .attr("width", 350)
                            .attr("height", 250)
                            .style("fill", "gray");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("How to interact with graph:")
                            .attr("x", "76%")
                            .attr("y", "12%")
                            .style("font-size", "25px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("Click a node to show cahracter")
                            .attr("x", "76%")
                            .attr("y", "16%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("informations.")
                            .attr("x", "76%")
                            .attr("y", "18%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("Hover with mouse on a link")
                            .attr("x", "76%")
                            .attr("y", "21%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("to show link informations.")
                            .attr("x", "76%")
                            .attr("y", "23%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("Scroll with mouse over the graph")
                            .attr("x", "76%")
                            .attr("y", "26%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("to zoom it")
                            .attr("x", "76%")
                            .attr("y", "28%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("Drag the graph and move it")
                            .attr("x", "76%")
                            .attr("y", "31%")
                            .style("font-size", "20px");
                        options.append("text")
                            .attr("class", "optionsText")
                            .text("along the screen")
                            .attr("x", "76%")
                            .attr("y", "33%")
                            .style("font-size", "20px");


                        svg.call(d3.zoom()
                            .scaleExtent([1 / 2, 8])
                            .on("zoom", zoomGraph));

                        setWidthScaleDomainAndRange(nodesInChapter);
                        setHeightScaleDomainAndRange(nodesInChapter);

                        //if (L) link.attr("stroke", ({ index: i }) => L[i]);
                        if (G) node.attr("fill", ({ index: i }) => color(G[i]));
                        if (T) node.append("title").text(({ index: i }) => T[i]);
                        if (invalidation != null) invalidation.then(() => simulation.stop());

                        function intern(value) {
                            return value !== null && typeof value === "object" ? value.valueOf() : value;
                        }

                        function ticked() {
                            link
                                .attr("d", function (d) {
                                    var dx = d.target.x - d.source.x,
                                        dy = d.target.y - d.source.y,
                                        dr = 1000 / d.linknum;  //linknum is defined above
                                    return "M " + d.source.x + "," + d.source.y + " Q " + (d.source.x + d.target.x)/2 + " " + (d.source.y + d.target.y)/2 + ", "/* + d.target.x + " " + d.target.y + ", " */ + d.target.x + " " + d.target.y;
                                })
                                .attr("hostilityLevel", function (d) {
                                    return d.hostilityLevel;
                                });

                            node
                                .attr("cx", d => (d.x))
                                .attr("cy", d => (d.y));
                        }

                        function zoomGraph(event) {
                            node.attr("transform", event.transform);
                            link.attr("transform", event.transform);
                        }

                        function displayNames(d) {
                            //console.log(d);

                            svg.append("rect").attr("x", "5.7%").attr("y", 300).attr("width", 400).attr("height", 200).style("fill", "white")
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



                    chart = ForceGraph({ nodes, links, family }, {
                        nodeId: d => d.id,
                        nodeGroup: d => d.group,
                        nodeTitle: d => `${d.id}\n${d.group}`,
                        width,
                        height,
                    });

                    document.body.addEventListener("change", updateGraph);
                });
            });
        });
    });
}

init();
