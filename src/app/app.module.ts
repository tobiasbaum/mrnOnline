import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatBoxComponent } from './chat-box/chat-box.component';
import { SelfPlayerComponent } from './self-player/self-player.component';
import { CardComponent } from './card/card.component';
import { OtherPlayerComponent } from './other-player/other-player.component';
import { CardCollectionComponent } from './card-collection/card-collection.component';

@NgModule({
  declarations: [
    AppComponent,
    ChatBoxComponent,
    SelfPlayerComponent,
    CardComponent,
    OtherPlayerComponent,
    CardCollectionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
