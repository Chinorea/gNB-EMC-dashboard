from .Attribute import Attribute
import shutil

class DriveSpace(Attribute):

    def __init__(self):
        super().__init__()
        self.drive_data = []

    def refresh(self):
        self.drive_data = self.get_disk_usage()

    def get_disk_usage(self):
        """
        Returns a tuple (total_gib, used_gib, free_gib)
        """
        total, used, free = shutil.disk_usage("/")
        # convert bytes → GiB
        gib = 1024**3
        return round(total / gib,2), round(used / gib,2), round(free / gib,2)

    def print_drive_space(self):
        print(f"Drive Space Info:")
        print(f"  Total Drive Space: {self.drive_data[0]} GiB")
        print(f"  Used Drive Space:  {self.drive_data[1]} GiB")
        print(f"  Free Drive Space:  {self.drive_data[2]} GiB")