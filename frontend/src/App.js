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
import buildStaticsLQM, { getBatteryPercentage } from './utils';
import NodeInfo from './NodeInfo';
import RebootAlertDialog from './nodedashboardassets/RebootAlertDialog';
import Sidebar from './appassets/SideBar';
import NetworkScanner from './appassets/NetworkScanner';

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

  // Network scanning state
  const [autoDiscoveredNodes, setAutoDiscoveredNodes] = useState([]);
  const [isNetworkScanning, setIsNetworkScanning] = useState(false);
  const [subnet, setSubnet] = useState(() => {
    const savedSubnet = localStorage.getItem('networkSubnet');
    return savedSubnet || '192.168.2';
  });
  const [scanner] = useState(() => new NetworkScanner());

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
        // STEP 1: Robust network discovery with proper overlap detection
        const networkDataResults = [];
        const allResponses = [];

        // First, try to get responses from ALL nodes
        for (const node of nodesWithManetIp) {
          try {
            const networkData = await fetchWithTimeout(`http://${node.manet.ip}/status`, 2000); // Increased timeout
            allResponses.push({
              sourceNode: node,
              data: networkData,
              sourceIp: node.manet.ip
            });
          } catch (error) {
            console.warn(`Failed to fetch from ${node.manet.ip}:`, error.message);
            continue;
          }
        }

        if (allResponses.length === 0) {
          console.error("All MANET IP attempts failed");
          setMapMarkers([]);
          setLQM([]);
          return;
        }

        // STEP 2: Analyze responses to find distinct networks using robust method
        const networkGroups = [];
        
        for (const response of allResponses) {
          const responseNodeIps = new Set();
          
          // Extract all IPs from this response
          const infos = Array.isArray(response.data.nodeInfos) 
            ? response.data.nodeInfos 
            : Object.values(response.data.nodeInfos || {});
          
          infos.forEach(info => {
            if (info.ip && info.ip.trim()) {
              responseNodeIps.add(info.ip.trim());
            }
          });

          // Check if this response belongs to an existing network group
          let foundGroup = false;
          
          for (const group of networkGroups) {
            // Calculate overlap between this response and existing group
            const existingIps = group.allNodeIps;
            const intersection = new Set([...responseNodeIps].filter(ip => existingIps.has(ip)));
            const union = new Set([...responseNodeIps, ...existingIps]);
            
            // If there's significant overlap (>30%) or source IP is in the group, it's the same network
            const overlapRatio = intersection.size / union.size;
            const sourceInGroup = existingIps.has(response.sourceIp);
            
            if (overlapRatio > 0.3 || sourceInGroup) {
              // Add this response to existing group
              group.responses.push(response);
              responseNodeIps.forEach(ip => group.allNodeIps.add(ip));
              foundGroup = true;
              break;
            }
          }
          
          // If no overlap found, create new network group
          if (!foundGroup) {
            const newGroup = {
              responses: [response],
              allNodeIps: new Set(responseNodeIps),
              networkId: networkGroups.length + 1
            };
            networkGroups.push(newGroup);
          }
        }

        // Log summary only if multiple networks detected
        if (networkGroups.length > 1) {
          console.log(`🌐 Detected ${networkGroups.length} distinct MANET networks`);
        }
        
        // STEP 3: Select best response from each network group
        networkGroups.forEach((group, index) => {
          // Pick the response with the most complete data
          const bestResponse = group.responses.reduce((best, current) => {
            const currentInfos = Array.isArray(current.data.nodeInfos) 
              ? current.data.nodeInfos 
              : Object.values(current.data.nodeInfos || {});
            const bestInfos = Array.isArray(best.data.nodeInfos) 
              ? best.data.nodeInfos 
              : Object.values(best.data.nodeInfos || {});
            
            return currentInfos.length > bestInfos.length ? current : best;
          });
          
          networkDataResults.push(bestResponse);
        });

        // STEP 4: SAFE merge of all discovered networks
        const allNetworkInfosMap = new Map(); // Use Map to prevent duplicates
        const allLinkQualityEntries = [];

        networkDataResults.forEach((result, index) => {
          const infos = Array.isArray(result.data.nodeInfos) 
            ? result.data.nodeInfos 
            : Object.values(result.data.nodeInfos || {});
          
          // SAFE: Merge network infos without duplicates
          infos.forEach(info => {
            if (info.ip && !allNetworkInfosMap.has(info.ip)) {
              allNetworkInfosMap.set(info.ip, info);
            }
          });
          
          // SAFE: Collect link quality data with source tracking
          const rawLQM = Array.isArray(result.data.linkQuality) ? result.data.linkQuality : [];
          rawLQM.forEach(entry => {
            // Add source network info to prevent conflicts
            allLinkQualityEntries.push({
              ...entry,
              sourceNetwork: result.sourceNode.manet.ip,
              networkGroup: index + 1
            });
          });
        });

        const uniqueNetworkInfos = Array.from(allNetworkInfosMap.values());

        // SAFE: Merge LQM data instead of overriding
        const mergedLQM = buildStaticsLQM(
          uniqueNetworkInfos, 
          allLinkQualityEntries, 
          currentLQM, // This preserves existing LQM data
          100, 
          null
        );
        setLQM(mergedLQM);

        // Get battery levels from all nodes in parallel
        const batteryPromises = nodesWithManetIp.map(async (node) => {
          try {
            const data = await fetchWithTimeout(`http://${node.manet.ip}/status`);
            const batteryVoltage = data.batteryLevel ? `${(data.batteryLevel).toFixed(2)}V` : 'unknown';
            const batteryPercentage = getBatteryPercentage(batteryVoltage);
            
            return {
              ip: node.manet.ip,
              batteryLevel: batteryVoltage,
              batteryPercentage: batteryPercentage
            };
          } catch {
            return { 
              ip: node.manet.ip, 
              batteryLevel: 'unknown',
              batteryPercentage: 'unknown'
            };
          }
        });

        const batteryData = await Promise.all(batteryPromises);
        const batteryMap = new Map(batteryData.map(item => [item.ip, item]));

        // STEP 3: SAFE node data update - merge instead of override
        nodesWithManetIp.forEach(node => {
          const match = uniqueNetworkInfos.find(info => info.ip === node.manet.ip);
          if (match) {
            const batteryInfo = batteryMap.get(node.manet.ip) || { 
              batteryLevel: 'unknown', 
              batteryPercentage: 'unknown' 
            };
            
            // SAFE: Merge nodeInfo instead of overriding
            const existingNodeInfo = node.manet.nodeInfo || [];
            const mergedNodeInfo = [...existingNodeInfo];
            
            // Add new network infos that don't already exist
            uniqueNetworkInfos.forEach(info => {
              if (!mergedNodeInfo.find(existing => existing.ip === info.ip)) {
                mergedNodeInfo.push(info);
              }
            });
            
            node.manet.nodeInfo = mergedNodeInfo;
            node.manet.selfManetInfo = {
              ...match,
              label: node.nodeName || node.ip,
              batteryLevel: batteryInfo.batteryLevel,
              batteryPercentage: batteryInfo.batteryPercentage
            };
          } else {
            // Don't override if no match - preserve existing data
            if (!node.manet.selfManetInfo) {
              node.manet.selfManetInfo = null;
            }
          }
        });

        // STEP 4: Update state and generate markers
        if (!nodeDataOverride) {
          setAllNodeData(prevNodes => [...prevNodes]);
        }        const markers = currentAllNodeData
          .filter(node => node.manet?.selfManetInfo?.latitude && node.manet?.selfManetInfo?.longitude)
          .map(node => ({
            ...node.manet.selfManetInfo,
            nodeStatus: node.status // Add node status to marker data
          }));
        
        setMapMarkers(markers);

      } catch (error) {
        console.error("Map data flow failed:", error);
        setMapMarkers([]);
        setLQM([]);
      }

      // For Dummy Testing, uncomment below lines to only show dummy markers and LQM
      // setMapMarkers(DUMMY_MARKERS[0].nodeInfos);
      // const rawLQM = Array.isArray(DUMMY_LQM)
      //   ? DUMMY_LQM
      //   : [];
      // const fullLQM = buildStaticsLQM(DUMMY_MARKERS[0].nodeInfos, rawLQM, lqm, 100, null);
      // setLQM(fullLQM);
    };    executeMapDataFlow();
  }, []); // No dependencies needed since buildStaticsLQM is imported function
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
  }, [loadMapData]);  // Network scanning function
  const startNetworkScan = useCallback(async () => {
    // Check both React state and scanner internal state to prevent overlaps
    if (isNetworkScanning || scanner.getIsScanning()) return;
    
    console.log(`🔍 Initiating network scan for subnet: ${subnet}.x`);
    setIsNetworkScanning(true);
    
    try {
      const results = await scanner.scanUserSubnet(
        subnet,
        null, // progress callback
        (node) => {
          // Node found callback
          setAutoDiscoveredNodes(prev => {
            const existing = prev.find(n => n.ip === node.ip);
            if (!existing) {
              return [...prev, node.data];
            }
            return prev;
          });
        },
        (results) => {
          // Scan complete callback
          setAutoDiscoveredNodes(results.nodes);
        }
      );
    } catch (error) {
      console.error('Network scan failed:', error);
    } finally {
      setIsNetworkScanning(false);
    }
  }, [scanner, subnet]); // Removed isNetworkScanning from dependencies

  // Handle subnet change and persist to localStorage
  const handleSubnetChange = useCallback((newSubnet) => {
    setSubnet(newSubnet);
    localStorage.setItem('networkSubnet', newSubnet);
  }, []);

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
        // No UI update - data is refreshed silently
      } catch (error) {
        console.error("Error polling attributes:", error);
      } finally {
        running = false;
      }
    }, 5000);
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
        // No UI update - data is refreshed silently
      } catch (error) {
        console.error("Error polling MANET connection:", error);
      } finally {
        running = false;
      }    }, 5000);
    return () => clearInterval(manetInterval);
  }, [hasLoaded]); // Add hasLoaded to dependency array  // Effect 6: Network scanning every 20 seconds
  useEffect(() => {
    if (!hasLoaded) return; // Guard: Only run if initial load is complete
    
    // Start initial scan after a small delay to avoid overlaps
    const initialScanTimeout = setTimeout(() => {
      startNetworkScan();
    }, 500);
    // Set up interval for scanning every 20 seconds
    const networkScanInterval = setInterval(() => {
      startNetworkScan();
    }, 20000);
    
    return () => {
      clearTimeout(initialScanTimeout);
      clearInterval(networkScanInterval);
    };
  }, [hasLoaded, subnet, startNetworkScan]); // Restart when subnet changes


  return (
    <ThemeContextProvider>
      <RebootAlertDialog // Added RebootAlertDialog
        open={!!rebootAlertNodeIp}
        nodeIp={rebootAlertNodeIp}
        onClose={() => setRebootAlertNodeIp(null)}
      />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>          <Sidebar
            allNodeData={allNodeData}
            setAllNodeData={setAllNodeData}
            setRebootAlertNodeIp={setRebootAlertNodeIp}
            onMapDataRefresh={triggerMapDataRefresh}
            autoDiscoveredNodes={autoDiscoveredNodes}
            isNetworkScanning={isNetworkScanning}
            subnet={subnet}
            onSubnetChange={handleSubnetChange}
            startNetworkScan={startNetworkScan}
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