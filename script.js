document.addEventListener("DOMContentLoaded", function () {
    fetch("films.json")  // Load the JSON file
        .then(response => response.json())
        .then(data => {
            window.filmData = data; // Store global copy for filtering
            populateTable(data);
            generateBubbleChart(data);  // Call the function to generate the bubble chart
        });

    document.getElementById("search").addEventListener("input", function () {
        filterMovies();
    });
});

// Function to populate table with film data
function populateTable(data) {
    const tbody = document.querySelector("#filmsTable tbody");
    tbody.innerHTML = ""; // Clear previous content

    data.forEach(film => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><a href="${film.wiki_link}" target="_blank">${film.title}</a></td>
            <td>${film.release_year}</td>
            <td>${film.directors}</td>
            <td>$${film.box_office.toLocaleString()}</td>
            <td>${film.country}</td>
            <td>${film.running_time}</td>
            <td>${film.actors}</td>
        `;
        tbody.appendChild(row);
    });
}

// Function to filter movies based on search input
function filterMovies() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const rows = document.querySelectorAll("#filmsTable tbody tr");

    rows.forEach(row => {
        const title = row.cells[0].textContent.toLowerCase();
        const director = row.cells[2].textContent.toLowerCase();
        const actors = row.cells[5].textContent.toLowerCase();

        row.style.display = (title.includes(searchValue) || director.includes(searchValue) || actors.includes(searchValue)) ? "" : "none";
    });
}

// Function to sort table columns
function sortTable(n) {
    const table = document.getElementById("filmsTable");
    let rows, switching, i, x, y, shouldSwitch, direction = "asc", switchCount = 0;
    switching = true;

    while (switching) {
        switching = false;
        rows = table.rows;

        for (i = 1; i < rows.length - 1; i++) {
            shouldSwitch = false;
            x = rows[i].cells[n].textContent.toLowerCase();
            y = rows[i + 1].cells[n].textContent.toLowerCase();

            // Determine sorting type (numeric or text)
            let isNumeric = (n === 3 || n === 5); // Box Office (column 3) and Running Time (column 5) are numeric

            if (isNumeric) {
                x = parseFloat(x.replace(/[^0-9.]/g, "")) || 0; // Extract numbers only
                y = parseFloat(y.replace(/[^0-9.]/g, "")) || 0;
            }

            if ((direction === "asc" && x > y) || (direction === "desc" && x < y)) {
                shouldSwitch = true;
                break;
            }
        }
        
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchCount++;
        } else if (switchCount === 0 && direction === "asc") {
            direction = "desc";
            switching = true;
        }
    }
}


// Update labels dynamically
function updateYearLabel() {
    document.getElementById("yearLabel").innerText = document.getElementById("yearRange").value;
}

function updateSizeLabel() {
    document.getElementById("sizeLabel").innerText = document.getElementById("bubbleSize").value;
}

// Apply filters and regenerate the bubble chart
function applyFilters() {
    let minFilms = parseInt(document.getElementById("minFilms").value);
    let maxYear = parseInt(document.getElementById("yearRange").value);
    let bubbleScale = parseInt(document.getElementById("bubbleSize").value);

    let filteredData = window.filmData.filter(film => film.release_year <= maxYear);

    generateBubbleChart(filteredData, minFilms, bubbleScale);
}

// Generate Bubble Chart with filters
function generateBubbleChart(data, minFilms = 3, bubbleScale = 3) {
    let canvas = document.getElementById("actorBubbleChart");

    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    let ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Unable to get canvas context!");
        return;
    }

    let actorCounts = {};

    // Count occurrences of each actor
    data.forEach(film => {
        let actors = film.actors.split(", ");
        actors.forEach(actor => {
            actorCounts[actor] = (actorCounts[actor] || 0) + 1;
        });
    });

    let actorData = Object.entries(actorCounts)
        .map(([actor, count]) => ({ actor, count, size: count * bubbleScale }))
        .filter(actor => actor.count >= minFilms) // Filter actors with at least `minFilms`
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Show top 15 actors

    let chartData = {
        labels: actorData.map(a => a.actor),
        datasets: [{
            label: "Most Starred Actors",
            data: actorData.map(a => ({ x: actorData.indexOf(a), y: a.count, r: a.size })),
            backgroundColor: "rgb(255, 167, 242)"
        }]
    };

    // Destroy previous chart instance (if exists) to avoid overlay issues
    if (window.actorChart) {
        window.actorChart.destroy();
    }

    window.actorChart = new Chart(ctx, {
        type: "bubble",
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: {
                    title: { display: true, text: "Number of Films" },
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            let actorIndex = tooltipItem.dataIndex;
                            return actorData[actorIndex].actor + ": " + actorData[actorIndex].count + " films";
                        }
                    }
                }
            }
        }
    });
}