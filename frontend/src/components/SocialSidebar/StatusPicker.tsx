import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  createPlayerStatus,
  formatPlayerStatus,
  MAX_WORKING_ON_LENGTH,
  PlayerStatusKind,
  PLAYER_STATUS_KINDS,
  STATUS_DURATION_MINUTES,
} from '../../classes/PlayerStatus';
import usePlayerStatus from '../../hooks/usePlayerStatus';
import useTownController from '../../hooks/useTownController';

/**
 * Re-renders the component every second, so that a countdown shown in it stays current
 */
function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

/**
 * Lets the player pick a status (Focused, On break or AFK) and how long it lasts, and optionally
 * say what they are working on. The status is shown above their avatar with a countdown.
 */
export default function StatusPicker(): JSX.Element {
  const townController = useTownController();
  const status = usePlayerStatus(townController.ourPlayer);
  const now = useNow();
  const [kind, setKind] = useState<PlayerStatusKind>('Focused');
  const [minutes, setMinutes] = useState<number>(STATUS_DURATION_MINUTES[1]);
  const [workingOn, setWorkingOn] = useState<string>('');

  const current = formatPlayerStatus(status, now);

  return (
    <Box>
      <Heading as='h2' fontSize='l'>
        Your status
      </Heading>
      <Text data-testid='currentStatus' whiteSpace='pre-line' fontSize='sm'>
        {current ?? 'No status set'}
      </Text>
      <VStack align='left' spacing={2} marginTop={2}>
        <ButtonGroup size='sm' isAttached variant='outline' aria-label='Status'>
          {PLAYER_STATUS_KINDS.map(k => (
            <Button
              key={k}
              aria-pressed={kind === k}
              colorScheme={kind === k ? 'blue' : undefined}
              variant={kind === k ? 'solid' : 'outline'}
              onClick={() => setKind(k)}>
              {k}
            </Button>
          ))}
        </ButtonGroup>
        <ButtonGroup size='sm' isAttached variant='outline' aria-label='Duration'>
          {STATUS_DURATION_MINUTES.map(m => (
            <Button
              key={m}
              aria-pressed={minutes === m}
              colorScheme={minutes === m ? 'blue' : undefined}
              variant={minutes === m ? 'solid' : 'outline'}
              onClick={() => setMinutes(m)}>
              {m}m
            </Button>
          ))}
        </ButtonGroup>
        <FormControl>
          <FormLabel htmlFor='workingOn' fontSize='sm' marginBottom={1}>
            What are you working on? (optional)
          </FormLabel>
          <Input
            id='workingOn'
            size='sm'
            placeholder='e.g. CS490 HW3'
            maxLength={MAX_WORKING_ON_LENGTH}
            value={workingOn}
            onChange={e => setWorkingOn(e.target.value)}
            // Stop the arrow keys and WASD from moving the avatar while typing
            onFocus={() => townController.pause()}
            onBlur={() => townController.unPause()}
          />
        </FormControl>
        <ButtonGroup size='sm'>
          <Button
            colorScheme='blue'
            onClick={() =>
              townController.emitStatusChange(
                createPlayerStatus(kind, minutes, Date.now(), workingOn),
              )
            }>
            Set status
          </Button>
          <Button
            variant='outline'
            isDisabled={current === undefined}
            onClick={() => townController.emitStatusChange(undefined)}>
            Clear
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  );
}
