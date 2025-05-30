class NodeInfo {
  constructor(ip) {
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
    this.rawAttributes = {};
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

  async toggleScript(action, timeout = 10000) {
    this.isInitializing = true;

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchTimeoutId = setTimeout(() => controller.abort(), timeout);

    let result = { success: false, showRebootAlert: false, error: null };

    try {
      const response = await fetch(`http://${this.ip}:5000/api/setup_script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        signal,
      });
      clearTimeout(fetchTimeoutId);

      // Check for 500 or 504 to indicate potential reboot
      if (response.status === 500 || response.status === 504) {
        result = { success: true, showRebootAlert: true, error: null };
        // _currentStatus will be updated by subsequent polling.
        // isInitializing remains true until explicitly set false.
      } else if (response.ok) {
        result = { success: true, showRebootAlert: false, error: null };
        // If action is 'setupv2', node is starting. If 'stop', it's stopping.
        // _currentStatus will be updated by subsequent polling.
      } else {
        const errorText = await response.text();
        console.error(`[NodeInfo ${this.ip}] Toggle script '${action}' failed: ${response.status} - ${errorText}`);
        this._currentStatus = 'DISCONNECTED'; // Or some other error state if preferred
        result = { success: false, showRebootAlert: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      let errorMsg = '';
      if (error.name === 'AbortError') {
        errorMsg = `Request timed out after ${timeout}ms.`;
        console.warn(`[NodeInfo ${this.ip}] Toggle script '${action}' ${errorMsg}`);
      } else {
        errorMsg = error.message;
        console.error(`[NodeInfo ${this.ip}] Error toggling script '${action}':`, error);
      }
      this._currentStatus = 'DISCONNECTED'; // Or some other error state
      result = { success: false, showRebootAlert: false, error: errorMsg };
    } finally {
      this.isInitializing = false;
    }
    return result;
  }

  async checkManetConnection(timeout = 2000) {
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
