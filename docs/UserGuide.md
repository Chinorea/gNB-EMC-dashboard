# 5G RAN Dashboard User Guide

**ST Engineering Web Dashboard for Multi-Board gNB Systems**

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Installation & Setup](#-installation--setup)
  - [System Requirements](#system-requirements)
  - [Frontend Setup (Client Machine)](#frontend-setup-client-machine)
  - [Backend Setup (gNB RAN Board)](#backend-setup-gnb-ran-board)
  - [Verification](#verification)
- [Getting Started](#-getting-started)
- [Core Features](#-core-features)
  - [Node Status Monitoring](#node-status-monitoring)
  - [Node Management](#node-management)
  - [Real-time Dashboard](#real-time-dashboard)
  - [GPS & Network Mapping](#gps--network-mapping)
  - [Configuration Management](#configuration-management)
  - [Logs & Troubleshooting](#logs--troubleshooting)
- [Advanced Features](#-advanced-features)
- [Board Support](#-board-support)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Glossary](#-glossary)


## 🚀 Introduction

The **5G RAN Dashboard** is a comprehensive web-based interface designed to visualize live status updates and manage multiple types of 5G RAN boards. This professional-grade dashboard provides network operators with powerful tools to configure, monitor, and maintain gNB systems efficiently across different hardware platforms.

### Key Capabilities
- **Multi-Board Support**: Compatible with EdgeQ and other 5G gNB platforms with automatic detection
- **Real-time Monitoring**: Live status updates, performance metrics, and system health
- **Interactive Mapping**: GPS tracking with link quality visualization  
- **Remote Management**: Start/stop nodes, configuration management, and system control
- **Performance Analytics**: CPU, RAM, and disk usage monitoring with historical trends
- **Multi-node Support**: Manage up to 20+ nodes simultaneously
- **Professional UI**: Modern, responsive interface with light/dark mode support
- **Automatic Setup**: Simplified installation with automatic dependency management

---

## 📦 Installation & Setup

### System Requirements

#### Frontend (Client Machine)
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: Version 18.0 or higher
- **RAM**: Minimum 4GB recommended
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Network**: Access to gNB RAN boards via TCP/IP

#### Backend (gNB RAN Board)  
- **Operating System**: Linux-based system
- **Python**: Version 3.9 or higher
- **RAM**: Minimum 2GB recommended
- **Storage**: At least 1GB free space
- **Network**: TCP/IP connectivity
- **Board Support**: EdgeQ (with support for future board types)

---

### Frontend Setup (Client Machine)

#### Step 1: Download Release Files
1. Navigate to the [GitHub Releases page](https://github.com/your-repo/releases)
2. Download the latest release containing:
   - `frontend.zip` - Web dashboard application
   - `webdashboard.zip` - Backend services for gNB boards

#### Step 2: Extract Frontend
1. Create a working directory (e.g., `C:\ST-Engineering\Dashboard\`)
2. Extract `frontend.zip` to this directory
3. You should see a `frontend/` folder containing the web application

#### Step 3: Install Node.js
1. Download Node.js from [https://nodejs.org/](https://nodejs.org/)
2. Install the LTS version (18.x or higher)
3. Verify installation by opening Command Prompt/Terminal:
   ```bash
   node --version
   npm --version
   ```
   ✅ Both commands should return version numbers

#### Step 4: Install Dependencies
1. Open Command Prompt/Terminal as Administrator
2. Navigate to the frontend directory:
   ```bash
   cd C:\ST-Engineering\Dashboard\frontend
   ```
3. Install all dependencies:
   ```bash
   npm install
   ```
   ⏳ This process may take 2-5 minutes depending on your internet connection

4. Install Leaflet mapping library:
   ```bash
   npm install leaflet
   ```

#### Step 5: Start the Dashboard
1. Start the development server:
   ```bash
   npm start
   ```
2. ✅ The dashboard will automatically open at `http://localhost:3000`
3. You should see the ST Engineering dashboard homepage

> **💡 Pro Tip**: Keep this terminal window open while using the dashboard. Closing it will stop the web server.

---

### Backend Setup (gNB RAN Board)

#### Step 1: Prepare the Backend Files
1. Extract `webdashboard.zip` from the GitHub release
2. You should have:
   - `WebDashboard.py` - Main backend service with automatic dependency installation
   - `backend/` folder - Contains all backend logic, board support, and dependencies

#### Step 2: Transfer to gNB Board
1. Copy the entire extracted backend folder to your gNB RAN board
2. Recommended location: `/home/user/webdashboard/`
3. Ensure you have the following structure on the board:
   ```
   /home/user/webdashboard/
   ├── WebDashboard.py            # Main entry point with auto-setup
   ├── backend/
   │   ├── board_factory.py       # Multi-board support factory
   │   ├── config_manager.py      # Board-specific configuration management
   │   ├── Flask.py               # Flask web service
   │   ├── boards/                # Board-specific implementations
   │   │   ├── base_board.py      # Abstract base class
   │   │   ├── edgeq_board.py     # EdgeQ-specific implementation
   │   │   └── __init__.py
   │   ├── logic/                 # Board attributes and system logic
   │   │   ├── setupLogManager.py # Log Manager for setup logs
   │   │   ├── edgeq_attributes/
   │   │   └── shared_attributes/
   │   └── dependencies/          # Pre-packaged dependencies
   │       ├── flask_pkgs/        # Flask and web framework packages
   │       ├── pexpect_pkgs/      # Process automation packages
   │       └── pytest_pkgs/       # Testing framework packages
   ```

#### Step 3: Verify Python Installation
1. SSH into your gNB RAN board
2. Check Python version:
   ```bash
   python3 --version
   ```
   ✅ Should return Python 3.9 or higher

#### Step 4: **Automatic Setup** (Recommended)
The new WebDashboard.py includes automatic dependency management and board detection.

1. Navigate to the webdashboard directory:
   ```bash
   cd /home/user/webdashboard
   ```

2. **Start with automatic setup** (handles all dependencies):
   ```bash
   python3 WebDashboard.py
   ```

3. ✅ **The system will automatically**:
   - Check for existing dependencies
   - Install required packages from local wheel files if needed
   - Detect your board type (EdgeQ or others)
   - Initialize board-specific configurations
   - Start the Flask backend service

4. **Success Indicators**:
   ```
   ============================================================
   gNB Dashboard - Multi-Board Support
   ============================================================
   Board type: auto-detect (defaults to EdgeQ)
   Available boards: edgeq
   For help: python3 WebDashboard.py --help
   ------------------------------------------------------------
   All required dependencies are already installed.
   Starting Flask application...
   Board system initialized successfully
   Dependencies verified
   Access the dashboard at: http://localhost:5000
   ============================================================
   * Running on all addresses (0.0.0.0)
   * Running on http://127.0.0.1:5000
   * Running on http://[your-ip]:5000
   ```

#### Step 5: **Manual Setup** (If Needed)
If automatic setup fails, you can install dependencies manually:

1. Install Flask dependencies:
   ```bash
   cd backend/dependencies/flask_pkgs
   pip3 install *.whl --no-deps
   ```

2. Install pexpect dependencies:
   ```bash
   cd ../pexpect_pkgs
   pip3 install *.whl --no-deps
   ```

3. Install pytest dependencies:
   ```bash
   cd ../pytest_pkgs
   pip3 install *.whl --no-deps
   ```

4. Return to main directory and start:
   ```bash
   cd /home/user/webdashboard
   python3 WebDashboard.py
   ```

#### Step 6: **Board-Specific Options**
The dashboard now supports multiple board types with command-line options:

```bash
# Auto-detect board type (default behavior)
python3 WebDashboard.py

# Explicitly specify EdgeQ board
python3 WebDashboard.py --edgeq

# View help and available options
python3 WebDashboard.py --help
```

**Available Board Types:**
- **EdgeQ**: 5G gNodeB platform with EdgeQ chipsets (currently supported)
- **Future boards**: Additional board types can be added through the extensible architecture

> **🔒 Security Note**: The backend runs on port 5000. Ensure this port is accessible from your client machine but secured from unauthorized access.

---

### Verification

#### Test Frontend-Backend Connection
1. Open the dashboard at `http://localhost:3000`
2. In the sidebar, add a node using the IP address of your gNB board
3. Click "ADD" - the node should appear in the sidebar
4. ✅ **Success**: Node status updates to show current state (RUNNING/INITIALIZING/OFF)
5. ❌ **Failure**: Node shows as "DISCONNECTED" - check network connectivity and backend service

#### Network Connectivity Checklist
- [ ] gNB board is powered on and connected to network
- [ ] Client machine can ping the gNB board IP address  
- [ ] Backend service is running on port 5000
- [ ] No firewall blocking port 5000
- [ ] Both machines are on the same network or have proper routing
- [ ] Correct board type detected (check startup messages)

#### Board Detection Verification
1. Check the startup messages for board detection:
   ```
   Board type: auto-detect (defaults to EdgeQ)
   Available boards: edgeq
   ```
2. For EdgeQ boards, verify these paths exist:
   - `/opt/ste/bin/gnb_commission`
   - `/opt/ste/active/commissioning/configs/`

---

## 🎯 Getting Started

Once both frontend and backend are successfully installed and running, follow these steps to start monitoring your gNB nodes:

### Adding Your First Node
1. **Open the Dashboard**: Navigate to `http://localhost:3000` in your web browser
2. **Locate the Sidebar**: Find the "Add Node" section in the left sidebar
3. **Enter Node Information**:
   - Input the IP address of your gNB RAN board
   - Example: `192.168.1.100`
4. **Add the Node**: Click the "ADD" button or press Enter
5. **Verify Connection**: The node should appear in the sidebar with its current status

### Understanding Node Status
- 🟢 **RUNNING**: Node is operational and functioning normally
- 🟡 **INITIALIZING**: Node is starting up and configuring systems
- 🔴 **OFF**: Node is powered down or not operational
- ⚫ **DISCONNECTED**: Node is unreachable (network/backend issues)

### Navigation Overview
- **Homepage**: Grid view of all configured nodes with status overview
- **Individual Node Dashboard**: Detailed metrics, controls, and monitoring
- **Map View**: GPS locations and network topology visualization
- **Sidebar**: Node management, adding/removing nodes, navigation

---

## 🔧 Core Features 

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

#### 1. Network Scanning & Discovery
Automatically scan the network to discover available gNB and MANET devices.

**How it works:**
- The system performs dual-sweep scanning using two APIs:
  - **Health API scan**: Detects gNB nodes at `http://[ip]:5000/api/health`
  - **MANET API scan**: Detects MANET devices at `http://[ip]/status?content=temp`
- Scans are performed automatically every 15 seconds after initial load
- Manual scans can be triggered using the scan controls in the sidebar

**How to use:**
1. **Configure Subnet**: In the sidebar, enter the network subnet to scan (e.g., `192.168.1`)
2. **Start Scan**: Click the scan button to manually trigger network discovery
3. **View Results**: Discovered devices appear in the "Scanned Nodes" section
4. **Add Devices**: 
   - **For gNB nodes**: Click the ➕ icon to add directly to your saved nodes
   - **For MANET devices**: Click the ➕ icon to assign the MANET IP to an existing saved node

**Device Types:**
- 🔧 **GNB**: 5G base station nodes that respond to health API calls
- 📡 **MANET**: Mesh network radios that respond to status API calls

**Features:**
- **Real-time Discovery**: Automatic scanning finds new devices as they come online
- **Smart Filtering**: Only shows devices not already in your saved nodes list
- **Status Indication**: Color-coded chips show device type (GNB/MANET)
- **Subnet Persistence**: Your chosen subnet is saved for future sessions

#### 2. Add Node (Manual)
Add a new node manually by entering its IP address.

How to use:
* Enter a node IP in the sidebar form
* Click "Add" or press Enter
* The system adds the node to the tracked list and begins polling its status
* Even if the node is unreachable, it will be added but shown as disconnected

#### 3. Add Node (From Discovery)
Add discovered nodes directly from the network scan results.

How to use:
* Perform a network scan to discover available devices
* **For gNB nodes**: Click the ➕ icon next to any discovered gNB
* **For MANET devices**: Click the ➕ icon to open the assignment dialog
  - Select which saved gNB node to attach the MANET to
  - MANET devices cannot be added without an existing gNB node
* The device is automatically added to your saved nodes with appropriate configuration

#### 4. Remove Node
Remove a node from the dashboard monitoring.

How to use:
* Find the node in the sidebar list
* Click the remove icon next to the node
* The node will be removed from tracking

#### 5. Start/Stop Node
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

#### 6. MANET Assignment
Assign discovered MANET devices to existing gNB nodes for mesh networking.

**How to use:**
1. **Discover MANET**: Network scan identifies MANET devices on the network
2. **Open Assignment**: Click the ➕ icon next to a discovered MANET device
3. **Select Node**: Choose which saved gNB node to attach the MANET to
4. **Confirm Assignment**: The MANET IP is automatically configured for the selected node

**Requirements:**
- At least one saved gNB node must exist before assigning MANET devices
- MANET devices are identified by their response to `/status` API calls
- Assigned MANET IPs enable GPS tracking and mesh network visualization

### GPS & Network Mapping

---

#### 1. Interactive Map View
Visualize node locations and network topology with real-time updates.

**Features:**
- **Satellite & Map Toggle**: Switch between satellite imagery and standard map views
- **Multiple Satellite Providers**: Choose from Google (best quality), ESRI, or hybrid views
- **Real-time GPS Tracking**: See exact node positions with automatic updates
- **Link Quality Visualization**: Color-coded lines showing connection strength between nodes

**How to use:**
- Click the **Map** tab in the sidebar to access the interactive map
- Use the **satellite toggle** (🛰️) in the top-right corner to switch between map and satellite views
- When in satellite mode, select quality level from the dropdown:
  - 🌟 **Google (Best)**: Highest resolution satellite imagery
  - 🏷️ **Google + Labels**: Satellite view with road names and labels
  - 🗺️ **ESRI (Standard)**: Standard satellite imagery

**Link Quality Indicators:**
- **Green Lines**: High quality connection (good SNR)
- **Yellow Lines**: Medium quality connection
- **Red Lines**: Poor quality connection (low SNR)
- **No Line**: No connection or link quality data unavailable

---

### Real-time Dashboard

---

#### 1. Performance Monitoring
Monitor system performance with live updating charts and metrics.

**CPU Usage Monitoring:**
- Real-time CPU utilization charts
- Historical trend analysis with ~200 data points
- Hover for detailed values and timestamps
- Automatic scaling and smooth transitions

**RAM Usage Tracking:**
- Memory usage visualization with percentage and absolute values
- Real-time updates every second
- Historical memory usage patterns
- System memory health indicators

**Disk Space Management:**
- Available storage monitoring
- Disk I/O performance metrics
- Storage usage alerts and recommendations
- Historical usage trends

**How to use:**
- Navigate to any node's dashboard
- Performance charts update automatically every second
- Hover over chart points for detailed information
- Use the historical view to identify usage patterns

---

### Configuration Management

---

#### 1. View Configuration
View the current configuration settings for the gNB node.

**How to use:**
- Navigate to a node's dashboard
- Select the Configuration tab
- View the current settings and parameters
- Real-time configuration status updates

#### 2. Edit Configuration
Modify configuration parameters for the gNB node.

**How to use:**
- Navigate to a node's dashboard
- Select the Configuration tab
- Edit desired parameters using the intuitive interface
- Save changes and apply to the node
- Monitor configuration status for successful application

**Features:**
- Parameter validation before saving
- Rollback capability for failed configurations
- Configuration history tracking

---

### Logs & Troubleshooting

---

#### 1. Real-time Log Monitoring
Access system logs for troubleshooting and monitoring.

**How to use:**
- Navigate to a node's dashboard
- Select the Logs tab
- View real-time log updates with automatic scrolling
- Filter logs by severity level or timestamp

**Features:**
- Color-coded log levels (ERROR, WARNING, INFO, DEBUG)
- Search and filter capabilities
- Automatic log rotation and cleanup
- Export logs for external analysis

#### 2. System Diagnostics
Advanced troubleshooting tools and diagnostics.

**How to use:**
- Access diagnostic tools from the node dashboard
- Run system health checks
- View detailed error reports and recommendations
- Generate comprehensive system reports

---

## 🚀 Advanced Features

### API Documentation & Developer Resources
- **Interactive API Documentation**: Complete Swagger/OpenAPI documentation with live testing capabilities
- **Developer Guide**: Comprehensive technical documentation for developers and system integrators
- **Independent Testing Environment**: API documentation runs separately from main backend for safe testing

### Multi-Board Architecture
- **Automatic Detection**: System automatically detects board type based on installed software and file paths
- **Extensible Design**: New board types can be easily added through the board factory pattern
- **Board-Specific Logic**: Each board type has its own configuration, setup commands, and attribute management
- **Unified Interface**: Consistent API and user experience across all supported board types

### Enhanced Configuration Management
- **Board-Specific Configs**: Each board type uses optimized configuration parameters
- **Override Support**: User-specific configuration overrides through `config/board_overrides.json`
- **Automatic Config Generation**: EdgeQ boards can automatically generate configuration files through commissioning
- **Validation & Enhancement**: Automatic validation and enhancement of generated configurations

### Dependency Management
- **Automatic Installation**: Dependencies are automatically installed from pre-packaged wheel files
- **Offline Support**: All required packages included for boards without internet access
- **Selective Installation**: Only installs missing dependencies to avoid conflicts
- **Compatibility Checking**: Verifies critical imports after installation

### Multi-Node Operations
- **Bulk Actions**: Perform operations across multiple nodes simultaneously
- **Group Management**: Create and manage node groups for easier administration
- **Synchronized Updates**: Coordinate configuration changes across node clusters

### Performance Analytics
- **Historical Trending**: Long-term performance analysis and capacity planning
- **Alert Thresholds**: Customizable alerts for performance metrics
- **Automated Reports**: Schedule and generate performance reports

### Security & Access Control
- **Role-based Access**: Different permission levels for various user types
- **Audit Logging**: Complete audit trail of all user actions and system changes
- **Secure Communications**: Encrypted communications between dashboard and nodes

---

## 🎯 Board Support

The dashboard now supports multiple 5G RAN board types through an extensible architecture:

### Currently Supported Boards

#### EdgeQ Boards
**Features:**
- Automatic board detection based on EdgeQ software paths
- EdgeQ-specific commissioning automation with `gnb_commission`
- Custom configuration file generation and enhancement
- EdgeQ attribute monitoring (CPU, temperature, memory, radio parameters)
- Integration with EdgeQ's `gnb_ctl` control interface

**Detection Criteria:**
- Presence of `/opt/ste/bin/gnb_commission`
- Presence of `/opt/ste/active/commissioning/configs/` directory

**Command Line Usage:**
```bash
# Auto-detect EdgeQ board
python3 WebDashboard.py

# Explicitly specify EdgeQ
python3 WebDashboard.py --edgeq
```

### Future Board Support
The architecture is designed to easily support additional board types

### Board-Specific Features

#### Configuration Management
Each board type has its own:
- Configuration file paths and formats
- Setup and control commands
- Log file locations and formats
- Timeout settings and automation parameters

#### Attribute Monitoring
Board-specific attributes include:
- **Common**: CPU usage, RAM usage, disk space, date/time
- **EdgeQ-specific**: SoC temperature, EdgeQ radio parameters, EdgeQ core attributes, Raptor status
- **Future boards**: Board-specific monitoring parameters

#### Commissioning & Setup
- **EdgeQ**: Automated commissioning with `gnb_commission -g`
- **Future boards**: Board-specific setup and commissioning procedures

---

## 🛠️ Troubleshooting

### Common Issues

#### Dashboard Won't Start
**Symptoms:** `npm start` fails or dashboard doesn't load
**Solutions:**
1. Verify Node.js version: `node --version` (should be 18.x+)
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
4. Check for port conflicts (default: 3000)

#### Node Shows as DISCONNECTED
**Symptoms:** Node appears in sidebar but status shows as disconnected
**Solutions:**
1. Verify network connectivity: `ping [node-ip]`
2. Check backend service is running on port 5000
3. Verify firewall settings allow port 5000
4. Restart backend service: `python3 WebDashboard.py`
5. Check board detection messages in startup output

#### Backend Service Fails to Start
**Symptoms:** `python3 WebDashboard.py` returns errors
**Solutions:**
1. Check Python version: `python3 --version` (should be 3.9+)
2. **Check automatic dependency installation output for errors**
3. Try manual dependency installation if automatic fails
4. Check port 5000 availability: `netstat -ln | grep 5000`
5. Review backend logs for specific error messages
6. Verify board detection is working properly

#### Board Detection Issues
**Symptoms:** Wrong board type detected or detection fails
**Solutions:**
1. Check startup messages for detection criteria
2. For EdgeQ: Verify `/opt/ste/bin/gnb_commission` exists
3. For EdgeQ: Verify `/opt/ste/active/commissioning/configs/` exists  
4. Use explicit board selection: `python3 WebDashboard.py --edgeq`
5. Check file permissions on detection paths

#### Dependency Installation Fails
**Symptoms:** Automatic dependency installation reports errors
**Solutions:**
1. Check available disk space on the board
2. Verify pip3 is installed and working: `pip3 --version`
3. Try manual installation from `backend/dependencies/*/`
4. Check Python module paths and permissions
5. Ensure no conflicting package versions are installed

#### Configuration File Issues
**Symptoms:** Config file generation fails or node won't start
**Solutions:**
1. For EdgeQ: Check `/opt/ste/bin/gnb_commission` is executable
2. Verify commission automation triggers in board configuration
3. Check log files in `/opt/webdashboard/logdump/` for commissioning errors
4. Manually run commissioning if automation fails
5. Verify configuration file permissions and format

#### Performance Issues
**Symptoms:** Slow dashboard response or high resource usage
**Solutions:**
1. Reduce polling frequency in settings
2. Limit number of historical data points
3. Close unused browser tabs
4. Check system resources on client machine
5. Verify board-specific timeouts are appropriate

### Board-Specific Troubleshooting

#### EdgeQ Boards
**Common EdgeQ Issues:**
- **Config file not generated**: Check EdgeQ software installation
- **Raptor status errors**: Verify `/logdump/du_log.txt` exists and is readable
- **gnb_ctl commands fail**: Verify EdgeQ software paths and permissions

### Getting Help
- **Documentation**: Review this guide and developer documentation
- **Logs**: Check both frontend browser console and backend logs
- **Board Information**: Use `python3 WebDashboard.py --help` for board options
- **Support**: Contact ST Engineering technical support with:
  - Dashboard version and detected board type
  - Browser and OS information
  - Backend startup messages and board detection output
  - Error logs and screenshots
  - Network topology details

---

## ❓ FAQ

### General Questions

**Q: How does the dashboard detect my board type?**
**A:** The detection is specified by the user that runs the backend. You may refer to [board support](#-board-support) for the instruction of detection.

**Q: What board types are currently supported?**
**A:** Currently, the dashboard supports EdgeQ-based gNB platforms with automatic detection. The architecture is designed to easily support additional board types in the future.

**Q: Can I force a specific board type?**
**A:** Yes, use command-line arguments: `python3 WebDashboard.py --edgeq` for EdgeQ boards. Use `python3 WebDashboard.py --help` to see all available options.

**Q: How frequently does the dashboard update node status?**
**A:** The dashboard updates node attributes and status every 5 second while node and manet scanning every 20 seconds.

**Q: Do I need to manually install dependencies?**
**A:** No, the new WebDashboard.py automatically checks and installs all required dependencies from pre-packaged wheel files. This works even on boards without internet access.

**Q: What does each node status color indicate?**
**A:** 
- 🟢 **Green**: Node is RUNNING and fully operational
- 🟡 **Yellow**: Node is INITIALIZING (starting up)
- 🔴 **Red**: Node is OFF or powered down
- ⚫ **Black**: Node is DISCONNECTED (unreachable)

**Q: Can I add a node that's currently offline?**
**A:** Yes, you can add any node by IP address. If the node is unreachable, it will be added to the dashboard but shown as disconnected until it becomes available.

**Q: How many nodes can the dashboard support?**
**A:** The dashboard is designed to support 20 or more nodes simultaneously, though performance may vary based on your hardware resources.

### Installation & Setup

**Q: The automatic dependency installation failed. What should I do?**
**A:** If automatic installation fails, you can install dependencies manually from the `backend/dependencies/` folders. Navigate to each package folder (flask_pkgs, pexpect_pkgs, pytest_pkgs) and run `pip3 install *.whl --no-deps`.

**Q: How do I know if my board type was detected correctly?**
**A:** Check the startup messages when running `python3 WebDashboard.py`. You'll see output like "Board type: auto-detect (defaults to EdgeQ)" and "Available boards: edgeq". The system will also show board-specific initialization messages.

**Q: Can I add support for a custom board type?**
**A:** Yes, the architecture is extensible. You'll need to create a new board class inheriting from `BaseBoard`, implement the required methods, and add it to the `BoardFactory`. Contact support for guidance on custom board implementations or refer to developer guide for more instructions.

**Q: What browsers are supported?**
**A:** The dashboard works best with modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported.

**Q: Do I need special permissions to install the dashboard?**
**A:** You may need administrator privileges to install Node.js and modify system settings. The dashboard itself can run with standard user permissions.

**Q: Can I run the dashboard on a different port?**
**A:** Yes, you can modify the port in the package.json file or use environment variables. The default ports are 3000 (frontend) and 5000 (backend).

### Operation & Usage

**Q: My EdgeQ board won't generate a configuration file. What's wrong?**
**A:** Ensure that `/opt/ste/bin/gnb_commission` exists and is executable. The EdgeQ commissioning process requires proper EdgeQ software installation. Check the commissioning logs in `/opt/webdashboard/logdump/` for detailed error information.

**Q: Can I use the dashboard with multiple different board types simultaneously?**
**A:** Yes, the frontend can connect to multiple backend instances running on different board types. The frontend calls the backend via REST APIs through the flask server. The backend handles the difference in board types

**Q: How do I troubleshoot a node that won't start?**
**A:** 
1. Navigate to the node's dashboard
2. Check the logs for error messages
3. Ensure the node is reachable on the network
4. Try restarting using "Turn Off" followed by "Turn On". Make sure a physical hard reset is done.
5. Contact support if issues persist

**Q: Is my node configuration saved if I close the browser?**
**A:** Yes, node configurations are stored in the browser's localStorage, so your configured nodes will persist when you reopen the dashboard in the same browser.

**Q: Can I access the dashboard remotely?**
**A:** Yes, if properly configured with appropriate network access and security measures. Ensure proper firewall and security settings are in place.

### Performance & Monitoring

**Q: Why are my performance charts not updating?**
**A:** Check that:
- The node is connected and responding
- Backend service is running
- Network connectivity is stable
- Browser is not blocking JavaScript execution

**Q: How much historical data is stored?**
**A:** The dashboard maintains approximately 200 data points for performance charts. Older data is automatically rotated to maintain performance.

### Board-Specific Questions

**Q: What EdgeQ-specific features are supported?**
**A:** The dashboard supports EdgeQ's commissioning automation, gnb_ctl control interface, EdgeQ-specific attribute monitoring (SoC temperature, radio parameters), and automatic configuration file generation and enhancement.

**Q: How does EdgeQ commissioning automation work?**
**A:** The system automatically runs `gnb_commission -g` and handles the interactive commissioning process, including filename customization and profile selection. The generated configuration is automatically enhanced with board-specific settings.

**Q: What happens if EdgeQ commissioning fails?**
**A:** The system will log detailed error information and fall back to manual configuration. Check the commissioning logs and ensure EdgeQ software is properly installed. You can also try running commissioning manually and then restarting the dashboard.

---

## 📚 Glossary

### Technical Terms

**Board Factory**
A software design pattern used to create board-specific instances based on detected or specified board type, enabling support for multiple hardware platforms.

**Multi-Board Architecture**
The dashboard's extensible design that supports multiple types of 5G gNB hardware platforms through a common interface.

**gNB (5G Node B)**
The base station in a 5G network that provides radio coverage and connects user equipment to the core network.

**RAN (Radio Access Network)**
The part of a mobile network that connects user equipment to the core network through radio technology.

**PCI (Physical Cell ID)**
A unique identifier assigned to a cell in a mobile network, used to distinguish between different cells.

**SNR (Signal-to-Noise Ratio)**
A measure of signal quality, indicating the level of desired signal relative to background noise.

**MANET (Mobile Ad Hoc Network)**
A continuously self-configuring, infrastructure-less network of mobile devices connected wirelessly.

### Board Types

**EdgeQ Board**
A 5G gNodeB platform using EdgeQ chipsets and software, with specific commissioning procedures and attribute monitoring.

**Base Board**
The abstract foundation class that defines the common interface all board types must implement.

**Board-Specific Configuration**
Configuration parameters, file paths, and settings that are unique to each supported board type.

### Dashboard Status Types

**RUNNING**
Node is fully operational and functioning normally. All systems are active and responsive.

**INITIALIZING**
Node is starting up and configuring systems. This is a temporary state during boot-up or restart.

**OFF**
Node is powered down or not operational. No services are running.

**DISCONNECTED**
Node is unreachable from the dashboard. This may indicate network issues, backend problems, or node failure.

### System Components

**BoardFactory**
The central component responsible for detecting board types and creating appropriate board instances.

**ConfigManager**
Manages board-specific configurations and user overrides, supporting different configuration formats and paths.

**Commissioning Automation**
The automated process of generating configuration files through board-specific commissioning procedures.

**Frontend**
The web-based user interface that runs in your browser, providing the dashboard visualization and controls.

**Backend**
The Python-based service running on the gNB board that provides APIs and interfaces with the hardware.

**WebDashboard.py**
The main Python script that starts the backend service and handles communication between the dashboard and gNB systems.

**Node**
A single gNB RAN board or system being monitored by the dashboard.

---

## 📞 Support & Contact

For technical support, bug reports, or feature requests:

**ST Engineering Technical Support**
- Email: support@stengineering.com
- Documentation: Available in the `docs/` folder
- GitHub Issues: Report bugs and request features

**Developer Resources**
- **[Developer Guide](DeveloperGuide.md)**: Comprehensive technical documentation for system integration, architecture details, and development workflows
- **[API Documentation](../docs_generator/README.md)**: Interactive Swagger/OpenAPI documentation with live testing capabilities
  - Quick Start: Double-click `start_docs.bat` in the `docs_generator/` folder
  - Access at: `http://localhost:8080/docs/` (after starting the documentation server)
  - Features: Live API testing, endpoint documentation, request/response schemas

**When contacting support, please include:**
- Dashboard version and release information
- Operating system and browser details
- Error messages and log files
- Network topology and configuration details
- Screenshots of any issues encountered

---

*This guide covers version 1.1 of the 5G RAN Dashboard. For the latest updates and additional resources, please visit the project repository.*
