import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConfigService } from 'src/app/servicios/app-config.service';

@Component({
  selector: 'app-citainicio',
  templateUrl: './citainicio.component.html',
  styleUrls: ['./citainicio.component.scss'],
})
export class CitainicioComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private config: AppConfigService
  ) {}

  ngOnInit(): void {
    const guid = (this.route.snapshot.paramMap.get('guid') || '').trim();
    const base = this.config.citasPublicUrl.replace(/\/$/, '');
    window.location.replace(guid ? `${base}/${guid}` : base);
  }
}
