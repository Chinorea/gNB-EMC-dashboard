from .Attribute import Attribute
import re
from typing import Optional, List, Dict

class BroadcastFrequency(Attribute):
    frequencyDownLink = None
    frequencyUpLink = None

    def __init__(self):
        super().__init__()
        self.frequencyDownLink = ""
        self.frequencyUpLink = ""

    def refresh(self):
        pass

    def get_BroadcastFrequency(self):
        pass