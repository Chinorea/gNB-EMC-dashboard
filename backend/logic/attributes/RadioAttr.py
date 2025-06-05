from .Attribute import Attribute
import json
import os

class RadioAttr(Attribute):

    def __init__(self, json_file_path: str):
        super().__init__()
        self.gnb_Id = ""
        self.gnb_Id_Length = ""
        self.nr_Band = ""
        self.scs = ""
        self.tx_Power = ""
        self.dl_centre_frequency = ""
        self.json_file_path = json_file_path

    def refresh(self):
        """
        Read radio attributes from a JSON file and update instance variables
        
        Returns:
            bool: True if refresh was successful, False otherwise
        """
        # Use helper function to read JSON
        data = self.read_json_file()
        
        if data is None:
            return False
        
        # Extract values with fallback to current values if key doesn't exist
        self.gnb_Id = data.get('gNBId:', self.gnb_Id)
        self.gnb_Id_Length = data.get('gNBIdLength', self.gnb_Id_Length)
        self.nr_Band = data.get('band', self.nr_Band)
        self.scs = data.get('scs', self.scs)
        self.tx_Power = data.get('txMaxPower', self.tx_Power)
        self.dl_centre_frequency = data.get('dl_centre_freq', self.dl_centre_frequency)
        
        print(f"RadioAttr refreshed from {self.json_file_path}")
        return True

    def read_json_file(self):
        """
        Helper function to safely read and parse a JSON file
        
        Args:
            file_path (str): Path to the JSON file
            
        Returns:
            dict: Parsed JSON data, or None if reading failed
        """
        file_path = self.json_file_path
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                print(f"JSON file not found: {file_path}")
                return None
            
            # Read and parse JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                
            return data
            
        except json.JSONDecodeError as e:
            print(f"Invalid JSON format in {file_path}: {e}")
            return None
        except PermissionError:
            print(f"Permission denied reading {file_path}")
            return None
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return None

    def print_attributes(self):
        """
        Print the current radio attributes
        """
        print(f"gNB ID: {self.gnb_Id}")
        print(f"gNB ID Length: {self.gnb_Id_Length}")
        print(f"NR Band: {self.nr_Band}")
        print(f"SCS: {self.scs}")
        print(f"TX Power: {self.tx_Power}")
        print(f"DL Centre Frequency: {self.dl_centre_frequency}")