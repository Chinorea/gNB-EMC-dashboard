#!/usr/bin/env python3
import time


def read_bytes(iface, dir="tx"):
    path = f"/sys/class/net/{iface}/statistics/{dir}_bytes"
    with open(path, "r") as f:
        return int(f.read().strip())


def measure_throughput(iface, interval=1.0):
    # read initial counters
    tx1 = read_bytes(iface, "tx")
    rx1 = read_bytes(iface, "rx")
    time.sleep(interval)
    tx2 = read_bytes(iface, "tx")
    rx2 = read_bytes(iface, "rx")

    # delta bytes → bits/sec → Mbps
    tx_mbps = (tx2 - tx1) * 8 / interval / 1e6
    rx_mbps = (rx2 - rx1) * 8 / interval / 1e6

    print(f"{iface} → UE  DL: {tx_mbps:.2f} Mbps   UL: {rx_mbps:.2f} Mbps")


if __name__ == "__main__":
    # replace “gtp0” with your actual user-plane interface name
    measure_throughput("gtp0", interval=1.0)
