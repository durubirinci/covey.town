import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';
import React from 'react';
import PlayerController from '../../classes/PlayerController';
import { cleanWorkingOn, PlayerStatus } from '../../classes/PlayerStatus';
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
    (townController.emitWorkingOnChange as jest.Mock).mockImplementation(
      (workingOn: string | undefined) => {
        ourPlayer.workingOn = cleanWorkingOn(workingOn);
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
  describe('What are you working on? note (task 28)', () => {
    const noteInput = () => screen.getByLabelText('What are you working on? (optional)');
    const type = (text: string) => fireEvent.change(noteInput(), { target: { value: text } });

    it('saves the note', () => {
      type('CS490 HW3');
      click('Save note');
      expect(townController.emitWorkingOnChange).toHaveBeenCalledWith('CS490 HW3');
      expect(ourPlayer.workingOn).toBe('CS490 HW3');
    });
    it('clears the note, and disables Clear note when there is none', () => {
      expect(screen.getByRole('button', { name: 'Clear note' })).toBeDisabled();
      type('CS490 HW3');
      click('Save note');
      click('Clear note');
      expect(townController.emitWorkingOnChange).toHaveBeenLastCalledWith(undefined);
      expect(ourPlayer.workingOn).toBeUndefined();
      expect(noteInput()).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Clear note' })).toBeDisabled();
    });
    it('clears the note when a blank one is saved', () => {
      type('CS490 HW3');
      click('Save note');
      type('   ');
      click('Save note');
      expect(ourPlayer.workingOn).toBeUndefined();
    });
    it('limits the note to 60 characters', () => {
      expect(noteInput()).toHaveAttribute('maxLength', '60');
    });
    it('keeps the note when the status changes', () => {
      type('CS490 HW3');
      click('Save note');
      click('25m');
      click('Set status');
      act(() => {
        ourPlayer.status = { kind: 'AFK' };
      });
      expect(ourPlayer.workingOn).toBe('CS490 HW3');
    });
    it('pauses the game while typing, so the arrow keys do not move the avatar', () => {
      fireEvent.focus(noteInput());
      expect(townController.pause).toHaveBeenCalled();
      fireEvent.blur(noteInput());
      expect(townController.unPause).toHaveBeenCalled();
    });
  });
});
