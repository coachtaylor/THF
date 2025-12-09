// Red Flag Deflection Service Tests
// PRD 3.0 Critical Safety Feature - 100% coverage required

import {
  checkForRedFlags,
  isSafeQuery,
  getDeflectionMessage,
  CRISIS_RESOURCES,
  RedFlagCategory,
} from '../../services/safety/redFlagDeflection';

describe('redFlagDeflection', () => {
  describe('checkForRedFlags', () => {
    describe('acute_symptoms detection', () => {
      const acuteSymptomQueries = [
        'I have sharp chest pain',
        "I can't breathe properly",
        'difficulty breathing while exercising',
        'chest tightness during workout',
        'my heart is racing really fast',
        'heart pounding hard',
        'heart palpitations',
        'numbness in my arm',
        'numbness in chest area',
        'severe pain after surgery',
        'severe swelling at incision',
        'severe bruising',
        'blood in urine',
        'blood from stool',
        'I feel like passing out',
        'I fainted during exercise',
        'dizzy and nauseous',
        'dizzy while working out',
        'fever after surgery',
        'fever and chills',
        'I think I have an infection',
        'pus from incision site',
        'discharge from wound',
        'incision opening up',
        'incision splitting',
        'incision bleeding',
        'extreme fatigue',
        'extreme weakness',
      ];

      test.each(acuteSymptomQueries)(
        'detects acute symptom: "%s"',
        (query) => {
          const result = checkForRedFlags(query);
          expect(result.isRedFlag).toBe(true);
          expect(result.category).toBe('acute_symptoms');
          expect(result.matchedKeywords.length).toBeGreaterThan(0);
          expect(result.deflectionMessage).toContain('medical concern');
        }
      );
    });

    describe('medical_emergency detection', () => {
      const emergencyQueries = [
        'should I call 911',
        'need to call an ambulance',
        'call emergency services',
        'go to the ER',
        'go to emergency room',
        'go to hospital now',
        'medical emergency happening',
        'I think I overdosed',
        "I can't move my arm",
        "I can't feel my leg",
        'losing consciousness',
        'feeling suicidal',
        'thoughts of self-harm',
        'I want to die',
        'I want to hurt myself',
      ];

      test.each(emergencyQueries)(
        'detects medical emergency: "%s"',
        (query) => {
          const result = checkForRedFlags(query);
          expect(result.isRedFlag).toBe(true);
          expect(result.category).toBe('medical_emergency');
          expect(result.deflectionMessage).toContain('911');
        }
      );

      it('includes crisis resources in emergency deflection', () => {
        const result = checkForRedFlags('I want to hurt myself');
        expect(result.deflectionMessage).toContain('988');
        expect(result.deflectionMessage).toContain('Trans Lifeline');
      });
    });

    describe('medication_dosing detection', () => {
      const dosingQueries = [
        'how much testosterone should I take',
        'how much T should I inject',
        'how much estrogen per day',
        'how much HRT is right',
        'increase my dose',
        'increase my dosage',
        'change my dose',
        'change my dosage',
        'skip my dose',
        'skip my shot',
        'skip my injection',
        'double my dose',
        'double my shot',
        'what dose should I take',
        '100mg of testosterone',
        '200 mg of estrogen',
        'injection site pain and swelling',
        'injection site lump',
      ];

      test.each(dosingQueries)(
        'detects medication dosing question: "%s"',
        (query) => {
          const result = checkForRedFlags(query);
          expect(result.isRedFlag).toBe(true);
          expect(result.category).toBe('medication_dosing');
          expect(result.deflectionMessage).toContain('prescribing provider');
        }
      );
    });

    describe('diagnosis_seeking detection', () => {
      const diagnosisQueries = [
        'do I have an injury',
        'is this normal after surgery',
        'is this okay after surgery',
        'is this infected',
        'is it infected',
        'should I be worried',
        'should I be concerned',
        "what's wrong with my chest",
        'can you diagnose this',
        'is this serious',
        'am I okay',
        'am I dying',
        'am I having a heart attack',
      ];

      test.each(diagnosisQueries)(
        'detects diagnosis seeking: "%s"',
        (query) => {
          const result = checkForRedFlags(query);
          expect(result.isRedFlag).toBe(true);
          expect(result.category).toBe('diagnosis_seeking');
          expect(result.deflectionMessage).toContain('cannot diagnose');
        }
      );
    });

    describe('surgical_clearance detection', () => {
      const clearanceQueries = [
        'can I exercise yet',
        'can I exercise now',
        'can I lift weights yet',
        'can I workout yet',
        'when can I start exercising',
        'when can I begin working out',
        'when can I resume lifting',
        'am I cleared to exercise',
        'am I cleared for lifting',
        'can I override my surgeon',
        'ignore my surgeon advice',
        "surgeon said no but I want to",
        "surgeon said wait but I feel fine",
        "my surgeon said don't exercise",
      ];

      test.each(clearanceQueries)(
        'detects surgical clearance question: "%s"',
        (query) => {
          const result = checkForRedFlags(query);
          expect(result.isRedFlag).toBe(true);
          expect(result.category).toBe('surgical_clearance');
          expect(result.deflectionMessage).toContain('surgeon');
        }
      );
    });

    describe('safe queries', () => {
      const safeQueries = [
        'how do I do a squat',
        'what exercises are good for legs',
        'can I do cardio while binding',
        'how long should I rest between sets',
        'what is a good warm up',
        'how many reps should I do',
        'is this exercise good for building muscle',
        'how do I improve my form',
        'what equipment do I need',
        'how often should I work out',
      ];

      test.each(safeQueries)(
        'allows safe query: "%s"',
        (query) => {
          const result = checkForRedFlags(query);
          expect(result.isRedFlag).toBe(false);
          expect(result.category).toBeUndefined();
        }
      );
    });

    describe('category priority', () => {
      it('prioritizes medical_emergency over acute_symptoms', () => {
        const query = 'I have sharp chest pain and want to hurt myself';
        const result = checkForRedFlags(query);
        expect(result.category).toBe('medical_emergency');
      });

      it('prioritizes acute_symptoms over medication_dosing', () => {
        const query = 'sharp pain after increasing my dose';
        const result = checkForRedFlags(query);
        expect(result.category).toBe('acute_symptoms');
      });

      it('prioritizes medication_dosing over surgical_clearance', () => {
        const query = 'how much T should I take after surgery, when can I start';
        const result = checkForRedFlags(query);
        expect(result.category).toBe('medication_dosing');
      });
    });

    describe('case insensitivity', () => {
      it('detects uppercase queries', () => {
        const result = checkForRedFlags('I HAVE SHARP CHEST PAIN');
        expect(result.isRedFlag).toBe(true);
      });

      it('detects mixed case queries', () => {
        const result = checkForRedFlags('Sharp Chest Pain');
        expect(result.isRedFlag).toBe(true);
      });
    });

    describe('matched keywords tracking', () => {
      it('returns matched keywords', () => {
        const result = checkForRedFlags('I have sharp chest pain and difficulty breathing');
        expect(result.matchedKeywords.length).toBeGreaterThan(0);
        expect(result.matchedKeywords.some(k => k.toLowerCase().includes('sharp'))).toBe(true);
      });
    });
  });

  describe('isSafeQuery', () => {
    it('returns true for safe queries', () => {
      expect(isSafeQuery('how do I do a pushup')).toBe(true);
      expect(isSafeQuery('what exercises are good for back')).toBe(true);
    });

    it('returns false for red flag queries', () => {
      expect(isSafeQuery('I have sharp chest pain')).toBe(false);
      expect(isSafeQuery('how much testosterone should I take')).toBe(false);
      expect(isSafeQuery('I want to hurt myself')).toBe(false);
    });
  });

  describe('getDeflectionMessage', () => {
    it('returns correct message for acute_symptoms', () => {
      const message = getDeflectionMessage('acute_symptoms');
      expect(message).toContain('medical concern');
      expect(message).toContain('healthcare provider');
    });

    it('returns correct message for medical_emergency', () => {
      const message = getDeflectionMessage('medical_emergency');
      expect(message).toContain('911');
      expect(message).toContain('988');
    });

    it('returns correct message for medication_dosing', () => {
      const message = getDeflectionMessage('medication_dosing');
      expect(message).toContain('prescribing provider');
      expect(message).toContain('hormone dosing');
    });

    it('returns correct message for diagnosis_seeking', () => {
      const message = getDeflectionMessage('diagnosis_seeking');
      expect(message).toContain('cannot diagnose');
    });

    it('returns correct message for surgical_clearance', () => {
      const message = getDeflectionMessage('surgical_clearance');
      expect(message).toContain('surgeon');
      expect(message).toContain('clearance');
    });

    it('returns general message for undefined category', () => {
      const message = getDeflectionMessage(undefined);
      expect(message).toContain('outside what TransFitness can help with');
    });
  });

  describe('CRISIS_RESOURCES', () => {
    it('contains suicide lifeline', () => {
      expect(CRISIS_RESOURCES.suicideLifeline).toBeDefined();
      expect(CRISIS_RESOURCES.suicideLifeline.number).toBe('988');
    });

    it('contains trans lifeline', () => {
      expect(CRISIS_RESOURCES.transLifeline).toBeDefined();
      expect(CRISIS_RESOURCES.transLifeline.number).toBe('877-565-8860');
    });

    it('contains crisis text line', () => {
      expect(CRISIS_RESOURCES.crisisTextLine).toBeDefined();
      expect(CRISIS_RESOURCES.crisisTextLine.number).toContain('741741');
    });

    it('contains trevor project', () => {
      expect(CRISIS_RESOURCES.trevorProject).toBeDefined();
      expect(CRISIS_RESOURCES.trevorProject.number).toBe('1-866-488-7386');
    });
  });
});
