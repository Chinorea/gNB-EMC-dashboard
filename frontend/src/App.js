import React, { useState, useEffect } from "react";
import "./App.css";

import {
  Widget,
  WidgetWithButton,
  WidgetWith3Subtitles,
  WidgetWith2Subtitles,
} from "./jsfiles/Widgets";
import "./cssfiles/Widgets.css";

function App() {
  const [attrs, setAttrs] = useState(null);

  useEffect(() => {
    const fetchAttrs = () => {
      fetch("http://192.168.2.26:5000/api/attributes")
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then((data) => setAttrs(data))
        .catch((err) => console.error("Failed to load attributes:", err));
    };

    fetchAttrs();                         // initial load
    const intervalId = setInterval(       // every 0.2 seconds
      fetchAttrs,
      200
    );
    return () => clearInterval(intervalId);
  }, []);

  if (!attrs) {
    return <div className="dashboard-container">Loading…</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">5G Node Dashboard</h1>

      <div className="widget-stack">
        <Widget title="System Time" value={attrs.board_time} />
        <Widget title="System Date" value={attrs.board_date} />

        <WidgetWithButton
          title="Status"
          value={attrs.raptor_status}
          button={attrs.raptor_status === "RUNNING" ? "Turn Off" : "Turn On"}
        />
      </div>

      <div className="widget-stack">
        <WidgetWith2Subtitles
          title="Broadcast Bandwidth"
          subtitle1="Downlink"
          text1={`${attrs.bandwidth_down_link} MHz`}
          subtitle2="Uplink"
          text2={`${attrs.bandwidth_up_link} MHz`}
        />
        <Widget title="CPU Usage" value={`${attrs.cpu_usage}%`} />
        <WidgetWith2Subtitles
        title="RAM"
        subtitle1="Total RAM"
        text1={`${attrs.ram_total} GB`}
        subtitle2="Used RAM" 
        text2={`${attrs.ram_usage} GB`}
        />
      </div>

      <div className="widget-stack">
        <WidgetWith3Subtitles
          title="IP Address"
          subtitle1="gNB IP Address"
          text1={attrs.ip_address_gnb}
          subtitle2="User Plane NgC"
          text2={attrs.ip_address_ngc}
          subtitle3="User Plane NgR"
          text3={attrs.ip_address_ngu}
        />

        <WidgetWith2Subtitles
          title="Broadcast Frequency"
          subtitle1="Downlink"
          text1={`${attrs.frequency_down_link} KHz`}
          subtitle2="Uplink"
          text2={`${attrs.frequency_down_link} KHz`}
        />
      </div>
    </div>
  );
}

export default App;