import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ModalCuentaFinancieraComponent } from './modal-cuenta-financiera.component';

describe('ModalCuentaFinancieraComponent', () => {
  let component: ModalCuentaFinancieraComponent;
  let fixture: ComponentFixture<ModalCuentaFinancieraComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalCuentaFinancieraComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalCuentaFinancieraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
