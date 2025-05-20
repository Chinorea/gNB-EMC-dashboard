#!/usr/bin/env python3
import subprocess
import sys

def ping_status(host: str, attempts: int = 4, timeout: int = 1) -> str:
    """
    Ping `host` up to `attempts` times, showing each ping's output.
    Returns:
      - "Up"       : all attempts succeeded
      - "Unstable" : at least one succeeded, but not all
      - "Down"     : no attempt succeeded
    """
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
        return "Up"
    elif successes > 0:
        return "Unstable"
    else:
        return "Down"


if __name__ == "__main__":
    target_host = "192.168.100.100"  # change as needed
    status = ping_status(target_host, attempts=4, timeout=1)
    print(f"\nFinal status for {target_host}: {status}")






