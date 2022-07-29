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
var svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

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


                    function drawGraphUsageGuide(){
                        var howToInteractWithGraph = d3.select("#graph").append("g").attr("id", "howToInteractWithGraph");
                        howToInteractWithGraph.append("rect")
                            .attr("class", "options")
                            .attr("id", "options")
                            .attr("x", "75%")
                            .attr("y", "7%")
                            .attr("width", "20%")
                            .attr("height", 550)
                            .style("fill", "#999");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("How to interact with graph:")
                            .attr("x", "76%")
                            .attr("y", "12%")
                            .style("font-size", "30px")
                            .style("font-weight", 700);
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("Click a node to show character")
                            .attr("x", "76%")
                            .attr("y", "16%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("informations.")
                            .attr("x", "76%")
                            .attr("y", "18%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("Hover with mouse on a link")
                            .attr("x", "76%")
                            .attr("y", "22%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("to show link informations.")
                            .attr("x", "76%")
                            .attr("y", "24%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("Scroll with mouse over the graph")
                            .attr("x", "76%")
                            .attr("y", "28%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("to zoom it.")
                            .attr("x", "76%")
                            .attr("y", "30%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("Drag the graph and move it")
                            .attr("x", "76%")
                            .attr("y", "34%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("around the screen.")
                            .attr("x", "76%")
                            .attr("y", "36%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("Hover with mouse on a node")
                            .attr("x", "76%")
                            .attr("y", "40%")
                            .style("font-size", "20px");
                        howToInteractWithGraph.append("text")
                            .attr("class", "optionsText")
                            .text("to show all connected nodes.")
                            .attr("x", "76%")
                            .attr("y", "42%")
                            .style("font-size", "20px");
                    }


                    function reset() {
                        svg.selectAll(".info").remove();
                        svg.selectAll("#svgNodeInfo").remove();
                        d3.select(this).remove();
                        svg.style("box-shadow", "0 0 0 0px rgba(0,0,0,0.65)");
                        drawGraphUsageGuide();
                        drawLegend();
                    }

                    function isFamily(actions) {
                        var parental_actions = [];

                        actions.forEach(function (azione) {
                            if (azione["isFamily"] == 1) {
                                parental_actions.push(azione["action"]);
                            }
                        });

                        var families = [];
                        edgesData.forEach(function (general_actions) {
                            if (parental_actions.indexOf(general_actions["action"]) != -1) {

                                if (families.length == 0) {
                                    family = [];
                                    family.push(general_actions["source"]);
                                    family.push(general_actions["target"]);
                                    families.push(family);
                                }

                                else {
                                    var aggiunto = 0;
                                    for (var i in families) {
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
                        for (var i in families) {
                            if (families[i].indexOf(id_character) != -1) {
                                return i;
                            }
                        }

                        var alone = families.length + parseInt(id_character);

                        return alone;
                    }

                    function createclique(families) {
                        var edges = [];
                        for (var i in families) {

                            for (var j in families[i]) {
                                var source = families[i][j];

                                for (var h in families[i]) {
                                    var target = families[i][h]
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
                        var source_family = found_family(families, source);
                        var target_family = found_family(families, target);
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

                        var families = isFamily(actions);

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

                        var familyEdges = createclique(families);

                        result[0] = characterNodes;
                        result[1] = characterEdges;
                        result[2] = familyEdges;
                        return result;
                    }


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
                        reset();
                        chapterNumber = parseInt(document.querySelector('#rangeField').value);
                        svg.selectAll(".nodes").remove();
                        svg.selectAll(".links").remove();
                        chart = ForceGraph({ nodes, links, family }, {
                            nodeId: d => d.id,
                            nodeGroup: d => d.group,
                            nodeTitle: d => `${d.label}`,
                            width,
                            height: 600,
                        });
                    }

                    function selectNodesInChapter(nodesInChapter) {
                        var temp = []
                        for (var i in nodesInChapter) {
                            var nodeChapter = nodesInChapter[i][1];
                            if (nodeChapter == null || nodeChapter <= chapterNumber) {
                                temp.push({ id: nodesInChapter[i][0], chapter: nodesInChapter[i][1], label: nodesInChapter[i][2], gender: nodesInChapter[i][3] });
                            }
                        }
                        return temp;
                    }

                    function selectLinksInChapter(linksInChapter, nodesInChapter) {
                        var temp = [];
                        var nodesIds = [];

                        for (var i in nodesInChapter) {
                            var nodesIC = parseInt(nodesInChapter[i].id)
                            nodesIds.push(nodesIC)
                        }

                        for (var i in linksInChapter) {

                            var source = linksInChapter[i][0];
                            var target = linksInChapter[i][1];
                            var chapter = linksInChapter[i][2];
                            var action = linksInChapter[i][3];
                            var hostilityLevel = linksInChapter[i][4];
                            var isFamily = linksInChapter[i][5];

                            if (linksInChapter[i][2] <= chapterNumber && (nodesIds.indexOf(parseInt(source)) != -1) && (nodesIds.indexOf(parseInt(target)) != -1)) {
                                temp.push({ source: source, target: target, chapter: chapter, action: action, hostilityLevel: hostilityLevel, isFamily: isFamily });
                            }
                        }
                        return temp;
                    }

                    function selectFamilyLinksInChapter(familyLinksInChapter, nodesInChapter) {
                        var temp = [];
                        var nodesIds = [];

                        for (var i in nodesInChapter) {
                            var nodesIC = parseInt(nodesInChapter[i].id)
                            nodesIds.push(nodesIC)
                        }

                        for (var i in familyLinksInChapter) {

                            var source = familyLinksInChapter[i][0]
                            var target = familyLinksInChapter[i][1]

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

                    function openNodeInfos(d){
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
                                    .text("Name: ")
                                    .attr("x", "8%")
                                    .attr("y", "10%")
                                    .style("font-size", "20px")
                                    .style("font-weight", 700)
                                    .append("tspan")
                                    .text(d.srcElement.__data__.label)
                                    .style("font-weight", 300);
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text("ID: ")
                                    .style("font-weight", 700)
                                    .attr("x", "8%")
                                    .attr("y", "20%")
                                    .style("font-size", "20px")
                                    .append("tspan")
                                    .text(d.srcElement.__data__.id)
                                    .style("font-weight", 300);
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text("Gender: ")
                                    .attr("x", "8%")
                                    .attr("y", "30%")
                                    .style("font-size", "20px")
                                    .style("font-weight", 700)
                                    .append("tspan")
                                    .text(d.srcElement.__data__.gender)
                                    .style("font-weight", 300);
                                svgNodeInfo.append("text")
                                    .attr("class", "info")
                                    .text(() => {
                                        if (d.srcElement.__data__.chapter != "")
                                            return "First appearance: ";
                                    })
                                    .attr("x", "8%")
                                    .attr("y", "40%")
                                    .style("font-size", "20px")
                                    .style("font-weight", 700)
                                    .append("tspan")
                                    .text(function () {
                                        if (d.srcElement.__data__.chapter != "")
                                            return "chapter " + d.srcElement.__data__.chapter;
                                    })
                                    .style("font-weight", 300);
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
                                    .text("Close")
                                    .attr("x", "32%")
                                    .attr("y", "70%")
                                    .style("font-size", "20px");

                                svg.style("box-shadow", "0 0 0 1600px rgba(0,0,0,0.65)");
                    }

                    function defineLinksColor(link){
                        if (link.isFamily == 1)
                            return "transparent"
                        if (link.chapter < chapterNumber)
                            return "#B1B1B1"
                        if (link.hostilityLevel == 0)
                            return "green"
                        if (link.hostilityLevel == 1)
                            return "white"
                        if (link.hostilityLevel == 2)
                            return "orange"
                        if (link.hostilityLevel == 3)
                            return "red"
                    }

                    // links are drawn as curved paths between nodes,
                    // through the intermediate nodes
                    function positionLink(d) {
                        var offset = 30;

                        var midpoint_x = (d.source.x + d.target.x) / 2;
                        var midpoint_y = (d.source.y + d.target.y) / 2;

                        var dx = (d.target.x - d.source.x);
                        var dy = (d.target.y - d.source.y);

                        var normalise = Math.sqrt((dx * dx) + (dy * dy));

                        var offSetX = dx != 0 ? midpoint_x + offset*(dy/normalise) : midpoint_x + offset;
                        var offSetY = dy != 0 ? midpoint_y - offset*(dx/normalise) : midpoint_y + offset;

                        return "M " + d.source.x + "," + d.source.y +
                            " Q " + offSetX + "," + offSetY +
                            " " + d.target.x + "," + d.target.y;
                    }

                    function drawLegend(){
                        // select the svg area
                        var g = d3.select("#graph").append("g").attr("id", "legend");

                        g.append("rect").attr("x", "7%").attr("y", 60).attr("width", 350).attr("height", 200).style("fill", "#999");
                        // Handmade legend
                        g.append("text").attr("x", "7.5%").attr("y", 100).text("Color -> Hostility level").style("font-size", "30px").style("font-weight", 700).attr("alignment-baseline", "left");
                        g.append("rect").attr("x", "9%").attr("y", 130).attr("width", 23).attr("height", 7).style("fill", "white");
                        g.append("rect").attr("x", "9%").attr("y", 160).attr("width", 23).attr("height", 7).style("fill", "green");
                        g.append("rect").attr("x", "9%").attr("y", 190).attr("width", 23).attr("height", 7).style("fill", "orange");
                        g.append("rect").attr("x", "9%").attr("y", 220).attr("width", 23).attr("height", 7).style("fill", "red");
                        g.append("rect").attr("x", "9%").attr("y", 250).attr("width", 23).attr("height", 3).style("fill", "gray");
                        g.append("text").attr("x", "11%").attr("y", 130).text("Neutral action").style("font-size", "20px").attr("alignment-baseline", "middle");
                        g.append("text").attr("x", "11%").attr("y", 160).text("Good action").style("font-size", "20px").attr("alignment-baseline", "middle");
                        g.append("text").attr("x", "11%").attr("y", 190).text("Bad action").style("font-size", "20px").attr("alignment-baseline", "middle");
                        g.append("text").attr("x", "11%").attr("y", 220).text("Very bad action").style("font-size", "20px").attr("alignment-baseline", "middle");
                        g.append("text").attr("x", "11%").attr("y", 250).text("Past chapters action").style("font-size", "20px").attr("alignment-baseline", "middle");
                    }

                    function drawLinkInfos(link){
                        var data = link.srcElement.__data__;
                        if (data.chapter == chapterNumber) {
                            var azione = data.action;
                            var source = data.source;
                            var target = data.target;
                            var isFamily = data.isFamily;
                            if (!isFamily) {
                                var edgeInfo = d3.select("#graph");
                                edgeInfo.append("rect")
                                    .attr("class", "edgeAction")
                                    .attr("id", "nodeInfo")
                                    .attr("x", "40%")
                                    .attr("y", "7%")
                                    .attr("width", () => {
                                        var text = edgeInfo.append("text")
                                            .attr("class", "edgeAction")
                                            .attr("id", "edgeActionText")
                                            .text(function (d) {
                                                if (azione == "sibling")
                                                    return source.label + " and " + target.label + " are sibling.";
                                                if (azione == "descent")
                                                    return source.label + " discends from " + target.label + ".";
                                                if (azione == "marriage")
                                                    return source.label + " and " + target.label + " marry."
                                                if (azione == "fostering")
                                                    return source.label + " supports " + target.label + "."
                                                if (azione == "betrothal")
                                                    return source.label + " declares his love to " + target.label + "."
                                                if (azione == "inheritance")
                                                    return source.label + " inherits " + target.label + "."
                                                if (azione == "succession")
                                                    return source.label + " succedes " + target.label + "."
                                                if (azione == "placed in command")
                                                    return source.label + " places in command " + target.label + "."
                                                if (azione == "request assistance")
                                                    return source.label + " requests assistance to " + target.label + "."
                                                if (azione == "offer assistance")
                                                    return source.label + " offers assistance to " + target.label + "."
                                                if (azione == "provide information")
                                                    return source.label + " provides informations to " + target.label + "."
                                                if (azione == "discover information")
                                                    return source.label + " discovers informations and refers to " + target.label + "."
                                                if (azione == "invitation")
                                                    return source.label + " invites " + target.label + "."
                                                if (azione == "giftgiving")
                                                    return source.label + " gives a present to " + target.label + "."
                                                if (azione == "accusation")
                                                    return source.label + " blames " + target.label + "."
                                                if (azione == "summons")
                                                    return source.label + " summons " + target.label + "."
                                                if (azione == "lying")
                                                    return source.label + " lies to " + target.label + "."
                                                if (azione == "insult")
                                                    return source.label + " insults " + target.label + "."
                                                if (azione == "threat")
                                                    return source.label + " threats " + target.label + "."
                                                if (azione == "intervention")
                                                    return source.label + " intervenes in " + target.label + "'s stuff."
                                                if (azione == "challenge")
                                                    return source.label + " challenges " + target.label + "."
                                                if (azione == "hostility_non-lethal")
                                                    return source.label + " is in non-lethal hostility with " + target.label + "."
                                                if (azione == "hostility_lethal")
                                                    return source.label + " is in lethal hostility with " + target.label + "."
                                                if (azione == "conversation_neutral")
                                                    return source.label + " converse with " + target.label + "."
                                                if (azione == "death_neutral")
                                                    return source.label + " kills neutrally " + target.label + "."
                                                if (azione == "request information")
                                                    return source.label + " requests informations to " + target.label + "."
                                                if (azione == "name giving")
                                                    return source.label + " gives a name to " + target.label + "."
                                                if (azione == "suicide")
                                                    return source.label + " commits suicide (" + target.label + " dies)."
                                                if (azione == "ownership")
                                                    return source.label + " owns " + target.label + "."
                                            })
                                            .attr("x", "41%")
                                            .attr("y", "10%")
                                            .style("font-size", "20px");
                                        var bbox = text.node().getBBox();
                                        return bbox.width + 40;
                                    })
                                    .attr("height", 50)
                                    .style("fill", "#999");
                            }
                        }
                    }


















                    function ForceGraph({ nodes, links, family }, {
                            nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
                            nodeLabel = d => d.label,
                            nodeGender = d => d.gender,
                            nodeGroup, // given d in nodes, returns an (ordinal) value for color
                            nodeGroups, // an array of ordinal values representing the node groups
                            nodeTitle = d => d.label, // given d in nodes, a title string
                            nodeStrokeOpacity = 1, // node stroke opacity
                            nodeRadius = 10, // node radius, in pixels
                            nodeStrength,
                            nodeChapter = ({ chapter }) => chapter,
                            linkSource = ({ source }) => source, // given d in links, returns a node identifier string
                            linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
                            linkDistance = ({ distance }) => distance,
                            linkStrokeOpacity = (link) => parseInt(link["chapter"]) == chapterNumber ? 1 : 0.2, // link stroke opacity
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

                        var nodesInChapter = d3.map(nodes, (_, i) => ([N[i], NC[i], NLabel[i], NGender[i]]));
                        var linksInChapter = d3.map(links, (_, i) => ([LS[i], LT[i], LC[i], LA[i], LH[i], LF[i]]));
                        var familyLinks = d3.map(family, (_, i) => ([FS[i], FT[i]]));

                        var nodesInChapter = selectNodesInChapter(nodesInChapter);
                        var linksInChapter = selectLinksInChapter(linksInChapter, nodesInChapter);
                        var familyLinkInChapter = selectFamilyLinksInChapter(familyLinks, nodesInChapter);
                        var familyLinkInChapter = sortLinks(familyLinkInChapter);

                        linksInChapter.sort(function (a, b) {
                            var aSource = parseInt(a.source);
                            var bSource = parseInt(b.source);
                            var aTarget = parseInt(a.target);
                            var bTarget = parseInt(b.target);
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

                        svg.attr("style", "max-width: 100%; height: auto; height: intrinsic;");

                        const link = svg.append("g")
                            .attr("class", "links")
                            .attr("fill", "transparent")
                            .attr("stroke-linecap", linkStrokeLinecap)
                            .selectAll("path")
                            .data(linksInChapter)
                            .join("path")
                            .attr("stroke", l => defineLinksColor(l))
                            .attr("stroke-width", function (d) {
                                if (parseInt(d.chapter) == chapterNumber)
                                    return 8;
                                else return 3;
                            })
                            .attr("stroke-opacity", function (d) {
                                if (parseInt(d.chapter) == chapterNumber)
                                    return 1;
                                else return 0.2;
                            })
                            .on("mouseover", d => {
                                drawLinkInfos(d);
                            })
                            .on("mouseleave", () => {
                                svg.selectAll(".edgeAction").remove();
                            });

                        // build a dictionary of nodes that are linked
                        var linkedByIndex = {};
                        links.forEach(function(d) {
                            if(d.isFamily == 0 && d.chapter <= chapterNumber){
                                linkedByIndex[d.source + "," + d.target] = 1;
                            }
                        });

                        // check the dictionary to see if nodes are linked
                        function isConnected(a, b) {
                            return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id] || a.id == b.id;
                        }

                        // fade nodes on hover
                        function mouseOver(opacity) {
                            return function(d) {
                                // check all other nodes to see if they're connected
                                // to this one. if so, keep the opacity at 1, otherwise
                                // fade
                                var thisOpacity = 1;
                                var d = d.srcElement.__data__;
                                circles.style("stroke-opacity", function(o) {
                                    thisOpacity = isConnected(d, o) ? 1 : opacity;
                                    return thisOpacity;
                                });
                                circles.style("fill-opacity", function(o) {
                                    thisOpacity = isConnected(d, o) ? 1 : opacity;
                                    return thisOpacity;
                                });
                                // also style link accordingly
                                link.style("stroke-opacity", function(o) {
                                    return o.source === d || o.target === d ? linkStrokeOpacity : opacity;
                                });
                                link.style("stroke", function(o){
                                    return o.source === d || o.target === d ? defineLinksColor(o) : "#ddd";
                                });
                            };
                        }

                        function mouseOut() {
                            circles.style("stroke-opacity", nodeStrokeOpacity);
                            circles.style("fill-opacity", 1);
                            link.style("stroke-opacity", linkStrokeOpacity);
                            link.style("stroke", l => defineLinksColor(l));
                        }
                    
                        var node = svg
                            .append("g")
                            .attr("id", "nodes")
                            .attr("class", "nodes")
                            .attr("width", width)
                            .attr("height", height)
                            .selectAll(".node")
                            .data(nodesInChapter)
                            .join("g")
                            .attr("class", "node");

                        var circles = node.append("circle")
                            .attr("id", d => "node" + d.id)
                            .attr("r", nodeRadius)
                            .on("click", d => {
                                reset();
                                openNodeInfos(d);
                            })
                            .on("mouseover", mouseOver(.2))
                            .on("mouseout", mouseOut);
                            
                        var nodeTitle = node.append("title").text(d => d.label);
                        var nodeText = node.append("text")
                                .attr("dx", 12)
                                .attr("dy", ".35em")
                                .text(d => d.label)
                                .style("stroke", "black")
                                .style("stroke-width", 0.5)
                                .style("fill", "gray");
                            
                        if (invalidation != null) invalidation.then(() => simulation.stop());


                        svg.call(d3.zoom()
                            .scaleExtent([1 / 2, 8])
                            .on("zoom", zoomGraph));

                        function intern(value) {
                            return value !== null && typeof value === "object" ? value.valueOf() : value;
                        }

                        function ticked() {

                            link.attr("d", positionLink)
                                .attr("hostilityLevel", function (d) {
                                    return d.hostilityLevel;
                                });

                            circles.attr("cx", d => d.x)
                                .attr("cy", d => d.y);
                            nodeText.attr("x", d => d.x)
                                .attr("y", d => d.y);
                        }

                        function zoomGraph(event) {
                            node.attr("transform", event.transform);
                            link.attr("transform", event.transform);
                        }

                        function displayNames(d) {
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

                    var chart = ForceGraph({ nodes, links, family }, {
                        nodeId: d => d.id,
                        nodeGroup: d => d.group,
                        nodeTitle: d => `${d.label}`,
                        width,
                        height,
                    });

                    document.body.addEventListener("change", updateGraph);

                    drawLegend();
                    drawGraphUsageGuide();
                });
            });
        });
    });
}

init();
