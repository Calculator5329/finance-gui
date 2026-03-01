import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingStore } from '../../stores/OnboardingStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { AboutYouStep } from './steps/AboutYouStep';
import { IncomeStep } from './steps/IncomeStep';
import { AccountsStep } from './steps/AccountsStep';
import { ReviewStep } from './steps/ReviewStep';

const STEP_LABELS = ['Welcome', 'About You', 'Income', 'Accounts', 'Review'];

interface OnboardingWizardProps {
  onComplete: (store: OnboardingStore) => void;
}

export const OnboardingWizard = observer(function OnboardingWizard({
  onComplete,
}: OnboardingWizardProps) {
  const [store] = useState(() => new OnboardingStore());
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const handleNext = () => {
    if (!store.canProceed) return;
    setDirection(1);
    store.nextStep();
  };

  const handleBack = () => {
    setDirection(-1);
    store.prevStep();
  };

  const handleComplete = () => {
    onComplete(store);
  };

  const isLastStep = store.currentStep === store.totalSteps - 1;
  const isFirstStep = store.currentStep === 0;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (store.currentStep) {
      case 0:
        return <WelcomeStep key="welcome" />;
      case 1:
        return <AboutYouStep key="about" store={store} />;
      case 2:
        return <IncomeStep key="income" store={store} />;
      case 3:
        return <AccountsStep key="accounts" store={store} />;
      case 4:
        return <ReviewStep key="review" store={store} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background dot grid - matches main app */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(161,161,170,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Step indicator */}
      <div className="relative z-10 flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (i < store.currentStep) {
                  setDirection(-1);
                  store.goToStep(i);
                }
              }}
              disabled={i > store.currentStep}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-300 cursor-default
                ${i === store.currentStep
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : i < store.currentStep
                    ? 'text-zinc-400 hover:text-cyan-400 cursor-pointer'
                    : 'text-zinc-600'
                }
              `}
            >
              <span
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  transition-all duration-300
                  ${i === store.currentStep
                    ? 'bg-cyan-500 text-black'
                    : i < store.currentStep
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-zinc-800 text-zinc-600'
                  }
                `}
              >
                {i < store.currentStep ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-8 h-px transition-colors duration-300 ${
                  i < store.currentStep ? 'bg-cyan-500/40' : 'bg-zinc-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card container */}
      <div className="relative z-10 w-full max-w-xl px-4">
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-8 min-h-[420px] flex flex-col">
          {/* Step content with animation */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={store.currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
            {!isFirstStep ? (
              <button
                onClick={handleBack}
                className="border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-300 px-5 py-2 rounded-md text-sm font-medium transition-all duration-200"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {isLastStep ? (
              <button
                onClick={handleComplete}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-2 rounded-md text-sm transition-colors duration-200 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                Launch Your Plan
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!store.canProceed}
                className={`
                  px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200
                  ${store.canProceed
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                {isFirstStep ? 'Get Started' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
