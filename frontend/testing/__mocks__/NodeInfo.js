export default class NodeInfo {
  constructor(ip, setAllNodeData, setRebootAlertNodeIp) {
    this.ip = ip;
    this.nodeName = `Node-${ip}`;
    this.manet = {
      ip: null,
      connectionStatus: 'disconnected',
      selfManetInfo: null
    };
    this._currentStatus = 'offline';
    this.attributes = {};
    this.isInitializing = false;
    this.setAllNodeData = setAllNodeData;
    this.setRebootAlertNodeIp = setRebootAlertNodeIp;
  }

  get status() {
    return this._currentStatus;
  }

  get isToggleInProgress() {
    return this.isInitializing;
  }

  async refreshAttributesFromServer() {
    // Mock implementation
    this.attributes = {
      transmitData: { txPower: 20 },
      batteryLevel: '12.5V'
    };
    return Promise.resolve();
  }

  async refreshStatusFromServer() {
    this._currentStatus = 'online';
    return Promise.resolve();
  }

  async checkManetConnection() {
    this.manet.connectionStatus = 'connected';
    return Promise.resolve();
  }
}