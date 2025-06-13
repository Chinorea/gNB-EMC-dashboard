from abc import ABC, abstractmethod
import json
import os

class Attribute(ABC):
    def __init__(self):
        pass

    @abstractmethod
    def refresh(self):
        pass

    def edit_config(self, key: str, value: str):
        """
        Edit a single key-value pair in the JSON configuration file
        
        Args:
            key (str): The JSON key to modify
            value (str): The new value to set
            
        Returns:
            bool: True if edit was successful, False otherwise
        """
        try:
            # Quick one-liner edit: Read, modify, write
            with open(self.json_file_path, 'r+', encoding='utf-8') as f:
                data = json.load(f)
                data[key] = value
                f.seek(0)
                json.dump(data, f, indent=2)
                f.truncate()
            
            print(f"Successfully updated {key} = {value} in {self.json_file_path}")
            return True
            
        except FileNotFoundError:
            print(f"JSON file not found: {self.json_file_path}")
            return False
        except json.JSONDecodeError as e:
            print(f"Invalid JSON format in {self.json_file_path}: {e}")
            return False
        except Exception as e:
            print(f"Error editing {self.json_file_path}: {e}")
            return False

