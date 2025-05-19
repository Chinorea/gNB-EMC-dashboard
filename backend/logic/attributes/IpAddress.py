import configparser

from .Attribute import Attribute
import re, subprocess
from typing import Optional, List, Dict


class IpAddress(Attribute):

    def __init__(self, new_config_path: str):
        super().__init__()
        self.ipAddressGnb = ""
        self.ipAddressNgc = ""
        self.ipAddressNgu = ""
        self.remoteIpNgc = ""
        self.remoteIpNgu = ""
        self.remoteIpGnb = ""
        self.config_path = new_config_path

    def refresh(self):
        # pull the dynamic info
        blocks = self.get_Ip_Info(self)
        # blocks is {'EP_NgC': {'Local': 'x.x.x.x', 'Remote': 'y.y.y.y'},
        #            'EP_NgU': {...}}

        # now store into your attributes
        if 'EP_NgC' in blocks:
            loc, rem = blocks['EP_NgC']['Local'], blocks['EP_NgC']['Remote']
            self.set_Ip_Ngc(loc, rem)

        if 'EP_NgU' in blocks:
            loc, rem = blocks['EP_NgU']['Local'], blocks['EP_NgU']['Remote']
            self.set_Ip_Ngu(loc, rem)

    @staticmethod
    def get_Ip_Info(self, block_tags: Optional[List[str]] = None) -> Dict[str, Dict[str, str]]:

        # Provide the default if nobody passed in block_tags
        if block_tags is None:
            block_tags = ['EP_NgC', 'EP_NgU']

        # Prepare data container
        results = {}
        inside = False
        current_tags = None

        with open(self.config_path, 'r') as f:
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

    # make these real instance methods
    def set_Ip_Ngc(self, loc_Ip: str, rem_Ip: str) -> None:
        self.ipAddressNgc = loc_Ip
        self.remoteIpNgc = rem_Ip

    def set_Ip_Ngu(self, loc_Ip: str, rem_Ip: str) -> None:
        self.ipAddressNgu = loc_Ip
        self.remoteIpNgu = rem_Ip

    def get_Ip_Ngc(self):
        return self.ipAddressNgc, self.remoteIpNgc

    def get_Ip_Ngu(self):
        return self.ipAddressNgu, self.remoteIpNgu

    def print_Ip_Status(self):
        # EP_NgC
        print("EP_NgC:")
        print(f"  Local IP Address:  {self.ipAddressNgc or 'N/A'}")
        print(f"  Remote IP Address: {self.remoteIpNgc or 'N/A'}\n")

        # EP_NgU
        print("EP_NgU:")
        print(f"  Local IP Address:  {self.ipAddressNgu or 'N/A'}")
        print(f"  Remote IP Address: {self.remoteIpNgu or 'N/A'}\n")
        pass
