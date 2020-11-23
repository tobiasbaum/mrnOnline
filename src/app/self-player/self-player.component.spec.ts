import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfPlayerComponent } from './self-player.component';

describe('SelfPlayerComponent', () => {
  let component: SelfPlayerComponent;
  let fixture: ComponentFixture<SelfPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelfPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
