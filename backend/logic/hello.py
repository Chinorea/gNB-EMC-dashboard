#!/usr/bin/env python3
import xml.etree.ElementTree as ET
from datetime import datetime
import re, subprocess
from typing import List, Optional, Dict

# Absolute path to XML
config_path = "/cu/config/me_config.xml"

# Block tags to look for
block_tags = ['EP_NgC', 'EP_NgU']
 

def get_raptor_status():
    # Simple: run and print its output
    try:
        result = subprocess.run(
            ["/raptor/bin/utility", "--getRfmgrStatus"],   # command and args as a list
            stdout=subprocess.PIPE,        # capture stdout
            stderr=subprocess.PIPE,        # capture stderr
            text=True,                     # decode bytes to str
            timeout=0.01                   # immediately recalls command to bypass cmd request issue
        )
        output = result.stdout.strip()
    except subprocess.TimeoutExpired:
        result = subprocess.run(
            ["/raptor/bin/utility", "--getRfmgrStatus"],   # command and args as a list
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        output = result.stdout.strip()

    # ... after capturing `output` ...
    if "error response received" in output.lower():
        print("Raptor down, gNB not transmitting\n")

    # Extract all "key: value" pairs with a regex
    else:
        # Extract key:value pairs
        pairs = re.findall(r'(\w+)\s*:\s*(\S+)', result.stdout)
        return { key: value for key, value in pairs }

def get_Ip_Info(config_path: str, block_tags: Optional[List[str]] = None) -> Dict[str, Dict[str,str]]:
    # Parse the XML file
    tree = ET.parse(config_path)
    root = tree.getroot()

    # Provide the default if nobody passed in block_tags
    if block_tags is None:
        block_tags = ['EP_NgC', 'EP_NgU']

    # Prepare data container
    results = {}
    inside = False
    current_tags = None

    with open(config_path, 'r') as f:
        for line in f:
            # Detect start of any block
            if not inside:
                for tag in block_tags:
                    if re.search(rf'<{tag}\b', line):
                        inside = True
                        current_tag = tag
                        # initialize storage for this block
                        results[current_tag] = {'Local': None, 'Remote': None}
                        break
                continue

            # If inside, look for local and remote addresses or end tag
            if inside:
                # End of this block?
                if re.search(rf'</{current_tag}>', line):
                    inside = False
                    current_tag = None
                else:
                    # localIpAddress
                    m_loc = re.search(r'<localIpAddress>\s*(.*?)\s*</localIpAddress>', line)
                    if m_loc and current_tag:
                        results[current_tag]['Local'] = m_loc.group(1)
                    # remoteAddress
                    m_rem = re.search(r'<remoteAddress>\s*(.*?)\s*</remoteAddress>', line)
                    if m_rem and current_tag:
                        results[current_tag]['Remote'] = m_rem.group(1)

    return results


rfic_info = get_raptor_status()
ip_info = get_Ip_Info(config_path,block_tags)

# Now both print and reuse:

now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
print(f"Current Date Time: {now}\n")

print("Raptor Status Details:")
for key, value in rfic_info.items():
    pretty = key.replace('_', ' ').title()
    print(f"  {pretty}: {value}")

print("")
for tag, data in ip_info.items():
    print(f"{tag}:")
    print(f"  Local IP Address:  {data['Local'] or 'N/A'}")
    print(f"  Remote IP Address: {data['Remote'] or 'N/A'}\n")


