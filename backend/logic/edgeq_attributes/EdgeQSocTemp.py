from logic.shared_attributes.Attribute import Attribute
import os, glob

class EdgeQSocTemp(Attribute):
    core_path = "/sys/class/hwmon/hwmon*"

    def __init__(self):
        super().__init__()
        self.core_temp = "-1"

    def refresh(self):
        self.core_temp = self.read_hwmon_temp()

    def read_hwmon_temp(self):
        """
        EdgeQ-specific temperature monitoring
        Read the SoC temperature from EdgeQ hardware monitoring interface
        """
        hwmons = glob.glob(self.core_path)
        if not hwmons:
            print("Warning: No hwmon directories found for EdgeQ temperature monitoring")
            return -1

        # Read the first available temperature sensor from hwmon
        for hw in hwmons:
            for inp in glob.glob(os.path.join(hw, "temp*_input")):
                try:
                    with open(inp, 'r') as f:
                        raw = f.read().strip()
                    # Convert from millicelsius to celsius
                    return round(int(raw) / 1000.0, 1)
                except Exception as e:
                    print(f"EdgeQ: Could not read temperature from {inp}: {e}")
                    continue

        print("Warning: No temperature input file could be read from EdgeQ hwmon")
        return -1

    def get_core_temp(self):
        """
        Legacy method name for backward compatibility
        """
        return self.read_hwmon_temp()

    def print_core_temp(self):
        print(f"EdgeQ SoC Temperature: {self.core_temp}°C")