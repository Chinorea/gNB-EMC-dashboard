# gNB-EMS Dashboard Developer Guide

**Version 1.1 - Multi-Board Architecture**

---

## Table of Contents

1. [Acknowledgements](#acknowledgements)  
2. [Setting up / Getting started](#setting-up—getting-started)  
   2.1. [Frontend Setup](#frontend-setup)  
   2.2. [Backend Setup](#backend-setup)  
3. [Architecture Overview](#architecture-overview)  
   3.1. [Multi-Board Architecture](#multi-board-architecture)  
   3.2. [System Components](#system-components)  
   3.3. [Data Flow](#data-flow)  
4. [Design](#design)  
   4.1. [Frontend Components](#frontend-components)  
   4.2. [Backend Components](#backend-components)  
   4.3. [Board Factory System](#board-factory-system)  
   4.4. [Network Scanning System](#network-scanning-system)  
5. [Implementation](#implementation)  
   5.1. [Node status monitoring](#node-status-monitoring)  
   5.2. [Network Discovery & Scanning](#network-discovery--scanning)  
   5.3. [Dashboard visualization](#dashboard-visualization)  
   5.4. [Node control (start/stop)](#node-control-startstop)  
   5.5. [Real-time data updates](#real-time-data-updates)  
   5.6. [Persistent node configuration](#persistent-node-configuration)  
   5.7. [Multi-Board Support](#multi-board-support)  
6. [API Documentation](#api-documentation)  
7. [Development Workflows](#development-workflows)  
   7.1. [Adding New Board Types](#adding-new-board-types)  
   7.2. [Testing & Debugging](#testing--debugging)  
   7.3. [Unit Testing & Quality Assurance](#unit-testing--quality-assurance)  
   7.4. [Deployment](#deployment)  
8. [Design considerations](#design-considerations)  
9. [Appendix: Requirements](#appendix-requirements)  

---

## Acknowledgements

- **[React](https://reactjs.org/)** & **[Material-UI](https://mui.com/)**  
- **[Flask](https://flask.palletsprojects.com/)** & **Flask-CORS**  
- **[Recharts](https://recharts.org/)**  
- **[Leaflet](https://leafletjs.com/)** for interactive mapping and GPS visualization
- **NetworkScanner** custom implementation for device discovery

---

## Setting up / Getting started

### Frontend Setup

1. Navigate to the frontend directory
    ``` bash
    cd frontend
    ```  
2. Install dependencies:  
   ```bash
   npm install
   ```  
3. Install additional mapping dependencies:
   ```bash
   npm install leaflet
   ```
4. Start dev server:  
   ```bash
   npm start
   ```  
   ✅ Dashboard will be available at `http://localhost:3000`

### Backend Setup

**Automatic Setup (Recommended):**

1. Ensure Python 3.9+ is installed:  
   ```bash
   python3 --version
   ```
2. Navigate to project root and run:  
   ```bash
   python3 WebDashboard.py
   ```
   ✅ The system automatically installs dependencies and starts the Flask server

**Manual Setup (If needed):**

1. Install dependencies manually:  
   ```bash
   cd backend/dependencies/flask_pkgs
   pip3 install *.whl --no-deps
   cd ../pexpect_pkgs
   pip3 install *.whl --no-deps
   cd ../pytest_pkgs
   pip3 install *.whl --no-deps
   ```  
2. Run Flask API with board selection:  
   ```bash
   python3 WebDashboard.py --edgeq  # Explicit EdgeQ board
   python3 WebDashboard.py         # Auto-detect board type
   ```  

---

## Architecture Overview

### Multi-Board Architecture

The dashboard implements an extensible multi-board architecture supporting different 5G gNB hardware platforms:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                         │
├─────────────────────────────────────────────────────────────────┤
│  Components: HomePage | NodeDashboard | Map | Sidebar           │
│  Features: Network Scanner | Real-time Updates | Controls       │
└─────────────────────────────────────────────────────────────────┘
                                 │ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                 Backend (Flask + Multi-Board)                   │
├─────────────────────────────────────────────────────────────────┤
│  WebDashboard.py (Entry Point + Auto-Setup)                     │
│  ├── BoardFactory (Auto-Detection & Board Creation)             │
│  ├── Flask.py (REST API Routes)                                 │
│  └── ConfigManager (Board-Specific Configuration)               │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                      Board Implementations                      │
├─────────────────────────────────────────────────────────────────┤
│  BaseBoard (Abstract)                                           │
│  ├── EdgeQBoard (EdgeQ Implementation)                          │
│  ├── [Future Board Types]                                       │
│  └── Board-Specific: Attributes | Commands | Configs            │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Hardware Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  EdgeQ gNB Hardware | Other 5G Platforms | MANET Devices        │
└─────────────────────────────────────────────────────────────────┘
```

### System Components

#### Frontend Components
- **App.js**: Main application with routing, global state, and network scanning coordination
- **Sidebar**: Node management, network discovery, and navigation
- **HomePage**: Grid view of node status cards with real-time updates
- **NodeDashboard**: Detailed metrics, controls, and configuration for individual nodes
- **Map**: Interactive GPS tracking and mesh network visualization
- **NetworkScanner**: Client-side network discovery utility

#### Backend Components
- **WebDashboard.py**: Main entry point with automatic dependency installation and board detection
- **BoardFactory**: Creates appropriate board instances based on detection or user specification
- **Flask.py**: REST API server with board-agnostic endpoints
- **Board Implementations**: Board-specific logic, attributes, and commands
- **ConfigManager**: Handles board-specific configurations and user overrides

### Data Flow

1. **Initialization**:
   - `WebDashboard.py` detects board type and initializes appropriate board instance
   - Flask server starts with board-specific configuration
   - Frontend connects and begins polling

2. **Real-time Monitoring**:
   - Frontend polls `/api/attributes` and `/api/node_status` (5s)
   - Board-specific attribute classes collect hardware data
   - JSON responses sent to frontend for visualization

3. **Network Discovery**:
   - Frontend `NetworkScanner` performs dual-sweep scanning (Health + MANET APIs every 20s)
   - Discovered devices categorized by type (gNB/MANET)
   - Users can add discovered devices to saved nodes

4. **Node Control**:
   - Frontend sends control commands via `/api/setup_script`
   - Backend uses board-specific setup commands
   - Real-time feedback provided to user

---

## Design

### Frontend Components

#### App.js - Main Application
- **Global State Management**: Manages all node data, scanning state, and map data
- **Network Scanning**: Coordinates automatic and manual network discovery
- **Routing**: Handles navigation between pages
- **Real-time Updates**: Manages polling intervals for different data types

```javascript
// Key state management
const [allNodeData, setAllNodeData] = useState([]);
const [autoDiscoveredNodes, setAutoDiscoveredNodes] = useState([]);
const [isNetworkScanning, setIsNetworkScanning] = useState(false);
const [subnet, setSubnet] = useState('192.168.1');
```

#### Sidebar - Navigation & Node Management
- **Manual Node Addition**: Traditional IP-based node configuration
- **Network Discovery**: Integration with scanning results
- **MANET Assignment**: Assign discovered MANET devices to existing nodes
- **Saved Node Management**: Edit, remove, and organize configured nodes

#### NetworkScanner - Device Discovery
- **Dual-Sweep Scanning**: Health API (gNB) + MANET API scanning
- **Concurrent Processing**: Batch processing with configurable concurrency limits
- **Smart Filtering**: Avoids duplicate discovery and filters existing nodes
- **Progress Reporting**: Real-time scan progress and results

### Backend Components

#### BoardFactory - Multi-Board Support
```python
class BoardFactory:
    AVAILABLE_BOARDS = {
        'edgeq': EdgeQBoard
        # Future board types added here
    }
    
    @staticmethod
    def create_board(board_type: str = None):
        if board_type is None:
            board_type = BoardFactory.detect_board_type()
        return BoardFactory.AVAILABLE_BOARDS[board_type.lower()]()
```

#### BaseBoard - Abstract Interface
```python
class BaseBoard(ABC):
    @abstractmethod
    def get_board_name(self) -> str: pass
    
    @abstractmethod  
    def get_board_config(self) -> Dict[str, Any]: pass
    
    @abstractmethod
    def create_attributes(self): pass
    
    @abstractmethod
    def ensure_config_exists(self) -> bool: pass
```

#### EdgeQBoard - Concrete Implementation
- **EdgeQ-Specific Configuration**: Paths, timeouts, and automation parameters
- **Commissioning Automation**: Automated `gnb_commission -g` handling
- **Attribute Creation**: EdgeQ-specific monitoring classes
- **Setup Commands**: EdgeQ `gnb_ctl` integration

### Board Factory System

The board factory system enables support for multiple hardware platforms:

1. **Board Creation**: Factory pattern creates appropriate board instances  
2. **Unified Interface**: All boards implement the same abstract interface
3. **Extensibility**: New boards can be added without modifying existing code

### Network Scanning System

The network discovery system performs intelligent device detection:

1. **Health API Scan**: Detects gNB nodes at `http://[ip]:5000/api/health`
2. **MANET API Scan**: Detects mesh devices at `http://[ip]/status?content=temp`
3. **Batch Processing**: Scans multiple IPs concurrently with rate limiting
4. **Smart Categorization**: Distinguishes between gNB and MANET devices
5. **Integration**: Seamlessly integrates discovered devices into node management

---

## Implementation

### Node status monitoring

**Frontend Implementation:**
1. `App.js` manages multiple polling intervals:
   - **Attributes**: 5-second interval for performance metrics
   - **Status**: 5-second interval for operational state
   - **MANET**: 20-second interval for mesh connectivity
   - **Network Scanning**: 20-second automatic discovery

2. **State Management**: 
   ```javascript
   // Real-time updates flow via state
   useEffect(() => {
     const attributeInterval = setInterval(async () => {
       // Update CPU, RAM, etc. for all nodes
     }, 5000);
   }, [allNodeData]);
   ```

**Backend Implementation:**
Board-specific attribute classes collect real-time data:
```python
# EdgeQ example
class EdgeQCpuUsage(BaseAttribute):
    def refresh(self):
        # EdgeQ-specific CPU monitoring
        pass
```

### Network Discovery & Scanning

**Frontend NetworkScanner:**
```javascript
class NetworkScanner {
  async scanSubnet(subnet, onProgress, onNodeFound) {
    // Dual-sweep: Health API + MANET API
    await this.performSweep(allIPs, 'health', onProgress, onNodeFound);
    await this.performSweep(allIPs, 'manet', onProgress, onNodeFound);
  }
}
```

**Integration with Sidebar:**
- Discovered devices appear in "Scanned Nodes" section
- Color-coded chips distinguish gNB vs MANET devices
- One-click addition to saved nodes

### Dashboard visualization

**Performance Charts:**
- **Recharts** for time-series visualization (CPU/RAM trends)
- **Responsive containers** with automatic scaling
- **Historical data**: ~200 data points with smooth transitions
- **Real-time updates**: Charts update without full re-render

**Interactive Map:**
- **Leaflet** for GPS tracking and mesh network visualization
- **Multiple satellite providers**: Google, ESRI with quality selection
- **Link Quality**: Color-coded lines between mesh nodes
- **Real-time positioning**: Automatic updates from MANET data

### Node control (start/stop)

**Frontend Control Flow:**
```javascript
const handleNodeControl = async (action) => {
  setLoading(true);
  try {
    const response = await fetch('/api/setup_script', {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    // Handle response and update UI
  } finally {
    setLoading(false);
  }
};
```

**Backend Control Flow:**
1. Board factory determines appropriate commands
2. Board-specific setup commands executed
3. Real-time output streamed to response
4. Timeout handling for long operations

### Real-time data updates

**Data Flow Architecture:**
- **Frontend**: Manages polling intervals and state updates
- **Backend**: Board-specific data collection with caching
- **Optimization**: Staggered polling prevents API overwhelming
- **Error Handling**: Graceful degradation on network issues

### Persistent node configuration

**Client-Side Persistence:**
```javascript
// Save to localStorage
const saveNodes = (nodes) => {
  localStorage.setItem('nodes', JSON.stringify(nodes));
};

// Load on app startup
const loadNodes = () => {
  const saved = localStorage.getItem('nodes');
  return saved ? JSON.parse(saved) : [];
};
```

**Configuration includes:**
- Node IP addresses and names
- MANET IP assignments
- Custom node labels
- Network subnet preferences

### Multi-Board Support

**Adding New Board Types:**
1. Create new board class inheriting from `BaseBoard`
2. Implement required abstract methods
3. Add to `BoardFactory.AVAILABLE_BOARDS`
4. Add command-line argument support
5. Test with new hardware platform

**Board-Specific Features:**
- Custom attribute monitoring classes
- Board-specific setup commands
- Hardware-specific configuration paths
- Tailored commissioning procedures

---

## API Documentation

The backend Flask service provides REST API endpoints for monitoring and controlling gNB nodes. This API enables external applications and services to integrate with the gNB Dashboard functionality.

### Interactive Swagger Documentation (Flasgger)

For comprehensive interactive API documentation with "Try it out" functionality, see the **Flasgger Documentation System**:

📖 **[Complete Setup Guide](../docs_generator/README.md)**

**Quick Start:**
1. Navigate to `docs_generator/`
2. Double-click `start_docs.bat` (Windows) or run `python swagger_docs.py`
3. Access interactive documentation at: http://localhost:8080/docs/

**Features:**
- ✅ Interactive "Try it out" testing
- ✅ Real backend integration
- ✅ Professional Swagger UI
- ✅ Copy-paste curl commands
- ✅ Complete request/response schemas

### Base URL
```
http://<gnb-board-ip>:5000/api
```

### Endpoints

#### GET /api/board-info
Get current board information and configuration details.

**Response Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Board Type | `board_type` | string | Type of board hardware (e.g., "EdgeQ") |
| Config Path | `config_path` | string | Absolute path to configuration file on board |
| Log Directory | `log_directory` | string | Directory where system logs are stored |
| Available Files | `available_files` | array[string] | List of downloadable file keys |
| Timeouts | `timeouts` | object | Configuration timeout values |
| Raptor Status Timeout | `timeouts.raptor_status` | number | Timeout for status checks in seconds |
| Setup Max Wait | `timeouts.setup_max_wait` | number | Maximum wait time for setup operations |

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/board-info
```

#### GET /api/attributes
Get comprehensive system attributes and real-time metrics.

**Response Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| gNB ID | `gnb_id` | string | Unique identifier for the gNodeB |
| gNB ID Length | `gnb_id_length` | string | Length specification for gNodeB identifier |
| NR Band | `nr_band` | string | 5G NR frequency band (e.g., "n78") |
| Subcarrier Spacing | `scs` | string | Subcarrier spacing configuration |
| TX Power | `tx_power` | string | Transmission power level in dBm |
| Downlink Frequency | `frequency_down_link` | string | Downlink center frequency in Hz |
| gNB IP Address | `ip_address_gnb` | string | IP address of the gNodeB interface |
| NGC IP Address | `ip_address_ngc` | string | Next Generation Core IP address |
| NGU IP Address | `ip_address_ngu` | string | NG User plane interface IP address |
| Mobile Country Code | `MCC` | string | Mobile Country Code for network identification |
| Mobile Network Code | `MNC` | string | Mobile Network Code for operator identification |
| Cell ID | `cell_id` | string | Unique cell identifier within the network |
| NR TAC | `nr_tac` | string | 5G NR Tracking Area Code |
| Slice Service Type | `sst` | string | Network slice service type identifier |
| Slice Differentiator | `sd` | string | Network slice differentiator value |
| Profile | `profile` | string | Active configuration profile name |
| CPU Usage | `cpu_usage` | number | Current CPU utilization percentage (0-100) |
| CPU Usage History | `cpu_usage_history` | array[number] | Historical CPU usage data points |
| CPU Temperature | `cpu_temp` | number | Current CPU temperature in Celsius |
| RAM Usage | `ram_usage` | number | Current RAM utilization percentage (0-100) |
| RAM Usage History | `ram_usage_history` | array[number] | Historical RAM usage data points |
| RAM Total | `ram_total` | number | Total system RAM in megabytes |
| Drive Total | `drive_total` | number | Total disk space in gigabytes |
| Drive Used | `drive_used` | number | Used disk space in gigabytes |
| Drive Free | `drive_free` | number | Available disk space in gigabytes |
| Board Date | `board_date` | string | Current system date on the board |
| Board Time | `board_time` | string | Current system time on the board |
| Core Connection | `core_connection` | string | Status of connection to core network |

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/attributes
```

#### GET /api/node_status
Get current operational status of the gNB node.

**Response Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Node Status | `node_status` | string | Current operational state: `OFF`, `INITIALISING`, or `RUNNING` |

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/node_status
```

#### POST /api/setup_script
Execute node control commands for managing gNB operations.

**⏱️ Expected Execution Times:**
- **Stop/Status commands**: 5-10 seconds
- **Start commands**: ~2 minutes (up to 120 seconds timeout)

**Request Body Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Action | `action` | string | Command to execute: "start", "stop", "status", or "setupv2" |

**Response Schema (Success):**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Action | `action` | string | Echo of the executed action command |
| Status | `status` | string | Result status: "ok" for successful start/setup, "completed" for stop/status |
| Output | `output` | string | Command execution output and logs from log file |
| Log File | `log_file` | string | Path to the generated log file |
| Exit Code | `exit_code` | number | Process exit code (0 = success) |

**Response Schema (Error):**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Action | `action` | string | Echo of the attempted action command |
| Error | `error` | string | Error type: "timeout", "process_terminated_unexpectedly", etc. |
| Details | `details` | string | Detailed error description and context |
| Output | `output` | string | Partial command output before failure |
| Exit Code | `exit_code` | number | Process exit code (-1 for timeouts, actual code for process failures) |

**Examples:**
```bash
# Start the gNB node (takes ~2 minutes)
curl -X POST http://192.168.1.100:5000/api/setup_script \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Stop the gNB node (takes 5-10 seconds)
curl -X POST http://192.168.1.100:5000/api/setup_script \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

**Important Notes:**
- Start operations monitor for "CELL_IS_UP" indicator before completing
- Long-running operations may timeout after 120 seconds
- Log files are created for all operations and can be downloaded via `/api/download/`
- Start operations will timeout and result in a fail when running it the second time. A physical hardreset is required for subsequent starts.
- Start operations will automatically end if start

#### POST /api/config
Update gNB configuration parameters dynamically.

**Request Body Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Field | `field` | string | Configuration parameter name to update (see valid fields below) |
| Value | `value` | string | New value for the configuration parameter |

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
| `n3_remote_ip` | string | Core | N3 interface local IP address | "192.168.1.10" |
| `n2_remote_ip` | string | Core | N2 interface local IP address | "192.168.1.11" |
| `MCC` | string | Core | Mobile Country Code | "001" |
| `MNC` | string | Core | Mobile Network Code | "01" |
| `cellId` | string | Core | Cell identifier | "1" |
| `nrTAC` | string | Core | 5G NR Tracking Area Code | "1" |
| `sst` | string | Core | Network slice service type | "1" |
| `sd` | string | Core | Network slice differentiator | "000001" |

**Response Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Status | `status` | string | Operation result: "success" or "error" |
| Message | `message` | string | Descriptive message about the operation result |

**Examples:**
```bash
# Update gNB IP configuration
curl -X POST http://192.168.1.100:5000/api/config \
  -H "Content-Type: application/json" \
  -d '{"field": "gnbIP", "value": "192.168.1.50"}'

# Update gNB ID Length
curl -X POST http://192.168.1.100:5000/api/config \
  -H "Content-Type: application/json" \
  -d '{"field": "gNBIdLength", "value": "28"}'

# Update NR Band
curl -X POST http://192.168.1.100:5000/api/config \
  -H "Content-Type: application/json" \
  -d '{"field": "band", "value": "n77"}'
```

**Important Notes:**
- Changes take effect immediately upon successful update
- Invalid field names will return an error response
- Fields will require node restart to fully apply changes
- Field validation is performed before applying changes

#### GET /api/download/<file_key>
Download board-specific files and logs.

**Parameters:**
- `file_key`: String identifier for the file to download

**Response:** File download (binary content) or error message

**Error Response Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Error | `error` | string | Error description for invalid file keys |
| Available Files | `available_files` | array[string] | List of valid file keys that can be downloaded |

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/download/log_file \
  -o downloaded_log.txt
```

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success - Request completed successfully
- `400`: Bad Request - Invalid request format or parameters
- `500`: Internal Server Error - Server-side processing error
- `504`: Gateway Timeout - Operation timed out

**Standard Error Response Schema:**

| Name | JSON Attribute | Type | Remarks |
|------|----------------|------|---------|
| Error | `error` | string | Brief error description |
| Details | `details` | string | Additional error context and troubleshooting information |
| Status | `status` | string | Always "error" for error responses |

### Rate Limiting

The API is designed for dashboard polling and control operations:
- Attribute monitoring: Recommended polling interval of 1-3 seconds
- Status checks: Recommended polling interval of 3-5 seconds
- Control operations: Should be user-initiated, not automated

### Integration Examples

#### Python Integration
```python
import requests
import json

# Monitor node attributes
response = requests.get('http://192.168.1.100:5000/api/attributes')
if response.status_code == 200:
    data = response.json()
    print(f"CPU Usage: {data['cpu_usage']}%")
    print(f"RAM Usage: {data['ram_usage']}%")

# Start node
payload = {"action": "start"}
response = requests.post(
    'http://192.168.1.100:5000/api/setup_script',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(payload)
)
```

#### JavaScript Integration
```javascript
// Fetch node status
async function getNodeStatus() {
  try {
    const response = await fetch('http://192.168.1.100:5000/api/node_status');
    const data = await response.json();
    console.log('Node Status:', data.node_status);
  } catch (error) {
    console.error('Error fetching status:', error);
  }
}

// Update configuration
async function updateConfig(field, value) {
  try {
    const response = await fetch('http://192.168.1.100:5000/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value })
    });
    const result = await response.json();
    console.log('Config update:', result);
  } catch (error) {
    console.error('Error updating config:', error);
  }
}
```

---

[Architecture Diagram](./puml files/architecture.puml)

## Development Workflows

### Adding New Board Types

**Step 1: Create Board Implementation**
```python
# backend/boards/new_board.py
from .base_board import BaseBoard

class NewBoard(BaseBoard):
    def get_board_name(self) -> str:
        return "NewBoard"
    
    def get_board_config(self) -> Dict[str, Any]:
        return {
            "config_file_path": "/path/to/config",
            "setup_commands": {...},
            # Board-specific configuration
        }
    
    def create_attributes(self):
        return {
            'cpu_usage': NewBoardCpuUsage(),
            'custom_attr': NewBoardCustomAttr(),
            # Board-specific attributes
        }
```

**Step 2: Register with BoardFactory**
```python
# backend/board_factory.py
from boards.new_board import NewBoard

class BoardFactory:
    AVAILABLE_BOARDS = {
        'edgeq': EdgeQBoard,
        'newboard': NewBoard  # Add new board
    }
```

**Step 3: Add Detection Logic**
```python
@staticmethod
def detect_board_type():
    if os.path.exists("/opt/newboard/bin/control"):
        return "newboard"
    # Existing detection logic...
```

**Step 4: Create Board-Specific Attributes**
```python
# backend/logic/newboard_attributes/NewBoardCpuUsage.py
from logic.shared_attributes.BaseAttribute import BaseAttribute

class NewBoardCpuUsage(BaseAttribute):
    def __init__(self):
        super().__init__()
        self.value = 0.0
        
    def refresh(self):
        # Board-specific CPU monitoring implementation
        pass
```

**Step 5: Add Command-Line Support**
```python
# In board_factory.py parse_board_from_args()
board_group.add_argument('--newboard', action='store_true',
                        help='Use NewBoard configuration')
```

### Testing & Debugging

**Frontend Testing:**
```bash
# Run frontend tests
cd frontend
npm test

# Debug network scanning
# Check browser console for NetworkScanner logs
console.log("NetworkScanner: Starting scan...");

# Test individual components
npm test -- --testNamePattern="NetworkScanner"
```

**Backend Testing:**
```bash
# Test board detection
python3 WebDashboard.py --help

# Test specific board
python3 WebDashboard.py --edgeq

# Debug API endpoints
curl http://localhost:5000/api/board-info
curl http://localhost:5000/api/attributes

# Test board-specific functionality
python3 -c "from board_factory import BoardFactory; print(BoardFactory.get_available_boards())"
```

**Network Scanning Testing:**
```javascript
// Frontend testing in browser console
const scanner = new NetworkScanner();
scanner.scanUserSubnet('192.168.1', 
  (progress) => console.log('Progress:', progress),
  (node) => console.log('Found node:', node)
);
```

**Integration Testing:**
- Test frontend-backend communication across all board types
- Verify network scanning with multiple device types
- Test MANET assignment workflows
- Validate real-time updates with high node counts
- Performance testing with 20+ nodes

### Unit Testing & Quality Assurance

The gNB-EMC Dashboard includes a comprehensive unit testing suite to ensure code quality, reliability, and maintainability. Our testing framework covers all critical components and workflows.

#### 📊 Testing Status (Updated June 2025)
- **8 test suites** ✅ **ALL PASSING**
- **40 tests** ✅ **ALL PASSING**  
- **100% localStorage functionality** ✅
- **Complete JSDOM environment** ✅
- **Clean console output** ✅ **NO NOISE**
- **Fast execution** ⚡ **~25 seconds**

#### 🚀 Quick Testing Commands

```bash
# Navigate to frontend directory
cd frontend/

# Run all tests (recommended - works perfectly)
npm test

# Run tests in watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI/CD pipelines
npm run test:ci

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:utils         # Utility tests only

# Alternative commands (if needed)
npm run test:react-scripts # Use react-scripts (fallback option)
```

#### ✅ Current Status
After recent optimizations, all testing commands work flawlessly:
- ✅ **npm test** - Now detects and runs all 40 tests correctly
- ✅ **Console output** - Clean, no noise during test execution  
- ✅ **Fast execution** - Complete test suite runs in ~25 seconds
- ✅ **Cross-platform** - Works on Windows, macOS, and Linux

#### 🎯 Test Categories

**Unit Tests**
Focus on individual components and classes:
- **App.test.js**: Main application routing and state management
- **HomePage.test.js**: Home page rendering and node display
- **NetworkScanner.test.js**: Network discovery class functionality
- **NodeInfo.test.js**: Node information management

**Integration Tests**
Test complete workflows and data flows:
- **LocalStoragePersistence.test.js**: Data persistence across sessions
- **NetworkScanning.test.js**: End-to-end network discovery
- **MapDataFlow.test.js**: Map data processing and API integration

**Utility Tests**
Test pure functions and calculations:
- **utils.test.js**: Voltage conversion with calibrated ranges (7.0V - 8.6V)

#### ⚡ Voltage Testing

The testing suite includes comprehensive validation of your calibrated voltage ranges:

| Voltage | Percentage | Description |
|---------|------------|-------------|
| 7.0V    | 0%         | Empty battery |
| 7.5V    | 20%        | Low battery |
| 8.0V    | 50%        | Medium battery |
| 8.3V    | 80%        | High battery |
| 8.6V    | 100%       | Full battery |
| < 7.0V  | 'unknown'  | Below range |
| > 8.6V  | 'unknown'  | Above range |

#### 🛠 Testing Features

**✅ Backend Independence**
- All API calls are mocked for reliable testing
- No actual backend required for test execution
- Simulates real network responses and error scenarios

**✅ Cross-Platform Compatibility**
- Runs on Windows, macOS, and Linux
- Uses Jest with jsdom for browser environment simulation
- Consistent results across different development environments

**✅ Real-World Scenario Testing**
- Network discovery and scanning workflows
- Map data loading from multiple sources
- localStorage persistence and recovery
- Error handling and edge cases
- API failures and timeout scenarios

#### 📁 Testing Structure

```
frontend/testing/
├── setupTests.js           # Global test environment setup
├── testUtils.js            # Testing utilities and helpers
├── mockConfigs.js          # Centralized mock configurations
├── README.md               # Detailed testing documentation
├── __mocks__/              # Mock implementations
│   ├── leaflet.js          # Leaflet map library mock
│   ├── mockData.js         # Test data constants
│   ├── NetworkScanner.js   # NetworkScanner class mock
│   └── NodeInfo.js         # NodeInfo class mock
├── unit/                   # Component unit tests
├── integration/            # End-to-end workflow tests
└── utils/                  # Utility function tests
```

#### 🔧 Test Configuration

- **Jest Configuration**: Optimized for React component testing
- **JSDOM Environment**: Full browser API simulation
- **Automatic Mocking**: localStorage, fetch, and browser APIs
- **Coverage Reports**: Generated in `testing/coverage/`

#### 🎉 Testing Benefits

- **Regression Prevention**: Catch breaking changes early
- **Code Quality**: Maintain high standards and best practices
- **Developer Confidence**: Safe refactoring and feature development
- **Documentation**: Tests serve as usage examples
- **CI/CD Ready**: Automated testing in deployment pipelines

#### 📖 Detailed Testing Documentation

For comprehensive testing guides, setup instructions, and troubleshooting:

**📋 [Frontend Testing Guide](../frontend/testing/README.md)**
- Complete testing utilities and helpers
- Mock configurations and test data
- Voltage testing with calibrated ranges
- Browser API mocking and setup
- Troubleshooting common testing issues

This dedicated testing README contains:
- **Test Structure**: Detailed file organization
- **Mock Configurations**: Centralized testing setup
- **Voltage Testing**: Your specific 7.0V-8.6V calibration
- **Test Utilities**: Render helpers and data generators
- **Best Practices**: Testing patterns and conventions
- **Maintenance Guide**: Adding new tests and updating mocks

### Deployment

**Development Environment:**
```bash
# Frontend development
cd frontend && npm start

# Backend development with hot reload
cd backend && python3 WebDashboard.py --edgeq
```

**Production Deployment:**
1. **Frontend Build:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Backend Package:**
   ```bash
   # Ensure all dependencies are in backend/dependencies/
   ls backend/dependencies/
   # flask_pkgs/ pexpect_pkgs/ pytest_pkgs/
   ```

3. **Board Configuration:**
   - Verify board-specific paths exist on target hardware
   - Test board detection and attribute collection
   - Validate setup commands work correctly

4. **Network Configuration:**
   ```bash
   # Configure firewalls for required ports
   sudo ufw allow 3000/tcp  # Frontend
   sudo ufw allow 5000/tcp  # Backend API
   ```

**Release Checklist:**
- [ ] Test all supported board types
- [ ] Verify network scanning functionality across subnets
- [ ] Test MANET assignment workflows
- [ ] Validate API documentation accuracy
- [ ] Performance testing with multiple nodes
- [ ] Cross-browser compatibility testing
- [ ] Mobile responsiveness validation
- [ ] Error handling and recovery testing

**Docker Deployment (Optional):**
```bash
# Build frontend container
cd frontend
docker build -t gnb-dashboard-frontend .

# Build backend container
cd ../backend
docker build -t gnb-dashboard-backend .

# Run with docker-compose
docker-compose up -d
```

**Production Environment Setup:**
1. **Hardware Requirements:**
   - Frontend Server: 2GB RAM, 2 CPU cores minimum
   - Backend on gNB: 1GB RAM, 1 CPU core minimum
   - Network: Stable TCP/IP connectivity

2. **Security Configuration:**
   ```bash
   # SSL/TLS setup (recommended for production)
   # Configure reverse proxy (nginx/apache)
   # Set up authentication if required
   # Enable firewall rules
   ```

3. **Monitoring Setup:**
   - Set up log aggregation
   - Configure health checks
   - Monitor resource usage
   - Set up alerting for failures

**Backup and Recovery:**
- Regular backup of node configurations
- Database backup procedures (if applicable)
- Recovery procedures documentation
- Disaster recovery testing

---
