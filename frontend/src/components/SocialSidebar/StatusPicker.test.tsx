import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';
import React from 'react';
import PlayerController from '../../classes/PlayerController';
import { PlayerStatus } from '../../classes/PlayerStatus';
import TownController from '../../classes/TownController';
import * as useTownController from '../../hooks/useTownController';
import StatusPicker from './StatusPicker';

describe('StatusPicker', () => {
  const now = 1_700_000_000_000;
  let ourPlayer: PlayerController;
  let townController: TownController;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    ourPlayer = new PlayerController('id', 'alice', {
      x: 0,
      y: 0,
      rotation: 'front',
      moving: false,
    });
    townController = mock<TownController>();
    Object.defineProperty(townController, 'ourPlayer', { value: ourPlayer });
    (townController.emitStatusChange as jest.Mock).mockImplementation(
      (newStatus: PlayerStatus | undefined) => {
        ourPlayer.status = newStatus;
      },
    );
    jest.spyOn(useTownController, 'default').mockReturnValue(townController);
    render(
      <ChakraProvider>
        <StatusPicker />
      </ChakraProvider>,
    );
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows that no status is set at first, with Clear disabled', () => {
    expect(screen.getByTestId('currentStatus')).toHaveTextContent('No status set');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });
  it('sends Focused for 25 minutes by default', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Set status' }));
    expect(townController.emitStatusChange).toHaveBeenCalledWith({
      kind: 'Focused',
      expiresAt: now + 25 * 60_000,
    });
    expect(screen.getByTestId('currentStatus')).toHaveTextContent('Focused 25:00');
  });
  it('sends the picked status, duration and working-on text', () => {
    fireEvent.click(screen.getByRole('button', { name: 'On break' }));
    fireEvent.click(screen.getByRole('button', { name: '15m' }));
    fireEvent.change(screen.getByLabelText(/What are you working on/), {
      target: { value: 'CS490 HW3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set status' }));
    expect(townController.emitStatusChange).toHaveBeenCalledWith({
      kind: 'On break',
      expiresAt: now + 15 * 60_000,
      workingOn: 'CS490 HW3',
    });
  });
  it('counts down the current status', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Set status' }));
    act(() => {
      jest.advanceTimersByTime(61_000);
    });
    expect(screen.getByTestId('currentStatus')).toHaveTextContent('Focused 23:59');
  });
  it('clears the status', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Set status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(townController.emitStatusChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByTestId('currentStatus')).toHaveTextContent('No status set');
  });
  it('shows a status set elsewhere, such as auto-AFK', () => {
    act(() => {
      ourPlayer.status = { kind: 'AFK' };
    });
    expect(screen.getByTestId('currentStatus')).toHaveTextContent('AFK');
  });
  it('pauses the game while typing, so typing does not move the avatar', () => {
    const input = screen.getByLabelText(/What are you working on/);
    fireEvent.focus(input);
    expect(townController.pause).toHaveBeenCalled();
    fireEvent.blur(input);
    expect(townController.unPause).toHaveBeenCalled();
  });
});
