import sys
import json
from scapy.all import sniff, IP, TCP, UDP, ICMP
import matplotlib.pyplot as plt
import signal

captured_packets = []

def packet_callback(packet):
    sport = None
    dport = None

    if TCP in packet:
        protocol = 'TCP'
        sport = packet[TCP].sport
        dport = packet[TCP].dport
        if (sport == 21 or dport == 21):
            protocol = 'FTP'
        elif (sport == 80 or dport == 80):
            protocol = 'HTTP'
        elif (sport == 443 or dport == 443):
            protocol = 'HTTPS'
    elif UDP in packet:
        protocol = 'UDP'
        sport = packet[UDP].sport
        dport = packet[UDP].dport
    elif ICMP in packet:
        protocol = 'ICMP'
    else:
        protocol = 'Other'

    packet_info = {
        'time': packet.time,
        'src': packet[IP].src if IP in packet else None,
        'dst': packet[IP].dst if IP in packet else None,
        'protocol': protocol,
        'sport': sport,
        'dport': dport,
        'length': len(packet)
    }
    captured_packets.append(packet_info)
    save_data_to_txt() #new line
    save_visualization() #new line
    print(json.dumps(packet_info))
    sys.stdout.flush()

def start_sniffing(interface):
    sniff(iface=interface, prn=packet_callback, store=False)

def signal_handler(sig, frame):
    save_data_to_txt()
    save_visualization()
    sys.exit(0)

def save_data_to_txt():
    with open('packets.txt', 'w') as f:
        for packet in captured_packets:
            f.write(json.dumps(packet) + '\n')
    print("Packet data saved to packets.txt")

def save_visualization():
    protocol_counts = {
        'TCP': 0,
        'UDP': 0,
        'FTP': 0,
        'HTTP': 0,
        'HTTPS': 0,
        'ICMP': 0,
        'Other': 0
    }
    for packet in captured_packets:
        protocol_counts[packet['protocol']] += 1

    plt.figure()
    plt.bar(protocol_counts.keys(), protocol_counts.values())
    plt.xlabel('Protocol')
    plt.ylabel('Number of Packets')
    plt.title('Final Network Packet Protocol Histogram')
    plt.savefig('final_visualization.png')
    print("Visualization saved to final_visualization.png")

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    interface = "eth0" 
    start_sniffing(interface)