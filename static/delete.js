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
    const heatmapInterval = 10; // seconds
    const maxTime = 60; // seconds
    const numIntervals = Math.ceil(maxTime / heatmapInterval);

    for (let i = 0; i < numIntervals; i++) {
        heatmapData.push({
            x: i * heatmapInterval,
            y: 0 // y represents packet count
        });
    }

    // Histogram
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

    // Heatmap
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
                    max: maxTime
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

    startBtn.addEventListener('click', () => {
        fetch('/start_capturing', { method: 'POST' })
            .then(response => response.text())
            .then(message => {
                startBtn.classList.add('disabled');
                stopBtn.classList.remove('disabled');
                downTXT.classList.add('disabled');
                downGraph.classList.add('disabled')
                packetInfoDiv.innerHTML = '';
                filteredPackets = [];
                capturedPackets = [];
                heatmapData.forEach(dataPoint => dataPoint.y = 0); // Reset heatmap data
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
                startBtn.classList.remove('disabled');
                stopBtn.classList.add('disabled');
                downTXT.classList.remove('disabled');
                downGraph.classList.remove('disabled')
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

        updateHeatmap(packetInfo); // Update heatmap with new packet
    });

    // Reapply filters when user clicks apply filter button
    applyFilterBtn.addEventListener('click', () => {
        filteredPackets = capturedPackets.filter(applyFilter);
        updatePackageDisplay();
    });
});
