import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OnboardingSteps } from './OnboardingSteps';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onStepClick
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">ChefGuio</h1>
          <p className="text-muted-foreground mt-2">Configure seu restaurante em poucos passos</p>
        </div>
        
        <div className="hidden md:block mb-6">
          <OnboardingSteps 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            onStepClick={onStepClick}
            variant="horizontal"
          />
        </div>
        
        <div className="block md:hidden mb-6">
          <OnboardingSteps 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            onStepClick={onStepClick}
            variant="vertical"
          />
        </div>
        
        <Card className="mt-6 shadow-lg">
          <CardContent className="pt-6 px-4 sm:px-6">
            {children}
          </CardContent>
        </Card>
        
        <p className="text-center text-muted-foreground text-sm mt-6">
          Seu progresso é salvo automaticamente. Você pode voltar a qualquer momento.
        </p>
      </div>
    </div>
  );
}