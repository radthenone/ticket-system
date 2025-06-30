import { Component } from '@angular/core';
import { MainComponent, HeaderComponent, FooterComponent } from '@layout/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainComponent, HeaderComponent, FooterComponent],
  templateUrl: './app.template.html',
  styleUrl: './app.styles.css',
})
export class AppComponent {}
