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

### Base URL
```
http://<gnb-board-ip>:5000/api
```

### Endpoints

#### GET /api/board-info
Get current board information and configuration details.

**Response:**
```json
{
  "board_type": "string",
  "config_path": "string",
  "log_directory": "string",
  "available_files": ["string"],
  "timeouts": {
    "raptor_status": "number",
    "setup_max_wait": "number"
  }
}
```

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/board-info
```

#### GET /api/attributes
Get comprehensive system attributes and real-time metrics.

**Response:**
```json
{
  "gnb_id": "string",
  "gnb_id_length": "string",
  "nr_band": "string",
  "scs": "string", 
  "tx_power": "string",
  "frequency_down_link": "string",
  "ip_address_gnb": "string",
  "ip_address_ngc": "string",
  "ip_address_ngu": "string",
  "MCC": "string",
  "MNC": "string",
  "cell_id": "string",
  "nr_tac": "string",
  "sst": "string",
  "sd": "string",
  "profile": "string",
  "cpu_usage": "number",
  "cpu_usage_history": ["number"],
  "cpu_temp": "number",
  "ram_usage": "number",
  "ram_usage_history": ["number"],
  "ram_total": "number",
  "drive_total": "number",
  "drive_used": "number",
  "drive_free": "number",
  "board_date": "string",
  "board_time": "string",
  "core_connection": "string"
}
```

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/attributes
```

#### GET /api/node_status
Get current operational status of the gNB node.

**Response:**
```json
{
  "node_status": "OFF|INITIALISING|RUNNING"
}
```

**Example:**
```bash
curl -X GET http://192.168.1.100:5000/api/node_status
```

#### POST /api/setup_script
Execute node control commands for managing gNB operations.

**⏱️ Expected Execution Times:**
- **Stop/Status commands**: 5-10 seconds
- **Start commands**: ~2 minutes (up to 120 seconds timeout)

**Request Body:**
```json
{
  "action": "start|stop|status|setupv2"
}
```

**Response (Success):**
```json
{
  "action": "string",
  "status": "ok|completed", 
  "output": "string",
  "log_file": "string",
  "exit_code": 0
}
```

**Response (Error):**
```json
{
  "action": "string",
  "error": "string",
  "details": "string",
  "output": "string", 
  "exit_code": -1
}
```

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

# Check node status (takes 5-10 seconds)
curl -X POST http://192.168.1.100:5000/api/setup_script \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

**Important Notes:**
- Start operations monitor for "CELL_IS_UP" indicator before completing
- Long-running operations may timeout after 120 seconds
- Log files are created for all operations and can be downloaded via `/api/download/`

#### POST /api/config
Update gNB configuration parameters dynamically.

**Request Body:**
```json
{
  "field": "string",
  "value": "string"
}
```

**Response:**
```json
{
  "status": "success|error",
  "message": "string"
}
```

**Example:**
```bash
# Update gNB IP configuration
curl -X POST http://192.168.1.100:5000/api/config \
  -H "Content-Type: application/json" \
  -d '{"field": "gnbIP", "value": "192.168.1.50"}'

# Update gNB ID Length
curl -X POST http://192.168.1.100:5000/api/config \
  -H "Content-Type: application/json" \
  -d '{"field": "gNBIdLength", "value": "28"}'
```

#### GET /api/download/<file_key>
Download board-specific files and logs.

**Parameters:**
- `file_key`: String identifier for the file to download

**Response:** File download or error message

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

Error responses include descriptive messages in JSON format:
```json
{
  "error": "Description of the error",
  "details": "Additional error context",
  "status": "error"
}
```

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
