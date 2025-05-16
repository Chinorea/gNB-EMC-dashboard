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
                <WidgetWith3Subtitles
                    title="IP Address"
                    subtitle1="gNB IP Address"
                    text1="192.168.2.26"
                    subtitle2="User Plane NgC"
                    text2="192.168.2.10"
                    subtitle3="User Plane NgR"
                    text3="192.168.2.10"

                />
                <WidgetWith2Subtitles
                    title="Widget Title 2-Sub"
                    subtitle1="Subtitle 1"
                    text1="Text 1"
                    subtitle2="Subtitle 2"
                    text2="Text 2"
                />
                <WidgetWith3Subtitles
                    title="Widget Title 3-Sub"
                    subtitle1="Subtitle 1"
                    text1="Text 1"
                    subtitle2="Subtitle 2"
                    text2="Text 2"
                    subtitle3="Subtitle 3"
                    text3="Tqweiqwjeieiejqiej"
                />
            </div>
        </div>
    );
}

export default App;