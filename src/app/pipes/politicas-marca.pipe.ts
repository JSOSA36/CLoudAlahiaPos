import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { resaltarMacroBitsHtml } from '../politicas/politicas-formato.util';

@Pipe({ name: 'politicasMarca' })
export class PoliticasMarcaPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(texto: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(resaltarMacroBitsHtml(texto));
  }
}
