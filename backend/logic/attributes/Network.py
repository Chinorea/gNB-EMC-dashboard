from .Attribute import Attribute
from .NetworkType import NetworkType
import subprocess, sys

class Network(Attribute):
    attempts = 4
    timeout = 1

    def __init__(self, host_ip: str):
        super().__init__()
        self.networkStatus = NetworkType.DOWN
        self.host = host_ip

    def refresh(self):
        self.networkStatus = self.ping_status(self.host)

    def ping_status(self, host: str) -> NetworkType:
        """
        Ping `host` up to `attempts` times (one packet each time, with `timeout` seconds).
        Returns:
          - "Up"       : all attempts succeeded
          - "Unstable" : at least one succeeded, but not all
          - "Down"     : no attempt succeeded
        """
        successes = 0
        attempts = self.attempts
        timeout = self.timeout
        for _ in range(attempts):
            if sys.platform.startswith("win"):
                # -n 1 = send 1 echo request
                # -w <ms> = timeout in milliseconds
                cmd = ["ping", "-n", "1", "-w", str(timeout * 1000), host]
            else:
                # -c 1 = send 1 packet
                # -W <s> = timeout in seconds
                cmd = ["ping", "-c", "1", "-W", str(timeout), host]

            try:
                result = subprocess.run(
                    cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                if result.returncode == 0:
                    successes += 1
            except Exception:
                # ignore failures/exceptions and count as a miss
                continue

        if successes == attempts:
            return NetworkType.UP
        elif successes > 0:
            return NetworkType.UNSTABLE
        else:
            return NetworkType.DOWN


    def ping_status_detailed(self, host: str) -> NetworkType:
        """
        Ping `host` up to `attempts` times, showing each ping's output.
        Returns:
          - "Up"       : all attempts succeeded
          - "Unstable" : at least one succeeded, but not all
          - "Down"     : no attempt succeeded
        """
        attempts = self.attempts
        timeout = self.timeout
        successes = 0

        for i in range(1, attempts + 1):
            if sys.platform.startswith("win"):
                cmd = ["ping", "-n", "1", "-w", str(timeout * 1000), host]
            else:
                cmd = ["ping", "-c", "1", "-W", str(timeout), host]

            print(f"\n--- Ping attempt {i}/{attempts} ---")
            try:
                # capture both stdout and stderr so we can print the full ping output
                result = subprocess.run(
                    cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
                )
                output = result.stdout.decode(errors="ignore")
                print(output, end="")

                if result.returncode == 0:
                    successes += 1
                else:
                    print(f"(Attempt {i} failed, return code {result.returncode})")
            except Exception as e:
                print(f"Error executing ping: {e}")

        if successes == attempts:
            return NetworkType.UP
        elif successes > 0:
            return NetworkType.UNSTABLE
        else:
            return NetworkType.DOWN

    def print_network_status(self):
           print(f"Network Status: {self.networkStatus.name}")

    def test_network(self, ip: str):
        self.host = ip
        self.refresh()