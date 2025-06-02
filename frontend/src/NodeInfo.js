class NodeInfo {
  constructor(ip, setRebootAlertNodeIp) { // globalSetState removed
    this.ip = ip; // Primary IP of the node

    // Status and Initialization
    this._currentStatus = 'DISCONNECTED'; // Internal status: 'DISCONNECTED', 'RUNNING', 'OFF'
    // this.isInitializing = false; // Removed, App.js will handle UI based on rebootAlertNodeIp

    // Naming and Identification
    this.nodeName = ''; // User-defined node name

    // Centralized attributes store
    this.attributes = {
      coreData: {
        gnbId: null,
        pci: null,
        boardTime: null,
        boardDate: null,
        coreConnection: null, // e.g., 'UP', 'DOWN', 'UNSTABLE'
        cpuUsagePercent: null, // Overall CPU usage percentage
        cpuTemp: null
      },
      ramData: {
        totalMB: null,
        usedMB: null,
        freeMB: null,
        usagePercent: null
      },
      diskData: {
        totalGB: null,
        usedGB: null,
        freeGB: null,
        usagePercent: null
      },
      transmitData: {
        frequencyDownlink: null,
        bandwidthDownlink: null,
        frequencyUplink: null,
        bandwidthUplink: null,
        txPower: null
      },
      ipData: {
        ipAddressGnb: null,
        ipAddressNgc: null,
        ipAddressNgu: null
      }
    };

    // MANET Configuration
    this.manet = {
      ip: null,
      connectionStatus: null,
      nodeInfo : null,
      selfManetInfo: null
    };
    this.rawAttributes = {}; // Store raw attributes if needed
    // this.isInitializing = false; // Removed

    // Store the callback
    // this._globalSetState = globalSetState; // Removed
    this._setRebootAlertNodeIp = setRebootAlertNodeIp; // Store the new callback

    this.pollingIntervals = {
      attributes: null,
      status: null,
      manet: null
    };
    this.startInternalPolling();
  }

  startInternalPolling() {
    // Initial fetches
    this.refreshAttributesFromServer();
    this.refreshStatusFromServer();
    this.checkManetConnection();

    // Setup intervals
    this.pollingIntervals.attributes = setInterval(() => this.refreshAttributesFromServer(), 1000);
    this.pollingIntervals.status = setInterval(() => this.refreshStatusFromServer(), 3000);
    this.pollingIntervals.manet = setInterval(() => this.checkManetConnection(), 5000);
  }

  stopInternalPolling() {
    if (this.pollingIntervals.attributes) clearInterval(this.pollingIntervals.attributes);
    if (this.pollingIntervals.status) clearInterval(this.pollingIntervals.status);
    if (this.pollingIntervals.manet) clearInterval(this.pollingIntervals.manet);
  }

  get status() {
    // if (this.isInitializing) { // Removed
    // return 'INITIALIZING';
    // }
    return this._currentStatus;
  }

  // Internal helper to parse and assign attributes from fetched data
  _parseAndAssignAttributes(attrsData) {
    // Reset attributes to the defined nested default state first
    this.attributes = {
      coreData: {
        gnbId: null,
        pci: null,
        boardTime: null,
        boardDate: null,
        coreConnection: null,
        cpuUsagePercent: null,
        cpuTemp: null
      },
      ramData: {
        totalMB: null,
        usedMB: null,
        freeMB: null,
        usagePercent: null
      },
      diskData: {
        totalGB: null,
        usedGB: null,
        freeGB: null,
        usagePercent: null
      },
      transmitData: {
        frequencyDownlink: null,
        bandwidthDownlink: null,
        frequencyUplink: null,
        bandwidthUplink: null,
        txPower: null
      },
      ipData: {
        ipAddressGnb: null,
        ipAddressNgc: null,
        ipAddressNgu: null
      }
    };

    if (!attrsData) {
      this.rawAttributes = {};
      // Attributes are already reset above, so just return
      return;
    }

    this.rawAttributes = attrsData;

    // Populate coreData
    this.attributes.coreData.gnbId = attrsData.gnb_id;
    this.attributes.coreData.pci = attrsData.gnb_pci;
    this.attributes.coreData.boardTime = attrsData.board_time;
    this.attributes.coreData.boardDate = attrsData.board_date;
    this.attributes.coreData.coreConnection = attrsData.core_connection;
    this.attributes.coreData.cpuUsagePercent = attrsData.cpu_usage;
    this.attributes.coreData.cpuTemp = attrsData.cpu_temp;

    // Populate transmitData (txPower was previously assigned to this.attributes.txPower directly)
    this.attributes.transmitData.txPower = attrsData.tx_power;
    this.attributes.transmitData.frequencyDownlink = attrsData.frequency_down_link;
    this.attributes.transmitData.bandwidthDownlink = attrsData.bandwidth_down_link;
    this.attributes.transmitData.frequencyUplink = attrsData.frequency_up_link;
    this.attributes.transmitData.bandwidthUplink = attrsData.bandwidth_up_link;

    // RAM Data (structure was already nested, path is now this.attributes.ramData)
    this.attributes.ramData.totalMB = parseFloat(attrsData.ram_total);
    this.attributes.ramData.usagePercent = parseFloat(attrsData.ram_usage);
    if (!isNaN(this.attributes.ramData.totalMB) && !isNaN(this.attributes.ramData.usagePercent)) {
      this.attributes.ramData.usedMB = (this.attributes.ramData.totalMB * this.attributes.ramData.usagePercent) / 100;
      this.attributes.ramData.freeMB = this.attributes.ramData.totalMB - this.attributes.ramData.usedMB;
    } else {
      this.attributes.ramData.usedMB = null;
      this.attributes.ramData.freeMB = null;
    }

    // Disk Data (structure was already nested, path is now this.attributes.diskData)
    this.attributes.diskData.totalGB = parseFloat(attrsData.drive_total);
    this.attributes.diskData.usedGB = parseFloat(attrsData.drive_used);
    this.attributes.diskData.freeGB = parseFloat(attrsData.drive_free);
    if (!isNaN(this.attributes.diskData.totalGB) && !isNaN(this.attributes.diskData.usedGB) && this.attributes.diskData.totalGB > 0) {
      this.attributes.diskData.usagePercent = (this.attributes.diskData.usedGB / this.attributes.diskData.totalGB) * 100;
    } else {
      this.attributes.diskData.usagePercent = null;
    }

    // Populate ipData
    this.attributes.ipData.ipAddressGnb = attrsData.ip_address_gnb;
    this.attributes.ipData.ipAddressNgc = attrsData.ip_address_ngc;
    this.attributes.ipData.ipAddressNgu = attrsData.ip_address_ngu;
  }

  async refreshAttributesFromServer(timeout = 900) {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchTimeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`http://${this.ip}:5000/api/attributes`, { signal });
      clearTimeout(fetchTimeoutId);

      if (response.ok) {
        const data = await response.json();
        this._parseAndAssignAttributes(data);
        // If attributes are fetched successfully, and status was DISCONNECTED,
        // it implies the node is reachable. The next status poll will confirm RUNNING/OFF.
        // However, we don't change _currentStatus here directly to avoid race conditions
        // with refreshStatusFromServer. Let refreshStatusFromServer be the authority on _currentStatus.
      } else {
        console.error(`[NodeInfo ${this.ip}] Failed to fetch attributes: ${response.status}`);
        this._parseAndAssignAttributes(null);
        this._currentStatus = 'DISCONNECTED';
      }
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      if (error.name === 'AbortError') {
        console.warn(`[NodeInfo ${this.ip}] Attribute fetch timed out after ${timeout}ms.`);
      } else {
        console.error(`[NodeInfo ${this.ip}] Error fetching attributes:`, error);
      }
      this._parseAndAssignAttributes(null);
      this._currentStatus = 'DISCONNECTED';
    }
    // No _globalSetState call
  }

  async refreshStatusFromServer(timeout = 3500) {
    // Do not poll status if a toggle operation is in progress,
    // as toggleScript will manage the initializing state.
    // if (this.isInitializing) { // Removed
        // console.log(`[NodeInfo ${this.ip}] Skipping status refresh because isInitializing is true.`);
        // return;
    // }

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchTimeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`http://${this.ip}:5000/api/node_status`, { signal });
      clearTimeout(fetchTimeoutId);

      if (response.ok) {
        const data = await response.json();
        this._currentStatus = data.node_status; // Expected: 'RUNNING' or 'OFF'
      } else {
        console.error(`[NodeInfo ${this.ip}] Failed to fetch node status: ${response.status}`);
        this._currentStatus = 'DISCONNECTED';
      }
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      if (error.name === 'AbortError') {
        console.warn(`[NodeInfo ${this.ip}] Node status fetch timed out after ${timeout}ms.`);
      } else {
        console.error(`[NodeInfo ${this.ip}] Error fetching node status:`, error);
      }
      this._currentStatus = 'DISCONNECTED';
    }
    // No _globalSetState call
  }

  // Method to toggle the script (start/stop)
  async toggleScript(action) { // action is expected to be 'setupv2' or 'stop'
    // if (!this._globalSetState) { // Removed
    // console.warn(`[NodeInfo ${this.ip}] _globalSetState is not available. UI may not refresh.`);
    // }
    if (!this._setRebootAlertNodeIp) {
      console.warn(`[NodeInfo ${this.ip}] _setRebootAlertNodeIp is not available. Reboot alert will not function.`);
    }

    // Validate action
    if (action !== 'setupv2' && action !== 'stop') {
      console.error(`Invalid action: ${action} passed to toggleScript. Expected 'setupv2' or 'stop'.`);
      return;
    }

    // this.isInitializing = true; // Removed
    // if (this._globalSetState) { // Removed
    // this._globalSetState(prev => [...prev]); // Removed
    // }

    const API_URL = `http://${this.ip}:5000/api/setup_script`;

    const finalizeToggle = () => {
      // this.isInitializing = false; // Removed
      // if (this._globalSetState) { // Removed
      // this._globalSetState(prev => [...prev]); // Removed
      // }
      // The primary responsibility of finalizeToggle was to reset isInitializing and refresh UI.
      // Since isInitializing is removed and UI refresh is handled by App.js tick,
      // this function's role changes. It's now mainly a delay.
      // If _setRebootAlertNodeIp was called, App.js will handle the "initializing" state.
      // If not, the node's status will naturally update via its internal polling.
      console.log(`[NodeInfo ${this.ip}] Toggle action '${action}' processed (finalizeToggle).`);
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: action }) // Use action directly
      });

      if (!response.ok) { // Handle non-2xx responses by logging and potentially setting reboot alert
        let errorText = `Error toggling script. HTTP Status: ${response.status}`;
        try {
          const rtext = await response.text();
          errorText = `Error toggling script. HTTP Status: ${response.status}. Response Text: ${rtext}`;
        } catch (textError) {
          // Ignore if response text cannot be read
        }
        console.error(`[NodeInfo ${this.ip}] ${errorText}`);

        if ((response.status === 500 || response.status === 504) && this._setRebootAlertNodeIp) {
          this._setRebootAlertNodeIp(this.ip); // App.js will see this and can show "Initializing"
        }
      } else {
        // If the command is 'setupv2' (turn on) or 'stop' (turn off) and is successful,
        // we can anticipate the status change and set it optimistically.
        // The regular status polling will eventually confirm this.
        // For 'setupv2', we might expect 'RUNNING' (or 'INITIALIZING' if backend takes time).
        // For 'stop', we expect 'OFF'.
        // However, to keep things simple and reliant on the backend's reported status,
        // we'll let the normal polling update the status.
        // If a quick UI update is desired here, we could set _setRebootAlertNodeIp(this.ip)
        // to signal App.js to show an "Initializing" or "Updating" state briefly.
        if (this._setRebootAlertNodeIp) {
            this._setRebootAlertNodeIp(this.ip); // Signal App.js to show "Initializing"
        }
      }
      // For all cases (response.ok or not), introduce the delay before finalizing.
      setTimeout(finalizeToggle, 4000);

    } catch (error) { // Network error or other error during fetch
      console.error(`[NodeInfo ${this.ip}] Network error or other error during fetch for toggle script. Error:`, error);
      if (this._setRebootAlertNodeIp) {
        this._setRebootAlertNodeIp(this.ip); // Also signal initializing on network error during toggle
      }
      // Also delay in case of a catch block error.
      setTimeout(finalizeToggle, 4000);
    }
    // The lines that were previously here to set isInitializing = false and update _globalSetState
    // are now handled by the finalizeToggle function, called with a delay in all paths.
  }

  async checkManetConnection(timeout = 900) {
    if (!this.manet.ip) {
      this.manet.connectionStatus = 'Not Configured';
      // No _globalSetState call
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchTimeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Assuming the MANET IP might also have a similar API or a simple ping-like endpoint
      // For now, let's simulate a fetch. Replace with actual MANET API endpoint if available.
      // This is a placeholder. You'll need to adjust how MANET status is actually checked.
      const response = await fetch(`http://${this.manet.ip}:5000/api/manet_status`, { signal }); // Example endpoint
      clearTimeout(fetchTimeoutId);

      if (response.ok) {
        const data = await response.json(); // Assuming it returns { status: 'CONNECTED'/'DISCONNECTED', nodeInfo: {...}, selfManetInfo: {...} }
        this.manet.connectionStatus = data.status;
        this.manet.nodeInfo = data.nodeInfo;
        this.manet.selfManetInfo = data.selfManetInfo;
      } else {
        this.manet.connectionStatus = 'Error';
        this.manet.nodeInfo = null;
        this.manet.selfManetInfo = null;
      }
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      if (error.name === 'AbortError') {
        // console.warn(`[NodeInfo ${this.ip}] MANET connection check to ${this.manet.ip} timed out.`);
        this.manet.connectionStatus = 'Timeout';
      } else {
        // console.error(`[NodeInfo ${this.ip}] Error checking MANET connection to ${this.manet.ip}:`, error);
        this.manet.connectionStatus = 'Unreachable';
      }
      this.manet.nodeInfo = null;
      this.manet.selfManetInfo = null;
    }
    // No _globalSetState call
  }

  // Helper to update MANET IP, e.g., from user input
  setManetIp(manetIp) {
    this.manet.ip = manetIp;
    this.manet.connectionStatus = null; // Reset status when IP changes
    this.manet.nodeInfo = null;
    this.manet.selfManetInfo = null;
    this.checkManetConnection(); // Optionally, trigger an immediate check
    // No _globalSetState call
  }

  // Utility to get a simplified representation for localStorage
  toPlainObject() {
    return {
      ip: this.ip,
      nodeName: this.nodeName,
      manetIp: this.manet.ip // Only persist the MANET IP
      // Other attributes are fetched live
    };
  }
}

export default NodeInfo;
