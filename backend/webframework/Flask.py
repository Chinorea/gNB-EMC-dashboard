from flask import Flask, jsonify
from flask_cors import CORS

from backend.logic.attributes.IpAddress          import IpAddress
from backend.logic.attributes.CpuUsage           import CpuUsage
from backend.logic.attributes.RamUsage           import RamUsage
from backend.logic.attributes.BroadcastFrequency import BroadcastFrequency
from backend.logic.attributes.BoardDateTime      import BoardDateTime
from backend.logic.attributes.RaptorStatus       import RaptorStatus

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes")
def attributes_api():
    cfg = "/cu/config/me_config.xml"
    ip  = IpAddress(cfg);                 ip.refresh()
    cpu = "50"  # CpuUsage(cfg);          cpu.refresh()
    ram = "40"  # RamUsage(cfg);          ram.refresh()
    bc  = BroadcastFrequency(cfg);        bc.refresh()
    bd  = BoardDateTime();                bd.refresh()
    rap = RaptorStatus();                 rap.refresh()

    data = {
      "ipAddressGnb":      ip.ipAddressGnb,
      "ipAddressNgc":      ip.ipAddressNgc,
      "ipAddressNgu":      ip.ipAddressNgu,
      "cpuUsage":          cpu,
      "ramUsage":          ram,
      "frequencyDownLink": bc.frequencyDownLink,
      "frequencyUpLink":   bc.frequencyUpLink,
      "boardDate":         bd.boardDate,
      "boardTime":         bd.boardTime,
      "raptorStatus":      rap.raptorStatus,
    }
    return jsonify(data)