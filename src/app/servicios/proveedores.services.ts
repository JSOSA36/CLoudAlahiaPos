import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { proveedores } from '../models/proveedores';
import {  Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class proveedoresService {

  //private apiURL = "https://alahiaposapi.bashtechsys.net/api";
  
   private apiURL = "https://apikds.alahiapos.com/api";
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }
  constructor(private httpClient: HttpClient) { }

  GetListadoProveedores(): Observable<proveedores[]> {
  
    return this.httpClient.get<proveedores[]>(this.apiURL+'/proveedores')
    
  }
}