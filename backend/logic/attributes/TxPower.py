from .Attribute import Attribute
import re, os

class TxPower(Attribute):

    def __init__(self, new_tx_path:str):
        super().__init__()
        self.tx_path = new_tx_path
        self.tx_power = 0

    def refresh(self):
        self.tx_power = self.get_tx_power()

    def get_tx_power(self):
        # 1) ensure the file is there
        if not os.path.isfile(self.tx_path):
            print("File does not exist:", self.tx_path)
            return "File not found"

        # 2) compile a regex for <configuredMaxTxPower>…</configuredMaxTxPower>
        pattern = re.compile(r'<configuredMaxTxPower>\s*(.*?)\s*</configuredMaxTxPower>')

        # 3) scan line by line
        with open(self.tx_path, 'r') as f:
            for line in f:
                match = pattern.search(line)
                if match:
                    # 4) return the captured value
                    return match.group(1)

        # 5) fallback if no tag was ever seen
        return "Tag not found"

    def print_tx_power(self):
        print(f"Tx Power: {self.tx_power}")
