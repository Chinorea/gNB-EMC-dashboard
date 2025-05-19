from .Attribute import Attribute
from .RaptorStatusType import RaptorStatusType
import os, subprocess


class RaptorStatus(Attribute):
    du_Check = "CELL_IS_UP, CELL_ID:1"

    def __init__(self, new_log_path:str):
        super().__init__()
        self.raptorStatus = RaptorStatusType.OFF
        self.log_path = new_log_path

    def refresh(self):
        self.duStatus = self.check_Du_Log()
        self.raptorStatusMode = self.get_Raptor_Status()

    def check_Du_Log(self) -> bool:
        if not os.path.isfile(self.log_path):
            print("Log path {} does not exist.".format(self.log_path))
            return False

        # Call `tail -n 1` so you don't try to run the .txt itself
        cmd = ["tail", "-n", "1", self.log_path]
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
        except subprocess.CalledProcessError as e:
            # tail failed (e.g. no permission)
            print("Error tailing DU log:", e.stderr)
            return False

        last_line = result.stdout.strip()
        print("Last line:", last_line)
        return True if last_line == self.du_Check else False

    def get_Raptor_Status(self):
        # Simple: run and print its output
        try:
            result = subprocess.run(
                ["/raptor/bin/utility", "--getRfmgrStatus"],  # command and args as a list
                stdout=subprocess.PIPE,  # capture stdout
                stderr=subprocess.PIPE,  # capture stderr
                text=True,  # decode bytes to str
                timeout=0.01  # immediately recalls command to bypass cmd request issue
            )
            output = result.stdout.strip()
        except subprocess.TimeoutExpired:
            result = subprocess.run(
                ["/raptor/bin/utility", "--getRfmgrStatus"],  # command and args as a list
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            output = result.stdout.strip()

        # ... after capturing `output` ...
        if "error response received" in output.lower():
            print("Raptor down, gNB not transmitting\n")
            return False

        # Extract all "key: value" pairs with a regex
        else:
            print(f"Raptor status: \n {output}")
            return True

    def print_Raptor_Status(self):
        if  self.duStatus and self.raptorStatusMode:
            self.raptorStatus = RaptorStatusType.RUNNING
        elif (self.duStatus ^ self.raptorStatusMode):
            self.raptorStatus = RaptorStatusType.INITIALISING
        else:
            self.raptorStatus = RaptorStatusType.OFF

        print(self.raptorStatus)


