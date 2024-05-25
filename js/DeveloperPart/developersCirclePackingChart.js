// setup the dimesnions of the circle packing chart
const marginDev = { top:10, right: 40, bottom: 60, left:100 }
const widthDev = 700 - marginDev.left -marginDev.right
const heightDev = 700 - marginDev.top - marginDev.bottom

//variable for developer graph
var currentDeveloperSelected = ""

// to know if the graph is currently play
var isPlayingDeveloper = false;

// Create the SVG container for the circle packing chart
const devCircleChart = d3.select("#developer_circle_packing_chart").append("svg")
    .attr("viewBox", `0 0 ${widthDev + marginDev.left + marginDev.right} ${heightDev + marginDev.top + marginDev.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", "translate(" + marginDev.left + "," + marginDev.top + ")");

// create a tooltip for the circular packing chart
var TooltipDev = d3.select("#developer_circle_packing_chart")
    .append("div")
    .style("z-index", "10")
    .style("position", "absolute")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("background-color", "black")
    .style("color", "white")
    .style("font-family", "'SF Pixelate', sans-serif")
    .style("font-size", "10pt")
    .style("margin", "5px")
    .attr("pointer-events", "none")
    .style("left", "100px")
    .style("top", "100px");

// import the data form the json file
d3.json("data/games_by_year_and_developers.json", function(error, data) {
    if(error) {
        console.log('Error when loading the data for the developer circular packing chart : ', error);
        return;
    }

    // extract the criteria for the developer evolution
    var criteriaDevEvolution = document.getElementById("developer_evolution_criteria")
        .oninput = function() {
            //re-draw the evolution graph
            drawDevEvolutionChart(data)
        }
    // obtains the criteria in which the list of games will be ranked
    var criteriaDevTop = document.getElementById("developer_list_games_criteria")
        .oninput = function() {
            //re-draw the list of games relative to the developer
            drawListGamesDeveloper(data)
    }

    //draw initial graph
    drawGraphDev(data)
    
    // retrieve the slider of the years
    var sliderOutputDev = document.getElementById("year_developer_displayed")
    var yearSliderDev = document.getElementById("year_developer_slider")
        .oninput = function() {
            // display the year currently displayed
            sliderOutputDev.innerHTML = this.value;
            drawGraphDev(data);
        }

    // retrieve the selector of the number of developers displayed
    var nbDeveloperSelectorDev= document.getElementById("nb_developer_displayed_selector")
        .oninput = function() {
            drawGraphDev(data);
        }

    // upadte every 3 s the displaying of the graph if isPlayingDeveloper is activated
    setInterval(function() { return upadteGraphDisplayinyOnPlayDev(data); }, 3000)
})

// Play Button change on click
function onClickPlayButtonDev() {
    if(document.getElementById("year_developer_slider").value < document.getElementById("year_developer_slider").max || isPlayingDeveloper) {
        isPlayingDeveloper  = !isPlayingDeveloper
        document.getElementById("developer_play_button").innerText = isPlayingDeveloper ? "Pause" : "Play"
    }
}

// Updadte the graph displaying if the play button is activated
function upadteGraphDisplayinyOnPlayDev(data) {
    const currentYear = Number(document.getElementById("year_developer_slider").value)
    if(isPlayingDeveloper) {
        if(currentYear >= document.getElementById("year_developer_slider").max-1) {
            isPlayingDeveloper = false
            document.getElementById("developer_play_button").innerText = "Play"
        }
        // to evict the bug when moveing the side bar during the animation.
        if(currentYear >= document.getElementById("year_developer_slider").min && currentYear <= document.getElementById("year_developer_slider").max - 1) {
            document.getElementById("year_developer_displayed").innerHTML = currentYear + 1
            document.getElementById("year_developer_slider").value = currentYear + 1
            // re draw the graph
            drawGraphDev(data)
        }
    }
}

function drawGraphDev(data) {
    var graphData = []
    var dataForYear = data[String(document.getElementById("year_developer_slider").value)]
    for (let key in dataForYear) {
        graphData.push({Developers : [key], Number_Of_Games : dataForYear[key].length})
    }
    // sort the data
    graphData.sort(function (x, y) {
        return d3.ascending(x.Number_Of_Games, y.Number_Of_Games);
    });

    // select only the nbItemsDisplayed minimum elements(such that if there is less elements to show than expected, tehre is no error)
    const startIndex = Math.min(graphData.length, document.getElementById("nb_developer_displayed_selector").value)
    graphData = graphData.slice(graphData.length-startIndex, graphData.length)

    const max_Value = graphData[graphData.length-1].Number_Of_Games

    // edit the title of the graph
    document.getElementById("developer_graph_title")
        .textContent = "Number of Video Games Realeased by Developer in "+String(document.getElementById("year_developer_slider").value)

    // remove past graph
    devCircleChart.selectAll("*").remove()

    // size scale by developers
    var size = d3.scaleLinear()
        .domain([0, Math.max(graphData.values)])
        .range([1, 50])

    // show the name of the developers and the number of games released by this developer when the mouse is over to the corresponding circle
    var mouseMoveOnCircle = function(elem) {
        TooltipDev
            .html('<u>' + elem.Developers + '</u>' + "<br>" + elem.Number_Of_Games + " Games Realeased");
    }

    // set the opacity of the tootlptip to see relative information corresponding to the circle the mouse is present to. 
    var mouseOverCircle = function(elem) {
        TooltipDev
            .style("opacity", 1);
    }

    // remove the opacity of the tooltip when the mouse leave the circle
    var mouseLeaveCircle = function(elem) {
        TooltipDev
            .style("opacity", 0);
    }

    // on mouse click change the current developer selected + change the color circle + reset the color of the other circle
    var mouseClick = function(elem) {
        // reset the color of all the circle
        node.style("fill", '#69b3aa')
        // change the color of the bar
        d3.select(this).style("fill", '#003366')
        // save the developer selected
        currentDeveloperSelected = elem.Developers
        // draw a new evolution graph
        drawDevEvolutionChart(data)
        // draw the list f games relative to the developer
        drawListGamesDeveloper(data)
        // show the right content of the visualization
        document.getElementById("developer_right_no_selected").style.display = "none"
        document.getElementById("developer_right_selected").style.display = "initial"
        return;
    }

    // create the circle for each developer 
    var node = devCircleChart.append("g")
        .selectAll("g")
        .data(graphData)
        .enter()
        .append("circle")
            .attr("class", "node")
            .attr("r", function(elem){ return elem.Number_Of_Games*100/max_Value})
            .attr("cx", widthDev / 2)
            .attr("cy", heightDev / 2)
            .style("fill", "#69b3aa")
            .style("fill-opacity", 0.8)
            .attr("stroke", "black")
            .style("stroke-width", 1)
            .on("mouseover", mouseOverCircle)
            .on("mousemove", mouseMoveOnCircle)
            .on("mouseleave", mouseLeaveCircle)
            .on("click", mouseClick)
            //used to darg a circle and change is position
            .call(d3.drag() // call specific function when circle is dragged
                .on("start", startDragCircle)
                .on("drag", dragCircle)
                .on("end", endDragCircle));
    
    // add text label to indicate the developer
    var textsDev = devCircleChart.append("g")
        .selectAll("g")
        .data(graphData)
        .enter()
        .append("text")
            .attr("x", widthDev/2)
            .attr("y", (heightDev-10)/2)
            .attr("dy", "0.35em")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("font-family", "arial")
            .style("font-weight", "bold")
            .style("fill", "#3c3d28")
            .text(function(elem) {
                var index = Math.min(String(elem.Developers).length, 10)
                if(index < String(elem.Developers).length) {
                    return String(elem.Developers).substring(0, index) + "...";
                }
                return elem.Developers;
            })
            .style("font-size", function(elem) { return (elem.Number_Of_Games *25/max_Value) + "px"; });
    
    // add text label to indicate the number of games realeased
    var textsGamesRealeased = devCircleChart.append("g")
        .selectAll("g")
        .data(graphData)
        .enter()
        .append("text")
            .attr("x", widthDev/2)
            .attr("y", (heightDev+10)/2)
            .attr("dy", "0.35em")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("font-family", "arial")
            .style("foont-size", function(elem) {String(0.01/elem.Number_Of_Games)+"px"})
            .style("fill", "#3c3d28")
            .text(function(elem) {
                return String(elem.Number_Of_Games);
            })
            .style("font-size", function(elem) { return (elem.Number_Of_Games *25/max_Value) + "px"; });
    
    // add forces forces between each nodes
    var simulation = d3.forceSimulation()
        // attraction to the center of the circle area
        .force("center", d3.forceCenter().x(widthDev/2).y(heightDev/2))
        // nodes are attracted one each other
        .force("charge", d3.forceManyBody().strength(0.1))
        // force that avoird that the circles overlapp
        .force("collide", d3.forceCollide().strength(.2).radius(function(elem) { return elem.Number_Of_Games*100/max_Value + 5; }).iterations(1));

    
    // apply the previous forces to all the nodes and upadtaes the nodes psotions
    // once the force algorithm has converge, the node stop to move
    simulation.nodes(graphData)
        .on("tick", function(elem) {
            //update the position of the circle
            node.attr("cx", function(elem){ return elem.x; })
                .attr("cy", function(elem){ return elem.y; })
            // update the postion of the developer's text
            textsDev.attr("x", function(elem){ return elem.x; })
                .attr("y", function(elem){ return elem.y - elem.Number_Of_Games*20/max_Value; })
            // upadte the postion of the nuber of games realeased text
            textsGamesRealeased.attr("x", function(elem){ return elem.x; })
                .attr("y", function(elem){ return elem.y + elem.Number_Of_Games*20/max_Value; })
        });
    
    //FUNCTIONS TO DRAG A CIRCLE//
    function startDragCircle(elem) {
        if (!d3.event.active) {
            simulation.alphaTarget(.03).restart()
        }
        elem.fx = elem.x
        elem.fy = elem.y
    }

    function dragCircle(elem) {
        elem.fx = d3.event.x
        elem.fy = d3.event.y
    }

    function endDragCircle(elem) {
        if (!d3.event.active) {
            simulation.alphaTarget(.03)
        }
        elem.fx = null
        elem.fy = null
    }
}