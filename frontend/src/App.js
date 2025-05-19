import React from "react";
import "./App.css";

import {Widget, WidgetWithButton, WidgetWith2Subtitles, WidgetWith3Subtitles} from "./jsfiles/Widgets";
import "./cssfiles/Widgets.css";


function App() {
    // Example mock data for just the gNB IP address
    const ipAddressGnb = "192.168.1.100";

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">5G Node Dashboard</h1>
            <div className="widget-stack">
                <Widget
                    title="System Time"
                    value="1:29PM"
                />
                <Widget
                    title="System Date"
                    value="12/06/2025"
                />

                <WidgetWithButton
                    title="Status"
                    value="Online"
                    button="Turn Off"
                />
            </div>

            <div className="widget-stack">
                <Widget
                    title="Broadcast Bandwidth"
                    value="40Mhz"
                />
                <Widget
                    title="CPU Usage"
                    value="42%"
                />
                <Widget
                    title="RAM Usage"
                    value="1.1/2.0 GB"
                />
            </div>

            <div className="widget-stack">
                <WidgetWith3Subtitles
                    title="IP Address"
                    subtitle1="gNB IP Address"
                    text1="192.168.2.26"
                    subtitle2="User Plane NgC"
                    text2="192.168.2.10"
                    subtitle3="User Plane NgR"
                    text3="192.168.2.10"

                />
                <WidgetWith3Subtitles
                    title="Broadcast Frequency"
                    subtitle1="Downlink"
                    text1="3.5Mhz"
                    subtitle2="Uplink"
                    text2="3.5Mhz"
                    subtitle3="Bandwidth"
                    text3="40Mhz"
                />
            </div>
        </div>
    );
}

export default App;