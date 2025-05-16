import React from "react";
import "./App.css";

function App() {
    // Example mock data for just the gNB IP address
    const ipAddressGnb = "192.168.1.100";

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">5G Node Dashboard</h1>
            <div className="widget-stack">
                <Widget
                    title="gNB IP Address"
                    value={ipAddressGnb}
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
                    text3="Text 3"
                />
            </div>
        </div>
    );
}


// Widget component for consistent UI
function Widget({title, value}) {
    return (
        <div className="widget-card">
            <h2 className="widget-title">{title}</h2>
            <div className="widget-value">{value}</div>
        </div>
    );
}

function WidgetWith2Subtitles({title, subtitle1, text1, subtitle2, text2}) {
    return (
        <div className="widget-card">
            <h2 className="widget-title">{title}</h2>
            <div className="widget-subsection">
                <h3 className="widget-subtitle">{subtitle1}</h3>
                <div className="widget-value">{text1}</div>
            </div>
            <div className="widget-subsection">
                <h3 className="widget-subtitle">{subtitle2}</h3>
                <div className="widget-value">{text2}</div>
            </div>
        </div>
    );
}

function WidgetWith3Subtitles({title, subtitle1, text1, subtitle2, text2, subtitle3, text3}) {
    return (
        <div className="widget-card">
            <h2 className="widget-title">{title}</h2>
            <div className="widget-subsection">
                <h3 className="widget-subtitle">{subtitle1}</h3>
                <div className="widget-value">{text1}</div>
            </div>
            <div className="widget-subsection">
                <h3 className="widget-subtitle">{subtitle2}</h3>
                <div className="widget-value">{text2}</div>
            </div>
            <div className="widget-subsection">
                <h3 className="widget-subtitle">{subtitle3}</h3>
                <div className="widget-value">{text3}</div>
            </div>
        </div>
    );
}

export default App;