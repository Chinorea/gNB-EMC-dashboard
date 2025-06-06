import React, { useState } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Box,
  IconButton,
  Collapse,
  Divider,
  Badge
} from '@mui/material';
import {
  LocationOn,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Circle,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getThemeColors } from '../theme';

function MapSideBar({ 
  nodes = [], 
  onNodeClick, 
  selectedNodeId = null,
  isVisible = true,
  onToggleVisibility,
  onCollapseChange
}) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const [isCollapsed, setIsCollapsed] = useState(false);  // Helper function to get node status color
  const getStatusColor = (node) => {
    if (!node) return colors.nodeStatus.disconnected;
    
    // Use nodeStatus if available (from enhanced marker data)
    if (node.nodeStatus) {
      switch (node.nodeStatus) {
        case 'RUNNING':
          return colors.nodeStatus.running;
        case 'INITIALIZING':
          return colors.nodeStatus.initializing;
        case 'OFF':
          return colors.nodeStatus.off;
        case 'DISCONNECTED':
          return colors.nodeStatus.disconnected;
        case 'UNREACHABLE':
          return colors.nodeStatus.unreachable;
        default:
          return colors.nodeStatus.disconnected;
      }
    }
    
    // Fallback: Check if node has manet info and coordinates
    const hasLocation = node.latitude && node.longitude;
    
    if (!hasLocation) {
      return colors.nodeStatus.disconnected;
    }
    
    // Default to running if we have location but no status info
    return colors.nodeStatus.running;
  };

  // Helper function to get node display name
  const getNodeDisplayName = (node) => {
    return node.label || node.ip || `Node ${node.id}`;
  };
  // Helper function to format coordinates
  const formatCoordinate = (coord, type) => {
    if (!coord) return 'N/A';
    const num = parseFloat(coord);
    if (isNaN(num)) return 'N/A';
    const direction = type === 'lat' ? (num >= 0 ? 'N' : 'S') : (num >= 0 ? 'E' : 'W');
    return `${Math.abs(num).toFixed(4)}°${direction}`;
  };
  // Helper function to get battery gradient color
  const getBatteryGradient = (batteryLevel) => {
    if (!batteryLevel) return 'linear-gradient(135deg, #e0e0e0, #f5f5f5)';
    
    // Extract percentage from battery level string (e.g., "85%" -> 85)
    const percentage = parseInt(batteryLevel.replace('%', ''));
    if (isNaN(percentage)) return 'linear-gradient(135deg, #e0e0e0, #f5f5f5)';
    
    const isDark = theme.palette.mode === 'dark';
      // Define colors based on theme mode
    const pastels = isDark ? {
      // Dark mode: Low luminance (25%), moderate saturation (45%)
      green: { r: 35, g: 67, b: 35 },   // HSL(120, 45%, 25%)
      yellow: { r: 67, g: 67, b: 35 },  // HSL(60, 45%, 25%)
      orange: { r: 67, g: 51, b: 35 },  // HSL(30, 45%, 25%)
      red: { r: 67, g: 35, b: 35 }      // HSL(0, 45%, 25%)
    } : {
      // Light mode: Very desaturated pastels
      green: { r: 200, g: 230, b: 200 }, 
      yellow: { r: 240, g: 240, b: 210 }, 
      orange: { r: 240, g: 225, b: 210 }, 
      red: { r: 240, g: 210, b: 210 }     
    };
    
    let color1, color2;
    
    if (percentage >= 75) {      // Green gradient for high battery
      color1 = pastels.green;
      color2 = isDark ? 
        { r: 41, g: 77, b: 41 } :    // Slightly lighter desaturated dark green
        { r: 215, g: 235, b: 215 };  // Slightly lighter light green
    } else if (percentage >= 50) {
      // Yellow-green gradient for medium-high battery
      const ratio = (percentage - 50) / 25;
      color1 = {
        r: Math.round(pastels.yellow.r + (pastels.green.r - pastels.yellow.r) * ratio),
        g: Math.round(pastels.yellow.g + (pastels.green.g - pastels.yellow.g) * ratio),
        b: Math.round(pastels.yellow.b + (pastels.green.b - pastels.yellow.b) * ratio)
      };
      color2 = pastels.yellow;
    } else if (percentage >= 25) {
      // Orange-yellow gradient for medium-low battery
      const ratio = (percentage - 25) / 25;
      color1 = {
        r: Math.round(pastels.orange.r + (pastels.yellow.r - pastels.orange.r) * ratio),
        g: Math.round(pastels.orange.g + (pastels.yellow.g - pastels.orange.g) * ratio),
        b: Math.round(pastels.orange.b + (pastels.yellow.b - pastels.orange.b) * ratio)
      };
      color2 = pastels.orange;
    } else {      // Red gradient for low battery
      color1 = pastels.red;
      color2 = isDark ? 
        { r: 77, g: 41, b: 41 } :    // Slightly lighter desaturated dark red
        { r: 245, g: 220, b: 220 };  // Slightly lighter light red
    }
    
    return `linear-gradient(135deg, rgb(${color1.r}, ${color1.g}, ${color1.b}), rgb(${color2.r}, ${color2.g}, ${color2.b}))`;
  };

  // Filter nodes that have location data
  const nodesWithLocation = nodes.filter(node => 
    node && node.latitude && node.longitude
  );

  const sidebarWidth = isCollapsed ? 60 : 320;

  if (!isVisible) {
    return null;
  }

  return (    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        bottom: 40,
        width: sidebarWidth,
        backgroundColor: colors.background.paper,
        border: `1px solid ${colors.border.main}`,
        borderRadius: 2,
        zIndex: 1000,
        transition: 'width 0.3s ease-in-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${colors.border.light}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64
        }}
      >
        {!isCollapsed && (
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: colors.text.primary,
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              Network Nodes
            </Typography>            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <LocationOn 
                sx={{ 
                  color: colors.text.secondary, 
                  fontSize: '1rem' 
                }} 
              />
              <Typography 
                variant="caption" 
                sx={{ color: colors.text.secondary }}
              >
                {nodesWithLocation.length} located
              </Typography>
            </Box>
          </Box>
        )}        <IconButton
          size="small"
          onClick={() => {
            const newCollapsed = !isCollapsed;
            setIsCollapsed(newCollapsed);
            onCollapseChange && onCollapseChange(newCollapsed);
          }}
          sx={{
            color: colors.text.secondary,
            '&:hover': {
              backgroundColor: colors.background.hover,
              color: colors.primary.main
            }
          }}
        >
          {isCollapsed ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
        </IconButton>
      </Box>

      {/* Node List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isCollapsed ? (
          // Collapsed view - just status dots
          <Box sx={{ p: 1 }}>
            {nodesWithLocation.map((node, index) => (
              <Box
                key={node.id || index}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 1,
                  cursor: 'pointer'
                }}
                onClick={() => onNodeClick && onNodeClick(node)}
              >
                <Circle
                  sx={{
                    color: getStatusColor(node),
                    fontSize: '12px'
                  }}
                />
              </Box>
            ))}
          </Box>
        ) : (
          // Expanded view
          <List sx={{ p: 0 }}>
            {nodesWithLocation.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: colors.text.secondary,
                        textAlign: 'center',
                        fontStyle: 'italic'
                      }}
                    >
                      No nodes with GPS data
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              nodesWithLocation.map((node, index) => (
                <React.Fragment key={node.id || index}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => onNodeClick && onNodeClick(node)}
                      selected={selectedNodeId === node.id}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&.Mui-selected': {
                          backgroundColor: colors.primary.light + '20',
                          borderLeft: `3px solid ${colors.primary.main}`,
                        },
                        '&:hover': {
                          backgroundColor: colors.background.hover,
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Circle
                          sx={{
                            color: getStatusColor(node),
                            fontSize: '12px'
                          }}
                        />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: colors.text.primary,
                                fontWeight: 'bold',
                                fontSize: '1.0rem'
                              }}
                            >
                              {getNodeDisplayName(node)}
                            </Typography>                            {node.batteryLevel && (
                              <Chip
                                label={node.batteryLevel}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.7rem',
                                  background: getBatteryGradient(node.batteryLevel),
                                  color: colors.text.primary,
                                  border: `1px solid ${colors.border.light}`,
                                  fontWeight: 500,
                                  '& .MuiChip-label': { 
                                    px: 1,
                                    textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                                  }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>                            <Typography
                              variant="caption"
                              sx={{
                                color: colors.text.secondary,
                                display: 'block',
                                fontSize: '0.85rem'
                              }}
                            >
                              {formatCoordinate(node.latitude, 'lat')}, {formatCoordinate(node.longitude, 'lng')}
                            </Typography>
                            {node.altitude && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colors.text.secondary,
                                  fontSize: '0.8rem'
                                }}
                              >
                                Alt: {parseFloat(node.altitude).toFixed(1)}m
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < nodesWithLocation.length - 1 && (
                    <Divider 
                      sx={{ 
                        backgroundColor: colors.border.light,
                        mx: 2 
                      }} 
                    />
                  )}
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Box>

      {/* Footer */}
      {!isCollapsed && (
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${colors.border.light}`,
            backgroundColor: colors.background.default
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: colors.text.secondary,
              textAlign: 'center',
              display: 'block',
              fontSize: '0.7rem'
            }}
          >
            Click node to center map
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default MapSideBar;