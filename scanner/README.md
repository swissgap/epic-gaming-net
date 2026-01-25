# 🎮 Gaming Network Scanner

Automatischer Netzwerk-Scanner für das Gaming Command Center. Scannt das lokale Netzwerk via SNMP und sendet Live-Daten an das Dashboard.

## Features

- **Automatische Netzwerkerkennung** - Findet alle Geräte im Subnet
- **SNMP v1/v2c Support** - Sammelt Metriken von Routern, Switches, APs
- **Vendor-Erkennung** - Cisco, Ubiquiti, Netgear, MikroTik, etc.
- **Bandwidth-Monitoring** - Berechnet aktuelle Durchsatzraten
- **Latenz-Messung** - Ping-basierte Latenz für Gaming-Devices
- **Alert-Generierung** - Automatische Warnungen bei Problemen
- **API-Integration** - Sendet Daten direkt ans Command Center

## Installation

```bash
# Abhängigkeiten installieren
pip install -r requirements.txt

# Oder manuell
pip install requests pysnmp
```

## Verwendung

### Einmaliger Scan
```bash
python network_scanner.py --once
```

### Kontinuierliches Monitoring
```bash
python network_scanner.py --interval 30
```

### Mit Konfiguration
```bash
python network_scanner.py --config config.json
```

### Optionen

| Parameter | Beschreibung | Standard |
|-----------|-------------|----------|
| `--subnet` | Zu scannendes Subnet (CIDR) | Automatisch |
| `--community` | SNMP Community String | `public` |
| `--interval` | Scan-Intervall in Sekunden | 30 |
| `--once` | Nur einmal scannen | false |
| `--api-url` | API Base URL | Cloud URL |
| `--api-key` | API Key | Anon Key |
| `--config` | Pfad zur Config-Datei | - |
| `-v, --verbose` | Debug-Ausgabe | false |

## Konfigurationsdatei

Erstelle eine `config.json` basierend auf `config.example.json`:

```json
{
  "snmp_community": "public",
  "scan_interval": 30,
  "gaming_devices": {
    "switch_cluster": ["192.168.1.50", "192.168.1.51"],
    "ps5_cluster": ["192.168.1.60"]
  }
}
```

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `SCANNER_API_URL` | API Base URL |
| `SCANNER_API_KEY` | API Key für Authentifizierung |

## SNMP Setup auf Geräten

### Cisco/Netgear Switch
```
enable
configure terminal
snmp-server community public RO
```

### Ubiquiti UniFi
SNMP aktivieren im UniFi Controller unter Settings > Services

### MikroTik RouterOS
```
/snmp set enabled=yes
/snmp community set 0 name=public
```

### Linux Server (net-snmp)
```bash
apt install snmpd
echo "rocommunity public" >> /etc/snmp/snmpd.conf
systemctl restart snmpd
```

## Gesammelte Metriken

### Alle Geräte
- System Name, Description, Uptime
- Interface Status, Speed, Traffic

### Router/Gateway
- IP Forwarding Status
- TCP/UDP Statistiken

### Switches
- Port Status pro Interface
- VLAN-Informationen (wenn verfügbar)

### Access Points
- Client Count
- Channel, Signal Strength

## API Endpoints

Der Scanner sendet Daten an folgende Endpoints:

- `POST /bandwidth` - Bandwidth-Daten
- `POST /network-infrastructure` - Gerätestatus
- `POST /gaming-devices` - Latenz-Daten
- `POST /alerts` - Generierte Alerts

## Troubleshooting

### Keine Geräte gefunden
- Prüfe ob SNMP auf den Geräten aktiviert ist
- Teste mit: `snmpwalk -v2c -c public 192.168.1.1 system`

### Timeout-Fehler
- Erhöhe `--timeout` Parameter
- Prüfe Firewall-Regeln (UDP Port 161)

### Bandwidth zeigt 0
- Mindestens 2 Scans nötig für Delta-Berechnung
- Warte einen Scan-Zyklus

## Lizenz

MIT License - Frei verwendbar für private und kommerzielle Zwecke.
