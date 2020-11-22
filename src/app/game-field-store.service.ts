import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameField } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class GameFieldStoreService {

  public gameField: Subject<GameField> = new Subject<GameField>();

  constructor() { }
}
