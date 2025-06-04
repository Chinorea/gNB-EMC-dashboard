#!/usr/bin/env python3
import pexpect, sys, re, time, subprocess

def start_raptor2():
    cmd = ["systemctl", "start", "raptor2"]
    try:
        result = subprocess.run(
            cmd,
            check=False,            # we’ll inspect returncode ourselves
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True               # get str back instead of bytes
        )
    except Exception as e:
        print("Failed to even launch systemctl:", e, file=sys.stderr)
        return False

"""
# adjust these to exactly match your scripts' final output lines
SETUP_DONE_RE = re.compile(r"Finished setting up L23SW binaries environment")
PROMPT = re.compile(r"gnb-\d+:/webdashboard#\s*$")


child = pexpect.spawn("/bin/bash", ["-i"], encoding="utf-8", timeout=120)
child.setecho(False)
child.logfile = sys.stdout  # echo everything into our stdout

# 1) run setup.sh and wait for its last line
child.sendline("/etc/setup_gnb_env_v2.sh")
child.expect(r"Please\s+Enter\s+The\s+BOARD\s+NUM:\s*")
child.sendline("26")
child.expect(SETUP_DONE_RE)

# 2) run svc.sh and answer prompts
child.sendline("/raptor/etc/netopeer2_service.sh")
child.expect(r"Please\s+Enter\s+The\s+BOARD\s+NUM:\s*")
child.sendline("26")
child.expect(r"2\s+-\s+A0")
child.sendline("1")
child.expect(r"Please\s+Enter\s+y/n\s+to\s+load\s+extra\s+configuration:")
child.sendline("n")

# 3) wait for svc.sh’s “done” line
child.expect(PROMPT, timeout=60)


# 4) do the cleanup
child.sendline("rm -v /logdump/*.bin /logdump/*.txt /logdump/*.log")
# if you want to wait for the rm prompt or a confirmation line, expect that here
child.expect(PROMPT, timeout=10)

child.close()
print("All steps completed, exit status:", child.exitstatus)

start_raptor2()

"""

child = pexpect.spawn("/bin/bash", ["-i"], encoding="utf-8", timeout=120)
child.setecho(False)
child.logfile = sys.stdout  # echo everything into our stdout

# 1) run setup.sh and wait for its last line
child.sendline("gnb_ctl start")
child.expect(r"CELL_IS_UP,\s+CELL_ID:1")

child.close()
print("All steps completed, exit status:", child.exitstatus)
