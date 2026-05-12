// Dynamic step counter for the intake flow.
//
// Canonical 8-step order:
//   GenderIdentity (1) > HRTStatus (2) > BindingInfo (3) > Surgery (4)
//   > Goals (5) > Experience (6) > EnvironmentAndDays (7) > Review (8)
//
// Trans women (gender_identity === 'mtf') skip BindingInfo in the
// HRTStatus.handleContinue branch (PR shipped as `612b5c1`). For those
// users the counter should read 1..7 of 7 instead of jumping from
// "STEP 2 OF 8" to "STEP 4 OF 8".

export type IntakeGender = 'mtf' | 'ftm' | 'nonbinary' | 'questioning' | null | undefined;

const TOTAL_CANONICAL = 8;
const BINDING_INFO_STEP = 3;

export function intakeStepDisplay(
  canonicalStep: number,
  genderIdentity: IntakeGender,
): { currentStep: number; totalSteps: number } {
  const skipsBinding = genderIdentity === 'mtf';
  if (!skipsBinding) {
    return { currentStep: canonicalStep, totalSteps: TOTAL_CANONICAL };
  }
  const adjusted = canonicalStep > BINDING_INFO_STEP ? canonicalStep - 1 : canonicalStep;
  return { currentStep: adjusted, totalSteps: TOTAL_CANONICAL - 1 };
}
