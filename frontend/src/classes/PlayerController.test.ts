import PlayerController, { PlayerGameObjects, placePlayerLabels } from './PlayerController';

/** A stand-in for a Phaser text object: just a position, a height and whether it is shown */
function fakeText(height: number, visible: boolean) {
  const text = {
    x: 0,
    y: 0,
    height,
    visible,
    setX(x: number) {
      text.x = x;
      return text;
    },
    setY(y: number) {
      text.y = y;
      return text;
    },
  };
  return text;
}

function fakeGameObjects(workingOnVisible: boolean) {
  return {
    sprite: { body: { x: 100, y: 200 } },
    label: fakeText(20, true),
    workingOnLabel: fakeText(18, workingOnVisible),
    statusLabel: fakeText(21, true),
  };
}

describe('placePlayerLabels', () => {
  it('stacks the name, the working-on note and the status upward from the sprite', () => {
    const objects = fakeGameObjects(true);
    placePlayerLabels(objects as unknown as PlayerGameObjects);
    expect(objects.label.y).toBe(180);
    expect(objects.workingOnLabel.y).toBe(162);
    expect(objects.statusLabel.y).toBe(141);
    expect([objects.label.x, objects.workingOnLabel.x, objects.statusLabel.x]).toEqual([
      100, 100, 100,
    ]);
  });
  it('puts the status right above the name when there is no note', () => {
    const objects = fakeGameObjects(false);
    placePlayerLabels(objects as unknown as PlayerGameObjects);
    expect(objects.statusLabel.y).toBe(159);
  });
});

describe('PlayerController.workingOn', () => {
  it('emits workingOnChange when set or cleared', () => {
    const player = new PlayerController('id', 'alice', {
      x: 0,
      y: 0,
      rotation: 'front',
      moving: false,
    });
    const listener = jest.fn();
    player.addListener('workingOnChange', listener);
    player.workingOn = 'CS490 HW3';
    player.workingOn = undefined;
    expect(listener.mock.calls).toEqual([['CS490 HW3'], [undefined]]);
    expect(player.workingOn).toBeUndefined();
  });
});
