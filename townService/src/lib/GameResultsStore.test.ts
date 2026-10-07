import { mock } from 'jest-mock-extended';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  GAME_RESULTS_TABLE,
  GameResultRecord,
  getGameResultsStore,
  IGameResultsStore,
  noOpGameResultsStore,
  saveGameResultInBackground,
  setGameResultsStore,
  SupabaseGameResultsStore,
} from './GameResultsStore';
import { GameInstanceID } from '../types/CoveyTownSocket';

const record: GameResultRecord = {
  gameID: 'game1' as GameInstanceID,
  gameType: 'ConnectFourArea',
  areaID: 'Connect Four 1',
  scores: { alice: 1, bob: 0 },
};

describe('GameResultsStore', () => {
  afterEach(() => {
    setGameResultsStore(undefined);
  });

  describe('SupabaseGameResultsStore', () => {
    it('inserts the result into the game_results table', async () => {
      const insert = jest.fn().mockResolvedValue({ error: null });
      const from = jest.fn().mockReturnValue({ insert });
      const store = new SupabaseGameResultsStore({ from } as unknown as SupabaseClient);

      await store.saveGameResult(record);

      expect(from).toHaveBeenCalledWith(GAME_RESULTS_TABLE);
      expect(insert).toHaveBeenCalledWith({
        game_id: 'game1',
        game_type: 'ConnectFourArea',
        area_id: 'Connect Four 1',
        scores: { alice: 1, bob: 0 },
      });
    });
    it('throws if Supabase returns an error', async () => {
      const insert = jest.fn().mockResolvedValue({ error: { message: 'boom' } });
      const store = new SupabaseGameResultsStore({
        from: () => ({ insert }),
      } as unknown as SupabaseClient);

      await expect(store.saveGameResult(record)).rejects.toThrow('boom');
    });
  });

  describe('getGameResultsStore', () => {
    const originalEnv = { ...process.env };
    afterEach(() => {
      process.env = { ...originalEnv };
    });
    it('does not persist results when Supabase is not configured', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(getGameResultsStore()).toBe(noOpGameResultsStore);
    });
    it('uses Supabase when it is configured', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';
      expect(getGameResultsStore()).toBeInstanceOf(SupabaseGameResultsStore);
    });
  });

  describe('saveGameResultInBackground', () => {
    it('logs rather than throws when saving fails', async () => {
      const store = mock<IGameResultsStore>();
      store.saveGameResult.mockRejectedValue(new Error('database down'));
      setGameResultsStore(store);
      const trace = jest.spyOn(console, 'trace').mockImplementation(() => {});

      expect(() => saveGameResultInBackground(record)).not.toThrow();
      await new Promise(resolve => {
        setImmediate(resolve);
      });

      expect(store.saveGameResult).toHaveBeenCalledWith(record);
      expect(trace).toHaveBeenCalled();
      trace.mockRestore();
    });
  });
});
