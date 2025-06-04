# User Guide

---

## Table of Contents

---

[Introduction](#introduction) <br>
[Quick Start](#quick-start) <br>
[Features](#features-) <br>
&nbsp;&nbsp;1. [Configuration Management](#configuration-management) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [View Configuration](#1-view-configuration-view-config) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [Edit Configuration](#2-edit-configuration-edit-config) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [Restore Configuration](#3-restore-configuration-restore-config) <br>
&nbsp;&nbsp;2. [Dashboard](#dashboard) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [View System Status](#1-view-system-status-system-status) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [Monitor Performance](#2-monitor-performance-monitor) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [View Logs](#3-view-logs-logs) <br>
&nbsp;&nbsp;3. [System Administration](#system-administration) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [User Management](#1-user-management-manage-users) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [System Restart](#2-system-restart-restart) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [System Update](#3-system-update-update) <br>
&nbsp;&nbsp;4. [Reports](#reports) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [Generate Reports](#1-generate-reports-generate-report) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&bull; [View Historical Data](#2-view-historical-data-view-history) <br>
&nbsp;&nbsp;5. [Miscellaneous](#miscellaneous) <br>
[FAQ](#faq) <br>
[Command Summary](#command-summary) <br>


## Introduction
A dashboard web interface to visualize live status updates and statuses of 5G RAN board (gNB-Metanoia).
The dashboard provides comprehensive management tools for network operators to configure, monitor, and maintain gNB systems efficiently.


## Quick Start

### Prerequisites
Do take note that the following must be setup on the respective system:
1. FrontEnd (RPI/PC etc..):
   1. Node.js (10.9.2 and above), React (19.1 and above)
   2. Leaflet (1.9.4 and above)
2. BackEnd (gNB RAN card):
   1. Flask
   2. pexpect

### Frontend Setup

1. Navigate to the frontend directory
    ``` bash
    cd frontend
    ```  
2. Install dependencies:  
   ```bash
   npm install
   ```  
   i. Install Leaflet Dependency
   ```bash
   npm install leaflet
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
    i. Setup Flask on Backend
   ```bash
   cd /webdashboard/flask_pkgs
   pip install *.whl
   ```  
   ii. Setup pexpect on Backend
   ```bash
   cd /webdashboard/pexpect_pkgs
   pip install *.whl
   ```  
3. Run Flask API:  
   ```bash
   python3 WebDashboard.py
   ```  
## Features 

---

### Node Status Monitoring

---

#### 1. View All Nodes
The homepage displays a grid of status cards showing all configured nodes with their current status.

* Color-coded status indicators show node states (RUNNING, INITIALISING, OFF)
* Real-time updates every 3 seconds
* Quick overview of all system nodes

How to use:
* Simply open the dashboard homepage to see all configured nodes
* Status updates automatically without user intervention

#### 2. Node Details
View detailed metrics and information about a specific node.

How to use:
* Click on any node card from the homepage
* The system navigates to a detailed dashboard view for that specific node
* If a node is unreachable, the system will display a limited view with error indications

#### 3. Node GPS Tracking
View the current position and any additional information of the attached mesh radio (Manet) with link quality

How to use:
* Click on the map tab from the sidebar
* The system navigates to the map overview and plots the position of each mesh location
* A line signifying link quality will be shown on the map between the mesh (Red: Poor Quality, Green: High Quality)
* If there is no mesh radio found or connected, there will be no markers or link lines on the map

### Node Management

---

#### 1. Add Node
Add a new node to be monitored by the dashboard.

How to use:
* Enter a node IP in the sidebar form
* Click "Add" or press Enter
* The system adds the node to the tracked list and begins polling its status
* Even if the node is unreachable, it will be added but shown as disconnected

#### 2. Remove Node
Remove a node from the dashboard monitoring.

How to use:
* Find the node in the sidebar list
* Click the remove icon next to the node
* The node will be removed from tracking

#### 3. Start/Stop Node
Control the operational state of a node remotely.

How to use:
* Navigate to a node's dashboard
* Click the "Turn On" or "Turn Off" button
* The system sends the command to the node
* Operation progress is displayed
* Node status updates when complete

If command fails or times out:
* System displays error notification
* You may retry the operation

### Dashboard Visualization

---

#### 1. CPU Usage
Monitor CPU utilization of nodes in real-time.

How to use:
* Navigate to a node's dashboard
* View the CPU usage chart that updates every second
* Hover over points for detailed values

Features:
* Time-series visualization using Recharts
* Smooth transitions between data points
* ~200 data points buffered for trend analysis

#### 2. RAM Usage
Monitor memory usage of nodes in real-time.

How to use:
* Navigate to a node's dashboard
* View the RAM usage chart that updates every second
* Hover over points for detailed values

Features:
* Time-series visualization
* Percentage and absolute values available
* Historical trend visible

#### 3. Disk Metrics
Monitor disk space and I/O performance.

How to use:
* Navigate to a node's dashboard
* View the disk metrics section
* Data updates in real-time

### Configuration

---

#### 1. View Configuration
View the current configuration settings for the gNB node.

How to use:
* Navigate to a node's dashboard
* Select the Configuration tab
* View the current settings

#### 2. Edit Configuration
Modify configuration parameters for the gNB node.

How to use:
* Navigate to a node's dashboard
* Select the Configuration tab
* Edit desired parameters
* Save changes

### Logs and Troubleshooting

---

#### 1. View Logs
Access system logs for troubleshooting.

How to use:
* Navigate to a node's dashboard
* Select the Logs tab
* View real-time log updates

#### 2. Download Logs
Download log files for advanced troubleshooting.

How to use:
* Navigate to a node's dashboard
* Select the Logs tab
* Click the Download button for the desired log file

## FAQ

---

**Q**: How frequently does the dashboard update node status?

**A**: The dashboard updates node attributes every 1 second and node status every 3 seconds to provide real-time monitoring while minimizing network load.

**Q**: What does each node status color indicate?

**A**: 
- Green: Node is RUNNING
- Yellow: Node is INITIALISING
- Red: Node is OFF or unreachable

**Q**: Can I add a node that's currently offline?

**A**: Yes, you can add any node by IP address. If the node is unreachable, it will be added to the dashboard but shown as disconnected until it becomes available.

**Q**: How many nodes can the dashboard support?

**A**: The dashboard is designed to support 20 or more nodes simultaneously, though performance may vary based on your hardware resources.

**Q**: How do I troubleshoot a node that won't start?

**A**: Navigate to the node's dashboard, check the logs for error messages, and ensure the node is reachable on the network. You can also try restarting the node using the "Turn Off" followed by "Turn On" buttons.

**Q**: Is my node configuration saved if I close the browser?

**A**: Yes, node configurations are stored in the browser's localStorage, so your configured nodes will persist when you reopen the dashboard in the same browser.

## Glossary

---

- **gNB**: 5G Node B - the base station in a 5G network
- **RAN**: Radio Access Network - the part of a mobile network that connects user equipment to the core network
- **PCI**: Physical Cell ID - unique identifier assigned to a cell in a mobile network
- **RaptorStatus**: The operational state of a node, which can be:
  - OFF: Node is powered down or not operational
  - INITIALISING: Node is starting up and configuring
  - RUNNING: Node is fully operational and functioning normally
