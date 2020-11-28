import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CardActionModeService {
  private savedCardId: number | undefined = undefined;

  constructor() { }

  selectForModify(cardId: number) {
    this.savedCardId = cardId;
  }
  normalMode() {
    this.savedCardId = undefined;
  }
  get savedId(): number {
    return this.savedCardId as number;
  }
  get isModifyMode(): boolean {
    return typeof this.savedCardId !== 'undefined';
  }

}
