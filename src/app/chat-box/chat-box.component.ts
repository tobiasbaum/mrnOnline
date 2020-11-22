import { Component, OnInit } from '@angular/core';
import { GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

@Component({
  selector: 'mrn-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss']
})
export class ChatBoxComponent implements OnInit {

  constructor(field: GameFieldStoreService) { 
    field.gameField.subscribe(gf => gf.registerMessageHandler((id: undefined, msg: any) => this.handleAddedMessage(msg)));
  }

  ngOnInit(): void {
  }

  handleAddedMessage(msg: string) {
    $('#messages').append('<div>' + msg + '</div>\n');
  }

sendMessage(): void {
      var message = prompt('Nachricht');
      if (message) {
        (window.mrnOnline.gameField as GameField).sendMessage(message);
      }
  }

}
