import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders,HttpParams } from '@angular/common/http';
     
import {  Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { zonas } from '../models/zonas';
import { Mesas } from '../models/mesas';


@Injectable({
  providedIn: 'root'
})
export class ZonasService {

  


//private apiURL = "http://localhost:5139/api";
  private apiURL = "https://apikds.alahiapos.com/api";
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }
  constructor(private httpClient: HttpClient) { }

  GetListadoZonas(): Observable<zonas[]> {
  
    return this.httpClient.get<zonas[]>(this.apiURL + '/Zonas/')
    
  }
  GetListadoMesas(IdZona:number): Observable<Mesas[]> {
  
    let queryParams = new HttpParams();
    queryParams = queryParams.append("IdZona",IdZona); //VERY IMPORTANT
   
    return this.httpClient.get<Mesas[]>(this.apiURL + '/Mesas/'+IdZona)
    
  }
}
