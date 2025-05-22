#!/usr/bin/env python3
import subprocess
import re

def check_process_status() -> bool:
    """
    Runs `ctl status`, inspects the last line of stdout.
    Returns True if “X/X expected processes” (all up),
    False otherwise.
    """
    try:
        result = subprocess.run(
            ["gnb_ctl", "status"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print("Error running ctl status:", e.stderr.strip())
        return False

    # Grab the last non-empty line
    lines = [l for l in result.stdout.splitlines() if l.strip()]
    if not lines:
        print("No output from ctl.")
        return False

    last = lines[-1].strip()
    print("Last line:", last)

    # Pattern A: “[timestamp] gNB is running (10/10 expected processes running)”
    mA = re.search(
        r"gNB\s+is\s+running\s*\(\s*(\d+)\s*/\s*(\d+)\s*expected\s+processes\s+running\)",
        last
    )
    if mA:
        up, total = map(int, mA.groups())
        if up == total:
            print("✔ All systems up.")
            return True
        # (shouldn’t really happen, since the pattern says “X/X expected”)

    # Pattern B: “[timestamp] WARNING: 9 processes running, but expected 10”
    mB = re.search(
        r"WARNING:\s*(\d+)\s+processes\s+running,\s+but\s+expected\s+(\d+)",
        last
    )
    if mB:
        up, expected = map(int, mB.groups())
        print(f"✖ Partial failure: {up}/{expected} processes running.")
        return False

    # If we get here, we didn’t recognize the format
    print("?! Unrecognized status format.")
    return False

# Example usage:
if __name__ == "__main__":
    healthy = check_process_status()
    if healthy:
        print("Cell is up")
    else:
        print("Cell is down")


