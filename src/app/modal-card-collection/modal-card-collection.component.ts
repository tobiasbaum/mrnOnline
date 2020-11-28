import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { CardCollection } from '../domain/game-field';
import { ModalCardCollectionService } from '../modal-card-collection.service';

@Component({
  selector: 'mrn-modal-card-collection',
  templateUrl: './modal-card-collection.component.html',
  styleUrls: ['./modal-card-collection.component.scss']
})
export class ModalCardCollectionComponent implements OnInit {

  constructor(public service: ModalCardCollectionService) { 
    service
  }

  ngOnInit(): void {
  }

  hide() {
    this.service.isShown = false;
    this.service.closed.next();
  }

}
