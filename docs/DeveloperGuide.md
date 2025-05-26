Collecting workspace information

# gNB-EMC Dashboard Developer Guide

* Table of Contents
* gNB-EMC Dashboard Developer Guide
  * **Acknowledgements**
  * **Setting up, getting started**
  * **Design**
    * Architecture
    * UI component
    * Logic component
    * Model component
    * Backend component
  * **Implementation**
    * Node status monitoring
    * Dashboard visualization
    * Node control (start/stop)
    * Real-time data updates
    * Persistent node configuration
  * **Design considerations**
  * **Appendix: Requirements**
    * Product scope
    * User stories
    * Use cases
    * Non-Functional Requirements
    * Glossary

---

## **Acknowledgements**

- This project uses React and Material UI for frontend components
- Backend data processing utilizes Flask and standard Python libraries
- Visualization components powered by Recharts

---

## **Setting up, getting started**

### Frontend Setup
1. Navigate to the 

frontend

 directory
2. Install dependencies with `npm install`
3. Start the development server with 

npm start



### Backend Setup
1. Ensure Python 3.9+ is installed
2. Install required Python packages: 

flask

, 

flask-cors


3. Run the Flask server: `python3 WebDashboard.py`

---

## **Design**

### Architecture

The architecture of the gNB-EMC Dashboard follows a client-server model with these main components:

* **Frontend**: React-based SPA that handles UI rendering and user interactions
* **Backend**: Flask server that collects, processes, and serves data from the 5G nodes
* **Attributes**: Python classes that collect and format various metrics from the system

Data flows from the 5G hardware through the backend data collection classes, is exposed via the Flask REST API, and is consumed and visualized by the React frontend.

### UI component

The UI is built with React and Material-UI, consisting of:

* **App.js**: Core component handling routing and global state
* **Sidebar**: Persistent navigation and node list
* **HomePage**: Grid of node status cards
* **NodeDashboard**: Detailed single-node view with metrics and controls

The UI polls the backend at regular intervals to update displayed metrics and status information, creating a near-real-time monitoring experience.

### Logic component

The frontend logic is primarily implemented in React hooks:

* **useEffect**: For data polling and lifecycle management
* **useState**: For state management of nodes, attributes, and UI state
* **React Router**: For navigation between views

Data fetching is implemented using the Fetch API with different polling intervals for different types of data (attributes vs. status).

### Model component

The data model is split between frontend and backend:

* **Frontend Model**: React state containing:
  * 

nodes

 - List of tracked node IPs
  * 

nodeStatuses

 - Map of node IPs to their operational status
  * 

nodeAttrs

 - Map of node IPs to their full attribute objects
  * 

loadingMap

 - Map tracking which nodes are executing operations

* **Backend Model**: Python classes for various attribute types:
  * 

IpAddress

, 

CpuUsage

, 

RamUsage

, etc.
  * Each class implements an 

Attribute

 interface with a 

refresh()

 method

### Backend component

The backend is implemented in Flask with these key components:

* **Flask Routes**: REST endpoints for data access
  * `/api/attributes` - All node metrics
  * `/api/node_status` - Current operational status
  * `/api/setup_script` - Control actions (start/stop)

* **Attribute Classes**: Python classes that collect system metrics
  * Each implements 

refresh()

 to update its state
  * Data collection methods vary by metric (file parsing, subprocess calls, etc.)

---

## **Implementation**

### Node status monitoring

The dashboard continuously monitors node status through polling:

1. The 

App.js

 component sets up two polling intervals:
   * Fast interval (1s) for basic metrics via `/api/attributes`
   * Slower interval (3s) for operational status via `/api/node_status`

2. Status data flows to all components through React props
   * Sidebar shows node connection status with color coding
   * HomePage displays card grid with status summaries
   * NodeDashboard uses status to determine available actions

### Dashboard visualization

The NodeDashboard provides detailed metrics visualization:

1. Time-series data (CPU/RAM usage) is rendered with Recharts
   * Raw data from backend is processed with a moving average
   * Charts use responsive containers for proper sizing

2. Network and hardware metrics are displayed in card grids
   * Core connection status shows link quality
   * IP address information displays network configuration
   * Frequency details show radio parameters

### Node control (start/stop)

The NodeDashboard implements node control via a toggle button:

1. The "Turn On/Off" button calls the `/api/setup_script` endpoint
   * Sends appropriate action based on current status
   * Updates loading state while operation is in progress

2. Backend handles the operation:
   * Executes 

gnb_ctl start

 or 

gnb_ctl stop


   * Monitors output for completion or timeout
   * Returns result or error to frontend

### Real-time data updates

The dashboard implements efficient polling mechanisms:

1. CPU and RAM history is collected over time
   * Backend maintains collections of up to 200 data points
   * Frontend applies smoothing for visualization

2. Status indicators update based on backend state
   * Color coding provides immediate visual feedback
   * Status text changes reflect operational state

### Persistent node configuration

The dashboard remembers configured nodes between sessions:

1. The node list is stored in localStorage
   * Saved whenever the list changes
   * Loaded during initial component mount

2. UI provides node management controls
   * Add new nodes via Sidebar form
   * Remove nodes with the "X" button

---

## **Design considerations**

1. **Polling vs. WebSockets**: The application uses polling for simplicity and compatibility with existing infrastructure. WebSockets could offer more efficiency but would require additional backend support.

2. **State Management**: App-level state is used instead of a state management library like Redux, as the application scope is focused and the component hierarchy is relatively flat.

3. **Error Handling**: The application uses a combination of error states and fallback UI when nodes are unreachable, prioritizing graceful degradation over error messages.

4. **Data Processing**: CPU and RAM history smoothing is performed client-side to reduce backend processing load, with adjustable smoothing windows based on data volume.

---

## **Appendix: Requirements**

### Product scope

**Target user profile**:
* Network engineers monitoring 5G RAN nodes
* Operations staff who need visibility into node performance
* Support engineers diagnosing connectivity issues

**Value proposition**: Monitor and control multiple 5G nodes from a single dashboard with real-time updates and detailed metrics.

### User stories

Priorities: High (must have) - `* * *`, Medium (nice to have) - `* *`, Low (unlikely to have) - `*`

| Priority | As a …​         | I want to …​                                              | So that I can…​                                         |
|----------|----------------|-----------------------------------------------------------|--------------------------------------------------------|
| `* * *`  | Network Engineer | See the status of all nodes at a glance                   | Quickly identify which nodes need attention              |
| `* * *`  | Operator       | Start and stop nodes remotely                             | Manage nodes without physical access                     |
| `* * *`  | Support Engineer | View detailed metrics for CPU, RAM, and disk              | Diagnose performance issues                              |
| `* *`    | Network Engineer | Track node history over time                              | Identify trends or recurring issues                      |
| `* *`    | Operator       | Add and remove nodes from monitoring                      | Customize my dashboard to current infrastructure        |
| `*`      | Support Engineer | Download log files                                        | Perform advanced troubleshooting                        |

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

1. The system shall display real-time updates with latency under 3 seconds
2. The UI shall remain responsive during all operations
3. The system shall recover gracefully from network interruptions
4. The dashboard shall support at least 20 simultaneous nodes
5. The interface shall be usable on both desktop and tablet devices
6. Node configuration shall persist between browser sessions
7. The system shall handle various error conditions without crashing

### Glossary

* **gNB**: 5G Node B - The 5G base station that connects to the core network
* **RAN**: Radio Access Network - The radio portion of a mobile network
* **Node**: An individual 5G base station being monitored
* **PCI**: Physical Cell ID - Identifier for the cell 
* **RaptorStatus**: Current operational state of the node (OFF, INITIALISING, RUNNING)

Similar code found with 1 license type