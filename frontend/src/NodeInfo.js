class NodeInfo {
  constructor(ip, globalSetState) {
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
    this.isInitializing = false; // Used to indicate script toggle or initial data load

    // Store the callback
    this._globalSetState = globalSetState;
  }

  get status() {
    if (this.isInitializing) {
      return 'INITIALIZING';
    }
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

  async refreshAttributesFromServer(timeout = 2000) {
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

  async refreshStatusFromServer(timeout = 2000) {
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
  async toggleScript(action) { // action is expected to be 'start' or 'stop' from the frontend
    console.log(`[NodeInfo ${this.ip}] toggleScript called with action: ${action}`);

    if (!this._globalSetState) {
      console.warn(`[NodeInfo ${this.ip}] _globalSetState is not available. UI may not refresh.`);
    }

    this.isInitializing = true;
    if (this._globalSetState) {
      console.log(`[NodeInfo ${this.ip}] Setting isInitializing to true and updating global state.`);
      this._globalSetState(prev => [...prev]);
    } else {
      console.warn(`[NodeInfo ${this.ip}] Cannot update global state for isInitializing=true as _globalSetState is missing.`);
    }

    let backendAction;
    if (action === 'start') {
      backendAction = 'setupv2';
    } else if (action === 'stop') {
      backendAction = 'stop';
    } else {
      console.error(`[NodeInfo ${this.ip}] Invalid action: ${action} passed to toggleScript.`);
      this.isInitializing = false;
      if (this._globalSetState) {
        this._globalSetState(prev => [...prev]);
      }
      return;
    }

    const API_URL = `http://${this.ip}:5000/api/setup_script`;
    console.log(`[NodeInfo ${this.ip}] Attempting API call. Method: POST, URL: ${API_URL}, Backend Action: ${backendAction}`);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: backendAction })
      });

      console.log(`[NodeInfo ${this.ip}] API call completed. Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[NodeInfo ${this.ip}] Toggle script successful. Response data:`, data);
      } else {
        let errorText = 'Could not retrieve error text from response.';
        try {
          errorText = await response.text();
        } catch (textError) {
          console.error(`[NodeInfo ${this.ip}] Failed to get text from error response:`, textError);
        }
        console.error(`[NodeInfo ${this.ip}] Error toggling script. HTTP Status: ${response.status}. Response Text: ${errorText}`);
      }
    } catch (error) {
      console.error(`[NodeInfo ${this.ip}] Network error or other error during fetch for toggle script. Error:`, error);
      if (error && error.message) {
        console.error(`[NodeInfo ${this.ip}] Error message: ${error.message}`);
      }
      // Avoid logging full stack in production for security, but useful for dev
      // if (error && error.stack) {
      //   console.error(`[NodeInfo ${this.ip}] Error stack: ${error.stack}`);
      // }
    }

    console.log(`[NodeInfo ${this.ip}] Proceeding to refresh data after toggle attempt.`);
    try {
      await this.refreshStatusFromServer();
      // Note: this.status getter itself checks this.isInitializing.
      // If toggleScript failed and node is still 'OFF' or 'DISCONNECTED', attributes might not be fetched.
      if (this.status === 'RUNNING') { 
        console.log(`[NodeInfo ${this.ip}] Node status is RUNNING, refreshing attributes.`);
        await this.refreshAttributesFromServer();
      } else {
        console.log(`[NodeInfo ${this.ip}] Node status is ${this.status}, skipping attribute refresh.`);
      }
      await this.checkManetConnection();
      console.log(`[NodeInfo ${this.ip}] Data refresh completed.`);
    } catch (refreshError) {
        console.error(`[NodeInfo ${this.ip}] Error during post-toggle data refresh:`, refreshError);
    }
    
    this.isInitializing = false;
    if (this._globalSetState) {
      console.log(`[NodeInfo ${this.ip}] Setting isInitializing to false and updating global state.`);
      this._globalSetState(prev => [...prev]);
    } else {
       console.warn(`[NodeInfo ${this.ip}] Cannot update global state for isInitializing=false as _globalSetState is missing.`);
    }
    console.log(`[NodeInfo ${this.ip}] toggleScript finished.`);
  }

  async checkManetConnection(timeout = 1000) {
    if (!this.manet.ip) {
      this.manet.connectionStatus = 'Not Configured';
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchTimeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      await fetch(`http://${this.manet.ip}`, { method: 'HEAD', mode: 'no-cors', signal }); // Corrected
      clearTimeout(fetchTimeoutId);
      this.manet.connectionStatus = 'Connected';
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      this.manet.connectionStatus = 'Disconnected';
    }
  }
}

export default NodeInfo;
