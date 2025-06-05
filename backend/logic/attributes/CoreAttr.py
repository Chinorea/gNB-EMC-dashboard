from .Attribute import Attribute
import json
import os

class CoreAttr(Attribute):

    def __init__(self, json_file_path: str):
        super().__init__()
        self.MCC = ""
        self.MNC = ""
        self.cell_Id = ""
        self.json_file_path = json_file_path
        self.gnb_Ngc_Ip = ""
        self.gnb_Ngu_Ip = ""
        self.ngc_Ip = ""
        self.ngu_Ip = ""
        self.nr_Tac = ""
        self.sst = ""
        self.sd = ""
        self.profile = ""

    def refresh(self):
        """
        Read core attributes from a JSON file and update instance variables
        
        Returns:
            bool: True if refresh was successful, False otherwise
        """
        # Use helper function to read JSON
        data = self.read_json_file()
        
        if data is None:
            return False
        
        # Extract values with fallback to current values if key doesn't exist
        self.MCC = data.get('MCC', self.MCC)
        self.MNC = data.get('MNC', self.MNC)
        self.cell_Id = data.get('cellLocalId', self.cell_Id)
        self.gnb_Ngu_Ip = data.get('n2_local_ip', self.gnb_Ngu_Ip)
        self.gnb_Ngc_Ip = data.get('n3_local_ip', self.gnb_Ngc_Ip)
        self.ngc_Ip = data.get('n2_remote_ip', self.ngc_Ip)
        self.ngu_Ip = data.get('n3_remote_ip', self.ngu_Ip)
        self.nr_Tac = data.get('nrTAC', self.nr_Tac)
        self.sst = data.get('sst', self.sst)
        self.sd = data.get('sd', self.sd)
        self.profile = data.get('profile', self.profile)
        
        print(f"CoreAttr refreshed from {self.json_file_path}")
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
        Print the current core attributes
        """
        print(f"MCC: {self.MCC}")
        print(f"MNC: {self.MNC}")
        print(f"Cell ID: {self.cell_Id}")
        print(f"gNB NGC IP: {self.gnb_Ngc_Ip}")
        print(f"gNB NGU IP: {self.gnb_Ngu_Ip}")
        print(f"NGC IP: {self.ngc_Ip}")
        print(f"NGU IP: {self.ngu_Ip}")
        print(f"NR TAC: {self.nr_Tac}")
        print(f"SST: {self.sst}")
        print(f"SD: {self.sd}")
        print(f"Profile: {self.profile}")