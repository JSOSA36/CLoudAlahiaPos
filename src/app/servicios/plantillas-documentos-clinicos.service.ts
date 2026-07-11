import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { PlantillaDocumentoClinico } from '../models/plantilla-documento-clinico.models';

@Injectable({
  providedIn: 'root'
})
export class PlantillasDocumentosClinicosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/PlantillasDocumentosClinicos`;
  }

  private getActivasPorEmpresa(
    idEmpresa: number
  ): Observable<PlantillaDocumentoClinico[]> {
    return this.http
      .get<PlantillaDocumentoClinico[]>(`${this.baseUrl}/empresa/${idEmpresa}`)
      .pipe(
        map(lista => (lista || []).filter(p => p.activa))
      );
  }

  getTiposDocumento(idEmpresa: number): Observable<string[]> {
    return this.getActivasPorEmpresa(idEmpresa).pipe(
      map(plantillas => {
        const tipos = new Set<string>();

        plantillas.forEach(p => {
          if (p.tipoDocumento?.trim()) {
            tipos.add(p.tipoDocumento.trim());
          }
        });

        return Array.from(tipos).sort();
      })
    );
  }

  getPlantillaPorTipo(
    idEmpresa: number,
    tipoDocumento: string
  ): Observable<PlantillaDocumentoClinico | null> {
    const tipo = (tipoDocumento || '').trim();

    return this.getActivasPorEmpresa(idEmpresa).pipe(
      map(plantillas => {
        const delTipo = plantillas.filter(
          p => p.tipoDocumento?.trim() === tipo
        );

        if (!delTipo.length) {
          return null;
        }

        return (
          delTipo.find(p => p.esPredeterminada) ||
          delTipo[0]
        );
      })
    );
  }
}
