import { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Header } from './components/Header';
import { Sidebar } from './features/sidebar/Sidebar';
import { Canvas } from './features/canvas/Canvas';
import { DetailPanel } from './features/panels/DetailPanel';
import { StoreContext, rootStore } from './stores/RootStore';
import { DEFAULT_NODES, DEFAULT_EDGES } from './features/canvas/defaultFlow';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import type { OnboardingStore } from './stores/OnboardingStore';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';


// Expose rootStore for testing/debugging
if (typeof window !== 'undefined') {
  (window as any).__rootStore = rootStore;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(!IS_DEMO);

  useEffect(() => {
    if (onboardingComplete && !IS_DEMO) {
      rootStore.flowStore.initializeDefaultFlow(DEFAULT_NODES, DEFAULT_EDGES);
    }
  }, [onboardingComplete]);

  const handleOnboardingComplete = useCallback((onboarding: OnboardingStore) => {
    rootStore.completeOnboarding(onboarding, DEFAULT_NODES, DEFAULT_EDGES);
    setOnboardingComplete(true);
  }, []);

  // Show onboarding wizard in demo mode
  if (!onboardingComplete) {
    return (
      <StoreContext.Provider value={rootStore}>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </StoreContext.Provider>
    );
  }

  return (
    <StoreContext.Provider value={rootStore}>
      <ReactFlowProvider>
        <div className="h-screen w-screen flex flex-col bg-zinc-950 overflow-hidden">
          <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />

          <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} />
            <Canvas />
            <DetailPanel />
          </div>
        </div>
      </ReactFlowProvider>
    </StoreContext.Provider>
  );
}
