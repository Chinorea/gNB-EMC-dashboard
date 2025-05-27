#!/usr/bin/env python3
# amend_config_strict.py

import xml.etree.ElementTree as ET
from pathlib import Path
import shutil, re
from typing import List, Dict, Optional

def update_xml_by_path(xml_path: Path,
                       updates: Dict[str, str],
                       make_backup: bool = True) -> None:
    """
    updates: a dict mapping 'path/to/Element' -> 'new text'
      e.g. {'gNB/NgC/IP': '1.2.3.4'}
    """
    if not xml_path.exists() or not xml_path.is_file():
        raise FileNotFoundError(f"{xml_path} does not exist or is not a file")

    if make_backup:
        bak = xml_path.with_suffix(xml_path.suffix + ".bak")
        shutil.copy2(xml_path, bak)
        print(f"[INFO] backed up to {bak}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    # detect default namespace, if any, and register it
    m = re.match(r'\{(.+)\}', root.tag)
    ns_map = {}
    if m:
        uri = m.group(1)
        ET.register_namespace('', uri)     # <<–– register default NS
        ns_map['ns'] = uri

    for full_path, new_text in updates.items():
        if ns_map:
            parts = full_path.split('/')
            expr = ".//" + "/".join(f"ns:{p}" for p in parts)
            found = root.findall(expr, ns_map)
        else:
            expr = ".//" + full_path
            found = root.findall(expr)

        if not found:
            print(f"[WARN] no elements found for path '{full_path}' (expr={expr})")
            continue

        # for el in found:
        #     old = el.text or ""
        #     print(f"[INFO] updating {expr} (was '{old}') → '{new_text}'")
        #     el.text = new_text
          # only update the first match:
        el = found[0]
        old = el.text or ""
        print(f"[INFO] updating {expr} (was '{old}') → '{new_text}')")
        el.text = new_text

    # and finally write
    tree.write(xml_path, encoding="utf-8", xml_declaration=True)
    print(f"[OK] wrote {xml_path}")



def read_xml_by_path(xml_path: Path, paths: List[str]) -> Dict[str, List[Optional[str]]]:
    """
    xml_path: path to your XML file
    paths:   list of tag-paths like ['gNB/NgC/IP', 'Timeout']

    Returns a dict mapping each path to a list of element.text values.
    If a path is not found, you'll get an empty list.
    """
    xml_path = Path(xml_path)
    if not xml_path.exists() or not xml_path.is_file():
        raise FileNotFoundError(f"{xml_path} does not exist or is not a file")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    # 1) detect default namespace (if any) from root.tag
    ns_uri_match = re.match(r'\{(.+)\}', root.tag)
    ns_map: Dict[str, str] = {}
    if ns_uri_match:
        ns_map['ns'] = ns_uri_match.group(1)

    results: Dict[str, List[Optional[str]]] = {}
    for p in paths:
        # 2) build the XPath expression, prefixing each step with "ns:" if needed
        if ns_map:
            parts = p.split('/')
            expr = './/' + '/'.join(f'ns:{part}' for part in parts)
            found = root.findall(expr, ns_map)
        else:
            expr = './/' + p
            found = root.findall(expr)

        if not found:
            print(f"[WARN] no elements at path '{p}' (expr={expr})")
            results[p] = []
        else:
            # 3) extract text (or empty string if None)
            results[p] = [(el.text or '').strip() for el in found]

    return results


"""
if __name__ == "__main__":
    # example usage
    file = Path("sample.xml")
    updates = {
        # only IP under gNB/NgC
        "gNB/NgC/IP": "10.0.0.5",
        # this would match ANY <Timeout> anywhere:
        "Timeout": "45"
    }
    update_xml_by_path(file, updates)

# example usage
if __name__ == "__main__":
    config = Path("cu/config/me_config.xml")
    targets = ["GNBCUFunction/gNBId", "GNBCUFunction/DPCIConfigurationFunction/nRPciList/NRPci",
               "GNBCUFunction/EP_NgC/localIpAddress", "GNBCUFunction/EP_NgC/remoteAddress",
               "GNBCUFunction/EP_NgU/localIpAddress"]
    values = read_xml_by_path(config, targets)
    for path, texts in values.items():
        print(f"{path} → {texts}")
"""

if __name__ == "__main__":
    xml_file = Path("cu/config/me_config.xml")

    updates = {
        # local‐name paths; the function will prefix them with ns: if it
        # sees a default xmlns on the root element
        "GNBCUFunction/gNBId":   "25",
        "GNBCUFunction/DPCIConfigurationFunction/nRPciList/NRPci": "8",
    }

    update_xml_by_path(xml_file, updates)
