import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface OnboardingStepsProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  variant?: 'horizontal' | 'vertical';
}

export function OnboardingSteps({
  currentStep,
  totalSteps,
  onStepClick,
  variant = 'horizontal'
}: OnboardingStepsProps) {
  const steps = [
    { id: 1, label: 'Informações do Restaurante' },
    { id: 2, label: 'Áreas e Ambientes' },
    { id: 3, label: 'Cardápio' },
    { id: 4, label: 'Integração WhatsApp' },
    { id: 5, label: 'Conclusão' }
  ];
  
  if (variant === 'vertical') {
    return (
      <div className="w-full">
        <div className="flex flex-col space-y-4">
          {steps.slice(0, totalSteps).map((step) => (
            <div 
              key={step.id}
              className={cn(
                "flex items-center p-2 rounded-md",
                step.id === currentStep ? "bg-accent" : "",
                onStepClick ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => onStepClick?.(step.id)}
            >
              <div className="flex-shrink-0">
                {step.id < currentStep ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : step.id === currentStep ? (
                  <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                    {step.id}
                  </div>
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div 
                className={cn(
                  "ml-3 text-sm",
                  step.id === currentStep 
                    ? "text-primary font-medium" 
                    : step.id < currentStep 
                      ? "text-primary" 
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Horizontal layout for desktop
  return (
    <div className="w-full">
      <div className="relative">
        {/* Background connecting lines */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2">
          <div className="w-full h-full bg-muted-foreground/30"></div>
        </div>
        
        {/* Completed connecting lines */}
        <div className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2" style={{ width: `${(Math.max(0, currentStep - 1) / (totalSteps - 1)) * 100}%` }}>
          <div className="w-full h-full bg-primary"></div>
        </div>
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.slice(0, totalSteps).map((step) => (
            <div 
              key={step.id}
              className={cn(
                "flex flex-col items-center",
                onStepClick ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => onStepClick?.(step.id)}
            >
              <div className="flex items-center justify-center bg-background p-1 rounded-full">
                {step.id < currentStep ? (
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                ) : step.id === currentStep ? (
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    {step.id}
                  </div>
                ) : (
                  <Circle className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div 
                className={cn(
                  "mt-2 text-xs text-center max-w-[100px]",
                  step.id === currentStep 
                    ? "text-primary font-medium" 
                    : step.id < currentStep 
                      ? "text-primary" 
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}