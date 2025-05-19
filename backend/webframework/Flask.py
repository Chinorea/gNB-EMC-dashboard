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
    # Instantiate and refresh each attribute
    ip  = IpAddress("/cu/config/me_config.xml"); ip.refresh()
    cpu = CpuUsage();           cpu.refresh()
    ram = RamUsage();           ram.refresh()
    bc  = BroadcastFrequency(); bc.refresh()
    bd  = BoardDateTime();      bd.refresh()
    rap = RaptorStatus();       rap.refresh()

    # Return real values instead of dummy strings
    data = {
      "ipAddressGnb":      ip.ipAddressGnb,
      "ipAddressNgc":      ip.ipAddressNgc,
      "ipAddressNgu":      ip.ipAddressNgu,
      "cpuUsage":          cpu.cpuUsage,
      "ramUsage":          ram.ramUsage,
      "frequencyDownLink": bc.frequencyDownLink,
      "frequencyUpLink":   bc.frequencyUpLink,
      "boardDate":         bd.boardDate,
      "boardTime":         bd.boardTime,
      "raptorStatus":      rap.raptorStatus,
    }
    return jsonify(data)