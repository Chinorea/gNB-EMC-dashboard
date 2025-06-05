import configparser

from .Attribute import Attribute
import re, subprocess, os
from typing import Optional, List, Dict


class IpAddress(Attribute):

    def __init__(self, new_config_path: str):
        super().__init__()
        self.gnb_Id = ""
        self.ipAddressGnb = ""
        self.ipAddressNgc = ""
        self.ipAddressNgu = ""
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
        
        # gNB identifier
        gnb_id = self.get_gnb_info()
        self.gnb_Id = gnb_id

    @staticmethod
    def get_Ip_Info(self, block_tags: Optional[List[str]] = None) -> Dict[str, Dict[str, str]]:

        # Provide the default if nobody passed in block_tags
        if block_tags is None:
            block_tags = ['EP_NgC', 'EP_NgU']

        if not os.path.isfile(self.config_path):
            print('File does not exist')
            return{
                tag: {'Local': 'File not found', 'Remote': 'File not found'}
                for tag in block_tags
            }

        # Prepare data container
        results = {}
        inside = False

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

    def get_gnb_info(self) -> str:
        """
        Extracts <gNBId> from config.
        Returns gNBId string.
        """
        if not os.path.isfile(self.config_path):
            print("File not found")
            return 'File not found'

        gnb_id = ''
        # regex pattern
        re_id = re.compile(r'<gNBId>\s*(.*?)\s*</gNBId>')

        with open(self.config_path, 'r') as f:
            for line in f:
                if not gnb_id:
                    m_id = re_id.search(line)
                    if m_id:
                        gnb_id = m_id.group(1)
                        break  # Found gNB ID, no need to continue

        return gnb_id

    # make these real instance methods    def set_Ip_Ngc(self, loc_Ip: str, rem_Ip: str) -> None:
        self.ipAddressGnb = loc_Ip
        self.ipAddressNgc = rem_Ip

    def set_Ip_Ngu(self, loc_Ip: str, rem_Ip: str) -> None:
        self.ipAddressGnb = loc_Ip
        self.ipAddressNgu = rem_Ip

    def get_Ip_Ngc(self):
        return self.ipAddressNgc

    def get_Ip_Ngu(self):
        return self.ipAddressNgu

    def get_Ip_Gnb(self):
        return self.ipAddressGnb

    def print_Ip_Status(self):

        print("IpAddress Info:")
        print(f"  gnbId: {self.gnb_Id or 'N/A'}")
        print(f"  gNB IP Address:  {self.ipAddressGnb or 'N/A'}")
        print(f"  NgC IP Address:  {self.ipAddressNgc or 'N/A'}")
        print(f"  NgU IP Address:  {self.ipAddressNgu or 'N/A'}\n")
        pass
