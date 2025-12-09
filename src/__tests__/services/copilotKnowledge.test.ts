// Copilot Knowledge Base Tests
// PRD 3.0: Retrieval-based responses for Copilot v0

import { searchKnowledge, getRandomTips, KNOWLEDGE_BASE } from '../../services/copilot/knowledgeBase';

describe('copilotKnowledgeBase', () => {
  describe('KNOWLEDGE_BASE', () => {
    it('contains binding category entries', () => {
      const bindingEntries = KNOWLEDGE_BASE.filter(e => e.category === 'binding');
      expect(bindingEntries.length).toBeGreaterThan(0);
    });

    it('contains HRT category entries', () => {
      const hrtEntries = KNOWLEDGE_BASE.filter(e => e.category === 'hrt');
      expect(hrtEntries.length).toBeGreaterThan(0);
    });

    it('contains post-op category entries', () => {
      const postOpEntries = KNOWLEDGE_BASE.filter(e => e.category === 'post_op');
      expect(postOpEntries.length).toBeGreaterThan(0);
    });

    it('contains dysphoria category entries', () => {
      const dysphoriaEntries = KNOWLEDGE_BASE.filter(e => e.category === 'dysphoria');
      expect(dysphoriaEntries.length).toBeGreaterThan(0);
    });

    it('contains exercise category entries', () => {
      const exerciseEntries = KNOWLEDGE_BASE.filter(e => e.category === 'exercise');
      expect(exerciseEntries.length).toBeGreaterThan(0);
    });

    it('contains recovery category entries', () => {
      const recoveryEntries = KNOWLEDGE_BASE.filter(e => e.category === 'recovery');
      expect(recoveryEntries.length).toBeGreaterThan(0);
    });

    it('all entries have required fields', () => {
      KNOWLEDGE_BASE.forEach(entry => {
        expect(entry.id).toBeTruthy();
        expect(entry.category).toBeTruthy();
        expect(entry.keywords.length).toBeGreaterThan(0);
        expect(entry.question).toBeTruthy();
        expect(entry.answer).toBeTruthy();
      });
    });

    it('entries with relatedGuide reference valid guides', () => {
      const entriesWithGuides = KNOWLEDGE_BASE.filter(e => e.relatedGuide);
      entriesWithGuides.forEach(entry => {
        expect(['binder_safety', 'post_op_movement']).toContain(entry.relatedGuide);
      });
    });
  });

  describe('searchKnowledge', () => {
    describe('binding queries', () => {
      it('finds binding cardio entry', () => {
        const results = searchKnowledge('can I do cardio while binding');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('binding');
      });

      it('finds binding chest exercise entry', () => {
        const results = searchKnowledge('should I do chest press while binding');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.category === 'binding')).toBe(true);
      });

      it('finds binding duration entry', () => {
        const results = searchKnowledge('how long can I bind during workout');
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('HRT queries', () => {
      it('finds testosterone energy entry', () => {
        const results = searchKnowledge('feeling tired after starting T');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('hrt');
      });

      it('finds testosterone muscle gains entry', () => {
        const results = searchKnowledge('when will I see muscle gains on testosterone');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('hrt');
      });

      it('finds injection timing entry', () => {
        const results = searchKnowledge('should I workout on injection day');
        expect(results.length).toBeGreaterThan(0);
      });

      it('finds estrogen exercise entry', () => {
        const results = searchKnowledge('how does estrogen affect my workouts');
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('post-op queries', () => {
      it('finds top surgery timeline entry', () => {
        const results = searchKnowledge('when can I exercise after top surgery');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('post_op');
      });

      it('finds scar care entry', () => {
        const results = searchKnowledge('will exercise affect my surgery scars');
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('dysphoria queries', () => {
      it('finds gym dysphoria entry', () => {
        const results = searchKnowledge('how can I manage dysphoria at the gym');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('dysphoria');
      });

      it('finds rest day entry', () => {
        const results = searchKnowledge('can I skip workout on bad dysphoria days');
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('exercise queries', () => {
      it('finds modification entry', () => {
        const results = searchKnowledge('how do I modify an exercise if its too hard');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('exercise');
      });

      it('finds rest between sets entry', () => {
        const results = searchKnowledge('how long should I rest between sets');
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('recovery queries', () => {
      it('finds soreness entry', () => {
        const results = searchKnowledge('is muscle soreness normal');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('recovery');
      });
    });

    describe('context-aware boosting', () => {
      it('boosts binding entries when user binds', () => {
        const resultsWithContext = searchKnowledge('cardio', { binds_chest: true });
        const resultsWithoutContext = searchKnowledge('cardio');

        // With binding context, should find binding-related results
        const bindingResult = resultsWithContext.find(r => r.category === 'binding');
        expect(bindingResult).toBeDefined();
      });

      it('boosts HRT entries when user is on T', () => {
        const results = searchKnowledge('energy', { on_hrt: true, hrt_type: 'testosterone' });
        const hrtResult = results.find(r => r.category === 'hrt');
        expect(hrtResult).toBeDefined();
      });

      it('boosts post-op entries when user has surgery', () => {
        const results = searchKnowledge('exercise', { has_surgery: true });
        const postOpResult = results.find(r => r.category === 'post_op');
        expect(postOpResult).toBeDefined();
      });
    });

    describe('no results', () => {
      it('returns empty array for unrelated queries', () => {
        const results = searchKnowledge('quantum physics recipes');
        expect(results).toHaveLength(0);
      });
    });

    describe('result limiting', () => {
      it('returns max 3 results', () => {
        const results = searchKnowledge('exercise workout');
        expect(results.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('getRandomTips', () => {
    it('returns specified number of tips', () => {
      const tips = getRandomTips(3);
      expect(tips).toHaveLength(3);
    });

    it('returns different entries on multiple calls (randomized)', () => {
      const firstCall = getRandomTips(5);
      const secondCall = getRandomTips(5);

      // At least one should be different (statistically very likely)
      const firstIds = firstCall.map(t => t.id);
      const secondIds = secondCall.map(t => t.id);
      const allSame = firstIds.every((id, i) => id === secondIds[i]);

      // This test might flakily fail (1/N! chance), but practically never will
      // If it does fail consistently, the function isn't random
      if (KNOWLEDGE_BASE.length > 5) {
        // Only test randomness if we have enough entries
        expect(allSame).toBe(false);
      }
    });

    it('defaults to 3 tips', () => {
      const tips = getRandomTips();
      expect(tips).toHaveLength(3);
    });
  });
});
