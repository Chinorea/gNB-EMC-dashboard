from .Attribute import Attribute
from datetime import datetime

class BoardDateTime(Attribute):
    boardDate = None
    boardTime = None

    def __init__(self):
        super().__init__()
        self.refresh()

    def refresh(self):
        self.boardDate = datetime.today().date().strftime("%d %B %Y")
        self.boardTime = datetime.today().time().strftime("%H:%M:%S")

    def print_Current_time(self):
        print("Current date : ", self.boardDate)
        print("Current time : ", self.boardTime)




