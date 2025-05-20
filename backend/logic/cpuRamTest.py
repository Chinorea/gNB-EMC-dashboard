#!/usr/bin/env python3
import shutil
import glob, os

def read_hwmon_temp():

    hwmons = glob.glob("/sys/class/hwmon/hwmon*")
    if not hwmons:
        raise RuntimeError("No hwmon directories found")

    # Fallback: read the very first temp*_input we can find
    for hw in hwmons:
        for inp in glob.glob(os.path.join(hw, "temp*_input")):
            try:
                raw = open(inp).read().strip()
                return int(raw) / 1000.0
            except Exception:
                continue

    raise RuntimeError("No temperature input file could be read from hwmon")

def get_disk_usage(path="/"):
    """
    Returns a tuple (total_gib, used_gib, free_gib)
    """
    total, used, free = shutil.disk_usage(path)
    # convert bytes → GiB
    gib = 1024**3
    return (total / gib, used / gib, free / gib)

if __name__ == "__main__":
    total, used, free = get_disk_usage("/")
    temp = read_hwmon_temp()
    print(f"Measured temperature: {temp:.1f} °C")
    print(f"Disk total: {total:.2f} GiB")
    print(f"Disk used : {used:.2f} GiB")
    print(f"Disk free : {free:.2f} GiB")




