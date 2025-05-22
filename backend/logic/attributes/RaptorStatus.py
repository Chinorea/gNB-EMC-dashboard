import pexpect

from .Attribute import Attribute
from .RaptorStatusType import RaptorStatusType
import os, subprocess, re, sys

class RaptorStatus(Attribute):
    du_Check = "CELL_IS_UP, CELL_ID:1"


    def __init__(self, new_log_path:str):
        super().__init__()
        self.raptorStatus = RaptorStatusType.OFF
        self.log_path = new_log_path

    def refresh(self):
        #self.duStatus = self.check_Du_Log()
        #self.check_Cell_Status()
        self.duStatus= self.check_process_status()
        self.check_Cell_Status()

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

    def check_process_status(self) -> bool:
        # call gnb_ctl status non‐interactively
        cmd = ["gnb_ctl", "status"]

        print("DEBUG: running command:", " ".join(cmd))
        result = subprocess.run(
            cmd,
            stdin=subprocess.DEVNULL,     # don’t expect any input
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Now your usual logic:
        lines = [l for l in result.stdout.splitlines() if l.strip()]
        if not lines:
            print("No output from gnb_ctl status.")
            return False

        last = lines[-1].strip()
        print("Last line:", last)

        mA = re.search(
            r"gNB\s+is\s+running\s*\(\s*(\d+)\s*/\s*(\d+)\s*expected\s+processes\s+running\)",
            last
        )
        if mA:
            up, total = map(int, mA.groups())
            if up == total:
                print("✔ All systems up.")
                return True

        return False

    def check_process_status_print_output(self) -> bool:

        # 1) your “any‐cwd” prompt regex (adjust if needed)
        PROMPT = re.compile(r"gnb-\d+:/webdashboard#\s*$")

        # 2) spawn an interactive bash once (reuse for all checks)
        child = pexpect.spawn("/bin/bash", ["-i"], encoding="utf-8", timeout=60)
        child.logfile = sys.stdout

        """
        Sends `ctl status` to the shell, expects the gnb prompt,
        then parses the last line of output. Returns True if
        all processes are up, False otherwise.
        """
        # send the command
        child.sendline("gnb_ctl status")
        # wait until the prompt returns
        child.expect(PROMPT)
        # child.before is everything from after the command echo up to just before the prompt
        output = child.before.strip()
        # split into lines and pick last non‐empty
        lines = [L for L in output.splitlines() if L.strip()]
        if not lines:
            print("No output from ctl status.")
            return False

        last = lines[-1]
        print("Last line:", last)

        # Pattern A: “... gNB is running (10/10 expected processes running)”
        mA = re.search(
            r"gNB\s+is\s+running\s*\(\s*(\d+)\s*/\s*(\d+)\s*expected\s+processes\s+running\)",
            last
        )
        if mA:
            up, total = map(int, mA.groups())
            if up == total:
                print("✔ All systems up.")
                return True

        # unknown format
        print("?! Unrecognized status format.")
        return False

    def check_Cell_Status(self):
        if self.duStatus:
            self.raptorStatus = RaptorStatusType.RUNNING
        else:
            self.raptorStatus = RaptorStatusType.OFF

    def print_Raptor_Status(self):
        print(self.raptorStatus)
