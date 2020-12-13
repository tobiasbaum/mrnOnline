import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CardCollectionComponent } from '../card-collection/card-collection.component';
import { GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';
import { ModalCardCollectionService } from '../modal-card-collection.service';

@Component({
  selector: 'mrn-modal-card-collection',
  templateUrl: './modal-card-collection.component.html',
  styleUrls: ['./modal-card-collection.component.scss']
})
export class ModalCardCollectionComponent implements OnInit {

  private destroy = new Subject();

  @ViewChild(CardCollectionComponent)
  private cc!: CardCollectionComponent;

  constructor(public service: ModalCardCollectionService, private field: GameFieldStoreService) { 
    field.subscribe(
      (f: GameField) => f.myself.subscribeForUpdate(() => this.cc.collection = service.collection()),
      this.destroy);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  hide() {
    this.service.isShown = false;
    this.service.closed.next();
  }

}
