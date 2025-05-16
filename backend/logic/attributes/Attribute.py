from abc import ABC, abstractmethod

class Attribute(ABC):
    def __init__(self):
        pass

    @abstractmethod
    def refresh(self):
        pass

