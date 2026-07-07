import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransferenciasFinancierasComponent } from './transferencias-financieras.component';

describe('TransferenciasFinancierasComponent', () => {
  let component: TransferenciasFinancierasComponent;
  let fixture: ComponentFixture<TransferenciasFinancierasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TransferenciasFinancierasComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransferenciasFinancierasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
