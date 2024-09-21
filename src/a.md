// package.json
{
  "name": "graph-editor-app",
  "version": "1.0.0",
  "description": "A graph editor application using React and Webpack",
  "main": "index.js",
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2"
  },
  "devDependencies": {
    "@types/react": "^17.0.38",
    "@types/react-dom": "^17.0.11",
    "ts-loader": "^9.2.6",
    "typescript": "^4.5.4",
    "webpack": "^5.65.0",
    "webpack-cli": "^4.9.1",
    "webpack-dev-server": "^4.7.2",
    "html-webpack-plugin": "^5.5.0"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "outDir": "./dist/",
    "sourceMap": true,
    "noImplicitAny": true,
    "module": "commonjs",
    "target": "es6",
    "jsx": "react",
    "esModuleInterop": true
  }
}

// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000
  }
};

// src/index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Editor</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>

// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// src/App.tsx
import React from 'react';
import GraphEditor from './GraphEditor';

const App: React.FC = () => {
  return (
    <div>
      <h1>Graph Editor</h1>
      <GraphEditor />
    </div>
  );
};

export default App;

// src/GraphEditor.tsx
// (This is the component we created earlier, copy it here)

// public/graph.json
{
  "nodes": [
    { "id": "1", "x": 100, "y": 100, "label": "Node 1" },
    { "id": "2", "x": 200, "y": 200, "label": "Node 2" },
    { "id": "3", "x": 300, "y": 100, "label": "Node 3" }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "Edge 1-2" },
    { "source": "2", "target": "3", "label": "Edge 2-3" },
    { "source": "3", "target": "1", "label": "Edge 3-1" }
  ]
}
