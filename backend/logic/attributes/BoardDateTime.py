from Attribute import Attribute

class BoardDateTime(Attribute):
    boardDate = None
    boardTime = None

    def __init__(self):
        super().__init__()

    def refresh(self):
        pass