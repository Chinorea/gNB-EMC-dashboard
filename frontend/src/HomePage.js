import React from 'react';
import NodeHomePage from './homepageassets/NodeHomePage';
import EmptyHomePage from './homepageassets/EmptyHomePage';

export default function HomePage({ allNodeData, setAllNodeData, setRebootAlertNodeIp }) {
  // Check if there are any nodes to display
  const hasNodes = Array.isArray(allNodeData) && allNodeData.length > 0;

  // Render the appropriate homepage based on whether nodes exist
  if (hasNodes) {
    return (
      <NodeHomePage 
        allNodeData={allNodeData} 
        setAllNodeData={setAllNodeData} 
      />
    );
  } else {
    return (
      <EmptyHomePage 
        setAllNodeData={setAllNodeData} 
        setRebootAlertNodeIp={setRebootAlertNodeIp} 
      />
    );
  }
}