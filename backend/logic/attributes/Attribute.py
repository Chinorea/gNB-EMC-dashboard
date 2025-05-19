from abc import ABC, abstractmethod
import re

class Attribute(ABC):
    def __init__(self):
        pass

    @abstractmethod
    def refresh(self):
        pass

