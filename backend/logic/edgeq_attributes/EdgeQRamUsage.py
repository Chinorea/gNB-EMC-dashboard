from logic.shared_attributes.Attribute import Attribute
import subprocess
from collections import deque

class EdgeQRamUsage(Attribute):

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
        Read /proc/meminfo to extract total and available memory,
        then calculate percentage usage.
        """
        try:
            result = subprocess.run(['cat', '/proc/meminfo'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                return 0.0

            lines = result.stdout.strip().split('\n')
            mem_total = None
            mem_available = None

            for line in lines:
                if line.startswith('MemTotal:'):
                    mem_total = int(line.split()[1])  # in kB
                elif line.startswith('MemAvailable:'):
                    mem_available = int(line.split()[1])  # in kB

            if mem_total and mem_available:
                self.totalRam = round(mem_total / (1024 * 1024), 1)  # Convert to GB
                usage_percent = ((mem_total - mem_available) / mem_total) * 100
                return round(usage_percent, 1)
            else:
                return 0.0

        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, ValueError) as e:
            return 0.0
