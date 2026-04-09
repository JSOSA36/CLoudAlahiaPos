import { TestBed } from '@angular/core/testing';

import { FactDetalleService } from './fact-detalle.service';

describe('FactDetalleService', () => {
  let service: FactDetalleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FactDetalleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
