from .Attribute import Attribute

class RamUsage(Attribute):

    def __init__(self):
        super().__init__()
        self.ramUsage = ""
        self.totalRam = ""

    def refresh(self):
        self.ramUsage = self.get_ram_usage()

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
        self.totalRam = total / (1024.0 * 1024.0)
        return (used / total) * 100.0 if total else 0.0

    def print_ram_usage(self):
        print(f"Total Ram: {self.totalRam:.1f}GiB")
        print(f"Ram Usage: {self.ramUsage:.1f}%")