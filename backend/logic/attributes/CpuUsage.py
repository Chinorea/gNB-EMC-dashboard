from .Attribute import Attribute
import time
from collections import deque

# Update refresh such that it stores ram usage for the most recent 100 entries
# on refresh, remove the oldest data and add the newest data
class CpuUsage(Attribute):

    def __init__(self):
        super().__init__()
        self.cpuUsage = ""
        self.usage_history = deque(maxlen=100)

    def refresh(self):
        self.cpuUsage = self.get_cpu_usage()
        self.usage_history.append(self.cpuUsage)

    def get_cpu_usage(self):
        """
        Read /proc/stat twice, interval seconds apart,
        and compute the percentage of non-idle time.
        """

        def _read():
            with open('/proc/stat', 'r') as f:
                parts = f.readline().split()[1:]
                nums = list(map(float, parts))
            idle = nums[3] + nums[4]  # idle + iowait
            total = sum(nums)
            return idle, total

        idle1, total1 = _read()
        time.sleep(0.1)
        idle2, total2 = _read()

        idle_delta = idle2 - idle1
        total_delta = total2 - total1
        if total_delta == 0:
            return 0.0
        return round((1.0 - idle_delta / total_delta) * 100.0,1)

    def print_cpu_usage(self):
        print(f"Cpu Usage: {self.cpuUsage}%")

    def print_cpu_usage_hist(self):
        print(f"Cpu Usage: {self.cpuUsage}%")
        print(f"History (last {len(self.usage_history)} samples):")
        print(list(self.usage_history))
