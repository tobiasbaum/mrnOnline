import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { ChatBoxComponent } from './chat-box/chat-box.component';
import { SelfPlayerComponent } from './self-player/self-player.component';
import { CardComponent } from './card/card.component';
import { OtherPlayerComponent } from './other-player/other-player.component';
import { CardCollectionComponent } from './card-collection/card-collection.component';
import { CardDetailsComponent } from './card-details/card-details.component';
import { ModalCardCollectionComponent } from './modal-card-collection/modal-card-collection.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    ChatBoxComponent,
    SelfPlayerComponent,
    CardComponent,
    OtherPlayerComponent,
    CardCollectionComponent,
    CardDetailsComponent,
    ModalCardCollectionComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
