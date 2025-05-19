import React, { useState, useEffect } from "react";
import "./App.css";

import {
  Widget,
  WidgetWithButton,
  WidgetWith3Subtitles,
} from "./jsfiles/Widgets";
import "./cssfiles/Widgets.css";

function App() {
  // state to hold everything we get back from Flask
  const [attrs, setAttrs] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/attributes")
      .then((res) => res.json())
      .then((data) => setAttrs(data))
      .catch((err) => {
        console.error("Failed to load attributes:", err);
      });
  }, []);

  // while loading, you can show a spinner or simple text
  if (!attrs) {
    return <div className="dashboard-container">Loading…</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">5G Node Dashboard</h1>

      <div className="widget-stack">
        <Widget title="System Time" value={attrs.boardTime} />
        <Widget title="System Date" value={attrs.boardDate} />

        <WidgetWithButton
          title="Status"
          value={attrs.raptorStatus}
          button={attrs.raptorStatus === "RUNNING" ? "Turn Off" : "Turn On"}
        />
      </div>
      
      <div className="widget-stack">
        <Widget
          title="Broadcast Bandwidth"
          value={`${attrs.frequencyDownLink}/${attrs.frequencyUpLink}`}
        />
        <Widget title="CPU Usage" value={`${attrs.cpuUsage}%`} />
        <Widget title="RAM Usage" value={attrs.ramUsage} />
      </div>

      <div className="widget-stack">
        <WidgetWith3Subtitles
          title="IP Address"
          subtitle1="gNB IP Address"
          text1={attrs.ipAddressGnb}
          subtitle2="User Plane NgC"
          text2={attrs.ipAddressNgc}
          subtitle3="User Plane NgR"
          text3={attrs.ipAddressNgu}
        />

        <WidgetWith3Subtitles
          title="Broadcast Frequency"
          subtitle1="Downlink"
          text1={attrs.frequencyDownLink}
          subtitle2="Uplink"
          text2={attrs.frequencyUpLink}
          subtitle3="Bandwidth"
          text3={`${attrs.frequencyDownLink + attrs.frequencyUpLink}`}
        />
      </div>
    </div>
  );
}

export default App;