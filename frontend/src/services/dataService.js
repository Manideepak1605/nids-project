import { DATA_MODE } from '../config/dataMode';

const ATTACK_TYPES = ['DDoS', 'Brute Force', 'SQL Injection', 'Malware', 'Normal', 'Scanning', 'Infiltration'];
const COUNTRIES = ['USA', 'China', 'Russia', 'Germany', 'Brazil', 'India', 'Japan', 'UK', 'France', 'Canada'];
const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'FTP'];
const STATUSES = ['Blocked', 'Detected', 'Mitigated', 'Analyzing'];

const generateMockEvent = () => {
    const isAttack = Math.random() > 0.4;
    const attackType = isAttack ? ATTACK_TYPES[Math.floor(Math.random() * (ATTACK_TYPES.length - 1))] : 'Normal';
    const severity = attackType === 'Normal' ? 'Info' : (Math.random() > 0.7 ? 'Critical' : (Math.random() > 0.4 ? 'High' : 'Medium'));

    return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        source_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        destination_ip: `192.168.1.${Math.floor(Math.random() * 256)}`,
        attack_type: attackType,
        severity: severity,
        protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
        port: Math.floor(Math.random() * 65535),
        country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        status: isAttack ? STATUSES[Math.floor(Math.random() * STATUSES.length)] : 'Allowed',
        // Flow metrics matching user request
        flow_duration: Math.floor(Math.random() * 100000),
        total_fwd_packets: Math.floor(Math.random() * 1000),
        total_bwd_packets: Math.floor(Math.random() * 1000),
        flow_bytes_s: (Math.random() * 500000).toFixed(2),
        flow_packets_s: (Math.random() * 500).toFixed(2),
        label: attackType
    };
};

class DataService {
    constructor() {
        this.listeners = new Set();
        this.interval = null;
        this.events = [];
        this.socket = null;
        this.blockedIps = new Set();
        this.threatStats = {
            countries: {}, // { 'USA': { count: 5, cities: { 'New York': 2 } } }
        };
    }

    start() {
        if (DATA_MODE === 'MOCK') {
            this.interval = setInterval(() => {
                const newEvent = generateMockEvent();
                this.processIncomingEvent(newEvent);
            }, Math.random() * 3000 + 1000); // 1-3 seconds
        } else {
            this.connectWebSocket();
        }
    }

    processIncomingEvent(event) {
        if (event.status === 'Blocked' || event.attack_type !== 'Normal') {
            const country = event.country || 'Unknown';
            const city = event.city || 'Unknown';

            if (!this.threatStats.countries[country]) {
                this.threatStats.countries[country] = { count: 0, cities: {} };
            }
            this.threatStats.countries[country].count += 1;
            this.threatStats.countries[country].cities[city] = (this.threatStats.countries[country].cities[city] || 0) + 1;

            if (event.status === 'Blocked') {
                this.blockedIps.add(event.source_ip);
            }
        }

        const enrichedEvent = {
            ...event,
            blocked_ips: Array.from(this.blockedIps),
            threat_stats: this.getTopThreatStats()
        };

        this.events = [enrichedEvent, ...this.events].slice(0, 100);
        this.notify(enrichedEvent);
    }

    getTopThreatStats() {
        const sortedCountries = Object.entries(this.threatStats.countries)
            .map(([name, data]) => ({
                name,
                count: data.count,
                topCity: Object.entries(data.cities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return sortedCountries;
    }

    connectWebSocket() {
        if (this.socket) return;

        this.socket = new WebSocket('ws://localhost:8000/ws');

        this.socket.onmessage = (event) => {
            const newEvent = JSON.parse(event.data);
            this.processIncomingEvent(newEvent);
        };

        this.socket.onclose = () => {
            console.log("WebSocket disconnected. Retrying in 5s...");
            this.socket = null;
            setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.socket.onerror = (err) => {
            console.error("WebSocket error:", err);
            this.socket.close();
        };
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify(data) {
        this.listeners.forEach(cb => cb(data));
    }

    getRecentEvents() {
        return this.events;
    }
}

export const dataService = new DataService();
