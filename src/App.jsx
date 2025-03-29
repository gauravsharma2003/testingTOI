import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Root from './components/Root';
import LoopTheLoop from './components/LoopTheLoop';
import Sudoku from './components/Sudoku';
import Akari from './components/Akari';
const router = createBrowserRouter([
  { path: "/", Component: Root },
  { path: "/loop", Component: LoopTheLoop },
  { path: "/sudoku", Component: Sudoku },
  { path: "/akari", Component: Akari }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
