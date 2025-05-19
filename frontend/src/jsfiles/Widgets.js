import React from "react";

function Widget({title, value}) {
    return (
        <div className="widget-card">
            <h2 className="widget-title">{title}</h2>
            <div className="widget-value">{value}</div>
        </div>
    );
}

function WidgetWithButton({title, value, button}) {
    return (
        <div className="widget-card">
            <h2 className="widget-title">{title}</h2>
            <div className="widget-value">{value}</div>
            <button className="widget-button">{button}</button>
        </div>
    )
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

export { Widget, WidgetWithButton, WidgetWith2Subtitles, WidgetWith3Subtitles };
