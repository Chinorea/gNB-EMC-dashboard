class NodeInfo {
  constructor(ip, globalSetState, setRebootAlertNodeIp) { // Added setRebootAlertNodeIp
    this.ip = ip; // Primary IP of the node

    // Status and Initialization
    this._currentStatus = 'DISCONNECTED'; // Internal status: 'DISCONNECTED', 'RUNNING', 'OFF'
    this.isInitializing = false; // True during toggle operations or explicit initialization phases

    // Naming and Identification
    this.nodeName = ''; // User-defined node name

    // Centralized attributes store
    this.attributes = {
      coreData: {
        gnbId: null,
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
    this.isInitializing = false; // Used to indicate script toggle or initial data load

    // Store the callback
    this._globalSetState = globalSetState;
    this._setRebootAlertNodeIp = setRebootAlertNodeIp; // Store the new callback
  }

  get status() {
    if (this.isInitializing) {
      return 'INITIALIZING';
    }
    return this._currentStatus;
  }

  // Internal helper to parse and assign attributes from fetched data
  _parseAndAssignAttributes(attrsData) {    // Reset attributes to the defined nested default state first
    this.attributes = {
      coreData: {
        gnbId: null,
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

    this.rawAttributes = attrsData;    // Populate coreData
    this.attributes.coreData.gnbId = attrsData.gnb_id;
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

  async refreshAttributesFromServer(timeout = 4000) {
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
  }

  async refreshStatusFromServer(timeout = 4900) {
    // Do not poll status if a toggle operation is in progress,
    // as toggleScript will manage the initializing state.
    if (this.isInitializing) {
        // console.log(`[NodeInfo ${this.ip}] Skipping status refresh because isInitializing is true.`);
        return;
    }

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
  }

  // Method to toggle the script (start/stop)
  async toggleScript(action) { // action is expected to be 'start' or 'stop'
    if (!this._globalSetState) {
      console.warn(`[NodeInfo ${this.ip}] _globalSetState is not available. UI may not refresh.`);
    }
    if (!this._setRebootAlertNodeIp) {
      console.warn(`[NodeInfo ${this.ip}] _setRebootAlertNodeIp is not available. Reboot alert will not function.`);
    }

    // Validate action
    if (action !== 'start' && action !== 'stop') {
      console.error(`Invalid action: ${action} passed to toggleScript. Expected 'start' or 'stop'.`);
      return;
    }

    this.isInitializing = true;
    if (this._globalSetState) {
      this._globalSetState(prev => [...prev]);
    }

    const API_URL = `http://${this.ip}:5000/api/setup_script`;

    const finalizeToggle = () => {
      this.isInitializing = false;
      if (this._globalSetState) {
        this._globalSetState(prev => [...prev]);
      }
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
          this._setRebootAlertNodeIp(this.ip);
        }
      }
      // For all cases (response.ok or not), introduce the delay before finalizing.
      setTimeout(finalizeToggle, 15000);

    } catch (error) { // Network error or other error during fetch
      console.error(`[NodeInfo ${this.ip}] Network error or other error during fetch for toggle script. Error:`, error);
      // Also delay in case of a catch block error.
      setTimeout(finalizeToggle, 15000);
    }
    // The lines that were previously here to set isInitializing = false and update _globalSetState
    // are now handled by the finalizeToggle function, called with a delay in all paths.
  }
  async checkManetConnection(timeout = 4000) {
    if (!this.manet.ip) {
      this.manet.connectionStatus = 'Not Configured';
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchTimeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      await fetch(`http://${this.manet.ip}/status`, { method: 'GET', mode: 'no-cors', signal });
      clearTimeout(fetchTimeoutId);
      this.manet.connectionStatus = 'Connected';
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      this.manet.connectionStatus = 'Disconnected';
    }
  }
}

export default NodeInfo;
