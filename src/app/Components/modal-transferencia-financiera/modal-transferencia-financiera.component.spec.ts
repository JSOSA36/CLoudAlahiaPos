import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ModalTransferenciaFinancieraComponent } from './modal-transferencia-financiera.component';

describe('ModalTransferenciaFinancieraComponent', () => {
  let component: ModalTransferenciaFinancieraComponent;
  let fixture: ComponentFixture<ModalTransferenciaFinancieraComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalTransferenciaFinancieraComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalTransferenciaFinancieraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
