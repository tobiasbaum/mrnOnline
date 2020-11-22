import { Component, OnInit } from '@angular/core';
import { GameField } from '../domain/game-field';

@Component({
  selector: 'mrn-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss']
})
export class ChatBoxComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  sendMessage(): void {
      var message = prompt('Nachricht');
      if (message) {
        (window.mrnOnline.gameField as GameField).sendMessage(message);
      }
  }

}
