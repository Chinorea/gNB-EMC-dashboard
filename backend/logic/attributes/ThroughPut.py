from .Attribute import Attribute
import time
from collections import deque

class ThroughPut(Attribute):

    def __init__(self):
        super().__init__()
        self.coreUl = ""
        self.coreDl = ""
        # history deques with fixed maxlen=100
        self.coreUl_hist = deque(maxlen=100)
        self.coreDl_hist = deque(maxlen=100)
        self.iface = "eth0"

    def refresh(self):
        self.measure_throughput(self.iface)

    def read_bytes(iface, dir="tx"):
        path = f"/sys/class/net/{iface}/statistics/{dir}_bytes"
        with open(path, "r") as f:
            return int(f.read().strip())

    def measure_throughput(self, iface:str):
        interval = 1.0
        # read initial counters
        tx1 = self.read_bytes(iface, "tx")
        rx1 = self.read_bytes(iface, "rx")
        time.sleep(interval)
        tx2 = self.read_bytes(iface, "tx")
        rx2 = self.read_bytes(iface, "rx")

        # delta bytes → bits/sec → Mbps
        tx_mbps = (tx2 - tx1) * 8 / interval / 1e6
        rx_mbps = (rx2 - rx1) * 8 / interval / 1e6

        self.coreDl = round(tx_mbps,2)
        self.coreUl = round(rx_mbps,2)

    def print_core_throughput(self):
        print(f"Core Throughput: DL: {self.coreDl} Mbps   UL: {self.coreUl} Mbps")


