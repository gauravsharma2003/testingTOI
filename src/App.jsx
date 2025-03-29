import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './components/Root';
import LoopTheLoop from './components/LoopTheLoop';
import Akari from './components/Akari';
import Sudoku from './components/Sudoku';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
  },
  {
    path: "/loop",
    element: <LoopTheLoop />,
  },
  {
    path: "/akari",
    element: <Akari />,
  },
  {
    path: "/sudoku",
    element: <Sudoku />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
