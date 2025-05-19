#!/usr/bin/env python3
import time

def get_cpu_usage(interval=0.1):
    """
    Read /proc/stat twice, interval seconds apart,
    and compute the percentage of non-idle time.
    """
    def _read():
        with open('/proc/stat', 'r') as f:
            parts = f.readline().split()[1:]
            nums = list(map(float, parts))
        idle = nums[3] + nums[4]      # idle + iowait
        total = sum(nums)
        return idle, total

    idle1, total1 = _read()
    time.sleep(interval)
    idle2, total2 = _read()

    idle_delta  = idle2  - idle1
    total_delta = total2 - total1
    if total_delta == 0:
        return 0.0
    return (1.0 - idle_delta / total_delta) * 100.0

def get_ram_usage():
    """
    Parse /proc/meminfo to compute used RAM percentage.
    Uses MemAvailable if present, otherwise falls back.
    """
    meminfo = {}
    with open('/proc/meminfo', 'r') as f:
        for line in f:
            key, val = line.split(':')[0], line.split(':')[1].strip().split()[0]
            meminfo[key] = float(val)

    total     = meminfo.get('MemTotal', 0.0)
    available = meminfo.get('MemAvailable',
                            meminfo.get('MemFree',0.0)
                          + meminfo.get('Buffers',0.0)
                          + meminfo.get('Cached',0.0))
    used = total - available
    return (used / total) * 100.0 if total else 0.0

if __name__ == "__main__":
    # Run a quick one‐time measurement
    # cpu = get_cpu_usage()
    # ram = get_ram_usage()
    # print(f"CPU Usage: {cpu:.1f}%")
    # print(f"RAM Usage: {ram:.1f}%")

    # Or run in a loop to watch changes:
    while True:
        print(f"CPU {get_cpu_usage():.1f}%  RAM {get_ram_usage():.1f}%")
        time.sleep(1)


