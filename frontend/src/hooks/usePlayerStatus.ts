import { useEffect, useState } from 'react';
import PlayerController from '../classes/PlayerController';
import { PlayerStatus } from '../classes/PlayerStatus';

/**
 * A react hook to retrieve a player's status. Components that use it re-render when the status
 * is set or cleared, but not as it counts down or expires; check it with isStatusActive.
 */
export default function usePlayerStatus(player: PlayerController): PlayerStatus | undefined {
  const [status, setStatus] = useState<PlayerStatus | undefined>(player.status);
  useEffect(() => {
    setStatus(player.status);
    player.addListener('statusChange', setStatus);
    return () => {
      player.removeListener('statusChange', setStatus);
    };
  }, [player]);
  return status;
}
