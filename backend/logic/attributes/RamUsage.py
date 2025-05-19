from .Attribute import Attribute

class RamUsage(Attribute):
    ramUsage = None

    def __init__(self):
        super().__init__()

    def refresh(self):
        pass