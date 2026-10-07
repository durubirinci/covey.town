import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GameResult, InteractableType } from '../types/CoveyTownSocket';
import { logError } from '../Utils';

dotenv.config();

export const GAME_RESULTS_TABLE = 'game_results';

/**
 * A completed game, as it is saved to the database
 */
export interface GameResultRecord extends GameResult {
  /** The kind of game that was played, e.g. 'ConnectFourArea' */
  gameType: InteractableType;
  /** The ID of the game area that hosted the game */
  areaID: string;
}

/**
 * An abstraction for a class that saves the results of completed games
 */
export interface IGameResultsStore {
  saveGameResult(record: GameResultRecord): Promise<void>;
}

/**
 * Used when no database is configured: results are kept only in memory (in each GameArea's history)
 */
export const noOpGameResultsStore: IGameResultsStore = {
  saveGameResult: () => Promise.resolve(),
};

/**
 * Saves game results to the `game_results` table in a Supabase (Postgres) database.
 * @see townService/supabase/schema.sql for the table definition
 */
export class SupabaseGameResultsStore implements IGameResultsStore {
  private _client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this._client = client;
  }

  async saveGameResult(record: GameResultRecord): Promise<void> {
    const { error } = await this._client.from(GAME_RESULTS_TABLE).insert({
      game_id: record.gameID,
      game_type: record.gameType,
      area_id: record.areaID,
      scores: record.scores,
    });
    if (error) {
      throw new Error(`Unable to save game result ${record.gameID}: ${error.message}`);
    }
  }
}

let store: IGameResultsStore | undefined;

/**
 * Returns the store that game results should be saved to. If SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set, results are saved to Supabase; otherwise they are not persisted.
 */
export function getGameResultsStore(): IGameResultsStore {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    store =
      url && key
        ? new SupabaseGameResultsStore(createClient(url, key, { auth: { persistSession: false } }))
        : noOpGameResultsStore;
  }
  return store;
}

/**
 * Replaces the store returned by getGameResultsStore (used by tests)
 */
export function setGameResultsStore(newStore: IGameResultsStore | undefined): void {
  store = newStore;
}

/**
 * Saves a game result in the background, logging (rather than throwing) any error,
 * so that a database problem never interrupts a game in progress.
 */
export function saveGameResultInBackground(record: GameResultRecord): void {
  new Promise<void>(resolve => {
    resolve(getGameResultsStore().saveGameResult(record));
  }).catch(err => logError(err));
}
