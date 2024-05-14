// setup the dimesnions of the bar chart
const margin = { top:10, right: 40, bottom: 60, left:100 }
const width = 710 - margin.left -margin.right
const height = 700 - margin.top - margin.bottom

// Create the SVG container for the bar chart
const barChart = d3.select("#genres_bar_chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("data/games_by_year_and_genre.json", function(error, data) {
    if(error) {
        console.log('Error when loading the data for the genres bar chart : ', error);
        return;
    }
    // set default value of year and nb genres displayed
    localStorage.setItem("year_genres", 2000)
    localStorage.setItem("nb_genres_displayed", 23)
    //draw initial graph
    drawGraph(data)
    
    // retrive the slider of the years
    var sliderOutput = document.getElementById("year_genre_displayed")
    var yearSlider = document.getElementById("year_genre_slider")
        .oninput = function() {
            // display the year currently displayed
            sliderOutput.innerHTML = this.value;
            localStorage.setItem("year_genres", this.value)
            drawGraph(data);
        }

    // retrive the slector of the number of genres displayed
    var nbGenresSelector= document.getElementById("nb_genre_displayed_selector")
        .oninput = function() {
            localStorage.setItem("nb_genres_displayed", this.value);
            drawGraph(data);
        }
    
    //default criteria 
    localStorage.setItem("top_3_genres_criteria", "Plays")
    // extract the ranking top-3 games criteria
    var criteria = document.getElementById("genres_games_top_3_criteria")
        .oninput = function() {
            // save the new criteria
            localStorage.setItem("top_3_genres_criteria", this.value)
            //update the top-3 ranking
            updateTop3GamesGenreRanking(data)
        }
})

function drawGraph(data) {
    const nbItemsDisplayed = localStorage.getItem("nb_genres_displayed");
    const year = localStorage.getItem("year_genres");
    var graphData = []
    var dataForYear = data[String(year)]
    for (let key in dataForYear) {
        graphData.push({Genre : [key], Number_Of_Games : dataForYear[key].length})
    }
    // sort the data
    graphData.sort(function (x, y) {
        return d3.ascending(x.Number_Of_Games, y.Number_Of_Games);
    });

    // select only the nbItemsDisplayed first elements
    const startIndex = Math.min(graphData.length, nbItemsDisplayed)
    graphData = graphData.slice(graphData.length-startIndex, graphData.length)

    // edit the title of the graph
    document.getElementById("genre_graph_title")
        .textContent = "Number of Video Games by Genre in "+String(year)

    // remove past graph
    barChart.selectAll("*").remove()

    // set the x scale
    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(graphData, function(elem) { return elem.Number_Of_Games; })]);
    // set the y scale
    const y = d3.scaleBand()
        .range([height, 0])
        .padding(0.1)
        .domain(graphData.map(function (elem) { return elem.Genre}));

    // create the x and y axes
    const xAxis = d3.axisBottom(x)
        .ticks(5)
        .tickSize(0);
    const yAxis = d3.axisLeft(y)
        .tickSize(0)
        .tickPadding(10);
    
    // add grid lines
    barChart.selectAll("line.vertical-grid")
        .data(x.ticks(5))
        .enter()
        .append("line")
        .attr("class", "vertical-grid")
        .attr("x1", function (elem) { return x(elem); })
        .attr("y1", 0)
        .attr("x2", function (elem) { return x(elem); })
        .attr("y2", height)
        .style("stroke", "gray")
        .style("stroke-width", 0.5)
        .style("stroke-dasharray", "3 3");

    // create the bars
    var bars = barChart.selectAll(".bar")
        .data(graphData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", function (elem) { return y(elem.Genre); })
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", function (elem) { return x(elem.Number_Of_Games); })
        .style("fill", '#96a5b9')
    
    //add click listner on bar
    bars.on("click", function(elem) { 
        // reset the color of all the bars
        barChart.selectAll(".bar").style("fill", '#96a5b9')
        // change the color of the bar
        d3.select(this).style("fill", '#003366')
        // save the genre selected
        localStorage.setItem("genre_selected", elem.Genre)
        updateGenreDescription(); 
        //save the new list of games displayed in the top-3 ranking
        updateTop3GamesGenreRanking(data);
        return;
    });

    // add the x and y axes to the bar chart
    barChart.append('g')
        .attr("class", "x axis")
        .style("font-size", "10px")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .call(g => g.select(".domain").remove());

    barChart.append('g')
        .attr("class", "y axis")
        .style("font-size", "8px")
        .call(yAxis)
        .selectAll("path")
        .style("stroke-width", "1.75px");
    
    barChart.selectAll(".y.axis .tick text")
        .text(function (elem) { return elem[0].toUpperCase(); });

    // add labels to the end of each bars
    barChart.selectAll(".label")
        .data(graphData)
        .enter()
        .append("text")
        .attr("x", function (elem) { return x(elem.Number_Of_Games) + 5; })
        .attr("y", function (elem) { return y(elem.Genre) + y.bandwidth() / 2; })
        .attr("dy", ".35em")
        .style("font-family", "arial")
        .style("foont-size", "0.1px")
        .style("font-weight", "bold")
        .style("fill", "#3c3d28")
        .text( function (elem) { return elem.Number_Of_Games; });
}

function updateGenreDescription(genre) {
    // edit the title of the description section
    document.getElementById("genre_description_title")
        .textContent = localStorage.getItem("genre_selected")+" Genre"
}

function updateTop3GamesGenreRanking(data) {
    const rankingCriteria = localStorage.getItem("top_3_genres_criteria")
    const yearSelected = localStorage.getItem("year_genres");
    const genreSelected = localStorage.getItem("genre_selected");
    const gamesArray = data[yearSelected][genreSelected]
    // sort the games according to the criteria
    gamesArray.sort(function (x, y) {
        return d3.ascending(x[rankingCriteria], y[rankingCriteria]);
    });
    //slect the top 3
    const startIndex = Math.max(0, gamesArray.length - 3);
    const top3Games = gamesArray.slice(startIndex, gamesArray.length);
    //update games rankings displaying
    
    //top 1
    document.getElementById("games_genre_rank_1_title")
        .textContent = top3Games[2]["Title"]
    document.getElementById("games_genre_rank_1_genres")
        .innerHTML = String(top3Games[2]["Genres"]).replaceAll(',', "<br>");
    document.getElementById("games_genre_rank_1_developer")
        .innerHTML = String(top3Games[2]["Developers"]).replaceAll(',', "<br>");
    document.getElementById("games_genre_rank_1_platforms")
        .innerHTML = String(top3Games[2]["Platforms"]).replaceAll(',', "<br>");

    //top 2
    document.getElementById("games_genre_rank_2_title")
        .textContent = top3Games[1]["Title"]
    document.getElementById("games_genre_rank_2_genres")
        .innerHTML = String(top3Games[1]["Genres"]).replaceAll(',', "<br>");
    document.getElementById("games_genre_rank_2_developer")
        .innerHTML = String(top3Games[1]["Developers"]).replaceAll(',', "<br>");
    document.getElementById("games_genre_rank_2_platforms")
        .innerHTML = String(top3Games[1]["Platforms"]).replaceAll(',', "<br>");

    //top 3
    document.getElementById("games_genre_rank_3_title")
        .textContent = top3Games[0]["Title"]
    document.getElementById("games_genre_rank_3_genres")
        .innerHTML = String(top3Games[0]["Genres"]).replace(',', "<br>");
    document.getElementById("games_genre_rank_3_developer")
        .innerHTML = String(top3Games[0]["Developers"]).replace(',', "<br>");
    document.getElementById("games_genre_rank_3_platforms")
        .innerHTML = String(top3Games[0]["Platforms"]).replace(',', "<br>");
}