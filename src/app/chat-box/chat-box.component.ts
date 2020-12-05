import { AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { MsgData } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

@Component({
  selector: 'mrn-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss']
})
export class ChatBoxComponent implements OnInit, AfterViewChecked {

  public messages: MsgData[] = [];

  private destroy = new Subject();
  private scrollDirty: boolean = false;

  constructor(private field: GameFieldStoreService, private cdr: ChangeDetectorRef, private ngz: NgZone) { 
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
    this.ngz.run(() => {
      NgZone.assertInAngularZone();
      this.messages.push(msg);
      this.cdr.markForCheck();
      this.scrollDirty = true;
      this.scrollToBottom();  
    });
  }

  ngAfterViewChecked() {
    if (this.scrollDirty) {
      this.scrollDirty = false;
      setTimeout(() => this.scrollToBottom());
    }
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
