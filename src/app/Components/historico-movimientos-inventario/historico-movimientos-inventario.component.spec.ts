import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HistoricoMovimientosInventarioComponent } from './historico-movimientos-inventario.component';

describe('HistoricoMovimientosInventarioComponent', () => {
  let component: HistoricoMovimientosInventarioComponent;
  let fixture: ComponentFixture<HistoricoMovimientosInventarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoricoMovimientosInventarioComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricoMovimientosInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
