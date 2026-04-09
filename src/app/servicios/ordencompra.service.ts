import { Injectable } from '@angular/core';


import { HttpClient, HttpHeaders } from '@angular/common/http';
     
import {  Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })
  export class OrdenCompraService {
  
    //private apiURL = " http://localhost:5139/api";
     private apiURL = "https://apikds.alahiapos.com/api";
   
    httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }
    constructor(private httpClient: HttpClient) { }
  
    CuentaxPagar(): Observable<number> {
    
      return this.httpClient.get<number>(this.apiURL + '/OrdenCompra/CuentaxPagar');
  
      
      
    }
  }