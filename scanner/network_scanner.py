#!/usr/bin/env python3
"""
Gaming Network Scanner - Automatisches Netzwerk-Monitoring für das Command Center
Scannt das lokale Netzwerk via SNMP und sendet Daten an die Edge Functions.
"""

import os
import sys
import json
import time
import socket
import struct
import logging
import argparse
import threading
import subprocess
from datetime import datetime
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    print("Installing requests...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

try:
    from pysnmp.hlapi import *
except ImportError:
    print("Installing pysnmp...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pysnmp"])
    from pysnmp.hlapi import *

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# SNMP OID Database - Automatisch für verschiedene Gerätetypen
# ============================================================================
SNMP_OIDS = {
    "system": {
        "sysDescr": "1.3.6.1.2.1.1.1.0",
        "sysObjectID": "1.3.6.1.2.1.1.2.0",
        "sysUpTime": "1.3.6.1.2.1.1.3.0",
        "sysContact": "1.3.6.1.2.1.1.4.0",
        "sysName": "1.3.6.1.2.1.1.5.0",
        "sysLocation": "1.3.6.1.2.1.1.6.0",
    },
    "interfaces": {
        "ifNumber": "1.3.6.1.2.1.2.1.0",
        "ifDescr": "1.3.6.1.2.1.2.2.1.2",
        "ifType": "1.3.6.1.2.1.2.2.1.3",
        "ifSpeed": "1.3.6.1.2.1.2.2.1.5",
        "ifOperStatus": "1.3.6.1.2.1.2.2.1.8",
        "ifInOctets": "1.3.6.1.2.1.2.2.1.10",
        "ifOutOctets": "1.3.6.1.2.1.2.2.1.16",
        "ifInErrors": "1.3.6.1.2.1.2.2.1.14",
        "ifOutErrors": "1.3.6.1.2.1.2.2.1.20",
    },
    "high_speed_interfaces": {
        "ifHCInOctets": "1.3.6.1.2.1.31.1.1.1.6",
        "ifHCOutOctets": "1.3.6.1.2.1.31.1.1.1.10",
        "ifHighSpeed": "1.3.6.1.2.1.31.1.1.1.15",
    },
    "ip": {
        "ipForwarding": "1.3.6.1.2.1.4.1.0",
        "ipInReceives": "1.3.6.1.2.1.4.3.0",
        "ipOutRequests": "1.3.6.1.2.1.4.10.0",
    },
    "tcp": {
        "tcpActiveOpens": "1.3.6.1.2.1.6.5.0",
        "tcpPassiveOpens": "1.3.6.1.2.1.6.6.0",
        "tcpCurrEstab": "1.3.6.1.2.1.6.9.0",
    },
    "udp": {
        "udpInDatagrams": "1.3.6.1.2.1.7.1.0",
        "udpOutDatagrams": "1.3.6.1.2.1.7.4.0",
    },
}

# Vendor-spezifische OIDs
VENDOR_OIDS = {
    "cisco": {
        "cpuUsage": "1.3.6.1.4.1.9.2.1.56.0",
        "memoryUsed": "1.3.6.1.4.1.9.9.48.1.1.1.5.1",
        "memoryFree": "1.3.6.1.4.1.9.9.48.1.1.1.6.1",
    },
    "ubiquiti": {
        "unifiApName": "1.3.6.1.4.1.41112.1.6.1.2.1.6",
        "unifiApClients": "1.3.6.1.4.1.41112.1.6.1.2.1.8",
        "unifiApChannel": "1.3.6.1.4.1.41112.1.6.1.2.1.4",
    },
    "netgear": {
        "switchModel": "1.3.6.1.4.1.4526.11.1.1.1.3.0",
        "cpuUsage": "1.3.6.1.4.1.4526.11.1.1.4.9.0",
    },
    "mikrotik": {
        "cpuLoad": "1.3.6.1.2.1.25.3.3.1.2.1",
        "totalMemory": "1.3.6.1.2.1.25.2.3.1.5.65536",
        "usedMemory": "1.3.6.1.2.1.25.2.3.1.6.65536",
    }
}

# ============================================================================
# Network Scanner Class
# ============================================================================
class NetworkScanner:
    """Scannt das Netzwerk und sammelt SNMP-Daten"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_url = config.get("api_url", "https://oeckplemwzzzjikvwxkb.supabase.co/functions/v1")
        self.api_key = config.get("api_key", "")
        self.snmp_community = config.get("snmp_community", "public")
        self.snmp_version = config.get("snmp_version", 2)
        self.scan_interval = config.get("scan_interval", 30)
        self.timeout = config.get("timeout", 2)
        self.devices: Dict[str, Dict] = {}
        self.last_octets: Dict[str, Dict] = {}
        self.last_scan_time: float = 0
        
    def get_local_network(self) -> str:
        """Ermittelt das lokale Netzwerk automatisch"""
        try:
            # Verbindung zu externem Host um lokale IP zu ermitteln
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            
            # Subnet aus IP ableiten (Annahme /24)
            parts = local_ip.split(".")
            subnet = f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"
            logger.info(f"Lokales Netzwerk erkannt: {subnet} (Gateway: {parts[0]}.{parts[1]}.{parts[2]}.1)")
            return subnet
        except Exception as e:
            logger.error(f"Fehler beim Ermitteln des Netzwerks: {e}")
            return "192.168.1.0/24"
    
    def ip_range_from_cidr(self, cidr: str) -> List[str]:
        """Generiert IP-Adressen aus CIDR-Notation"""
        try:
            network, prefix = cidr.split("/")
            prefix = int(prefix)
            
            parts = [int(p) for p in network.split(".")]
            network_int = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
            
            host_bits = 32 - prefix
            num_hosts = (1 << host_bits) - 2  # Minus Network und Broadcast
            
            ips = []
            for i in range(1, num_hosts + 1):
                ip_int = network_int + i
                ip = f"{(ip_int >> 24) & 0xFF}.{(ip_int >> 16) & 0xFF}.{(ip_int >> 8) & 0xFF}.{ip_int & 0xFF}"
                ips.append(ip)
            
            return ips
        except Exception as e:
            logger.error(f"Fehler beim Parsen von CIDR: {e}")
            return []
    
    def ping_host(self, ip: str) -> bool:
        """Prüft ob ein Host erreichbar ist"""
        try:
            param = "-n" if sys.platform == "win32" else "-c"
            timeout_param = "-w" if sys.platform == "win32" else "-W"
            
            result = subprocess.run(
                ["ping", param, "1", timeout_param, "1", ip],
                capture_output=True,
                timeout=2
            )
            return result.returncode == 0
        except:
            return False
    
    def scan_network(self, subnet: Optional[str] = None) -> List[str]:
        """Scannt das Netzwerk nach aktiven Hosts"""
        if not subnet:
            subnet = self.get_local_network()
        
        logger.info(f"Scanne Netzwerk: {subnet}")
        ips = self.ip_range_from_cidr(subnet)
        active_hosts = []
        
        with ThreadPoolExecutor(max_workers=50) as executor:
            future_to_ip = {executor.submit(self.ping_host, ip): ip for ip in ips}
            
            for future in as_completed(future_to_ip):
                ip = future_to_ip[future]
                try:
                    if future.result():
                        active_hosts.append(ip)
                        logger.debug(f"Host gefunden: {ip}")
                except Exception:
                    pass
        
        logger.info(f"Gefundene Hosts: {len(active_hosts)}")
        return sorted(active_hosts, key=lambda x: [int(p) for p in x.split(".")])
    
    def snmp_get(self, ip: str, oid: str) -> Optional[Any]:
        """Führt SNMP GET aus"""
        try:
            if self.snmp_version == 2:
                iterator = getCmd(
                    SnmpEngine(),
                    CommunityData(self.snmp_community, mpModel=1),
                    UdpTransportTarget((ip, 161), timeout=self.timeout, retries=1),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid))
                )
            else:
                iterator = getCmd(
                    SnmpEngine(),
                    CommunityData(self.snmp_community, mpModel=0),
                    UdpTransportTarget((ip, 161), timeout=self.timeout, retries=1),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid))
                )
            
            errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
            
            if errorIndication or errorStatus:
                return None
            
            for varBind in varBinds:
                return varBind[1].prettyPrint()
                
        except Exception:
            return None
    
    def snmp_walk(self, ip: str, oid: str) -> Dict[str, Any]:
        """Führt SNMP WALK aus"""
        results = {}
        try:
            if self.snmp_version == 2:
                iterator = nextCmd(
                    SnmpEngine(),
                    CommunityData(self.snmp_community, mpModel=1),
                    UdpTransportTarget((ip, 161), timeout=self.timeout, retries=1),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid)),
                    lexicographicMode=False
                )
            else:
                iterator = nextCmd(
                    SnmpEngine(),
                    CommunityData(self.snmp_community, mpModel=0),
                    UdpTransportTarget((ip, 161), timeout=self.timeout, retries=1),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid)),
                    lexicographicMode=False
                )
            
            for errorIndication, errorStatus, errorIndex, varBinds in iterator:
                if errorIndication or errorStatus:
                    break
                
                for varBind in varBinds:
                    oid_str = varBind[0].prettyPrint()
                    value = varBind[1].prettyPrint()
                    # Extrahiere Index aus OID
                    index = oid_str.split(".")[-1]
                    results[index] = value
                    
        except Exception:
            pass
        
        return results
    
    def detect_device_type(self, sys_descr: str, sys_oid: str) -> Dict[str, str]:
        """Erkennt den Gerätetyp anhand von sysDescr und sysObjectID"""
        device_info = {
            "type": "unknown",
            "vendor": "unknown",
            "model": "",
            "category": "other"
        }
        
        sys_descr_lower = sys_descr.lower() if sys_descr else ""
        
        # Vendor Detection
        if "cisco" in sys_descr_lower or "1.3.6.1.4.1.9" in (sys_oid or ""):
            device_info["vendor"] = "cisco"
        elif "ubiquiti" in sys_descr_lower or "unifi" in sys_descr_lower or "1.3.6.1.4.1.41112" in (sys_oid or ""):
            device_info["vendor"] = "ubiquiti"
        elif "netgear" in sys_descr_lower or "1.3.6.1.4.1.4526" in (sys_oid or ""):
            device_info["vendor"] = "netgear"
        elif "mikrotik" in sys_descr_lower or "routeros" in sys_descr_lower:
            device_info["vendor"] = "mikrotik"
        elif "linux" in sys_descr_lower:
            device_info["vendor"] = "linux"
        elif "windows" in sys_descr_lower:
            device_info["vendor"] = "windows"
        elif "freebsd" in sys_descr_lower or "pfsense" in sys_descr_lower or "opnsense" in sys_descr_lower:
            device_info["vendor"] = "bsd_firewall"
        
        # Device Type Detection
        if any(kw in sys_descr_lower for kw in ["switch", "switching"]):
            device_info["type"] = "switch"
            device_info["category"] = "infrastructure"
        elif any(kw in sys_descr_lower for kw in ["router", "routing", "gateway"]):
            device_info["type"] = "router"
            device_info["category"] = "infrastructure"
        elif any(kw in sys_descr_lower for kw in ["access point", "wireless", "wifi", "ap", "unifi"]):
            device_info["type"] = "access_point"
            device_info["category"] = "infrastructure"
        elif any(kw in sys_descr_lower for kw in ["firewall", "pfsense", "opnsense", "fortigate"]):
            device_info["type"] = "firewall"
            device_info["category"] = "infrastructure"
        elif any(kw in sys_descr_lower for kw in ["printer", "print"]):
            device_info["type"] = "printer"
            device_info["category"] = "other"
        elif any(kw in sys_descr_lower for kw in ["nas", "storage", "synology", "qnap"]):
            device_info["type"] = "storage"
            device_info["category"] = "server"
        elif "linux" in sys_descr_lower or "windows" in sys_descr_lower:
            device_info["type"] = "server"
            device_info["category"] = "server"
        
        device_info["model"] = sys_descr[:50] if sys_descr else ""
        
        return device_info
    
    def collect_device_data(self, ip: str) -> Optional[Dict]:
        """Sammelt alle SNMP-Daten eines Geräts"""
        logger.debug(f"Sammle Daten von {ip}")
        
        # Basis-Informationen
        sys_descr = self.snmp_get(ip, SNMP_OIDS["system"]["sysDescr"])
        if not sys_descr:
            return None
        
        sys_oid = self.snmp_get(ip, SNMP_OIDS["system"]["sysObjectID"])
        sys_name = self.snmp_get(ip, SNMP_OIDS["system"]["sysName"]) or ip
        sys_uptime = self.snmp_get(ip, SNMP_OIDS["system"]["sysUpTime"])
        
        device_info = self.detect_device_type(sys_descr, sys_oid)
        
        device_data = {
            "ip": ip,
            "name": sys_name,
            "description": sys_descr,
            "uptime": sys_uptime,
            "type": device_info["type"],
            "vendor": device_info["vendor"],
            "model": device_info["model"],
            "category": device_info["category"],
            "status": "online",
            "last_seen": datetime.now().isoformat(),
            "interfaces": [],
            "metrics": {}
        }
        
        # Interface-Daten sammeln
        if_descrs = self.snmp_walk(ip, SNMP_OIDS["interfaces"]["ifDescr"])
        if_speeds = self.snmp_walk(ip, SNMP_OIDS["interfaces"]["ifSpeed"])
        if_status = self.snmp_walk(ip, SNMP_OIDS["interfaces"]["ifOperStatus"])
        if_in_octets = self.snmp_walk(ip, SNMP_OIDS["interfaces"]["ifInOctets"])
        if_out_octets = self.snmp_walk(ip, SNMP_OIDS["interfaces"]["ifOutOctets"])
        
        # High-Speed Counter für 10G+ Interfaces
        if_hc_in = self.snmp_walk(ip, SNMP_OIDS["high_speed_interfaces"]["ifHCInOctets"])
        if_hc_out = self.snmp_walk(ip, SNMP_OIDS["high_speed_interfaces"]["ifHCOutOctets"])
        if_high_speed = self.snmp_walk(ip, SNMP_OIDS["high_speed_interfaces"]["ifHighSpeed"])
        
        total_in_bytes = 0
        total_out_bytes = 0
        
        for idx in if_descrs:
            # Bevorzuge HC-Counter wenn verfügbar
            in_octets = int(if_hc_in.get(idx, if_in_octets.get(idx, 0)) or 0)
            out_octets = int(if_hc_out.get(idx, if_out_octets.get(idx, 0)) or 0)
            
            speed = int(if_high_speed.get(idx, 0) or 0) * 1_000_000  # Mbps to bps
            if speed == 0:
                speed = int(if_speeds.get(idx, 0) or 0)
            
            status_val = if_status.get(idx, "2")
            status = "up" if status_val == "1" else "down"
            
            interface = {
                "index": idx,
                "name": if_descrs[idx],
                "speed": speed,
                "status": status,
                "in_octets": in_octets,
                "out_octets": out_octets
            }
            device_data["interfaces"].append(interface)
            
            if status == "up":
                total_in_bytes += in_octets
                total_out_bytes += out_octets
        
        # Bandwidth-Berechnung (Delta seit letztem Scan)
        current_time = time.time()
        if ip in self.last_octets and self.last_scan_time > 0:
            time_delta = current_time - self.last_scan_time
            if time_delta > 0:
                last_in = self.last_octets[ip].get("in", 0)
                last_out = self.last_octets[ip].get("out", 0)
                
                # Bits per second
                in_bps = ((total_in_bytes - last_in) * 8) / time_delta
                out_bps = ((total_out_bytes - last_out) * 8) / time_delta
                
                device_data["metrics"]["bandwidth"] = {
                    "in_bps": max(0, in_bps),
                    "out_bps": max(0, out_bps),
                    "in_mbps": max(0, in_bps / 1_000_000),
                    "out_mbps": max(0, out_bps / 1_000_000)
                }
        
        self.last_octets[ip] = {"in": total_in_bytes, "out": total_out_bytes}
        
        # Vendor-spezifische Metriken
        if device_info["vendor"] in VENDOR_OIDS:
            vendor_oids = VENDOR_OIDS[device_info["vendor"]]
            for metric_name, oid in vendor_oids.items():
                value = self.snmp_get(ip, oid)
                if value:
                    device_data["metrics"][metric_name] = value
        
        return device_data
    
    def measure_latency(self, ip: str, count: int = 5) -> Dict[str, float]:
        """Misst Latenz zu einem Host"""
        try:
            param = "-n" if sys.platform == "win32" else "-c"
            
            result = subprocess.run(
                ["ping", param, str(count), ip],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            output = result.stdout
            
            # Parse Ping-Ausgabe
            if sys.platform == "win32":
                # Windows: Average = 10ms
                import re
                match = re.search(r"Average = (\d+)ms", output)
                if match:
                    avg = float(match.group(1))
                    return {"avg": avg, "min": avg * 0.8, "max": avg * 1.2, "loss": 0}
            else:
                # Linux/Mac: rtt min/avg/max/mdev = 0.5/1.0/1.5/0.2 ms
                import re
                match = re.search(r"rtt min/avg/max/mdev = ([\d.]+)/([\d.]+)/([\d.]+)", output)
                if match:
                    return {
                        "min": float(match.group(1)),
                        "avg": float(match.group(2)),
                        "max": float(match.group(3)),
                        "loss": 0
                    }
                
                # Packet loss
                loss_match = re.search(r"(\d+)% packet loss", output)
                if loss_match:
                    return {"avg": 0, "min": 0, "max": 0, "loss": float(loss_match.group(1))}
            
        except Exception as e:
            logger.debug(f"Latenz-Messung fehlgeschlagen für {ip}: {e}")
        
        return {"avg": 0, "min": 0, "max": 0, "loss": 100}
    
    def aggregate_bandwidth_data(self) -> Dict:
        """Aggregiert Bandwidth-Daten für das Dashboard"""
        total_downstream = 0
        total_upstream = 0
        
        for ip, device in self.devices.items():
            if "bandwidth" in device.get("metrics", {}):
                bw = device["metrics"]["bandwidth"]
                total_downstream += bw.get("in_bps", 0)
                total_upstream += bw.get("out_bps", 0)
        
        return {
            "downstream": {
                "current": total_downstream / 1_000_000_000,  # Gbps
                "max": 10.0,  # 10 Gbps Max
                "unit": "Gbps"
            },
            "upstream": {
                "current": total_upstream / 1_000_000_000,
                "max": 10.0,
                "unit": "Gbps"
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def build_infrastructure_data(self) -> Dict:
        """Baut Infrastruktur-Daten für das Dashboard"""
        gateway = None
        switches = []
        access_points = []
        
        for ip, device in self.devices.items():
            dev_type = device.get("type", "unknown")
            
            device_summary = {
                "ip": ip,
                "name": device.get("name", ip),
                "status": device.get("status", "unknown"),
                "model": device.get("model", ""),
                "uptime": device.get("uptime", ""),
                "port_count": len([i for i in device.get("interfaces", []) if i.get("status") == "up"])
            }
            
            if dev_type in ["router", "firewall"] or ip.endswith(".1"):
                gateway = device_summary
            elif dev_type == "switch":
                switches.append(device_summary)
            elif dev_type == "access_point":
                access_points.append(device_summary)
        
        # Default Gateway wenn keiner gefunden
        if not gateway:
            gateway = {
                "ip": self.get_local_network().replace(".0/24", ".1"),
                "name": "Gateway",
                "status": "unknown",
                "model": "Unknown Router"
            }
        
        return {
            "gateway": gateway,
            "switches": switches,
            "access_points": access_points,
            "total_devices": len(self.devices)
        }
    
    def build_gaming_devices_data(self) -> Dict:
        """Baut Gaming-Device-Daten (Latenz-Messungen)"""
        gaming_devices = {
            "switch_cluster": [],
            "ps5_cluster": []
        }
        
        # Identifiziere Gaming-Devices (könnte durch Config erweitert werden)
        gaming_ips = self.config.get("gaming_devices", {})
        
        for device_type, ips in gaming_ips.items():
            for ip in ips:
                latency = self.measure_latency(ip)
                gaming_devices[device_type].append({
                    "ip": ip,
                    "name": self.devices.get(ip, {}).get("name", ip),
                    "ping": latency["avg"],
                    "packet_loss": latency["loss"],
                    "status": "optimal" if latency["avg"] < 20 else "warning" if latency["avg"] < 50 else "critical"
                })
        
        return gaming_devices
    
    def build_alerts_data(self) -> List[Dict]:
        """Generiert Alerts basierend auf Gerätestatus"""
        alerts = []
        
        for ip, device in self.devices.items():
            # High Bandwidth Alert
            bw = device.get("metrics", {}).get("bandwidth", {})
            if bw.get("in_mbps", 0) > 8000:  # > 8 Gbps
                alerts.append({
                    "id": f"bw-{ip}",
                    "level": "warning",
                    "message": f"Hohe Bandbreite auf {device.get('name', ip)}: {bw['in_mbps']:.1f} Mbps",
                    "source": ip,
                    "timestamp": datetime.now().isoformat()
                })
            
            # Interface Down Alert
            down_interfaces = [i for i in device.get("interfaces", []) if i.get("status") == "down"]
            if down_interfaces and device.get("type") in ["switch", "router"]:
                alerts.append({
                    "id": f"if-down-{ip}",
                    "level": "info",
                    "message": f"{len(down_interfaces)} Interface(s) down auf {device.get('name', ip)}",
                    "source": ip,
                    "timestamp": datetime.now().isoformat()
                })
        
        return alerts
    
    def send_to_api(self, endpoint: str, data: Dict) -> bool:
        """Sendet Daten an die Edge Function"""
        try:
            url = f"{self.api_url}/{endpoint}"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}" if self.api_key else "",
                "apikey": self.api_key if self.api_key else ""
            }
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                logger.debug(f"Daten erfolgreich an {endpoint} gesendet")
                return True
            else:
                logger.warning(f"API-Fehler {endpoint}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Fehler beim Senden an {endpoint}: {e}")
            return False
    
    def run_scan_cycle(self, subnet: Optional[str] = None):
        """Führt einen kompletten Scan-Zyklus durch"""
        logger.info("=" * 50)
        logger.info("Starte Scan-Zyklus")
        
        # 1. Netzwerk scannen
        active_hosts = self.scan_network(subnet)
        
        # 2. SNMP-Daten sammeln
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_ip = {executor.submit(self.collect_device_data, ip): ip for ip in active_hosts}
            
            for future in as_completed(future_to_ip):
                ip = future_to_ip[future]
                try:
                    device_data = future.result()
                    if device_data:
                        self.devices[ip] = device_data
                        logger.info(f"✓ {ip}: {device_data['name']} ({device_data['type']})")
                except Exception as e:
                    logger.debug(f"Fehler bei {ip}: {e}")
        
        self.last_scan_time = time.time()
        
        # 3. Daten aggregieren und senden
        bandwidth_data = self.aggregate_bandwidth_data()
        infrastructure_data = self.build_infrastructure_data()
        gaming_data = self.build_gaming_devices_data()
        alerts_data = self.build_alerts_data()
        
        # 4. An API senden
        self.send_to_api("bandwidth", bandwidth_data)
        self.send_to_api("network-infrastructure", infrastructure_data)
        self.send_to_api("gaming-devices", gaming_data)
        self.send_to_api("alerts", {"alerts": alerts_data})
        
        logger.info(f"Scan-Zyklus abgeschlossen: {len(self.devices)} Geräte gefunden")
        logger.info("=" * 50)
        
        return {
            "devices_found": len(self.devices),
            "bandwidth": bandwidth_data,
            "infrastructure": infrastructure_data,
            "alerts": len(alerts_data)
        }
    
    def run_continuous(self, subnet: Optional[str] = None):
        """Kontinuierlicher Scan-Loop"""
        logger.info(f"Starte kontinuierliches Monitoring (Intervall: {self.scan_interval}s)")
        
        while True:
            try:
                self.run_scan_cycle(subnet)
                time.sleep(self.scan_interval)
            except KeyboardInterrupt:
                logger.info("Monitoring gestoppt")
                break
            except Exception as e:
                logger.error(f"Fehler im Scan-Loop: {e}")
                time.sleep(5)


# ============================================================================
# Main Entry Point
# ============================================================================
def main():
    parser = argparse.ArgumentParser(description="Gaming Network Scanner für Command Center")
    parser.add_argument("--subnet", help="Zu scannendes Subnet (z.B. 192.168.1.0/24)")
    parser.add_argument("--community", default="public", help="SNMP Community String")
    parser.add_argument("--interval", type=int, default=30, help="Scan-Intervall in Sekunden")
    parser.add_argument("--once", action="store_true", help="Nur einmal scannen")
    parser.add_argument("--api-url", help="API Base URL")
    parser.add_argument("--api-key", help="API Key für Authentifizierung")
    parser.add_argument("--config", help="Pfad zur Konfigurationsdatei")
    parser.add_argument("--verbose", "-v", action="store_true", help="Ausführliche Ausgabe")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Konfiguration laden
    config = {
        "api_url": args.api_url or os.environ.get("SCANNER_API_URL", "https://oeckplemwzzzjikvwxkb.supabase.co/functions/v1"),
        "api_key": args.api_key or os.environ.get("SCANNER_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lY2twbGVtd3p6emppa3Z3eGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTA1MjMsImV4cCI6MjA4NDg2NjUyM30.aYhxGKgUbfQJV3TghF3JMq0tQ8EUf6N3XsFTQWyAwcg"),
        "snmp_community": args.community,
        "scan_interval": args.interval,
        "gaming_devices": {
            "switch_cluster": [],  # IPs der Nintendo Switches
            "ps5_cluster": []      # IPs der PS5s
        }
    }
    
    # Config-Datei laden wenn vorhanden
    if args.config and os.path.exists(args.config):
        with open(args.config) as f:
            file_config = json.load(f)
            config.update(file_config)
    
    scanner = NetworkScanner(config)
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║       🎮 Gaming Network Scanner - Command Center             ║
╠══════════════════════════════════════════════════════════════╣
║  Automatisches SNMP-Monitoring für dein Gaming-Netzwerk      ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    if args.once:
        result = scanner.run_scan_cycle(args.subnet)
        print(f"\nErgebnis: {json.dumps(result, indent=2)}")
    else:
        scanner.run_continuous(args.subnet)


if __name__ == "__main__":
    main()
