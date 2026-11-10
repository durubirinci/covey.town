import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { Player as PlayerModel, PlayerLocation } from '../types/CoveyTownSocket';
import { PlayerStatus } from './PlayerStatus';
export const MOVEMENT_SPEED = 175;

export type PlayerEvents = {
  movement: (newLocation: PlayerLocation) => void;
  /** The player's status was set or cleared (cleared is undefined) */
  statusChange: (newStatus: PlayerStatus | undefined) => void;
  /** The player's "What are you working on?" note was set or cleared (cleared is undefined) */
  workingOnChange: (newWorkingOn: string | undefined) => void;
};

export type PlayerGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  label: Phaser.GameObjects.Text;
  /** A second line above the name label showing the player's status, hidden when there is none */
  statusLabel: Phaser.GameObjects.Text;
  /** A line between the name and status labels showing what the player is working on */
  workingOnLabel: Phaser.GameObjects.Text;
  locationManagedByGameScene: boolean /* For the local player, the game scene will calculate the current location, and we should NOT apply updates when we receive events */;
};
/**
 * Positions a player's labels above their sprite, stacked upward: name, then what they are
 * working on (if shown), then their status
 */
export function placePlayerLabels(gameObjects: PlayerGameObjects): void {
  const { sprite, label, workingOnLabel, statusLabel } = gameObjects;
  label.setX(sprite.body.x);
  label.setY(sprite.body.y - 20);
  workingOnLabel.setX(sprite.body.x);
  workingOnLabel.setY(label.y - workingOnLabel.height);
  const statusBottom = workingOnLabel.visible ? workingOnLabel.y : label.y;
  statusLabel.setX(sprite.body.x);
  statusLabel.setY(statusBottom - statusLabel.height);
}

export default class PlayerController extends (EventEmitter as new () => TypedEmitter<PlayerEvents>) {
  private _location: PlayerLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public gameObjects?: PlayerGameObjects;

  private _status?: PlayerStatus;

  private _workingOn?: string;

  constructor(id: string, userName: string, location: PlayerLocation) {
    super();
    this._id = id;
    this._userName = userName;
    this._location = location;
  }

  set location(newLocation: PlayerLocation) {
    this._location = newLocation;
    this._updateGameComponentLocation();
    this.emit('movement', newLocation);
  }

  get location(): PlayerLocation {
    return this._location;
  }

  set status(newStatus: PlayerStatus | undefined) {
    this._status = newStatus;
    this.emit('statusChange', newStatus);
  }

  /** The player's status; it may have expired, so check it with isStatusActive */
  get status(): PlayerStatus | undefined {
    return this._status;
  }

  set workingOn(newWorkingOn: string | undefined) {
    this._workingOn = newWorkingOn;
    this.emit('workingOnChange', newWorkingOn);
  }

  /** What the player said they are working on, e.g. "CS490 HW3"; kept when their status changes */
  get workingOn(): string | undefined {
    return this._workingOn;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  toPlayerModel(): PlayerModel {
    return { id: this.id, userName: this.userName, location: this.location };
  }

  private _updateGameComponentLocation() {
    if (this.gameObjects && !this.gameObjects.locationManagedByGameScene) {
      const { sprite } = this.gameObjects;
      if (!sprite.anims) return;
      sprite.setX(this.location.x);
      sprite.setY(this.location.y);
      if (this.location.moving) {
        sprite.anims.play(`misa-${this.location.rotation}-walk`, true);
        switch (this.location.rotation) {
          case 'front':
            sprite.body.setVelocity(0, MOVEMENT_SPEED);
            break;
          case 'right':
            sprite.body.setVelocity(MOVEMENT_SPEED, 0);
            break;
          case 'back':
            sprite.body.setVelocity(0, -MOVEMENT_SPEED);
            break;
          case 'left':
            sprite.body.setVelocity(-MOVEMENT_SPEED, 0);
            break;
        }
        sprite.body.velocity.normalize().scale(175);
      } else {
        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture('atlas', `misa-${this.location.rotation}`);
      }
      placePlayerLabels(this.gameObjects);
    }
  }

  static fromPlayerModel(modelPlayer: PlayerModel): PlayerController {
    return new PlayerController(modelPlayer.id, modelPlayer.userName, modelPlayer.location);
  }
}
