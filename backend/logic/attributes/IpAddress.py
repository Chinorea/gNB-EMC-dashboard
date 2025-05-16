from Attribute import Attribute

class IpAddress(Attribute):
    ipAddressGnb = ""
    ipAddressNgc = ""
    ipAddressNgu = ""

    def __init__(self):
        super().__init__()

    def refresh(self):
        pass
