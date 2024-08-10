document.addEventListener('DOMContentLoaded', (event) => {
    const socket = io();

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const packetInfoDiv = document.getElementById('packet-info');
    const downTXT = document.getElementById('down-txt-btn');
    const downGraph = document.getElementById('down-graph-btn')
    const protocolCounts = {
        'TCP': 0,
        'UDP': 0,
        'FTP': 0,
        'HTTP': 0,
        'HTTPS': 0,
        'ICMP': 0,
        'Other': 0
    };
    const filter = document.getElementById('filters')

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
                for (let key in protocolCounts) {
                    protocolCounts[key] = 0;
                }
                chart.data.datasets[0].data = Object.values(protocolCounts);
                chart.update();
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
                downGraph.classList.remove('disabled')
            });
    });

    downTXT.addEventListener('click', () => {
        window.location.href = '/download_txt';
    });

    downGraph.addEventListener('click', () => {
        window.location.href = '/download_graph';
    });


    socket.on('new_packet', (packetInfo) => {
        protocolCounts[packetInfo.protocol] += 1;
        chart.data.datasets[0].data = Object.values(protocolCounts);
        chart.update();

        const packetElement = document.createElement('div');
        packetElement.textContent = JSON.stringify(packetInfo, null, 2);
        packetInfoDiv.appendChild(packetElement);
    });
});
