from Attribute import Attribute

class BroadcastFrequency(Attribute):
    frequencyDownLink = None
    frequencyUpLink = None

    def __init__(self):
        super().__init__()

    def refresh(self):
        pass