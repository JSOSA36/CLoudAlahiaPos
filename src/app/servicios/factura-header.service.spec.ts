import { TestBed } from '@angular/core/testing';

import { FacturaHeaderService } from './factura-header.service';

describe('FacturaHeaderService', () => {
  let service: FacturaHeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacturaHeaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
