import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { GameField, MsgData } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

@Component({
  selector: 'mrn-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss']
})
export class ChatBoxComponent implements OnInit {

  public messages: MsgData[] = [];

  private destroy = new Subject();

  constructor(private field: GameFieldStoreService, private cdr: ChangeDetectorRef) { 
    field.subscribe(
      gf => gf.registerMessageHandler((id: undefined, msg: any) => this.handleAddedMessage(msg)),
      this.destroy);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  handleAddedMessage(msg: MsgData) {
    this.messages.push(msg);
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  scrollToBottom() {
    let elem = document.getElementById('chatbox');
    if (elem) {
      elem.scrollTop = elem.scrollHeight;
    }
  }

sendMessage(): void {
      var message = prompt('Nachricht');
      if (message) {
        this.field.gameField.sendMessage(message);
      }
  }

}
