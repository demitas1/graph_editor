export interface Node {
  id: string;
  x: number;
  y: number;
  [key: string]: any;
}

export interface Edge {
  source: string;
  target: string;
  [key: string]: any;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}
