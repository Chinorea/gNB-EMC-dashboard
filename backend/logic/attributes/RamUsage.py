from .Attribute import Attribute
from collections import deque
# Update refresh such that it stores ram usage for the most recent 100 entries
# on refresh, remove the oldest data and add the newest data
class RamUsage(Attribute):

    def __init__(self):
        super().__init__()
        self.ramUsage = ""
        self.totalRam = ""
        # history deques with fixed maxlen=100
        self.usage_history = deque(maxlen=100)


    def refresh(self):
        self.ramUsage = self.get_ram_usage()
        self.usage_history.append(self.ramUsage)


    def get_ram_usage(self):
        """
        Parse /proc/meminfo to compute used RAM percentage.
        Uses MemAvailable if present, otherwise falls back.
        """
        meminfo = {}
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                key, val = line.split(':')[0], line.split(':')[1].strip().split()[0]
                meminfo[key] = float(val)

        total = meminfo.get('MemTotal', 0.0)
        available = meminfo.get('MemAvailable',
                                meminfo.get('MemFree', 0.0)
                                + meminfo.get('Buffers', 0.0)
                                + meminfo.get('Cached', 0.0))
        used = total - available
        self.totalRam = round(total / (1024.0 * 1024.0),1)
        return round((used / total) * 100.0 if total else 0.0,1)

    def print_ram_usage(self):
        print(f"Total Ram: {self.totalRam}GiB")
        print(f"Ram Usage: {self.ramUsage}%")

    def print_ram_usage_hist(self):
        print(f"Total Ram: {self.totalRam} GiB")
        print(f"Ram Usage: {self.ramUsage}%")
        print(f"History (last {len(self.usage_history)} samples):")
        print(list(self.usage_history))
