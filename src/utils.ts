import { Graph } from './types';

export const isValidGraph = (graph: any): graph is Graph => {
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

export const isNodeConnected = (graph: Graph, nodeId: string): boolean => {
  return graph.edges.some(edge => edge.source === nodeId || edge.target === nodeId);
};
