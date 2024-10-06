// GraphEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge, Graph, ContextMenu, Transform } from './types';
import { isValidGraph, isNodeConnected } from './utils';

const GraphEditor: React.FC = () => {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>(
    {
      visible: false,
      x: 0,
      y: 0,
      nodeId: null,
    }
  );
  const [edgeOperation, setEdgeOperation] = useState<{ type: 'add' | 'delete', sourceId: string } | null>(null);
  const [transform, setTransform] = useState<Transform>(
    {
      x: 0,
      y: 0,
      scale: 1,
    }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
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
      const x = (event.clientX - svgRect.left - transform.x) / transform.scale;
      const y = (event.clientY - svgRect.top - transform.y) / transform.scale;

      setGraph(prevGraph => ({
        ...prevGraph,
        nodes: prevGraph.nodes.map(node =>
          node.id === selectedNode ? { ...node, x, y } : node
        ),
      }));
    } else if (isDragging && dragStart) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };


  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.button === 0 && event.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };


  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    if (!edgeOperation) {
      setSelectedNode(null);
    }
  };


  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      const mouseX = event.clientX - svgRect.left;
      const mouseY = event.clientY - svgRect.top;
      setTransform(prev => {
        const newScale = prev.scale * scaleFactor;
        const dx = mouseX - (mouseX - prev.x) * scaleFactor;
        const dy = mouseY - (mouseY - prev.y) * scaleFactor;
        return { x: dx, y: dy, scale: newScale };
      });
    }
  };


  const handleContextMenu = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = (event.clientX - svgRect.left - transform.x) / transform.scale;
      const y = (event.clientY - svgRect.top - transform.y) / transform.scale;

      const clickedNode = graph.nodes.find(node =>
        Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)) < 5 / transform.scale
      );

      setContextMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: clickedNode ? clickedNode.id : null });
    }
  };


  const handleCanvasClick = () => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
    setEdgeOperation(null);
  };


  const addNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      x: (contextMenu.x - transform.x) / transform.scale,
      y: (contextMenu.y - transform.y) / transform.scale,
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


  return (
    <div style={{ position: 'relative', width: '800px', height: '600px', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
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
              r={5 / transform.scale}
              fill={selectedNode === node.id ? 'red' : (edgeOperation && edgeOperation.sourceId === node.id ? 'green' : 'blue')}
              onMouseDown={(event) => handleNodeClick(event, node.id)}
            />
          ))}
        </g>
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
              {isNodeConnected(graph, contextMenu.nodeId) && (
                <button onClick={startDeleteEdge}>Delete Edge</button>
              )}
            </>
          ) : (
            <button onClick={addNode}>Add Node</button>
          )}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
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
        <div style={{ position: 'fixed', top: '10px', left: '10px', padding: '10px', background: 'lightyellow' }}>
          {edgeOperation.type === 'add' ? 'Select a node to add an edge' : 'Select a node to delete the edge'}
        </div>
      )}
    </div>
  );
};

export default GraphEditor;
