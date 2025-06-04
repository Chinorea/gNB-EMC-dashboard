from .Attribute import Attribute
import os, glob

class SocTemp(Attribute):
    core_path = "/sys/class/hwmon/hwmon*"

    def __init__(self):
        super().__init__()
        self.core_temp = "-1"

    def refresh(self):
        self.core_temp = self.read_hwmon_temp()

    def read_hwmon_temp(self):

        hwmons = glob.glob(self.core_path)
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

    def print_core_temp(self):
        print(f"Measured temperature: {self.core_temp:.1f} °C")