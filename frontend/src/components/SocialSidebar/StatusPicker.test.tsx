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
  const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
  const currentStatus = () => screen.getByTestId('currentStatus');

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
    (townController.emitStatusChange as jest.Mock).mockImplementation((newStatus: PlayerStatus) => {
      ourPlayer.status = newStatus;
    });
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

  it('starts as Active, with Back to Active disabled', () => {
    expect(currentStatus()).toHaveTextContent('Active');
    expect(screen.getByRole('button', { name: 'Back to Active' })).toBeDisabled();
  });
  it('asks for a time if none is picked, and keeps the status as it is', () => {
    click('Set status');
    expect(screen.getByText('Pick how long first.')).toBeInTheDocument();
    expect(townController.emitStatusChange).not.toHaveBeenCalled();
    expect(currentStatus()).toHaveTextContent('Active');
  });
  it('hides the missing time message once a time is picked', () => {
    click('Set status');
    click('25m');
    expect(screen.queryByText('Pick how long first.')).not.toBeInTheDocument();
  });
  it('sets Focused for the picked time', () => {
    click('25m');
    click('Set status');
    expect(townController.emitStatusChange).toHaveBeenCalledWith({
      kind: 'Focused',
      expiresAt: now + 25 * 60_000,
    });
    expect(currentStatus()).toHaveTextContent('Focused 25:00');
  });
  it('sets Away for the picked time', () => {
    click('Away');
    click('15m');
    click('Set status');
    expect(townController.emitStatusChange).toHaveBeenCalledWith({
      kind: 'Away',
      expiresAt: now + 15 * 60_000,
    });
  });
  it('asks for a time again for the next status', () => {
    click('25m');
    click('Set status');
    click('Set status');
    expect(townController.emitStatusChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pick how long first.')).toBeInTheDocument();
  });
  it('counts down the current status', () => {
    click('25m');
    click('Set status');
    act(() => {
      jest.advanceTimersByTime(61_000);
    });
    expect(currentStatus()).toHaveTextContent('Focused 23:59');
  });
  it('goes back to Active', () => {
    click('25m');
    click('Set status');
    click('Back to Active');
    expect(townController.emitStatusChange).toHaveBeenLastCalledWith({ kind: 'Active' });
    expect(currentStatus()).toHaveTextContent('Active');
  });
  it('shows a status set elsewhere, such as auto-AFK', () => {
    act(() => {
      ourPlayer.status = { kind: 'AFK' };
    });
    expect(currentStatus()).toHaveTextContent('AFK');
  });
});
