from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes")
def attributes_api():
    # return only dummy data for now
    return jsonify({
      "ipAddressGnb":       "192.168.2.26",
      "ipAddressNgc":       "192.168.2.24",
      "ipAddressNgu":       "ipaddressngu",
      "cpuUsage":           "cpuUsage",
      "ramUsage":           "ramUsage",
      "frequencyDownLink":  "frequencyDownLink",
      "frequencyUpLink":    "frequencyUpLink",
      "boardDate":          "boardDate",
      "boardTime":          "boardTime",
      "raptorStatus":       "raptorStatus",
    })