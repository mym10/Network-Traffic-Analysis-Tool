const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let packetCaptureProcess = null;
let capturedPackets = [];

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle start capturing request
app.post('/start_capturing', (req, res) => {
    if (!packetCaptureProcess) {
        capturedPackets = [];
        packetCaptureProcess = spawn('python3', ['packet_capture.py']);

        packetCaptureProcess.stdout.on('data', (data) => {
            const packets = data.toString().trim().split('\n');
            packets.forEach(packet => {
                try {
                    const packetInfo = JSON.parse(packet);
                    capturedPackets.push(packetInfo);
                    io.emit('new_packet', packetInfo);
                } catch (err) {
                    console.error('Error parsing packet data:', err);
               }
            });
        });

        packetCaptureProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        packetCaptureProcess.on('close', (code) => {
            console.log(`Packet capture process exited with code ${code}`);
            packetCaptureProcess = null;
        });

        res.send('Started packet capturing.');
    } else {
        res.send('Packet capturing is already running.');
    }
});

// Handle stop capturing request
app.post('/stop_capturing', (req, res) => {
    if (packetCaptureProcess) {
        process.kill(packetCaptureProcess.pid);
        packetCaptureProcess = null;
        io.emit('capturing_stopped', capturedPackets); //send all the captured packets to client
        res.send('Stopped packet capturing.');
    } else {
        res.send('No packet capturing process running.');
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.get('/download_txt', (req, res) => {
    const filePath = path.join(__dirname, 'packets.txt');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }
        res.setHeader('Content-Disposition', 'attachment; filename="packet_capture.txt"');
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

app.get('/download_graph', (req, res) => {
    const filePath = path.join(__dirname, 'final_visualization.png');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }
        res.setHeader('Content-Disposition', 'attachment; filename="graph.png"');
        res.setHeader('Content-Type', 'image/png');
        res.send(data);
    });
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
