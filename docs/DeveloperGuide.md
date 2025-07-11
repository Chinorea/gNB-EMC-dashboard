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
   7.3. [Deployment](#deployment)  
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

**Testing Overview:**

The dashboard includes comprehensive testing for both frontend and backend components:

**Frontend Testing:**
- Unit tests for React components using Jest and React Testing Library
- Integration tests for user workflows and component interactions
- Network scanning and real-time update testing
- Coverage reports and automated test execution

**Backend Testing:**
- Unit tests for board factory, configuration manager, and API endpoints
- Board-specific attribute testing with mock implementations
- API integration testing with comprehensive request/response validation
- Logging system testing for debugging and troubleshooting

📖 **[Complete Testing Documentation](../frontend/testing/README.md)**

**Quick Testing Commands:**
```bash
# Frontend testing
cd frontend
npm test

# Backend testing
cd backend
python3 -m pytest tests/

# Debug network scanning
# Check browser console for NetworkScanner logs
console.log("NetworkScanner: Starting scan...");

# Debug API endpoints
curl http://localhost:5000/api/board-info
curl http://localhost:5000/api/attributes
```

**Testing Logs:**
- Frontend testing includes comprehensive test coverage tracking
- Backend testing validates board-specific functionality with detailed logs
- Log monitoring available for troubleshooting and system verification
- Test execution logs help identify integration issues and performance bottlenecks
```

**Important Notes:**
- Ensure all tests pass before committing changes
- Use `npm run coverage` to check frontend test coverage
- Backend tests require a running instance of the Flask app
- Debugging information is logged to the console and server logs

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
   npm start
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



---

## Design considerations

### Architecture Decisions

1. **Multi-Board Extensibility vs. Complexity**
   - **Choice**: Factory pattern with abstract base classes
   - **Rationale**: Supports future hardware without breaking existing code
   - **Trade-off**: Increased complexity for single-board deployments

2. **Network Discovery vs. Manual Configuration**
   - **Choice**: Dual-sweep automatic scanning with manual override
   - **Rationale**: Reduces operator workload while maintaining flexibility
   - **Trade-off**: Network overhead from scanning operations

3. **Real-time Performance vs. Resource Usage**
   - **Choice**: Staggered polling intervals (5s/15s)
   - **Rationale**: Balances responsiveness with system load
   - **Trade-off**: Some latency in status updates

4. **Client-side vs. Server-side State Management**
   - **Choice**: React state with localStorage persistence
   - **Rationale**: Responsive UI with offline capability
   - **Trade-off**: State synchronization complexity

5. **REST API vs. WebSockets**
   - **Choice**: RESTful polling for most operations
   - **Rationale**: Simpler implementation and debugging
   - **Trade-off**: Higher network overhead than WebSockets

### Performance Considerations

**Frontend Optimizations:**
- React.memo() for expensive components
- useCallback() for event handlers
- Debounced network scanning triggers
- Efficient re-rendering strategies

**Backend Optimizations:**
- Attribute caching to reduce hardware calls
- Batch processing for multi-node operations
- Timeout management for long-running commands
- Memory-efficient data structures

**Network Optimizations:**
- Concurrent scanning with rate limiting
- Smart filtering to avoid redundant requests
- Compression for large responses
- Connection pooling for frequent requests

### Security Considerations

**API Security:**
- Input validation for all endpoints
- Rate limiting to prevent abuse
- Error messages that don't leak sensitive information
- Secure default configurations

**Network Security:**
- CORS configuration for frontend access
- Firewall rules for required ports only
- No hardcoded credentials in code
- Secure communication protocols

**Board Access:**
- Controlled access to board-specific commands
- Logging of all control operations
- Timeout enforcement for safety
- Graceful error handling

### Scalability Considerations

**Horizontal Scaling:**
- Stateless backend design enables multiple instances
- Frontend can connect to multiple backend instances
- Load balancing considerations for API calls

**Vertical Scaling:**
- Efficient memory usage for large node counts
- CPU optimization for real-time data processing
- Storage optimization for historical data

**Future Extensibility:**
- Plugin architecture for new board types
- Modular attribute system
- Configurable polling intervals
- Extensible API design

---

## Appendix: Requirements

### Product scope

**Target Users:**
- **Network Engineers**: System design and architecture planning
- **Field Operators**: Day-to-day monitoring and control operations  
- **Support Engineers**: Troubleshooting and maintenance tasks
- **System Integrators**: API integration and custom development

**Value Proposition:**
- **Unified Interface**: Single dashboard for multiple board types and network elements
- **Real-time Monitoring**: Live performance metrics and status updates
- **Automated Discovery**: Reduces manual configuration overhead
- **Remote Control**: Safe and reliable remote node management
- **Extensible Platform**: Supports future hardware and integration needs

### User stories

| Priority | Role               | Feature                  | Benefit                       |
| -------- | ------------------ | ------------------------ | ----------------------------- |
| ***      | Network Engineer   | See all node statuses    | Quickly spot failures across the network |
| ***      | Operator           | Start/stop nodes         | Remote control without physical access |
| ***      | Support Engineer   | View CPU/RAM/disk metrics| Diagnose performance issues efficiently |
| ***      | Operator           | Network device discovery | Automatically find new equipment |
| **       | Network Engineer   | Historical trends        | Identify recurring issues and patterns |
| **       | Operator           | Add/remove nodes         | Flexible dashboard configuration |
| **       | Support Engineer   | MANET GPS tracking       | Visualize mesh network topology |
| **       | System Integrator  | API access              | Integrate with existing systems |
| *        | Support Engineer   | Download logs            | Advanced troubleshooting capabilities |
| *        | Network Engineer   | Multi-board support      | Manage heterogeneous networks |

### Use cases

#### Use Case: UC01 - Monitor Node Status

**Main Success Scenario (MSS):**
1. User opens the dashboard homepage
2. System displays all configured nodes with their current status
3. System continually updates the status automatically every 3 seconds
4. Use case ends

**Extensions:**
- **2a.** No nodes are configured yet
  - 2a1. System shows empty node list with help text
  - 2a2. User can add nodes manually or via network discovery
  - Use case resumes from Step 2

#### Use Case: UC02 - Discover Network Devices

**MSS:**
1. User configures network subnet in sidebar
2. User triggers network scan or system performs automatic scan
3. System performs dual-sweep scan (Health API + MANET API)
4. System displays discovered devices categorized by type
5. User adds desired devices to saved nodes
6. Use case ends

**Extensions:**
- **3a.** No devices respond to scan
  - 3a1. System displays "no devices found" message
  - 3a2. User may try different subnet or manual addition
  - Use case ends

#### Use Case: UC03 - Assign MANET to Node

**MSS:**
1. User performs network scan that discovers MANET devices
2. User clicks add button next to MANET device
3. System opens MANET assignment dialog
4. User selects existing gNB node for assignment
5. System assigns MANET IP to selected node
6. Use case ends

**Extensions:**
- **4a.** No existing gNB nodes available
  - 4a1. System displays message requiring gNB node first
  - 4a2. User must add gNB node before MANET assignment
  - Use case ends

#### Use Case: UC04 - View Node Details

**MSS:**
1. User clicks on a node card on the homepage
2. System navigates to the node dashboard view
3. System displays detailed metrics, controls, and real-time charts
4. System updates metrics automatically every 1-3 seconds
5. Use case ends

**Extensions:**
- **3a.** Node is unreachable
  - 3a1. System displays limited view with error indication
  - 3a2. User may navigate back or retry connection
  - Use case ends

#### Use Case: UC05 - Control Node Operations

**MSS:**
1. User navigates to a node's dashboard
2. User clicks the "Turn On" or "Turn Off" button
3. System sends board-specific command to the node
4. System displays operation progress with real-time output
5. System updates the node status when operation completes
6. Use case ends

**Extensions:**
- **3a.** Command fails or times out
  - 3a1. System displays error notification with details
  - 3a2. User may retry the operation or check node connectivity
  - Use case resumes from Step 3

#### Use Case: UC06 - Add Node to Dashboard

**MSS:**
1. User enters a node IP in the sidebar form
2. User clicks "Add" or presses Enter
3. System creates new NodeInfo instance with board detection
4. System adds the node to the tracked list
5. System begins polling the node status and attributes
6. Use case ends

**Extensions:**
- **5a.** Node is unreachable
  - 5a1. System still adds the node but shows as disconnected
  - 5a2. System continues periodic connection attempts
  - Use case ends

### Non-Functional Requirements

1. **Performance Requirements**
   - Real-time updates with < 5 seconds latency
   - Support for ≥ 20 concurrent nodes
   - Network scanning completes within 20 seconds
   - Dashboard responsive on 1920x1080 displays

2. **Reliability Requirements**
   - 90% uptime for monitoring functions
   - Graceful recovery from network errors
   - Automatic reconnection for lost connections
   - Data integrity during system failures

3. **Usability Requirements**
   - Intuitive interface requiring < 30 minutes training
   - Responsive design supporting desktop and tablet
   - Consistent UI patterns across all pages
   - Comprehensive error messages and help text

4. **Compatibility Requirements**
   - Modern web browsers (Chrome, Firefox, Safari, Edge)
   - Python 3.9+ for backend systems
   - Linux-based gNB hardware platforms
   - Network protocols: HTTP/HTTPS, TCP/IP

5. **Security Requirements**
   - Input validation on all API endpoints
   - Secure communication protocols
   - Access logging for audit trails
   - No hardcoded credentials

6. **Maintainability Requirements**
   - Modular architecture supporting new board types
   - Comprehensive API documentation
   - Automated dependency management
   - Clear separation of concerns

### Glossary

**Technical Terms:**
- **gNB (5G Node B)**: 5G base station providing radio coverage
- **RAN (Radio Access Network)**: Mobile network radio infrastructure
- **MANET (Mobile Ad Hoc Network)**: Self-configuring wireless mesh network radio
- **PCI (Physical Cell ID)**: Unique cell identifier in mobile networks
- **SNR (Signal-to-Noise Ratio)**: Signal quality measurement

**System Terms:**
- **Board Factory**: Design pattern for creating board-specific instances
- **Dual-Sweep Scanning**: Two-phase network discovery (Health + MANET APIs)
- **NodeInfo**: Frontend class representing a monitored gNB node
- **Raptor Status**: EdgeQ-specific operational states (OFF/INITIALISING/RUNNING)

**API Terms:**
- **Health API**: REST endpoint for gNB node status checking
- **MANET API**: REST endpoint for mesh device discovery
- **Setup Script**: Backend command execution system
- **Board Detection**: Automatic identification of hardware platform

---

## References

- **React**: https://reactjs.org/
- **Material-UI**: https://mui.com/
- **Flask**: https://flask.palletsprojects.com/
- **Recharts**: https://recharts.org/
- **Leaflet**: https://leafletjs.com/
- **Swagger/OpenAPI**: https://swagger.io/

---

## Offline Maps System

The dashboard implements an offline maps capability that allows the application to work without an internet connection while still providing full map visualization. This system is critical for field deployments where internet connectivity may be unavailable or restricted.

**Disclamer: The offline maps details are not the best due to limited file space. Always try to use online maps for the best resolution. This issue may be fixed in future releases of the app.**

### PMTiles Implementation

The offline maps system uses the PMTiles format, a single-file archive format for map tiles optimized for HTTP range requests, developed by Protomaps.

#### Overview

PMTiles (Protomaps Tiles) provides several key advantages for our offline mapping needs:

- **Single file format**: All map data for a region is contained in one `.pmtiles` file
- **Efficient random access**: Enables fast loading of specific map tiles
- **Compact storage**: Optimized compression for map data
- **Cross-platform support**: Works in browsers via JavaScript and WebAssembly

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Map Component (Leaflet)                       │
├─────────────────────────────────────────────────────────────────┤
│  useOfflineMaps() Hook ◄───────────┐                            │
│  │                                 │                            │
│  ▼                                 │                            │
│  PMTiles Protocol Handler          │ createPMTilesLayer()       │
│  (window.pmtilesProtocol)          │                            │
│                                    │                            │
│  OfflineMapsHandler.js             │                            │
└────────────────────┬──────────────┬┘                            │
                     │              │                             │
     ┌───────────────▼───┐     ┌────▼────────────────────┐        │
     │  PMTiles File     │     │  Custom Paint Rules     │        │
     │  (*.pmtiles)      │     │  (Styling & Rendering)  │        │
     └───────────────────┘     └─────────────────────────┘        │
                     ▲                                            │
                     │                                            │
┌────────────────────┴────────────────────────────────────────────┘
│                    protomaps-leaflet Library                    │
└─────────────────────────────────────────────────────────────────┘
```

### Creating Offline Map Files

To create PMTiles files for offline use, follow these steps:

#### 1. Install PMTiles Tools

**Recommended Method: Downloading Latest Release from Github**

You are only required to extract the exe file from the zip folder to be used. Just go to the directory where the exe file is placed in to start using it.
Download the latest release from the link below:
https://github.com/protomaps/go-pmtiles/releases



**Alternative Method: Download through Npm**
```bash
# Install the PMTiles CLI tool
npm install -g pmtiles
```

#### 2. Acquire Source Data

**Recommended Method: Direct Extract from Protomaps Base Layer**

The most efficient method is to extract specific regions directly from the Protomaps global base layer, by downloading through the PMTiles CLI tool:

```bash
# Extract a specific geographical area using bounding box coordinates
# Format: --bbox=min_lon,min_lat,max_lon,max_lat
pmtiles extract https://build.protomaps.com/20250708.pmtiles singapore.pmtiles --bbox=103.6,1.2,104.1,1.5

# Extract a larger area with limited zoom level (reduces file size)
pmtiles extract https://build.protomaps.com/20250708.pmtiles queensland_z10.pmtiles --bbox=142.5,-29.2,154.0,-9.8 --maxzoom=10
```

This method allows you to:
- Extract precisely the region you need
- Control the maximum zoom level to manage file size
- Use the latest Protomaps data (update the date in the URL as needed)
- Download only what's needed rather than the entire planet file
- https://maps.protomaps.com/builds/ you can refer to this link for the latest build

**Alternative Methods:**

If you have specific requirements or existing data, you can also use these approaches:

**Option A: Convert from MBTiles**
```bash
# Convert from MBTiles format (if you have existing MBTiles)
pmtiles convert source.mbtiles destination.pmtiles
```

**Option B: Extract from OpenStreetMap**
```bash
# 1. Download OSM data for the region
wget https://download.geofabrik.de/asia/malaysia-singapore-brunei-latest.osm.pbf

# 2. Install Tilemaker
# Follow instructions at https://github.com/systemed/tilemaker

# 3. Convert OSM data to PMTiles
tilemaker --input malaysia-singapore-brunei-latest.osm.pbf --output singapore.pmtiles \
  --bbox 103.6 1.2 104.1 1.5 --config resources/config-openmaptiles.json \
  --process resources/process-openmaptiles.lua
```

**Option C: Use Pre-built Protomaps Data**
```bash
# Download pre-built country or region extract
curl -O https://protomaps.com/extracts/[COUNTRY_OR_REGION].pmtiles
```

#### 3. Optimize for Size and Performance

PMTiles files can be optimized to balance quality and size:

```bash
# Limit maximum zoom level (reduces file size significantly)
pmtiles extract source.pmtiles reduced_zoom.pmtiles --maxzoom=12

# Select specific layers to include (reduces complexity and size)
pmtiles extract source.pmtiles minimal.pmtiles --layers=water,roads,buildings

# Compress output to reduce file size
pmtiles extract source.pmtiles compressed.pmtiles --compression=gzip
```

**File Size Guidelines:**
- Small area (single city): 5-20 MB
- Medium area (state/province): 50-200 MB
- Large area (small country): 200-500 MB
- Very detailed area: Consider splitting into multiple files

#### 4. Deploy to Application

Place PMTiles files in the frontend's public folder:

```
frontend/
  └── public/
      └── offline-maps/
          ├── singapore.pmtiles
          ├── queensland.pmtiles
          └── default.pmtiles
```

### Integrating Offline Maps

#### Installation

```bash
# Install required packages
npm install pmtiles leaflet protomaps-leaflet
```

#### Frontend Implementation

**1. Map Component:**
```javascript
// Map.js - Key parts
import * as pmtiles from "pmtiles";
import * as protomaps from "protomaps-leaflet";

const Map = ({ nodeCoordinates }) => {
  useEffect(() => {
    // Initialize PMTiles protocol
    window.pmtilesProtocol = new pmtiles.Protocol();

    // Create map instance
    const map = L.map('map').setView([1.3521, 103.8198], 12);
    
    // Register PMTiles protocol
    protomaps.register({
      map: map,
      protocol: window.pmtilesProtocol,
    });

    // Use offline map tiles
    const offlineLayer = protomaps.leafletLayer({
      url: "offline-maps/singapore.pmtiles",
      attribution: "© Protomaps © OpenStreetMap contributors",
      style: protomaps.defaultStyle
    }).addTo(map);

    // Add node markers
    nodeCoordinates.forEach(node => {
      L.marker([node.lat, node.lng], { title: node.name }).addTo(map);
    });
    
    return () => map.remove();
  }, [nodeCoordinates]);

  return <div id="map" style={{ height: '500px', width: '100%' }} />;
};
```

**2. Internet Connectivity Detection:**
```javascript
// OfflineMapsHandler.js
export const useOfflineMaps = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mapSource, setMapSource] = useState('offline');
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMapSource(localStorage.getItem('preferredMapSource') || 'online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setMapSource('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOnline,
    mapSource,
    setMapSource: (source) => {
      setMapSource(source);
      localStorage.setItem('preferredMapSource', source);
    }
  };
};
```

**3. Creating Map Layers:**
```javascript
// Creating map layers with options for online/offline
export const createMapLayer = (mapSource) => {
  if (mapSource === 'offline') {
    return protomaps.leafletLayer({
      url: "offline-maps/default.pmtiles",
      attribution: "© Protomaps © OpenStreetMap contributors",
      style: protomaps.defaultStyle
    });
  } else {
    // Online map providers
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
  }
};
```

### Multi-Region Support

For deployments in different geographical regions, implement a region selector:

```javascript
// Region selector component
const RegionSelector = ({ onRegionChange }) => {
  const regions = [
    { id: 'singapore', name: 'Singapore', file: 'singapore.pmtiles', center: [1.3521, 103.8198] },
    { id: 'queensland', name: 'Queensland', file: 'queensland.pmtiles', center: [-23.8, 148.0] },
    // Add more regions as needed
  ];
  
  return (
    <select onChange={(e) => {
      const region = regions.find(r => r.id === e.target.value);
      onRegionChange(region);
    }}>
      {regions.map(region => (
        <option key={region.id} value={region.id}>{region.name}</option>
      ))}
    </select>
  );
};
```

### Automatic Updates for Field Deployments

For automatically updating offline maps when internet becomes available:

```javascript
// In OfflineMapUpdater.js
export const checkForMapUpdates = async () => {
  if (!navigator.onLine) return;
  
  try {
    const response = await fetch('https://api.server.com/map-versions');
    const versions = await response.json();
    
    const localVersions = JSON.parse(localStorage.getItem('mapVersions') || '{}');
    
    for (const [region, version] of Object.entries(versions)) {
      if (version > (localVersions[region] || 0)) {
        // Download new map version
        await downloadMapFile(region, version);
        localVersions[region] = version;
      }
    }
    
    localStorage.setItem('mapVersions', JSON.stringify(localVersions));
  } catch (error) {
    console.error('Failed to check for map updates:', error);
  }
};

const downloadMapFile = async (region, version) => {
  try {
    const response = await fetch(`https://api.server.com/maps/${region}-${version}.pmtiles`);
    const blob = await response.blob();
    
    // Save to IndexedDB for persistent storage
    await saveMapToStorage(region, blob);
  } catch (error) {
    console.error(`Failed to download map for ${region}:`, error);
  }
};
```

### Performance Considerations

- **Memory Usage**: PMTiles loads only the needed tiles, keeping memory usage low
- **Caching**: Implement browser caching for frequently accessed regions
- **Progressive Loading**: The format supports progressive loading for better UX
- **Zoom Level Control**: Limit maximum zoom for better performance on low-end devices
- **Layer Selection**: Only include necessary map features for your application

By implementing this offline maps system, the gNB-EMS Dashboard ensures full mapping functionality even in environments with limited or no internet connectivity, making it suitable for field deployments in remote areas.

---

## Enhanced Network Discovery

The network discovery system is enhanced with intelligent scanning and device classification features. It not only detects devices but also classifies them into categories for better management and visualization.

### Key Enhancements

1. **Device Classification**:
   - Discovered devices are classified into categories: `gNB`, `MANET`, and `Unknown`.
   - Classification is based on the presence of specific API endpoints and response patterns.

2. **Intelligent Scanning**:
   - Scanning is adaptive and can change intervals and methods based on network conditions and previous discoveries.
   - Failed discovery attempts are retried with exponential backoff.

3. **Integration with Node Management**:
   - Discovered devices can be directly added to node management from the discovery interface.
   - Manual and automatic discovery results are merged for a unified view.

### Implementation Details

#### Device Classification Logic

Devices are classified into three main types:

- **gNB (5G Node B)**: Detected via the Health API at `/api/health`.
- **MANET (Mobile Ad Hoc Network)**: Detected via the MANET API at `/status?content=temp`.
- **Unknown**: Devices that do not respond to either API.

**Example Classification Code:**
```javascript
const classifyDevice = (ip, healthResponse, manetResponse) => {
  if (healthResponse && healthResponse.status === 'up') {
    return { type: 'gNB', ip };
  } else if (manetResponse && manetResponse.nodes) {
    return { type: 'MANET', ip };
  } else {
    return { type: 'Unknown', ip };
  }
};
```

#### Intelligent Scanning Workflow

1. **Initial Scan**: Perform a full dual-sweep scan (Health + MANET APIs) on the configured subnet.
2. **Adaptive Rescanning**:
   - If new devices are found, rescans are triggered more frequently (every 10 seconds).
   - If no new devices are found, the system reverts to the normal scan interval (every 20 seconds).
3. **Exponential Backoff on Failure**:
   - If a device fails to respond, the system waits longer before retrying (up to a maximum of 60 seconds).
   - This prevents network flooding and allows for network recovery.

**Example Scanning Code:**
```javascript
const scanSubnet = async (subnet) => {
  const allIPs = getAllIPsInSubnet(subnet);
  await performSweep(allIPs, 'health');
  await performSweep(allIPs, 'manet');
  
  // Adaptive rescanning
  if (newDevicesFound) {
    setScanInterval(10); // 10 seconds
  } else {
    setScanInterval(20); // 20 seconds
  }
};
```

### User Interface Enhancements

- **Discovery Page**: A dedicated page for network discovery showing real-time scan progress, discovered devices, and manual addition options.
- **Device Status Indicators**: Color-coded indicators for device status (e.g., green for active, red for inactive).
- **Filter and Search**: Options to filter devices by type and search by IP or name.

---
