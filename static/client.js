document.addEventListener('DOMContentLoaded', (event) => {
    const socket = io();

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const packetInfoDiv = document.getElementById('packet-info');
    const downTXT = document.getElementById('down-txt-btn'); //download txt button
    const downGraph = document.getElementById('down-graph-btn') //download img button
    //filters---------
    const filterSelect = document.getElementById('filters');
    const filterInput = document.querySelector('input[aria-label="Search"]');
    const applyFilterBtn = document.getElementById('apply-filter-btn');

    let capturedPackets = [];
    let filteredPackets = [];
    let protocolInteractions = {};

    const protocolCounts = {
        'TCP': 0,
        'UDP': 0,
        'FTP': 0,
        'HTTP': 0,
        'HTTPS': 0,
        'ICMP': 0,
        'Other': 0
    };

    // Heatmap Data Structure
    let heatmapData = [];
    const heatmapInterval = 5;
    const maxTime = 60; 
    const numIntervals = Math.ceil(maxTime / heatmapInterval);

    for (let i = 0; i < numIntervals; i++) {
        heatmapData.push({
            x: i * heatmapInterval,
            y: 0 // y represents packet count
        });
    }

    //Histogram
    const ctx = document.getElementById('protocolChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(protocolCounts),
            datasets: [{
                label: 'Protocol Count',
                data: Object.values(protocolCounts),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    //Heatmap
    const htx = document.getElementById('heatmap').getContext('2d');
    const heatmap = new Chart(htx, {
        type: 'scatter', // Using scatter plot to simulate heatmap
        data: {
            datasets: [{
                label: 'Packet Count Over Time',
                data: heatmapData,
                backgroundColor: (context) => {
                    const value = context.dataset.data[context.dataIndex].y;
                    const alpha = value / 10; // Adjust intensity
                    return `rgba(255, 99, 132, ${alpha})`;
                },
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                pointRadius: 20,
                pointHoverRadius: 25
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    },
                    min: 0,
                    max: maxTime,
                    ticks: {
                        stepSize: heatmapInterval // 1 unit = 5 seconds
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Packet Count'
                    }
                }
            }
        }
    });

    //protocol interaction map
    function drawProtocolInteractionMap() {
        d3.select("#protocol-interaction-map").select("svg").remove();
        const nodes = Object.keys(protocolInteractions).map(protocol => ({ id: protocol }));
        const links = [];
    
        Object.keys(protocolInteractions).forEach(srcProtocol => {
            Object.keys(protocolInteractions[srcProtocol]).forEach(dstProtocol => {
                links.push({
                    source: srcProtocol,
                    target: dstProtocol,
                    value: protocolInteractions[srcProtocol][dstProtocol]
                });
            });
        });
    
        const width = 600;
        const height = 400;
    
        const svg = d3.select("#protocol-interaction-map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));
    
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", d => Math.sqrt(d.value))
            .attr("stroke", "#999");
    
        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 10)
            .attr("fill", "#69b3a2")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
    
        const label = svg.append("g")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("dy", -3)
            .attr("text-anchor", "middle")
            .text(d => d.id);
    
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
    
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
    
            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
    
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
    
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
    
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
    
    // Call drawProtocolInteractionMap when you want to render the graph
    

    startBtn.addEventListener('click', () => {
        fetch('/start_capturing', { method: 'POST' })
            .then(response => response.text())
            .then(message => {
                //alert(message);
                startBtn.classList.add('disabled');
                stopBtn.classList.remove('disabled');
                downTXT.classList.add('disabled');
                downGraph.classList.add('disabled')
                packetInfoDiv.innerHTML = '';
                filteredPackets = [];
                capturedPackets = [];
                protocolInteractions = {}; // Reset interactions
                for (let key in protocolCounts) {
                    protocolCounts[key] = 0;
                }
                chart.data.datasets[0].data = Object.values(protocolCounts);
                chart.update();
                heatmap.update();
            });
    });

    stopBtn.addEventListener('click', () => {
        fetch('/stop_capturing', { method: 'POST' })
            .then(response => response.text())
            .then(message => {
                //alert(message);
                startBtn.classList.remove('disabled');
                stopBtn.classList.add('disabled');
                downTXT.classList.remove('disabled');
                downGraph.classList.remove('disabled');
                console.log(protocolInteractions)
                //drawProtocolInteractionMap();
            });
    });

    downTXT.addEventListener('click', () => {
        window.location.href = '/download_txt';
    });

    downGraph.addEventListener('click', () => {
        window.location.href = '/download_graph';
    });

    function applyFilter(packetInfo) {
        const filterType = filterSelect.value;
        const filterValue = filterInput.value.trim().toLowerCase();

        if(!filterValue) return true; //if no filter is applied return all packets

        switch (filterType) {
            case 'protocol':
                return packetInfo.protocol.toLowerCase() === filterValue;
            case 'src':
                return packetInfo.src.toLowerCase() === filterValue;
            case 'dst':
                return packetInfo.dst.toLowerCase() === filterValue;
            case 'length':
                return true;
            default:
                return true;
        }
    }

    function updatePackageDisplay() {
        packetInfoDiv.innerHTML=''
        let packetsToDisplay = filteredPackets;

        if(filterSelect.value === 'length') {
            packetsToDisplay.sort((a, b) => b.length - a.length);
        }

        packetsToDisplay.forEach(packetInfo => {
            const packetElement = document.createElement('div');
            packetElement.textContent = JSON.stringify(packetInfo, null, 2);
            packetInfoDiv.appendChild(packetElement);
        });
    }

    function updateHeatmap(packetInfo) {
        const currentTime = Math.floor(packetInfo.time);
        const intervalIndex = Math.floor((currentTime % maxTime) / heatmapInterval);
        heatmapData[intervalIndex].y += 1; // Increment packet count for the time slot
        heatmap.update();
    }

    function recordInteraction(srcProtocol, dstProtocol) {
        console.log(`Recording interaction: ${srcProtocol} -> ${dstProtocol}`);
        
        if (!protocolInteractions[srcProtocol]) {
            protocolInteractions[srcProtocol] = {};
        }
        if (!protocolInteractions[srcProtocol][dstProtocol]) {
            protocolInteractions[srcProtocol][dstProtocol] = 0;
        }
        protocolInteractions[srcProtocol][dstProtocol] += 1;
    }
    socket.on('capturing_stopped', (packets) => {
        capturedPackets = packets; // Store all captured packets
        filteredPackets = packets.filter(applyFilter);
        updatePackageDisplay();
    });

    socket.on('new_packet', (packetInfo) => {
        protocolCounts[packetInfo.protocol] += 1;
        chart.data.datasets[0].data = Object.values(protocolCounts);
        chart.update();

        capturedPackets.push(packetInfo);

        if(applyFilter(packetInfo)) {
            filteredPackets.push(packetInfo);
            updatePackageDisplay();
        }

        updateHeatmap(packetInfo);
        console.log(packetInfo)
        // Record interaction between source and destination protocol
        recordInteraction(packetInfo.srcProtocol, packetInfo.dstProtocol);

        //const packetElement = document.createElement('div');
        //packetElement.textContent = JSON.stringify(packetInfo, null, 2);
        //packetInfoDiv.appendChild(packetElement);
    });

    //Reapply filters when user clicks apply filter button
    applyFilterBtn.addEventListener('click', () => {
        filteredPackets = capturedPackets.filter(applyFilter);
        updatePackageDisplay();
    });
});
