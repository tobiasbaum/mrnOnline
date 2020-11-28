import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CardActionModeService {
  private savedCardId: number | undefined = undefined;
  private subject = new Subject();

  constructor() { }

  selectForModify(cardId: number) {
    this.savedCardId = cardId;
    this.subject.next();
  }
  normalMode() {
    this.savedCardId = undefined;
    this.subject.next();
  }
  get savedId(): number {
    return this.savedCardId as number;
  }
  get isModifyMode(): boolean {
    return typeof this.savedCardId !== 'undefined';
  }
  subscribe(handler: () => void, destroy: Subject<unknown>) {
    this.subject.pipe(takeUntil(destroy)).subscribe(handler);
  }
}
