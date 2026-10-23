#!/usr/bin/env python3
"""Drives a program in a pseudo-terminal and prints what it drew, as JSON. Standard library only (macOS and Linux).

    python3 pty_drive.py SPEC.json

SPEC: {"argv": [...], "cwd": "...", "env": {...}, "cols": 100, "rows": 30, "steps": [...]}
Steps: {"wait": "text", "timeout": 60}  wait until the text has appeared (ANSI sequences left out) after this step began;
                                         with "anywhere": true, until it has appeared at all
       {"send": "keys"}                  type keys
       {"sleep": 0.8}                    pause
After the steps the driver sends Ctrl+C twice and waits for the program to end.
Output: {"text": "...", "raw": "...", "exit": 0, "failed": null or "the step that timed out"}
"""
import fcntl
import json
import os
import pty
import re
import select
import struct
import sys
import termios
import time

ANSI = re.compile(r"\x1b\[[0-9;?<>=]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][AB012]|\x1b[=>78]")

spec = json.load(open(sys.argv[1]))
pid, fd = pty.fork()
if pid == 0:
    os.chdir(spec["cwd"])
    os.execvpe(spec["argv"][0], spec["argv"], {**os.environ, **spec["env"]})
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", spec.get("rows", 30), spec.get("cols", 100), 0, 0))
raw = b""


def pump(seconds):
    global raw
    end = time.time() + seconds
    while time.time() < end:
        ready, _, _ = select.select([fd], [], [], 0.1)
        if ready:
            try:
                data = os.read(fd, 65536)
            except OSError:
                return False
            if not data:
                return False
            raw += data
    return True


def text():
    return ANSI.sub("", raw.decode("utf-8", "replace"))


failed = None
for step in spec["steps"]:
    if "wait" in step:
        start = 0 if step.get("anywhere") else len(text())
        end = time.time() + step.get("timeout", 60)
        while time.time() < end and step["wait"] not in text()[start:]:
            pump(0.2)
        if step["wait"] not in text()[start:]:
            failed = f"wait for {step['wait']!r}"
            break
    elif "send" in step:
        os.write(fd, step["send"].encode())
    elif "sleep" in step:
        pump(step["sleep"])
os.write(fd, b"\x03")
pump(0.15)
os.write(fd, b"\x03")
code = None
end = time.time() + 15
while time.time() < end:
    pump(0.2)
    done, status = os.waitpid(pid, os.WNOHANG)
    if done:
        code = os.waitstatus_to_exitcode(status)
        break
if code is None:
    os.kill(pid, 9)
    os.waitpid(pid, 0)
print(json.dumps({"text": text(), "raw": raw.decode("utf-8", "replace"), "exit": code, "failed": failed}))
