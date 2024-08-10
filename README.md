# Real-Time Network Traffic Analyzer

## Project Overview

This project is a **Real-Time Network Traffic Analyzer** that captures network packets on a specified network interface, visualizes the captured data in real-time using a histogram, and provides detailed information about each packet. Users can filter the captured packets based on various attributes like protocol, source IP, destination IP, and packet length.

## Features

- **Real-time Packet Capture:** Continuously captures network packets using Python's Scapy library.
- **Protocol Histogram Visualization:** Visualizes the distribution of protocols in the captured traffic using Chart.js.
- **Detailed Packet Information:** Displays information about each captured packet including timestamp, source, destination, protocol, source port, destination port, and packet length.
- **Filter Functionality:** Allows users to filter packets by protocol, source IP, destination IP, and length (in descending order).
- **Download Options:** Users can download the captured packet data as a text file and the protocol histogram as a PNG image.

## Tech Stack

- **Frontend:** HTML, CSS (Bootstrap), JavaScript (Socket.IO)
- **Backend:** Node.js, Express, Socket.IO
- **Packet Capture:** Python (Scapy)
- **Deployment:** Kali Linux

## Installation & Setup

### Prerequisites

- **Node.js & npm**: Ensure you have Node.js installed on your system.
- **Python**: Ensure Python 3.x is installed.
- **Scapy**: Install Scapy using `pip install scapy`.

### Clone the Repository

```bash
git clone https://github.com/yourusername/network-traffic-analyzer.git
cd network-traffic-analyzer
```

### Install Dependencies

1. **For Node.js Backend:**

    ```bash
    npm install
    ```


### Running the Application

1. **Start the Backend Server:**

    ```bash
    node server.js
    ```

3. **Access the Web Interface:**

    Open your web browser and navigate to `http://localhost:5000`.

### Usage

- **Start Capturing Packets:** Click the "Start Capturing" button on the web interface.
- **Stop Capturing Packets:** Click the "Stop Capturing" button to halt packet capturing.
- **Apply Filters:** Select a filter from the dropdown, enter the filter value, and click "Apply" to filter the packets displayed.
- **Download Data:** Click "Download txt file" to download the captured packets in a text file and "Download Graph" to download the protocol histogram as a PNG image.

### Project Structure

```plaintext
.
├── packet_capture.py       # Python script for capturing network packets
├── server.js               # Node.js server script
├── static
│   ├── styles.css          # CSS styles
│   ├── client.js           # JavaScript for front-end logic
├── index.html          # HTML file for the web interface
└── README.md               # Project documentation
```

### Filters

1. **Protocol:** Filters packets by the specified protocol (e.g., TCP, UDP, HTTP, etc.).
2. **Source:** Filters packets by the specified source IP address.
3. **Destination:** Filters packets by the specified destination IP address.
4. **Length (Descending):** Sorts packets by length in descending order.

### Troubleshooting

- **Error: ENOENT: no such file or directory:** Ensure that the file paths for saving the packet data and visualization are correctly specified.
- **Packet Data Not Displayed:** Check if the packet capture script is running and if the correct network interface is being used.
- **Graph Not Updating:** Ensure that the packets are being captured and that the data is being correctly processed and sent to the frontend.

### Future Enhancements

- **Additional Filters:** Implement more advanced filtering options based on other packet attributes.
- **Enhanced Visualization:** Introduce more visualization options like bar charts and line graphs.
- **Multi-Interface Support:** Allow simultaneous capturing from multiple network interfaces.

## Contributing

Feel free to contribute by submitting a pull request or opening an issue. Contributions are welcome to improve the functionality, UI/UX, and documentation of the project.

## Acknowledgments

- **Scapy** for packet capturing and manipulation.
- **Socket.IO** for enabling real-time communication between the server and the client.
