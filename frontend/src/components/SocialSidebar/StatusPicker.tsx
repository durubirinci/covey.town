import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  activeStatus,
  createTimedStatus,
  formatPlayerStatus,
  PlayerStatusKind,
  STATUS_DURATION_MINUTES,
  TIMED_STATUS_KINDS,
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
 * The status menu (task 20): shows the player's status, lets them pick Focused or Away for a set
 * time, and lets them go back to Active. If they don't pick a time, it asks for one and leaves
 * their status as it is.
 */
export default function StatusPicker(): JSX.Element {
  const townController = useTownController();
  const status = usePlayerStatus(townController.ourPlayer);
  const now = useNow();
  const [kind, setKind] = useState<PlayerStatusKind>('Focused');
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [missingTime, setMissingTime] = useState(false);

  const current = formatPlayerStatus(status, now);

  const setStatus = () => {
    if (minutes === undefined) {
      setMissingTime(true);
      return;
    }
    townController.emitStatusChange(createTimedStatus(kind, minutes, Date.now()));
    setMinutes(undefined);
  };

  return (
    <Box>
      <Heading as='h2' fontSize='l'>
        Your status
      </Heading>
      <Text data-testid='currentStatus' fontSize='sm'>
        {current ?? 'Active'}
      </Text>
      <VStack align='left' spacing={2} marginTop={2}>
        <ButtonGroup size='sm' isAttached aria-label='Status'>
          {TIMED_STATUS_KINDS.map(k => (
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
        <FormControl isInvalid={missingTime}>
          <FormLabel fontSize='sm' marginBottom={1}>
            For how long?
          </FormLabel>
          <ButtonGroup size='sm' isAttached aria-label='Duration'>
            {STATUS_DURATION_MINUTES.map(m => (
              <Button
                key={m}
                aria-pressed={minutes === m}
                colorScheme={minutes === m ? 'blue' : undefined}
                variant={minutes === m ? 'solid' : 'outline'}
                onClick={() => {
                  setMinutes(m);
                  setMissingTime(false);
                }}>
                {m}m
              </Button>
            ))}
          </ButtonGroup>
          <FormErrorMessage>Pick how long first.</FormErrorMessage>
        </FormControl>
        <ButtonGroup size='sm'>
          <Button colorScheme='blue' onClick={setStatus}>
            Set status
          </Button>
          <Button
            variant='outline'
            isDisabled={current === undefined}
            onClick={() => townController.emitStatusChange(activeStatus)}>
            Back to Active
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  );
}
