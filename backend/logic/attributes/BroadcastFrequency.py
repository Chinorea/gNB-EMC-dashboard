from .Attribute import Attribute
import re, os
from typing import Optional, List, Dict

class BroadcastFrequency(Attribute):
    frequencyDownLink = None
    frequencyUpLink = None

    def __init__(self, new_config_path:str):
        super().__init__()
        self.frequencyDownLink = ""
        self.frequencyUpLink = ""
        self.downLinkBw = ""
        self.upLinkBw = ""
        self.config_path = new_config_path

    def refresh(self):
        """Pulls frequency info and updates instance attributes."""
        freqs = self.get_Broadcast_Frequency()
        # set DL/UL center frequencies
        self.set_Dl_CenterFreq(freqs.get('nDlCenterFreq', ''))
        self.set_Ul_CenterFreq(freqs.get('nUlCenterFreq', ''))
        # set DL/UL bandwidths
        self.set_Dl_Bw(freqs.get('nDlBw', ''))
        self.set_Ul_Bw(freqs.get('nUlBw', ''))

    def get_Broadcast_Frequency(self):

        tags = ['nUlCenterFreq','nDlCenterFreq','nUlBw','nDlBw']
        error_file_dict = {tag: "File not found" for tag in tags}
        error_freq_dict = {tag: "Freq not found" for tag in tags}

        if not os.path.isfile(self.config_path):
            print('File does not exist')
            return error_file_dict

        freq_info = { tag: None for tag in tags }
        pattern = re.compile(rf'<({"|".join(tags)})>\s*(.*?)\s*</\1>')

        with open(self.config_path, 'r') as f:
            for line in f:
                m = pattern.search(line)
                if m:
                    tag, val = m.group(1), m.group(2)
                    freq_info[tag] = val

        if all(v is None for v in freq_info.values()):
            print("No broadcast-frequency tags found in file.")
            return error_freq_dict

        return freq_info

    def set_Dl_CenterFreq(self, val: str) -> None:
        self.frequencyDownLink = val or "N/A"

    def set_Ul_CenterFreq(self, val: str) -> None:
        self.frequencyUpLink = val or "N/A"

    def set_Dl_Bw(self, val: str) -> None:
        self.downLinkBw = val or "N/A"

    def set_Ul_Bw(self, val: str) -> None:
        self.upLinkBw = val or "N/A"

    def get_Ul_Freq(self):
        return self.upLinkBw, self.upLinkBw

    def get_Dl_Freq(self):
        return self.downLinkBw, self.downLinkBw

    def print_Freq_Status(self):
        print("Broadcast Frequencies Info:")
        print(f"  Downlink Center Frequency: {self.frequencyDownLink}")
        print(f"  Downlink Bandwidth:        {self.downLinkBw}")
        print(f"  Uplink Center Frequency:   {self.frequencyUpLink}")
        print(f"  Uplink Bandwidth:          {self.upLinkBw}")
