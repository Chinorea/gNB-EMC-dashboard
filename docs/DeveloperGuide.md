# gNB-EMC Dashboard Developer Guide

---

## Table of Contents

1. [Acknowledgements](#acknowledgements)  
2. [Setting up / Getting started](#setting-up—getting-started)  
   2.1. [Frontend Setup](#frontend-setup)  
   2.2. [Backend Setup](#backend-setup)  
3. [Design](#design)  
   3.1. [Architecture](#architecture)  
   3.2. [UI component](#ui-component)  
   3.3. [Logic component](#logic-component)  
   3.4. [Model component](#model-component)  
   3.5. [Backend component](#backend-component)  
4. [Implementation](#implementation)  
   4.1. [Node status monitoring](#node-status-monitoring)  
   4.2. [Dashboard visualization](#dashboard-visualization)  
   4.3. [Node control (start/stop)](#node-control-startstop)  
   4.4. [Real-time data updates](#real-time-data-updates)  
   4.5. [Persistent node configuration](#persistent-node-configuration)  
5. [API Documentation](#api-documentation)  
6. [Design considerations](#design-considerations)  
7. [Appendix: Requirements](#appendix-requirements)  
   7.1. [Product scope](#product-scope)  
   7.2. [User stories](#user-stories)  
   7.3. [Use cases](#use-cases)  
   7.4. [Non-Functional Requirements](#non-functional-requirements)  
   7.5. [Glossary](#glossary)  

---

## Acknowledgements

- **React** ([reactjs.org][react]) & **Material-UI** ([mui.com][mui])  
- **Flask** ([palletsprojects.com/p/flask][flask]) & **Flask-CORS**  
- **Recharts** ([recharts.org][recharts])  

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
3. Start dev server:  
   ```bash
   npm start
   ```  

### Backend Setup

1. Ensure Python 3.9+ is installed. Check with the following command:  
   ```bash
    python --version
    ```
2. Install Python dependencies:  
   ```bash
   pip install flask flask-cors
   python -m pip install *.whl --no-index --find-links . --no-deps
   ```  
3. Run Flask API:  
   ```bash
   python3 WebDashboard.py
   ```  

---

## Design

### Architecture

A classic client–server model:

- **Frontend**  
  React SPA (Material-UI)  
- **Backend**  
  Flask REST API + Python “Attribute” classes ([see `RaptorStatusType.py`][raptorstatus])  
- **Data flow**  
  1. Hardware → backend collectors  
  2. `/api/*` → JSON over HTTP  
  3. Frontend polls & visualizes  

### UI component

- **App.js** – routing & global state  
- **Sidebar** – navigation & node list  
- **HomePage** – grid of status cards  
- **NodeDashboard** – detailed metrics & controls  

### Logic component

- React hooks (`useEffect`, `useState`)  
- Fetch API for polling  
- React Router for navigation  

### Model component

- **Frontend state**  
  - `nodes`: tracked node IPs  
  - `nodeStatuses`, `nodeAttrs`, `loadingMap`  
- **Backend classes**  
  - `IpAddress`, `CpuUsage`, `RamUsage`, …  
  - Each has a `refresh()` method  

### Backend component

- **Routes**  
  - `GET /api/attributes`  
  - `GET /api/node_status`  
  - `POST /api/setup_script`  
- **Attribute classes**  
  Python modules that collect & format metrics  

---

## Implementation

### Node status monitoring

1. `App.js` sets two intervals:  
   - Fast (1 s) for attributes  
   - Slow (3 s) for status  
2. State updates flow via props → components  
   * Sidebar shows node connection status with color coding
   * HomePage displays card grid with status summaries
   * NodeDashboard uses status to determine available actions

### Dashboard visualization

- **Recharts** for time-series (CPU/RAM)  
- Responsive containers + smoothing  

### Node control (start/stop)

1. Toggle button → `POST /api/setup_script`  
2. Backend runs `gnb_ctl start|stop`  
3. Returns result → UI notifications  

### Real-time data updates

- Backend buffers ~200 points  
- Frontend smooths & renders  

### Persistent node configuration

- Stored in `localStorage`  
- Sidebar form to add/remove nodes  

---

## Design considerations

1. Polling vs WebSockets  
2. App-level state vs Redux  
3. Graceful error handling  
4. Client-side smoothing  
5. Responsive UI  

---

## Appendix: Requirements

### Product scope

- **Users**: network engineers, operators, support  
- **Value**: unified real-time monitoring & control  

### User stories

| Priority | Role               | Feature                  | Benefit                       |
| -------- | ------------------ | ------------------------ | ----------------------------- |
| ***      | Network Engineer   | See all node statuses    | Quickly spot failures        |
| ***      | Operator           | Start/stop nodes         | Remote control of hardware   |
| ***      | Support Engineer   | View CPU/RAM/disk metrics| Diagnose performance issues  |
| **       | Network Engineer   | Historical trends        | Identify recurring issues    |
| **       | Operator           | Add/remove nodes         | Flexible dashboard config    |
| *        | Support Engineer   | Download logs            | Advanced troubleshooting     |

### Use cases

(For all use cases below, the **System** is `gNB-EMC Dashboard` and the **Actor** is the `User`)

### Use Case: UC01 - Monitor Node Status

**Main Success Scenario (MSS):**

1. User opens the dashboard homepage
2. System displays all configured nodes with their status
3. System continually updates the status automatically
4. Use case ends

**Extensions:**

- **2a.** No nodes are configured yet
  - 2a1. System shows empty node list
  - 2a2. User adds a node using the sidebar form
  - Use case resumes from Step 2

### Use Case: UC02 - View Node Details

**MSS:**

1. User clicks on a node card on the homepage
2. System navigates to the node dashboard view
3. System displays detailed metrics and controls for the node
4. Use case ends

**Extensions:**

- **3a.** Node is unreachable
  - 3a1. System displays limited view with error indication
  - 3a2. User may navigate back or retry
  - Use case ends

### Use Case: UC03 - Start/Stop a Node

**MSS:**

1. User navigates to a node's dashboard
2. User clicks the "Turn On" or "Turn Off" button
3. System sends the command to the node
4. System displays operation progress
5. System updates the node status when complete
6. Use case ends

**Extensions:**

- **3a.** Command fails or times out
  - 3a1. System displays error notification
  - 3a2. User may retry the operation
  - Use case resumes from Step 3

### Use Case: UC04 - Add a Node to Dashboard

**MSS:**

1. User enters a node IP in the sidebar form
2. User clicks "Add" or presses Enter
3. System adds the node to the tracked list
4. System begins polling the node status
5. Use case ends

**Extensions:**

- **4a.** Node is unreachable
  - 4a1. System still adds the node but shows as disconnected
  - Use case ends

### Non-Functional Requirements

1. Real-time updates < 3 s  
2. Responsive UI  
3. Graceful recovery from network errors  
4. Support ≥ 20 nodes  
5. Desktop & tablet support  
6. Persistent config  
7. Robust error handling  

### Glossary

- **gNB** – 5G Node B  
- **RAN** – Radio Access Network  
- **PCI** – Physical Cell ID  
- **RaptorStatus** – OFF / INITIALISING / RUNNING  

---

## References

- **React**: https://reactjs.org/  
- **Mui**: https://mui.com/  
- **Flask**: https://flask.palletsprojects.com/  
- **Recharts**: https://recharts.org/

---

## API Documentation

The backend Flask service provides REST API endpoints for monitoring and controlling gNB nodes. This API enables external applications and services to integrate with the gNB Dashboard functionality.

### Interactive Swagger Documentation (Flasgger)

For comprehensive interactive API documentation with "Try it out" functionality, see the **Flasgger Documentation System**:

📖 **[Complete Setup Guide](../backend/docs_generator/README.md)**

**Quick Start:**
1. Navigate to `backend/docs_generator/`
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
