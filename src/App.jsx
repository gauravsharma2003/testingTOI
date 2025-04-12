import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './components/Root';
import LoopTheLoop from './components/LoopTheLoop';
import Akari from './components/Akari';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import Sudoku from './components/Sudoku';
import WordRow from './components/WordRow';
import MemoryMan from './components/MemoryMan';  
import Circuit from './components/Circuit';
import Whosthat from './components/Whosthat';
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
  {
    path: "/wordrow",
    element: <WordRow />,
  },
  {
    path : "/memoryman",
    element: <MemoryMan />
  },
  {
    path : "/circuit",
    element: <Circuit />
  },
  {
    path : "/whosthat",
    element: <Whosthat />
  }
]);

function App() {
  return (
    <RouterProvider router={router}>
      <SpeedInsights />
      <Analytics />
    </RouterProvider>
  );
}

export default App;
