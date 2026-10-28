import { Component, inject } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {  MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,MatSidenavModule,MatToolbarModule,MatIconModule,MatButtonModule,MatListModule,RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly router = inject(Router);
}
