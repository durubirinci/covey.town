import { useEffect } from 'react';
import AutoAfk from '../classes/AutoAfk';
import useTownController from './useTownController';

const ACTIVITY_EVENTS = ['keydown', 'mousedown', 'mousemove', 'wheel', 'touchstart'];

/** How often, in milliseconds, to check whether the player has gone idle */
const CHECK_INTERVAL_MS = 1000;

/**
 * Marks our player AFK after 5 minutes without keyboard or mouse use, back to Active when they
 * return, and ends their Focused or Away timer when it runs out (task 21). Use it once, in the
 * component that shows the town.
 *
 * This hook relies on the TownControllerContext.
 */
export default function useAutoAfk(): void {
  const townController = useTownController();
  useEffect(() => {
    const tracker = new AutoAfk(
      {
        get status() {
          return townController.ourPlayer.status;
        },
        setStatus: newStatus => townController.emitStatusChange(newStatus),
      },
      Date.now(),
    );
    const onActivity = () => tracker.recordActivity(Date.now());
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity, { passive: true }));
    const interval = setInterval(() => tracker.check(Date.now()), CHECK_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity));
    };
  }, [townController]);
}
