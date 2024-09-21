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

const GraphEditor: React.FC = () => {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Load graph from JSON file
    fetch('/graph.json')
      .then(response => response.json())
      .then(data => setGraph(data));
  }, []);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (selectedNode && svgRef.current) {
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
    setSelectedNode(null);
  };

  const saveGraph = () => {
    const jsonString = JSON.stringify(graph, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modified_graph.json';
    link.click();
  };

  return (
    <div>
      <svg
        ref={svgRef}
        width="800"
        height="600"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
            fill={selectedNode === node.id ? 'red' : 'blue'}
            onMouseDown={() => handleNodeClick(node.id)}
          />
        ))}
      </svg>
      <button onClick={saveGraph}>Save Graph</button>
    </div>
  );
};

export default GraphEditor;
