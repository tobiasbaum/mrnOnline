import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, Output } from '@angular/core';
import { GameField, MsgData } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

@Component({
  selector: 'mrn-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss']
})
export class ChatBoxComponent implements OnInit {

  @Output()
  public messages: MsgData[] = [];

  constructor(private field: GameFieldStoreService, private cdr: ChangeDetectorRef) { 
    field.subscribe(gf => gf.registerMessageHandler((id: undefined, msg: any) => this.handleAddedMessage(msg)));
  }

  ngOnInit(): void {
  }

  handleAddedMessage(msg: MsgData) {
    this.messages.push(msg);
    this.cdr.detectChanges();
  }

sendMessage(): void {
      var message = prompt('Nachricht');
      if (message) {
        (window.mrnOnline.gameField as GameField).sendMessage(message);
      }
  }

}
