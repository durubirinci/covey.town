import { useEffect, useState } from 'react';
import PlayerController from '../classes/PlayerController';

/**
 * A react hook to retrieve what a player said they are working on. Components that use it
 * re-render when the note is set or cleared.
 */
export default function usePlayerWorkingOn(player: PlayerController): string | undefined {
  const [workingOn, setWorkingOn] = useState<string | undefined>(player.workingOn);
  useEffect(() => {
    setWorkingOn(player.workingOn);
    player.addListener('workingOnChange', setWorkingOn);
    return () => {
      player.removeListener('workingOnChange', setWorkingOn);
    };
  }, [player]);
  return workingOn;
}
