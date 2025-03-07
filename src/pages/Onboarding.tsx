import { useState } from 'react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { RestaurantInfoStep } from '@/components/onboarding/steps/RestaurantInfoStep';
import { AreasStep } from '@/components/onboarding/steps/AreasStep';
import { MenuStep } from '@/components/onboarding/steps/MenuStep';
import { WhatsAppStep } from '@/components/onboarding/steps/WhatsAppStep';
import { CompletionStep } from '@/components/onboarding/steps/CompletionStep';
import { useOnboarding } from '@/hooks/useOnboarding';

export function Onboarding() {
  const { currentStep, totalSteps, goToStep } = useOnboarding();
  const [allowStepClick, setAllowStepClick] = useState(true);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RestaurantInfoStep />;
      case 2:
        return <AreasStep />;
      case 3:
        return <MenuStep />;
      case 4:
        return <WhatsAppStep />;
      case 5:
        return <CompletionStep />;
      default:
        return <RestaurantInfoStep />;
    }
  };

  return (
    <OnboardingLayout 
      currentStep={currentStep} 
      totalSteps={totalSteps}
      onStepClick={allowStepClick ? goToStep : undefined}
    >
      {renderStep()}
    </OnboardingLayout>
  );
}