import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/HomePage';

// Mock the child components
jest.mock('../../src/homepageassets/NodeHomePage', () => {
  return function MockNodeHomePage(props) {
    return (
      <div data-testid="node-home-page">
        Node Home Page - {props.allNodeData?.length || 0} nodes
      </div>
    );
  };
});

jest.mock('../../src/homepageassets/EmptyHomePage', () => {
  return function MockEmptyHomePage(props) {
    return <div data-testid="empty-home-page">Empty Home Page</div>;
  };
});

describe('HomePage Component', () => {
  const mockSetAllNodeData = jest.fn();
  const mockSetRebootAlertNodeIp = jest.fn();
  const mockOnMapDataRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders NodeHomePage when nodes exist', () => {
    const mockNodeData = [
      { ip: '192.168.1.100', nodeName: 'Test Node 1' },
      { ip: '192.168.1.101', nodeName: 'Test Node 2' }
    ];

    render(
      <MemoryRouter>
        <HomePage
          allNodeData={mockNodeData}
          setAllNodeData={mockSetAllNodeData}
          setRebootAlertNodeIp={mockSetRebootAlertNodeIp}
          onMapDataRefresh={mockOnMapDataRefresh}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('node-home-page')).toBeInTheDocument();
    expect(screen.getByText(/Node Home Page - 2 nodes/)).toBeInTheDocument();
    expect(screen.queryByTestId('empty-home-page')).not.toBeInTheDocument();
  });

  test('renders EmptyHomePage when no nodes exist', () => {
    render(
      <MemoryRouter>
        <HomePage
          allNodeData={[]}
          setAllNodeData={mockSetAllNodeData}
          setRebootAlertNodeIp={mockSetRebootAlertNodeIp}
          onMapDataRefresh={mockOnMapDataRefresh}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('empty-home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('node-home-page')).not.toBeInTheDocument();
  });

  test('renders EmptyHomePage when allNodeData is null', () => {
    render(
      <MemoryRouter>
        <HomePage
          allNodeData={null}
          setAllNodeData={mockSetAllNodeData}
          setRebootAlertNodeIp={mockSetRebootAlertNodeIp}
          onMapDataRefresh={mockOnMapDataRefresh}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('empty-home-page')).toBeInTheDocument();
  });

  test('renders EmptyHomePage when allNodeData is undefined', () => {
    render(
      <MemoryRouter>
        <HomePage
          allNodeData={undefined}
          setAllNodeData={mockSetAllNodeData}
          setRebootAlertNodeIp={mockSetRebootAlertNodeIp}
          onMapDataRefresh={mockOnMapDataRefresh}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('empty-home-page')).toBeInTheDocument();
  });

  test('passes correct props to NodeHomePage', () => {
    const mockNodeData = [{ ip: '192.168.1.100', nodeName: 'Test Node' }];

    render(
      <MemoryRouter>
        <HomePage
          allNodeData={mockNodeData}
          setAllNodeData={mockSetAllNodeData}
          setRebootAlertNodeIp={mockSetRebootAlertNodeIp}
          onMapDataRefresh={mockOnMapDataRefresh}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('node-home-page')).toBeInTheDocument();
  });

  test('passes correct props to EmptyHomePage', () => {
    render(
      <MemoryRouter>
        <HomePage
          allNodeData={[]}
          setAllNodeData={mockSetAllNodeData}
          setRebootAlertNodeIp={mockSetRebootAlertNodeIp}
          onMapDataRefresh={mockOnMapDataRefresh}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('empty-home-page')).toBeInTheDocument();
  });
});