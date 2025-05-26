Collecting workspace information

# gNB-EMC Dashboard Developer Guide

---

## Table of Contents

1. [Acknowledgements](#acknowledgements)  
2. [Setting up / Getting started](#setting-up—getting-started)  
   2.1. [Frontend Setup](#frontend-setup)  
   2.2. [Backend Setup](#backend-setup)  
3. [Design](#design)  
   3.1. [Architecture](#architecture)  
   3.2. [UI component](#ui-component)  
   3.3. [Logic component](#logic-component)  
   3.4. [Model component](#model-component)  
   3.5. [Backend component](#backend-component)  
4. [Implementation](#implementation)  
   4.1. [Node status monitoring](#node-status-monitoring)  
   4.2. [Dashboard visualization](#dashboard-visualization)  
   4.3. [Node control (start/stop)](#node-control-startstop)  
   4.4. [Real-time data updates](#real-time-data-updates)  
   4.5. [Persistent node configuration](#persistent-node-configuration)  
5. [Design considerations](#design-considerations)  
6. [Appendix: Requirements](#appendix-requirements)  
   6.1. [Product scope](#product-scope)  
   6.2. [User stories](#user-stories)  
   6.3. [Use cases](#use-cases)  
   6.4. [Non-Functional Requirements](#non-functional-requirements)  
   6.5. [Glossary](#glossary)  

---

## Acknowledgements

- **React** ([reactjs.org][react]) & **Material-UI** ([mui.com][mui])  
- **Flask** ([palletsprojects.com/p/flask][flask]) & **Flask-CORS**  
- **Recharts** ([recharts.org][recharts])  

---

## Setting up / Getting started

### Frontend Setup

1. `cd frontend`  
2. Install deps:  
   ```bash
   npm install
   ```  
3. Start dev server:  
   ```bash
   npm start
   ```  

### Backend Setup

1. Ensure Python 3.9+ is installed  
2. Install Python deps:  
   ```bash
   pip install flask flask-cors
   ```  
3. Run Flask API:  
   ```bash
   python3 WebDashboard.py
   ```  

---

## Design

### Architecture

A classic client–server model:

- **Frontend**  
  React SPA (Material-UI)  
- **Backend**  
  Flask REST API + Python “Attribute” classes ([see `RaptorStatusType.py`][raptorstatus])  
- **Data flow**  
  1. Hardware → backend collectors  
  2. `/api/*` → JSON over HTTP  
  3. Frontend polls & visualizes  

### UI component

- **App.js** – routing & global state  
- **Sidebar** – navigation & node list  
- **HomePage** – grid of status cards  
- **NodeDashboard** – detailed metrics & controls  

### Logic component

- React hooks (`useEffect`, `useState`)  
- Fetch API for polling  
- React Router for navigation  

### Model component

- **Frontend state**  
  - `nodes`: tracked node IPs  
  - `nodeStatuses`, `nodeAttrs`, `loadingMap`  
- **Backend classes**  
  - `IpAddress`, `CpuUsage`, `RamUsage`, …  
  - Each has a `refresh()` method  

### Backend component

- **Routes**  
  - `GET /api/attributes`  
  - `GET /api/node_status`  
  - `POST /api/setup_script`  
- **Attribute classes**  
  Python modules that collect & format metrics  

---

## Implementation

### Node status monitoring

1. `App.js` sets two intervals:  
   - Fast (1 s) for attributes  
   - Slow (3 s) for status  
2. State updates flow via props → components  

### Dashboard visualization

- **Recharts** for time-series (CPU/RAM)  
- Responsive containers + smoothing  

### Node control (start/stop)

1. Toggle button → `POST /api/setup_script`  
2. Backend runs `gnb_ctl start|stop`  
3. Returns result → UI notifications  

### Real-time data updates

- Backend buffers ~200 points  
- Frontend smooths & renders  

### Persistent node configuration

- Stored in `localStorage`  
- Sidebar form to add/remove nodes  

---

## Design considerations

1. Polling vs WebSockets  
2. App-level state vs Redux  
3. Graceful error handling  
4. Client-side smoothing  
5. Responsive UI  

---

## Appendix: Requirements

### Product scope

- **Users**: network engineers, operators, support  
- **Value**: unified real-time monitoring & control  

### User stories

| Priority | Role               | Feature                  | Benefit                       |
| -------- | ------------------ | ------------------------ | ----------------------------- |
| ***      | Network Engineer   | See all node statuses    | Quickly spot failures        |
| ***      | Operator           | Start/stop nodes         | Remote control of hardware   |
| ***      | Support Engineer   | View CPU/RAM/disk metrics| Diagnose performance issues  |
| **       | Network Engineer   | Historical trends        | Identify recurring issues    |
| **       | Operator           | Add/remove nodes         | Flexible dashboard config    |
| *        | Support Engineer   | Download logs            | Advanced troubleshooting     |

### Use cases

#### UC01 – Monitor Node Status

### Use Case: UC04 - Add a Node to Dashboard

#### UC02 – View Node Details

1. Click node card  
2. Detailed view + metrics  

*… (and so on)*

### Non-Functional Requirements

1. Real-time updates < 3 s  
2. Responsive UI  
3. Graceful recovery from network errors  
4. Support ≥ 20 nodes  
5. Desktop & tablet support  
6. Persistent config  
7. Robust error handling  

### Glossary

- **gNB** – 5G Node B  
- **RAN** – Radio Access Network  
- **PCI** – Physical Cell ID  
- **RaptorStatus** – OFF / INITIALISING / RUNNING  

---

## Publishing on GitHub Pages

1. Create a repo named `<your-username>.github.io`.  
2. Add this file as `index.md` in the root (or rename to `README.md`).  
3. (Optional) Add `_config.yml` for custom Jekyll settings.  
4. Push and go to **Settings → Pages** → choose `main` branch.  
5. Visit:  
   ```
   https://<your-username>.github.io/
   ```

---

## References

[react]: https://reactjs.org/  
[mui]: https://mui.com/  
[flask]: https://flask.palletsprojects.com/  
[recharts]: https://recharts.org/  
[raptorstatus]: RaptorStatusType.py