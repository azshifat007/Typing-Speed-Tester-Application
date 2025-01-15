import React from 'react';
import { Toaster } from 'sonner';
import TypingTest from './components/TypingTest';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <TypingTest />
    </>
  );
}

export default App;