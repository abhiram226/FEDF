const button = document.getElementById("trackBtn");

// Load recent searches when page opens
loadRecentSearches();

button.addEventListener("click", async () => {

    const flightInput =
        document.getElementById("flightInput").value.trim();

    if (!flightInput) {
        alert("Please enter a flight number");
        return;
    }

    // Show loading state
    button.textContent = "Searching...";
    button.disabled = true;

    const apiKey = "f11512765cf2a87532a90d11d30f5c0e";
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightInput.toUpperCase()}&limit=1`;

    try {
        const res = await fetch(url);
        const json = await res.json();

        if (json.error) {
            alert("API Error: " + json.error.info);
            return;
        }

        if (!json.data || json.data.length === 0) {
            alert("Flight not found. Try a valid IATA flight number like AI302 or 6E201.");
            return;
        }

        const f = json.data[0];

        // Calculate flight duration if both times available
        let flightTime = "N/A";
        if (f.departure.scheduled && f.arrival.scheduled) {
            const dep = new Date(f.departure.scheduled);
            const arr = new Date(f.arrival.scheduled);
            const diffMs = arr - dep;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins  = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            flightTime = `${hours}h ${mins}m`;
        }

        const flightData = {
            flightNumber:  f.flight.iata  || flightInput.toUpperCase(),
            departure:     `${f.departure.airport} (${f.departure.iata})`,
            arrival:       `${f.arrival.airport}   (${f.arrival.iata})`,
            departureCode: f.departure.iata,
            arrivalCode:   f.arrival.iata,
            airline:       f.airline.name,
            flightTime:    flightTime,
            status:        f.flight_status  // "active", "landed", "scheduled", "cancelled"
        };

        updateFlightCard(flightData);
        saveRecentSearch(flightData.flightNumber);
        loadRecentSearches();

    } catch (err) {
        alert("Network error. Make sure you're running this locally or through a server.");
        console.error(err);

    } finally {
        // Restore button
        button.textContent = "Search Flight";
        button.disabled = false;
    }
});

function updateFlightCard(data) {

    document.getElementById("flightNumber").textContent =
        data.flightNumber;

    document.getElementById("departure").textContent =
        data.departure;

    // Update all arrival elements (your HTML has two #arrival IDs — update both)
    document.querySelectorAll("#arrival").forEach(el => {
        el.textContent = data.arrival;
    });

    document.getElementById("departureCode").textContent =
        data.departureCode;

    document.getElementById("arrivalCode").textContent =
        data.arrivalCode;

    document.getElementById("flightTime").textContent =
        data.flightTime;

    document.getElementById("airline").textContent =
        data.airline;

    const statusBox = document.getElementById("status");

    // Friendly status label
    const statusLabels = {
        active:    "IN FLIGHT",
        landed:    "LANDED",
        scheduled: "SCHEDULED",
        cancelled: "CANCELLED",
        diverted:  "DIVERTED",
        incident:  "INCIDENT"
    };

    statusBox.textContent =
        statusLabels[data.status] || data.status.toUpperCase();

    // Status colours
    const statusColors = {
        active:    "#16a34a",
        scheduled: "#2563eb",
        landed:    "#0891b2",
        cancelled: "#ef4444",
        diverted:  "#f59e0b",
        incident:  "#dc2626"
    };

    statusBox.style.background =
        statusColors[data.status] || "#6b7280";
}

function saveRecentSearch(flightNumber) {

    let searches =
        JSON.parse(localStorage.getItem("recentFlights")) || [];

    searches.unshift(flightNumber);
    searches = [...new Set(searches)];

    if (searches.length > 5) {
        searches = searches.slice(0, 5);
    }

    localStorage.setItem(
        "recentFlights",
        JSON.stringify(searches)
    );
}

function loadRecentSearches() {

    const list = document.getElementById("recentList");
    if (!list) return;

    list.innerHTML = "";

    let searches =
        JSON.parse(localStorage.getItem("recentFlights")) || [];

    searches.forEach(flight => {

        const li = document.createElement("li");
        li.textContent = flight;

        li.addEventListener("click", () => {
            document.getElementById("flightInput").value = flight;
        });

        list.appendChild(li);
    });
}
