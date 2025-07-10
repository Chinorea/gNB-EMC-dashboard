import React from 'react';
import { 
  ToggleButton, ToggleButtonGroup, FormControl, InputLabel, 
  Select, MenuItem, Box, Paper, Typography, Collapse, 
  Divider, List, ListItem, ListItemText 
} from '@mui/material';
import { Satellite, Map as MapIcon, CloudOff, Cloud, ExpandLess, ExpandMore } from '@mui/icons-material';

// Reusable styles for controls
const getToggleButtonStyles = (colors) => ({
  '& .MuiToggleButton-root': {
    color: colors.text.primary,
    border: `1px solid ${colors.border.main}`,
    '&.Mui-selected': {
      backgroundColor: colors.primary.main,
      color: colors.background.paper,
      '&:hover': {
        backgroundColor: colors.primary.dark,
      },
    },
    '&:hover': {
      backgroundColor: colors.background.hover,
    },
  },
});

const getSelectStyles = (colors) => ({
  color: colors.text.primary,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.border.main,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.primary.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.primary.main,
  },
  '& .MuiSelect-icon': {
    color: colors.text.primary,
  },
});

/**
 * Component for rendering map controls (online/offline toggle, satellite mode, etc.)
 */
const MapControls = ({
  theme,
  colors,
  isSidebarVisible,
  isSidebarCollapsed,
  isOfflineMode,
  setIsOfflineMode,
  isSatellite,
  setIsSatellite,
  satelliteProvider,
  setSatelliteProvider,
  offlineMapAvailable,
  availableOfflineMaps,
  selectedOfflineMap,
  switchOfflineMap,
  isLegendsVisible,
  setIsLegendsVisible
}) => {
  // Position calculation for controls
  const rightPosition = isSidebarVisible 
    ? (isSidebarCollapsed ? 100 : 360) 
    : 20;

  return (
    <Paper
      elevation={3}
      style={{
        position: 'absolute',
        top: 20,
        right: rightPosition,
        zIndex: 1000,
        backgroundColor: colors.background.paper,
        padding: '8px',
      }}
    >
      <Box display="flex" flexDirection="column" gap={1}>
        {/* Offline/Online Toggle */}
        {offlineMapAvailable && (
          <ToggleButtonGroup
            value={isOfflineMode ? 'offline' : 'online'}
            exclusive
            onChange={(_, newValue) => newValue && setIsOfflineMode(newValue === 'offline')}
            size="small"
            sx={getToggleButtonStyles(colors)}
          >
            <ToggleButton value="online" aria-label="online maps">
              <Cloud fontSize="small" />
            </ToggleButton>
            <ToggleButton value="offline" aria-label="offline maps">
              <CloudOff fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        )}
        
        {/* Offline Map Selector - only show in offline mode when multiple maps available */}
        {isOfflineMode && availableOfflineMaps.length > 1 && (
          <FormControl size="small" variant="outlined">
            <InputLabel sx={{ 
              color: colors.text.secondary,
              '&.Mui-focused': { color: colors.primary.main }
            }}>
              Region
            </InputLabel>
            <Select
              value={selectedOfflineMap}
              onChange={(e) => switchOfflineMap(e.target.value)}
              label="Region"
              sx={{
                minWidth: 150,
                ...getSelectStyles(colors)
              }}
            >
              {availableOfflineMaps.map((mapInfo) => (
                <MenuItem key={mapInfo.id} value={mapInfo.id}>
                  {mapInfo.id.includes('queensland') || mapInfo.id.includes('shoalwater') 
                    ? '🇦🇺' : '🇸🇬'} {mapInfo.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        {/* Online Mode Controls */}
        {!isOfflineMode && (
          <>
            {/* Satellite/Map Toggle - only show in online mode */}
            <ToggleButtonGroup
              value={isSatellite ? 'satellite' : 'map'}
              exclusive
              onChange={(_, newValue) => newValue && setIsSatellite(newValue === 'satellite')}
              size="small"
              sx={getToggleButtonStyles(colors)}
            >
              <ToggleButton value="map" aria-label="map view">
                <MapIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="satellite" aria-label="satellite view">
                <Satellite fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            
            {/* Satellite Quality Selector - only show in online satellite mode */}
            {isSatellite && (
              <FormControl size="small" variant="outlined">
                <InputLabel sx={{ 
                  color: colors.text.secondary,
                  '&.Mui-focused': { color: colors.primary.main }
                }}>
                  Quality
                </InputLabel>
                <Select
                  value={satelliteProvider}
                  onChange={(e) => setSatelliteProvider(e.target.value)}
                  label="Quality"
                  sx={{
                    minWidth: 120,
                    ...getSelectStyles(colors)
                  }}
                >
                  <MenuItem value="google">🌟 Google (Best)</MenuItem>
                  <MenuItem value="googleHybrid">🏷️ Google + Labels</MenuItem>
                  <MenuItem value="esri">🗺️ ESRI (Standard)</MenuItem>
                </Select>
              </FormControl>
            )}
          </>
        )}
        
        {/* Offline Map Status Indicator */}
        {isOfflineMode && (
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1}
            sx={{
              padding: '4px 8px',
              backgroundColor: colors.success?.main || '#4caf50',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'white',
            }}
          >
            <CloudOff fontSize="small" />
            <span>
              {availableOfflineMaps.find(m => m.id === selectedOfflineMap)?.name || 'Offline Mode'}
            </span>
          </Box>
        )}
        
        {/* Map Legends - Offline Mode Only */}
        {isOfflineMode && (
          <MapLegends 
            colors={colors} 
            theme={theme} 
            isLegendsVisible={isLegendsVisible} 
            setIsLegendsVisible={setIsLegendsVisible} 
          />
        )}
      </Box>
    </Paper>
  );
};

/**
 * Component for rendering map legends when in offline mode
 */
const MapLegends = ({ colors, theme, isLegendsVisible, setIsLegendsVisible }) => {
  // Legend item definitions for reuse
  const legendItems = [
    {
      type: 'square',
      label: 'Land',
      desc: 'Base terrain',
      color: theme.palette.mode === 'dark' ? "#1a1a1a" : "#F5F5DC"
    },
    {
      type: 'square',
      label: 'Vegetation',
      desc: 'Forests, parks, bushland',
      color: theme.palette.mode === 'dark' ? "#2d4a2d" : "#90B090"
    },
    {
      type: 'square',
      label: 'Water',
      desc: 'Rivers, lakes, ocean',
      color: theme.palette.mode === 'dark' ? "#1e3a5f" : "#4A90E2"
    },
    {
      type: 'square',
      label: 'Buildings',
      desc: 'Structures and facilities',
      color: theme.palette.mode === 'dark' ? "#3a3a3a" : "#D0D0D0"
    },
    {
      type: 'line',
      label: 'Major Roads',
      desc: 'Highways and main routes',
      color: theme.palette.mode === 'dark' ? "#FFD700" : "#FFA500",
      height: 3
    },
    {
      type: 'line',
      label: 'Local Roads',
      desc: 'Residential and secondary roads',
      color: theme.palette.mode === 'dark' ? "#999999" : "#666666",
      height: 2
    }
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: colors.background.default,
        padding: 2,
        borderRadius: 2,
        marginTop: 1,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" fontWeight="medium" color={colors.text.primary}>
          Map Legends
        </Typography>
        <Box>
          <ToggleButton
            size="small"
            value={isLegendsVisible ? 'collapse' : 'expand'}
            onChange={() => setIsLegendsVisible(!isLegendsVisible)}
            sx={{
              border: `1px solid ${colors.border.main}`,
              '&.Mui-selected': {
                backgroundColor: colors.primary.main,
                color: colors.background.paper,
              },
            }}
          >
            {isLegendsVisible ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </ToggleButton>
        </Box>
      </Box>
      
      <Collapse in={isLegendsVisible}>
        <Divider sx={{ borderColor: colors.border.main, my: 1 }} />
        
        <List dense>
          {legendItems.map((item, index) => (
            <ListItem key={index}>
              <Box sx={item.type === 'square' ? {
                display: 'inline-block',
                width: 16,
                height: 16,
                mr: 1,
                backgroundColor: item.color,
                border: `1px solid ${colors.border.main}`,
              } : {
                display: 'flex',
                alignItems: 'center',
                mr: 1,
                '& > span': {
                  display: 'inline-block',
                  width: 16,
                  height: item.height,
                  mr: 0.5,
                  backgroundColor: item.color,
                }
              }}>
                {item.type === 'line' && <Box component="span" />}
              </Box>
              <ListItemText 
                primary={item.label}
                secondary={item.desc}
                primaryTypographyProps={{ 
                  variant: 'body2', 
                  fontWeight: 'medium',
                  color: colors.text.primary 
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: colors.text.secondary
                }}
              />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Paper>
  );
};

export default MapControls;