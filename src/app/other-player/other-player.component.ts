import { ChangeDetectorRef, Component, Input, NgZone, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CardBag, CardStash, OtherPlayer } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

@Component({
  selector: 'mrn-other-player',
  templateUrl: './other-player.component.html',
  styleUrls: ['./other-player.component.scss']
})
export class OtherPlayerComponent implements OnInit {

  @Input()
  public me!: OtherPlayer;

  private destroy = new Subject<void>();

  constructor(private field: GameFieldStoreService, private cdr: ChangeDetectorRef, private ngz: NgZone) { }

  ngOnInit(): void {
    this.me.subscribeForUpdate(() => this.ngz.run(() => this.cdr.markForCheck()), this.destroy);
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  get name(): string {
    return this.me.name;
  }

  get id(): string {
    return this.me.id;
  }

  get lifes(): number {
    return this.me.lifes;
  }

  get handSize(): number {
    return this.me.handSize;
  }

  get librarySize(): number {
    return this.me.librarySize;
  }

  get table(): CardBag {
    return this.me.table;
  }

  get graveyard(): CardStash {
    return this.me.graveyard;
  }

  isCurrentPlayer(): boolean {
    return this.field.gameField.currentPlayerName === this.me.name;
  }

}
