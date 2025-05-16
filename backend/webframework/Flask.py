from flask import Flask
from flask import render_template

app = Flask(__name__, template_folder = '../frontend')

@app.route('/dashboard')
def dashboard():
    from backend.logic.attributes.IpAddress import IpAddress
    from backend.logic.attributes.CpuUsage import CpuUsage
    from backend.logic.attributes.RamUsage import RamUsage
    from backend.logic.attributes.BroadcastFrequency import BroadcastFrequency
    from backend.logic.attributes.BoardDateTime import BoardDateTime
    from backend.logic.attributes.RaptorStatus import RaptorStatus

    ipAddress = IpAddress()
    cpuUsage = CpuUsage()
    ramUsage = RamUsage()
    broadcastFrequency = BroadcastFrequency()
    boardDateTime = BoardDateTime()
    raptorStatus = RaptorStatus()

    ipAddress.refresh()
    cpuUsage.refresh()
    ramUsage.refresh()
    broadcastFrequency.refresh()
    boardDateTime.refresh()
    raptorStatus.refresh()

    attributes = {
        'ipAddressGnb': ipAddress.ipAddressGnb,
        'ipAddressNgc': ipAddress.ipAddressNgc,
        'ipAddressNgu': ipAddress.ipAddressNgu,
        'cpuUsage': cpuUsage.cpuUsage,
        'ramUsage': ramUsage.ramUsage,
        'frequencyDownLink': broadcastFrequency.frequencyDownLink,
        'frequencyUpLink': broadcastFrequency.frequencyUpLink,
        'boardDate': boardDateTime.boardDate,
        'boardTime': boardDateTime.boardTime,
        'raptorStatus': raptorStatus.raptorStatus,
    }

    return render_template('dashboard.html', attributes=attributes)