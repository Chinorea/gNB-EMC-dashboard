import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box
} from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeContextProvider } from './theme/ThemeContext';
import HomePage from './HomePage';
import NodeDashboard from './NodeDashboard';
import MapView from './Map';
import 'leaflet/dist/leaflet.css';
import buildStaticsLQM from './utils';
import NodeInfo from './NodeInfo'; // Ensure NodeInfo is imported
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog'; // Added import
import Sidebar from './appassets/SideBar';

const drawerWidth = 350;

export default function App() {
  const [allNodeData, setAllNodeData] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false); // Ensure this is declared
  const allNodeDataRef = useRef(allNodeData);
  const [rebootAlertNodeIp, setRebootAlertNodeIp] = useState(null);

  // Add state for map markers and LQM
  const [mapMarkers, setMapMarkers] = useState([]);
  const [lqm, setLQM] = useState([]);

  // NEW: State to trigger map data refresh
  const [mapDataRefreshTrigger, setMapDataRefreshTrigger] = useState(0);

///— DUMMY TEST DATA —///
const DUMMY_MARKERS = [
  {
    "nodeInfos": [
    {
      "id": 20,
      "ip": "192.168.1.4",
      "latitude": "1.33631",
      "longitude": "103.744179",
      "altitude": 15.2,
      "resourceRatio": 0.73
    },
    {
      "id": 25,
      "ip": "192.168.1.5",
      "latitude": "1.32631",
      "longitude": "103.745179",
      "altitude": 22.7,
      "resourceRatio": 0.45
    },
    {
      "id": 32,
      "ip": "192.168.1.6",
      "latitude": "1.33531",
      "longitude": "103.746179",
      "altitude":  8.9,
      "resourceRatio": 0.88
    },
    {
      "id": 36,
      "ip": "192.168.1.7",
      "latitude": "1.33731",
      "longitude": "103.743179",
      "altitude": 31.4,
      "resourceRatio": 0.52
    },
    {
      "id": 38,
      "ip": "192.168.1.8",
      "latitude": "1.33831",
      "longitude": "103.740179",
      "altitude": 19.6,
      "resourceRatio": 0.29
    }
    ]}
];

// if you originally had 3×3 matrix, extend to 6×6.  Here we just
// fill new rows/cols with some made-up SNRs between −10 and +30:
const DUMMY_LQM = [
  [-10,  12,   5,  30,  -3],  // node 0 to 0–4
  [ 12, -10,  25,   0,  15],  // node 1
  [  5,  25, -10,  10,  20],  // node 2
  [ 30,   0,  10, -10,   8],  // node 3
  [ -3,  15,  20,   8, -10],  // node 4
];

  // Function to load map data from API
  const loadMapData = useCallback(() => {
    // Find the first node with a valid manet.ip
    const targetNode = allNodeData.find(node => node.manet && node.manet.ip);
    if (!targetNode) {
      console.warn("No node with a valid manet.ip found.");
      return;
    }
    const API_URL = `http://${targetNode.manet.ip}/status`;

    fetch(API_URL)
      .then(r => r.json())
      .then(data => {

        // For Actual Map Data Testing
        const infos = Array.isArray(data.nodeInfos)
          ? data.nodeInfos
          : Object.values(data.nodeInfos || {});
        const enriched = infos.map(info => ({
          ...info,
          batteryLevel:
            data.selfId === info.id
              ? (data.batteryLevel * 10).toFixed(2) + '%'
              : 'unknown'
        }));
        const rawLQM = Array.isArray(data.linkQuality)
          ? data.linkQuality
          : [];
        const fullLQM = buildStaticsLQM(infos, rawLQM, lqm, 100, null);
        setLQM(fullLQM);

        setAllNodeData(prevAllNodeData => {
          return prevAllNodeData.map(node => {
            // Find enriched info by manet IP
            const match = enriched.find(info => info.ip === node.manet.ip);
            if (match) {
              node.manet.nodeInfo = enriched;
              node.manet.selfManetInfo = match;
            }
            return node;
          });
        });

        // Use selfManetInfo for map markers
        const selfManetMarkers = allNodeData
          .map(node => node.manet.selfManetInfo)
          .filter(info => info && info.latitude && info.longitude);
        setMapMarkers(selfManetMarkers);

        // For Dummy Map Data Testing
        // setMapMarkers(DUMMY_MARKERS[0].nodeInfos);
        // const rawLQM = Array.isArray(DUMMY_LQM)
        //   ? DUMMY_LQM
        //   : [];
        // const fullLQM = buildStaticsLQM(DUMMY_MARKERS[0].nodeInfos, rawLQM, lqm, 100, null);
        // setLQM(fullLQM);       

      })
      .catch(console.error);
  }, [allNodeData, lqm, mapMarkers]); // Removed setAllNodeData from here as it's implicitly covered by allNodeData

  // NEW: Hard refresh rate for map data
  useEffect(() => {
    if (!hasLoaded) return; // Wait for initial load
    loadMapData(); // Initial load for map
    const intervalId = setInterval(() => {
      setMapDataRefreshTrigger(t => t + 1);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadMapData, hasLoaded]); // Add hasLoaded

  // Only update map data when mapDataRefreshTrigger changes
  useEffect(() => {
    if (!hasLoaded) return; // Wait for initial load
    loadMapData();
  }, [mapDataRefreshTrigger, loadMapData, hasLoaded]); // Add hasLoaded

  // Effect to keep ref in sync with state
  useEffect(() => {
    allNodeDataRef.current = allNodeData;
  }, [allNodeData]);

  // Effect 1: Initial load of allNodeData from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('allNodeDataStorage');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const instances = parsed.map(data => {
          const instance = new NodeInfo(data.ip, setAllNodeData, setRebootAlertNodeIp);
          instance.nodeName = data.nodeName;
          instance.manet.ip = data.manetIp;
          instance.manet.connectionStatus = data.manetConnectionStatus;
          instance._currentStatus = data.status;
          instance.attributes = data.attributes;
          instance.isInitializing = data.isInitializing || false;
          return instance;
        });
        setAllNodeData(instances);
      } catch (e) { // Catch specific error
        console.error("Failed to parse localStorage data:", e);
        setAllNodeData([]);
      }
    }
    setHasLoaded(true); // Set hasLoaded to true AFTER attempting to load and set state
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect 2: Persist allNodeData to localStorage
  useEffect(() => {
    if (!hasLoaded) { // Guard: Only run if initial load is complete
      return;
    }
    const plainObjects = allNodeData.map(instance => ({
      ip: instance.ip,
      nodeName: instance.nodeName,
      manetIp: instance.manet.ip,
      status: instance.status, // Relies on NodeInfo's getter
      attributes: instance.attributes, // Consider if all attributes need to be persisted
      isInitializing: instance.isToggleInProgress, // Persist based on isToggleInProgress
      manetConnectionStatus: instance.manet.connectionStatus,
    }));
    localStorage.setItem('allNodeDataStorage', JSON.stringify(plainObjects));
  }, [allNodeData, hasLoaded]); // Depend on allNodeData and hasLoaded

  // Effect 3: Poll attributes every 2 seconds with re-entrancy guard
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    let running = false;
    const attrInterval = setInterval(async () => {
      const currentNodes = allNodeDataRef.current;
      if (running || currentNodes.length === 0) return;
      running = true;
      try {
        await Promise.all(currentNodes.map(node => node.refreshAttributesFromServer()));
        setAllNodeData(prevNodes => [...prevNodes]); // Use functional update or ensure currentNodes is fresh
      } catch (error) {
        console.error("Error polling attributes:", error);
      } finally {
        running = false;
      }
    }, 2000);
    return () => clearInterval(attrInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array

  // Effect 4: Poll status every 8 seconds
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    let running = false;
    const statusInterval = setInterval(async () => {
      const currentNodes = allNodeDataRef.current;
      if (running || currentNodes.length === 0) return;
      running = true;
      try {
        await Promise.all(currentNodes.map(node => node.refreshStatusFromServer()));
        setAllNodeData(prevNodes => [...prevNodes]);
      } catch (error) {
        console.error("Error polling status:", error);
      } finally {
        running = false;
      }
    }, 5000);
    return () => clearInterval(statusInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array

  // Effect 5: Poll MANET connection every 2 seconds (as per user's current code)
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    let running = false;
    const manetInterval = setInterval(async () => {
      const currentNodes = allNodeDataRef.current;
      if (running || currentNodes.length === 0) return;
      running = true;
      try {
        await Promise.all(currentNodes.map(node => node.checkManetConnection()));
        setAllNodeData(prevNodes => [...prevNodes]);
      } catch (error) {
        console.error("Error polling MANET connection:", error);
      } finally {
        running = false;
      }
    }, 2000); // Interval was 2000 in user's code
    return () => clearInterval(manetInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array

  //console.log(allNodeData); // This will now log an array of NodeInfo instances
  return (
    <ThemeContextProvider>
      <RebootAlertDialog // Added RebootAlertDialog
        open={!!rebootAlertNodeIp}
        nodeIp={rebootAlertNodeIp}
        onClose={() => setRebootAlertNodeIp(null)}
      />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar
            allNodeData={allNodeData}
            setAllNodeData={setAllNodeData}
            setRebootAlertNodeIp={setRebootAlertNodeIp} // Pass setter to Sidebar
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              overflowY: 'auto'
            }}
          >
            <Routes>
              <Route
                path="/"
                element={(                  <HomePage
                    allNodeData={allNodeData}
                    setAllNodeData={setAllNodeData}
                    setRebootAlertNodeIp={setRebootAlertNodeIp}
                  />
                )}
              />
              <Route
                path="/node/:ip"
                element={(
                  <NodeDashboard
                    allNodeData={allNodeData}
                    // handleToggle={handleToggleNodeScript} // Remove this prop
                  />
                )}
              />
              <Route
                path="/map"
                element={<MapView 
                  markers={mapMarkers} 
                  linkQualityMatrix={lqm} />}
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}