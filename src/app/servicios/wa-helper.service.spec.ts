import { TestBed } from '@angular/core/testing';

import { WaHelperService } from './wa-helper.service';

describe('WaHelperService', () => {
  let service: WaHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
