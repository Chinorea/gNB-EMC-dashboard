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
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false); // New state for loading status

  // Add state for map markers and LQM
  const [mapMarkers, setMapMarkers] = useState([]);
  const [lqm, setLQM] = useState([]);

  // NEW: State to trigger map data refresh
  const [mapDataRefreshTrigger, setMapDataRefreshTrigger] = useState(0);

  // Function to load map data from API
  const loadMapData = useCallback(() => {
    // Find the first node with a valid manet.ip
    const currentNodes = allNodeDataRef.current; // Use ref for reading
    const targetNode = currentNodes.find(node => node.manet && node.manet.ip && node.manet.connectionStatus === 'Connected'); // Ensure connected
    if (!targetNode) {
      // console.warn("No node with a connected manet.ip found for map data.");
      // setMapMarkers([]); // Clear markers if no suitable node
      // setLQM([]); // Clear LQM
      return;
    }
    const API_URL = `http://${targetNode.manet.ip}/status`; // Assuming /status provides map-related data

    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        const infos = Array.isArray(data.nodeInfos)
          ? data.nodeInfos
          : Object.values(data.nodeInfos || {});
        
        const enriched = infos.map(info => ({
          ...info,
          batteryLevel:
            data.selfId === info.id && data.batteryLevel !== undefined
              ? (data.batteryLevel * 10).toFixed(2) + '%' // Assuming batteryLevel is a fraction, convert to percentage
              : 'unknown'
        }));
        
        // Update map markers based on all nodes that have selfManetInfo
        // NodeInfo instances now update their own manet.nodeInfo and manet.selfManetInfo
        // So, we can derive markers directly from allNodeData
        const currentMapMarkers = currentNodes
            .map(node => node.manet.selfManetInfo)
            .filter(info => info && info.latitude && info.longitude);

        // Only update if there's a change to avoid unnecessary re-renders of the map
        if (JSON.stringify(currentMapMarkers) !== JSON.stringify(mapMarkers)) {
            setMapMarkers(currentMapMarkers);
        }

        const rawLQM = Array.isArray(data.linkQuality)
          ? data.linkQuality
          : [];
        
        // We need all manetInfos from all nodes for buildStaticsLQM
        const allManetNodeInfos = currentNodes.reduce((acc, node) => {
            if (node.manet && node.manet.nodeInfo) { // node.manet.nodeInfo should be an array
                node.manet.nodeInfo.forEach(info => {
                    // Add to acc if not already present (based on id)
                    if (!acc.find(existingInfo => existingInfo.id === info.id)) {
                        acc.push(info);
                    }
                });
            }
            return acc;
        }, []);

        if (allManetNodeInfos.length > 0) {
            const fullLQM = buildStaticsLQM(allManetNodeInfos, rawLQM, lqm, 100, null);
            // Only update if there's a change
            if (JSON.stringify(fullLQM) !== JSON.stringify(lqm)) {
                setLQM(fullLQM);
            }
        } else {
            // setLQM([]); // Clear LQM if no nodeInfos
        }
        // No direct setAllNodeData here for map data to avoid conflicts with NodeInfo's internal state.
        // NodeInfo instances are responsible for their own manet data.
      })
      .catch(error => {
        // console.error(`Error loading map data from ${API_URL}:`, error);
        // setMapMarkers([]); // Clear markers on error
        // setLQM([]); // Clear LQM on error
      });
  }, [lqm, mapMarkers]); // Removed allNodeData, setAllNodeData as direct deps

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
          const instance = new NodeInfo(data.ip, setRebootAlertNodeIp);
          instance.nodeName = data.nodeName;
          if (data.manetIp) {
            instance.setManetIp(data.manetIp);
          }
          return instance;
        });
        setAllNodeData(instances);
      } catch (e) {
        console.error("Failed to parse or rehydrate from localStorage:", e);
        setAllNodeData([]); // Initialize to empty array on error
      }
    }
    setIsLoadedFromStorage(true); // Signal that loading is complete
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setRebootAlertNodeIp is stable

  // Effect 2: Persist essential NodeInfo data to localStorage
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
    const tickInterval = setInterval(() => {
      setAllNodeData(prevData => [...prevData]); // Trigger re-render by creating a new array reference
    }, 1000); // Update UI every 1 second

    return () => clearInterval(tickInterval);
  }, []); // Runs once on mount

  // Effect 4: Cleanup polling on unmount
  useEffect(() => {
    return () => {
      allNodeDataRef.current.forEach(node => {
        if (node && typeof node.stopInternalPolling === 'function') {
          node.stopInternalPolling();
        }
      });
    };
  }, []); // Runs once on mount and cleans up on unmount
  
  // Effect 5: Clear rebootAlertNodeIp after a delay if it's set
  useEffect(() => {
    let timer;
    if (rebootAlertNodeIp) {
      timer = setTimeout(() => {
        setRebootAlertNodeIp(null);
      }, 5000); // Clear after 5 seconds, assuming NodeInfo's internal polling has updated status
    }
    return () => clearTimeout(timer);
  }, [rebootAlertNodeIp]);

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
            setRebootAlertNodeIp={setRebootAlertNodeIp}
            rebootAlertNodeIp={rebootAlertNodeIp} // Pass rebootAlertNodeIp to Sidebar
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