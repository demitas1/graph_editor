import React, { useState, useEffect, useRef } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  [key: string]: any;
}

interface Edge {
  source: string;
  target: string;
  [key: string]: any;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

const GraphEditor: React.FC = () => {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, nodeId: null });
  const [edgeOperation, setEdgeOperation] = useState<{ type: 'add' | 'delete', sourceId: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // load default graph for example
    fetch('/graph.json')
      .then(response => response.json())
      .then(data => setGraph(data));
  }, []);

  const handleNodeClick = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    if (edgeOperation) {
      if (edgeOperation.sourceId !== nodeId) {
        if (edgeOperation.type === 'add') {
          addEdge(edgeOperation.sourceId, nodeId);
        } else if (edgeOperation.type === 'delete') {
          deleteEdge(edgeOperation.sourceId, nodeId);
        }
      }
      setEdgeOperation(null);
    } else if (!contextMenu.visible) {
      setSelectedNode(nodeId);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (selectedNode && !edgeOperation && svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - svgRect.left;
      const y = event.clientY - svgRect.top;

      setGraph(prevGraph => ({
        ...prevGraph,
        nodes: prevGraph.nodes.map(node =>
          node.id === selectedNode ? { ...node, x, y } : node
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    if (!edgeOperation) {
      setSelectedNode(null);
    }
  };

  const handleContextMenu = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - svgRect.left;
      const y = event.clientY - svgRect.top;

      const clickedNode = graph.nodes.find(node =>
        Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)) < 5
      );

      setContextMenu({ visible: true, x, y, nodeId: clickedNode ? clickedNode.id : null });
    }
  };

  const handleCanvasClick = () => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
    setEdgeOperation(null);
  };

  const addNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      x: contextMenu.x,
      y: contextMenu.y,
      label: `New Node ${graph.nodes.length + 1}`
    };
    setGraph(prevGraph => ({
      ...prevGraph,
      nodes: [...prevGraph.nodes, newNode]
    }));
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  };

  const deleteNode = () => {
    if (contextMenu.nodeId) {
      setGraph(prevGraph => ({
        nodes: prevGraph.nodes.filter(node => node.id !== contextMenu.nodeId),
        edges: prevGraph.edges.filter(edge =>
          edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId
        )
      }));
      setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
    }
  };

  const startAddEdge = () => {
    if (contextMenu.nodeId) {
      setEdgeOperation({ type: 'add', sourceId: contextMenu.nodeId });
      setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
      setSelectedNode(null);
    }
  };

  const startDeleteEdge = () => {
    if (contextMenu.nodeId) {
      setEdgeOperation({ type: 'delete', sourceId: contextMenu.nodeId });
      setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
      setSelectedNode(null);
    }
  };

  const addEdge = (sourceId: string, targetId: string) => {
    if (!graph.edges.some(edge =>
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    )) {
      setGraph(prevGraph => ({
        ...prevGraph,
        edges: [...prevGraph.edges, { source: sourceId, target: targetId }]
      }));
    }
  };

  const deleteEdge = (sourceId: string, targetId: string) => {
    setGraph(prevGraph => ({
      ...prevGraph,
      edges: prevGraph.edges.filter(edge =>
        !(edge.source === sourceId && edge.target === targetId) &&
        !(edge.source === targetId && edge.target === sourceId)
      )
    }));
  };

  const loadGraph = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedGraph = JSON.parse(e.target?.result as string);
          if (isValidGraph(loadedGraph)) {
            setGraph(loadedGraph);
          } else {
            alert("Invalid graph structure in the loaded file.");
          }
        } catch (error) {
          alert("Error parsing the JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const isValidGraph = (graph: any): graph is Graph => {
    return Array.isArray(graph.nodes) &&
           Array.isArray(graph.edges) &&
           graph.nodes.every((node: any) =>
             typeof node.id === 'string' &&
             typeof node.x === 'number' &&
             typeof node.y === 'number'
           ) &&
           graph.edges.every((edge: any) =>
             typeof edge.source === 'string' &&
             typeof edge.target === 'string'
           );
  };

  const saveGraph = () => {
    const jsonString = JSON.stringify(graph, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph.json';
    link.click();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isNodeConnected = (nodeId: string) => {
    return graph.edges.some(edge => edge.source === nodeId || edge.target === nodeId);
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width="800"
        height="600"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
      >
        {graph.edges.map(edge => (
          <line
            key={`${edge.source}-${edge.target}`}
            x1={graph.nodes.find(n => n.id === edge.source)?.x}
            y1={graph.nodes.find(n => n.id === edge.source)?.y}
            x2={graph.nodes.find(n => n.id === edge.target)?.x}
            y2={graph.nodes.find(n => n.id === edge.target)?.y}
            stroke="black"
          />
        ))}
        {graph.nodes.map(node => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r="5"
            fill={selectedNode === node.id ? 'red' : (edgeOperation && edgeOperation.sourceId === node.id ? 'green' : 'blue')}
            onMouseDown={(event) => handleNodeClick(event, node.id)}
          />
        ))}
      </svg>
      {contextMenu.visible && (
        <div
          style={{
            position: 'absolute',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            background: 'white',
            border: '1px solid black',
            padding: '5px'
          }}
        >
          {contextMenu.nodeId ? (
            <>
              <button onClick={deleteNode}>Delete Node</button>
              <button onClick={startAddEdge}>Add Edge</button>
              {isNodeConnected(contextMenu.nodeId) && (
                <button onClick={startDeleteEdge}>Delete Edge</button>
              )}
            </>
          ) : (
            <button onClick={addNode}>Add Node</button>
          )}
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={loadGraph}
          accept=".json"
        />
        <button onClick={triggerFileInput}>Load Graph</button>
        <button onClick={saveGraph} style={{ marginLeft: '10px' }}>Save Graph</button>
      </div>
      {edgeOperation && (
        <div style={{ position: 'fixed', top: 0, left: 0, padding: '10px', background: 'lightyellow' }}>
          {edgeOperation.type === 'add' ? 'Select a node to add an edge' : 'Select a node to delete the edge'}
        </div>
      )}
    </div>
  );
};

export default GraphEditor;
