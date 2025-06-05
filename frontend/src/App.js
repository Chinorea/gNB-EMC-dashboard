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
  const lqmRef = useRef(lqm); // Add ref for lqm

  // NEW: State to trigger map data refresh
  const [mapDataRefreshTrigger, setMapDataRefreshTrigger] = useState(0);

  // Function to load map data from API with optional node data override
  const loadMapData = useCallback((nodeDataOverride = null) => {
    const currentAllNodeData = nodeDataOverride || allNodeDataRef.current;
    const currentLQM = lqmRef.current;
    
    // Find ALL nodes with valid manet.ip
    const nodesWithManetIp = currentAllNodeData.filter(node => 
      node.manet?.ip?.trim()
    );
    
    // Helper function for API calls with timeout
    const fetchWithTimeout = async (url, timeoutMs = 1000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    // Clear markers and return early if no valid nodes
    if (nodesWithManetIp.length === 0) {
      currentAllNodeData.forEach(node => {
        if (node.manet) node.manet.selfManetInfo = null;
      });
      setMapMarkers([]);
      setLQM([]);
      return;
    }

    // Clear invalid nodes' selfManetInfo
    currentAllNodeData.forEach(node => {
      if (node.manet && !node.manet.ip?.trim()) {
        node.manet.selfManetInfo = null;
      }
    });

    // Main execution flow
    const executeMapDataFlow = async () => {
      try {
        // STEP 1: Get network data from first working node
        let networkData = null;
        for (const node of nodesWithManetIp) {
          try {
            networkData = await fetchWithTimeout(`http://${node.manet.ip}/status`);
            break; // Success - exit loop
          } catch (error) {
            console.warn(`Failed to fetch from ${node.manet.ip}:`, error.message);
            continue; // Try next node
          }
        }

        if (!networkData) {
          console.error("All MANET IP attempts failed");
          setMapMarkers([]);
          setLQM([]);
          return;
        }

        // STEP 2: Process network data and get battery levels in parallel
        const infos = Array.isArray(networkData.nodeInfos) 
          ? networkData.nodeInfos 
          : Object.values(networkData.nodeInfos || {});

        // Set LQM
        const rawLQM = Array.isArray(networkData.linkQuality) ? networkData.linkQuality : [];
        setLQM(buildStaticsLQM(infos, rawLQM, currentLQM, 100, null));

        // Get battery levels from all nodes in parallel
        const batteryPromises = nodesWithManetIp.map(async (node) => {
          try {
            const data = await fetchWithTimeout(`http://${node.manet.ip}/status`);
            return {
              ip: node.manet.ip,
              batteryLevel: data.batteryLevel ? `${(data.batteryLevel * 10).toFixed(2)}%` : 'unknown'
            };
          } catch {
            return { ip: node.manet.ip, batteryLevel: 'unknown' };
          }
        });

        const batteryData = await Promise.all(batteryPromises);
        const batteryMap = new Map(batteryData.map(item => [item.ip, item.batteryLevel]));

        // STEP 3: Update node data with network info and battery levels
        nodesWithManetIp.forEach(node => {
          const match = infos.find(info => info.ip === node.manet.ip);
          if (match) {
            node.manet.nodeInfo = infos;
            node.manet.selfManetInfo = {
              ...match,
              label: node.nodeName || node.ip,
              batteryLevel: batteryMap.get(node.manet.ip) || 'unknown'
            };
          } else {
            node.manet.selfManetInfo = null;
          }
        });

        // STEP 4: Update state and generate markers
        if (!nodeDataOverride) {
          setAllNodeData(prevNodes => [...prevNodes]);
        }

        const markers = currentAllNodeData
          .filter(node => node.manet?.selfManetInfo?.latitude && node.manet?.selfManetInfo?.longitude)
          .map(node => node.manet.selfManetInfo);
        
        setMapMarkers(markers);

      } catch (error) {
        console.error("Map data flow failed:", error);
        setMapMarkers([]);
        setLQM([]);
      }
    };

    executeMapDataFlow();
  }, [buildStaticsLQM]); // Only depend on buildStaticsLQM which should be stable

  // Function to manually trigger map data refresh
  const triggerMapDataRefresh = useCallback((options = {}) => {
    // If this is a node removal, immediately clear map markers to prevent lag
    if (options.nodeRemoved) {
      setMapMarkers([]);
      setLQM([]);
      
      // If we have the updated node list, use it directly to avoid ref timing issues
      if (options.updatedNodeList) {
        setTimeout(() => {
          loadMapData(options.updatedNodeList);
        }, 50); // Very small delay to ensure state clearing completes
        return;
      }
    }
    
    // For other cases, use the normal trigger mechanism
    setMapDataRefreshTrigger(prev => prev + 1);
  }, [loadMapData]);

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

  // Effect to keep lqmRef in sync with state
  useEffect(() => {
    lqmRef.current = lqm;
  }, [lqm]);

  // NEW: Hard refresh rate for map data - only depends on hasLoaded and loadMapData (which is now stable)
  useEffect(() => {
    if (!hasLoaded || allNodeData.length === 0) return; // Wait for initial load AND nodes to be loaded
    
    // Small delay to ensure allNodeDataRef is updated
    const timeoutId = setTimeout(() => {
      loadMapData(); // Initial load for map
    }, 100);
    
    const intervalId = setInterval(() => {
      setMapDataRefreshTrigger(t => t + 1);
    }, 30000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [loadMapData, hasLoaded, allNodeData.length]); // Add allNodeData.length dependency

  // Only update map data when mapDataRefreshTrigger changes
  useEffect(() => {
    if (!hasLoaded || mapDataRefreshTrigger === 0) return; // Wait for initial load and skip initial trigger
    
    loadMapData();
  }, [mapDataRefreshTrigger, loadMapData, hasLoaded]); // loadMapData is now stable

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
            onMapDataRefresh={triggerMapDataRefresh} // Pass map refresh trigger function
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
                    onMapDataRefresh={triggerMapDataRefresh} // Pass map refresh trigger function
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