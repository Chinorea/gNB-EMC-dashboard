"""
Local Flasgger API Documentation Generator for gNB EMC Dashboard
Run this on your Windows local machine to generate Swagger documentation

This module creates a separate Flask application purely for documentation purposes.
It does not interfere with your main Flask.py backend application.
"""

from flask import Flask
from flasgger import Swagger, swag_from
import webbrowser
import threading
import os
import sys
from datetime import datetime

# Configuration
DEFAULT_BACKEND_IP = "192.168.2.28"
DEFAULT_BACKEND_PORT = 5000
LOCAL_DOC_PORT = 8080

class GnbApiDocumentationServer:
    """Local documentation server for gNB EMC Dashboard API"""
    
    def __init__(self, backend_ip=DEFAULT_BACKEND_IP, backend_port=DEFAULT_BACKEND_PORT, local_port=LOCAL_DOC_PORT):
        self.backend_ip = backend_ip
        self.backend_port = backend_port
        self.local_port = local_port
        self.backend_url = f"http://{backend_ip}:{backend_port}"
        
        # Create Flask app for documentation only
        self.app = Flask(__name__)
        self.app.config['SWAGGER'] = {
            'title': 'gNB EMC Dashboard API',
            'uiversion': 3
        }
        
        # Configure Swagger
        self.swagger_config = {
            "headers": [],
            "specs": [
                {
                    "endpoint": 'apispec',
                    "route": '/apispec.json',
                    "rule_filter": lambda rule: True,
                    "model_filter": lambda tag: True,
                }
            ],
            "static_url_path": "/flasgger_static",
            "swagger_ui": True,
            "specs_route": "/docs/"
        }

        self.swagger_template = {
            "swagger": "2.0",
            "info": {
                "title": "gNB EMC Dashboard API",
                "description": f"""REST API for monitoring and controlling gNB (5G base station) nodes.
                
**Backend Server:** {self.backend_url}
**Documentation Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This documentation is generated locally and all API testing will connect to your actual backend server.""",
                "version": "1.0.0",
                "contact": {
                    "name": f"Backend Server: {self.backend_url}"
                }
            },
            "host": f"{self.backend_ip}:{self.backend_port}",
            "basePath": "/api",
            "schemes": ["http"],
            "consumes": ["application/json"],
            "produces": ["application/json"],
            "tags": [
                {"name": "Board Management", "description": "Board information and configuration"},
                {"name": "Monitoring", "description": "System monitoring and status"},
                {"name": "Control", "description": "Node control operations"},
                {"name": "Configuration", "description": "Configuration management"},
                {"name": "File Management", "description": "File operations and downloads"}
            ]
        }
        
        # Initialize Swagger
        self.swagger = Swagger(self.app, config=self.swagger_config, template=self.swagger_template)
        
        # Register routes
        self._register_documentation_routes()
    
    def _register_documentation_routes(self):
        """Register all API documentation routes"""
        
        @self.app.route("/api/board-info", methods=["GET"])
        @swag_from({
            'tags': ['Board Management'],
            'summary': 'Get Board Information',
            'description': f'''Retrieves current board information including board type, configuration paths, available files, and timeout settings.
            
**Actual Backend:** {self.backend_url}/api/board-info

**Usage:**
```bash
curl -X GET {self.backend_url}/api/board-info
```''',
            'responses': {
                200: {
                    'description': 'Board information retrieved successfully',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'board_type': {
                                'type': 'string', 
                                'description': 'Type of board',
                                'example': 'EdgeQ'
                            },
                            'config_path': {
                                'type': 'string',
                                'description': 'Path to configuration file',
                                'example': '/opt/gnb/config/gnb.conf'
                            },
                            'log_directory': {
                                'type': 'string',
                                'description': 'Directory where logs are stored',
                                'example': '/var/log/gnb'
                            },
                            'available_files': {
                                'type': 'array',
                                'items': {'type': 'string'},
                                'description': 'List of downloadable files',
                                'example': ['gnb_config', 'log_file']
                            },
                            'timeouts': {
                                'type': 'object',
                                'description': 'Configured timeout values',
                                'example': {'raptor_status': 3, 'setup_max_wait': 120}
                            }
                        }
                    }
                },
                500: {
                    'description': 'Server Error',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'error': {'type': 'string', 'example': 'Internal server error'},
                            'details': {'type': 'string', 'example': 'Failed to read board configuration'}
                        }
                    }
                }
            }
        })
        def get_board_info():
            """Documentation endpoint - not implemented locally"""
            return {"message": "This is documentation only. Use Swagger UI 'Try it out' to test actual backend."}

        @self.app.route("/api/attributes", methods=["GET"])
        @swag_from({
            'tags': ['Monitoring'],
            'summary': 'Get System Attributes',
            'description': f'''Retrieves comprehensive system metrics including radio parameters, core network settings, hardware usage statistics, and connection status.
            
**Actual Backend:** {self.backend_url}/api/attributes

**Usage:**
```bash
curl -X GET {self.backend_url}/api/attributes
```

**Response includes:**
- Radio parameters (gNB ID, band, frequency, power)
- Core network settings (IP addresses, MCC/MNC, TAC)  
- Hardware metrics (CPU, RAM, disk usage)
- Connection status''',
            'responses': {
                200: {
                    'description': 'System attributes retrieved successfully',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'gnb_id': {'type': 'string', 'description': 'gNodeB identifier', 'example': '001'},
                            'gnb_id_length': {'type': 'integer', 'description': 'Length of gNodeB ID', 'example': 24},
                            'nr_band': {'type': 'string', 'description': '5G NR frequency band', 'example': 'n78'},
                            'scs': {'type': 'string', 'description': 'Subcarrier spacing', 'example': '30kHz'},
                            'tx_power': {'type': 'number', 'description': 'Transmission power in dBm', 'example': 23.0},
                            'frequency_down_link': {'type': 'integer', 'description': 'Downlink frequency in Hz', 'example': 3500000000},
                            'ip_address_gnb': {'type': 'string', 'description': 'gNodeB IP address', 'example': '192.168.1.50'},
                            'ip_address_ngc': {'type': 'string', 'description': 'Next Generation Core IP address', 'example': '192.168.1.10'},
                            'ip_address_ngu': {'type': 'string', 'description': 'NG User plane IP address', 'example': '192.168.1.11'},
                            'MCC': {'type': 'string', 'description': 'Mobile Country Code', 'example': '001'},
                            'MNC': {'type': 'string', 'description': 'Mobile Network Code', 'example': '01'},
                            'cell_id': {'type': 'string', 'description': 'Cell identifier', 'example': '1'},
                            'nr_tac': {'type': 'string', 'description': '5G NR Tracking Area Code', 'example': '1'},
                            'sst': {'type': 'string', 'description': 'Slice/Service Type', 'example': '1'},
                            'sd': {'type': 'string', 'description': 'Slice Differentiator', 'example': '000001'},
                            'profile': {'type': 'string', 'description': 'Configuration profile', 'example': 'default'},
                            'cpu_usage': {'type': 'number', 'description': 'Current CPU usage percentage', 'example': 45.2},
                            'cpu_usage_history': {'type': 'array', 'items': {'type': 'number'}, 'description': 'Historical CPU usage data'},
                            'cpu_temp': {'type': 'number', 'description': 'CPU temperature in Celsius', 'example': 65.5},
                            'ram_usage': {'type': 'number', 'description': 'Current RAM usage percentage', 'example': 67.8},
                            'ram_usage_history': {'type': 'array', 'items': {'type': 'number'}, 'description': 'Historical RAM usage data'},
                            'ram_total': {'type': 'integer', 'description': 'Total RAM in MB', 'example': 8192},
                            'drive_total': {'type': 'integer', 'description': 'Total disk space in GB', 'example': 256},
                            'drive_used': {'type': 'integer', 'description': 'Used disk space in GB', 'example': 128},
                            'drive_free': {'type': 'integer', 'description': 'Free disk space in GB', 'example': 128},
                            'board_date': {'type': 'string', 'description': 'Current board date', 'example': '2024-01-15'},
                            'board_time': {'type': 'string', 'description': 'Current board time', 'example': '14:30:25'},
                            'core_connection': {'type': 'string', 'description': 'Core network connection status', 'example': 'CONNECTED'}
                        }
                    }
                },
                500: {
                    'description': 'Server Error',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'error': {'type': 'string'},
                            'details': {'type': 'string'}
                        }
                    }
                }
            }
        })
        def get_attributes():
            """Documentation endpoint - not implemented locally"""
            return {"message": "This is documentation only. Use Swagger UI 'Try it out' to test actual backend."}

        @self.app.route("/api/node_status", methods=["GET"])
        @swag_from({
            'tags': ['Monitoring'],
            'summary': 'Get Node Status',
            'description': f'''Retrieves the current operational status of the gNB node.
            
**Actual Backend:** {self.backend_url}/api/node_status

**Usage:**
```bash
curl -X GET {self.backend_url}/api/node_status
```''',
            'responses': {
                200: {
                    'description': 'Node status retrieved successfully',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'node_status': {
                                'type': 'string',
                                'enum': ['ACTIVE', 'INACTIVE', 'ERROR', 'STARTING', 'STOPPING'],
                                'description': 'Current node operational status',
                                'example': 'ACTIVE'
                            }
                        }
                    }
                },
                500: {
                    'description': 'Server Error',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'error': {'type': 'string'},
                            'details': {'type': 'string'}
                        }
                    }
                }
            }
        })
        def get_node_status():
            """Documentation endpoint - not implemented locally"""
            return {"message": "This is documentation only. Use Swagger UI 'Try it out' to test actual backend."}

        @self.app.route("/api/setup_script", methods=["POST"])
        @swag_from({
            'tags': ['Control'],
            'summary': 'Execute Setup Commands',
            'description': f'''Executes board-specific setup commands such as start, stop, status, or setupv2. For start/setup commands, monitors for 'CELL_IS_UP' status.
            
**Actual Backend:** {self.backend_url}/api/setup_script
            
**⏱️ Expected Execution Times:**
- Stop/Status commands: 5-10 seconds
- Start commands: ~2 minutes (up to 120 seconds timeout)

**Usage Examples:**
```bash
# Start gNB (takes ~2 minutes)
curl -X POST {self.backend_url}/api/setup_script \\
  -H "Content-Type: application/json" \\
  -d '{{"action": "start"}}'

# Stop gNB (takes 5-10 seconds)  
curl -X POST {self.backend_url}/api/setup_script \\
  -H "Content-Type: application/json" \\
  -d '{{"action": "stop"}}'
```

**Important Notes:**
- Start operations monitor for "CELL_IS_UP" indicator
- Operations may timeout after 120 seconds
- Log files are created and can be downloaded''',
            'parameters': [
                {
                    'name': 'body',
                    'in': 'body',
                    'required': True,
                    'schema': {
                        'type': 'object',
                        'required': ['action'],
                        'properties': {
                            'action': {
                                'type': 'string',
                                'enum': ['start', 'stop', 'status', 'setupv2'],
                                'description': 'Command action to execute',
                                'example': 'start'
                            }
                        }
                    }
                }
            ],
            'responses': {
                200: {
                    'description': 'Command executed successfully',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'action': {'type': 'string', 'example': 'start'},
                            'status': {'type': 'string', 'enum': ['ok', 'completed'], 'example': 'ok'},
                            'output': {'type': 'string', 'example': 'Starting gNB...\nCELL_IS_UP\n'},
                            'log_file': {'type': 'string', 'example': '/var/log/gnb/setup_log.txt'},
                            'exit_code': {'type': 'integer', 'example': 0}
                        }
                    }
                },
                400: {
                    'description': 'Bad Request',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'action': {'type': 'string'},
                            'error': {'type': 'string', 'example': 'Unknown action'},
                            'details': {'type': 'string'}
                        }
                    }
                },
                504: {
                    'description': 'Gateway Timeout',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'action': {'type': 'string'},
                            'error': {'type': 'string', 'example': 'timeout'},
                            'details': {'type': 'string', 'example': 'No CELL_IS_UP in 120s'}
                        }
                    }
                }
            }
        })
        def setup_script():
            """Documentation endpoint - not implemented locally"""
            return {"message": "This is documentation only. Use Swagger UI 'Try it out' to test actual backend."}

        @self.app.route("/api/config", methods=["POST"])
        @swag_from({
            'tags': ['Configuration'],
            'summary': 'Update Configuration',
            'description': f'''Updates gNB configuration parameters dynamically. Supports various configuration fields like IP addresses, identifiers, and radio parameters.
            
**Actual Backend:** {self.backend_url}/api/config

**Valid Configuration Fields:**

| Field Name | Type | Category | Description | Example Value |
|------------|------|----------|-------------|---------------|
| `gNBId` | string | Radio | gNodeB identifier | "001" |
| `gNBIdLength` | string | Radio | Length specification for gNodeB ID | "24" |
| `band` | string | Radio | 5G NR frequency band | "n78" |
| `scs` | string | Radio | Subcarrier spacing configuration | "30kHz" |
| `txMaxPower` | string | Radio | Maximum transmission power in dBm | "23.0" |
| `dl_centre_freq` | string | Radio | Downlink center frequency in Hz | "3500000000" |
| `gnbIP` | string | Core | gNodeB IP address | "192.168.1.50" |
| `n3_local_ip` | string | Core | N3 interface local IP address | "192.168.1.51" |
| `n2_local_ip` | string | Core | N2 interface local IP address | "192.168.1.52" |
| `n3_remote_ip` | string | Core | N3 interface remote IP address | "192.168.1.11" |
| `n2_remote_ip` | string | Core | N2 interface remote IP address | "192.168.1.10" |
| `MCC` | string | Core | Mobile Country Code | "001" |
| `MNC` | string | Core | Mobile Network Code | "01" |
| `cellId` | string | Core | Cell identifier | "1" |
| `nrTAC` | string | Core | 5G NR Tracking Area Code | "1" |
| `sst` | string | Core | Network slice service type | "1" |
| `sd` | string | Core | Network slice differentiator | "000001" |

**Usage Examples:**
```bash
# Update gNB IP
curl -X POST {self.backend_url}/api/config \\
  -H "Content-Type: application/json" \\
  -d '{{"field": "gnbIP", "value": "192.168.1.50"}}'

# Update gNB ID Length
curl -X POST {self.backend_url}/api/config \\
  -H "Content-Type: application/json" \\
  -d '{{"field": "gNBIdLength", "value": "28"}}'

# Update NR Band
curl -X POST {self.backend_url}/api/config \\
  -H "Content-Type: application/json" \\
  -d '{{"field": "band", "value": "n77"}}'

# Update TX Power
curl -X POST {self.backend_url}/api/config \\
  -H "Content-Type: application/json" \\
  -d '{{"field": "txMaxPower", "value": "25.0"}}'
```

**Important Notes:**
- Changes take effect immediately upon successful update
- Invalid field names will return an error response
- Some fields may require node restart to fully apply changes
- Field validation is performed before applying changes''',
            'parameters': [
                {
                    'name': 'body',
                    'in': 'body',
                    'required': True,
                    'schema': {
                        'type': 'object',
                        'required': ['field', 'value'],
                        'properties': {
                            'field': {
                                'type': 'string',
                                'description': 'Configuration field to update',
                                'enum': ['gNBId', 'gNBIdLength', 'band', 'scs', 'txMaxPower', 'dl_centre_freq', 'gnbIP', 'n3_local_ip', 'n2_local_ip', 'MCC', 'MNC', 'cellId', 'nrTAC', 'sst', 'sd'],
                                'example': 'gnbIP'
                            },
                            'value': {
                                'type': 'string',
                                'description': 'New value for the configuration parameter',
                                'example': '192.168.1.50'
                            }
                        }
                    }
                }
            ],
            'responses': {
                200: {
                    'description': 'Configuration updated successfully',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'status': {'type': 'string', 'enum': ['success', 'error'], 'example': 'success'},
                            'message': {'type': 'string', 'example': 'Updated gnbIP to 192.168.1.50'}
                        }
                    }
                },
                400: {
                    'description': 'Bad Request',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'status': {'type': 'string', 'example': 'error'},
                            'message': {'type': 'string', 'example': 'Invalid field name or value'}
                        }
                    }
                }
            }
        })
        def update_config():
            """Documentation endpoint - not implemented locally"""
            return {"message": "This is documentation only. Use Swagger UI 'Try it out' to test actual backend."}

        @self.app.route("/api/download/<file_key>", methods=["GET"])
        @swag_from({
            'tags': ['File Management'],
            'summary': 'Download Files',
            'description': f'''Downloads board-specific files such as configuration files or logs. Returns the file as an attachment.
            
**Actual Backend:** {self.backend_url}/api/download/<file_key>

**Usage Examples:**
```bash
# Download config file
curl -X GET {self.backend_url}/api/download/gnb_config -o gnb_config.txt

# Download log file
curl -X GET {self.backend_url}/api/download/log_file -o log_file.txt
```

**Available file keys:** cu_log, du_log, setup_log''',
            'parameters': [
                {
                    'name': 'file_key',
                    'in': 'path',
                    'type': 'string',
                    'required': True,
                    'description': 'Key identifying the file to download (e.g., gnb_config, log_file)',
                    'example': 'gnb_config'
                }
            ],
            'responses': {
                200: {
                    'description': 'File downloaded successfully',
                    'schema': {
                        'type': 'string',
                        'format': 'binary'
                    }
                },
                404: {
                    'description': 'File not found',
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'error': {'type': 'string', 'example': 'Unknown file key'},
                            'available_files': {'type': 'array', 'items': {'type': 'string'}, 'example': ['cu_log', 'du_log', 'setup_log']}
                        }
                    }
                }
            }
        })
        def download_file(file_key):
            """Documentation endpoint - not implemented locally"""
            return {"message": f"This is documentation only. File key: {file_key}. Use Swagger UI 'Try it out' to test actual backend."}

        # Add index route for information
        @self.app.route("/", methods=["GET"])
        def index():
            """Index page with information about the documentation server"""
            return {
                "name": "gNB EMC Dashboard API Documentation Server",
                "version": "1.0.0",
                "description": "Local Swagger documentation server for gNB EMC Dashboard API",
                "backend_server": self.backend_url,
                "documentation_url": f"http://localhost:{self.local_port}/docs/",
                "openapi_spec": f"http://localhost:{self.local_port}/apispec.json",
                "generated_at": datetime.now().isoformat(),
                "instructions": "Visit /docs/ for interactive Swagger UI documentation"
            }

    def start_server(self, open_browser=True):
        """Start the documentation server"""
        print("🚀 Starting gNB EMC Dashboard API Documentation Server")
        print("=" * 70)
        print(f"📄 Swagger UI: http://localhost:{self.local_port}/docs/")
        print(f"📋 OpenAPI JSON: http://localhost:{self.local_port}/apispec.json")
        print(f"🎯 Backend Server: {self.backend_url}")
        print("=" * 70)
        print("📖 Use the Swagger UI to:")
        print("   • View complete API documentation")
        print("   • Test API endpoints interactively")
        print("   • Copy curl commands for your backend")
        print("   • Explore request/response schemas")
        print("=" * 70)
        
        if open_browser:
            print("🌐 Opening Swagger UI in your default browser...")
            threading.Timer(3, lambda: webbrowser.open(f'http://localhost:{self.local_port}/docs/')).start()
        
        print("🛑 Press Ctrl+C to stop the documentation server")
        print()
        
        try:
            self.app.run(host='localhost', port=self.local_port, debug=False)
        except KeyboardInterrupt:
            print("\n🛑 Documentation server stopped")

def main():
    """Main function to start the documentation server"""
    # Parse command line arguments
    backend_ip = DEFAULT_BACKEND_IP
    backend_port = DEFAULT_BACKEND_PORT
    local_port = LOCAL_DOC_PORT
    
    if len(sys.argv) > 1:
        backend_ip = sys.argv[1]
        print(f"Using custom backend IP: {backend_ip}")
    
    if len(sys.argv) > 2:
        try:
            backend_port = int(sys.argv[2])
            print(f"Using custom backend port: {backend_port}")
        except ValueError:
            print(f"Invalid port number: {sys.argv[2]}, using default: {backend_port}")
    
    if len(sys.argv) > 3:
        try:
            local_port = int(sys.argv[3])
            print(f"Using custom local port: {local_port}")
        except ValueError:
            print(f"Invalid local port number: {sys.argv[3]}, using default: {local_port}")
    
    # Create and start documentation server
    doc_server = GnbApiDocumentationServer(backend_ip, backend_port, local_port)
    doc_server.start_server()

if __name__ == "__main__":
    main()