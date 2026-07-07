import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ModalMetodoPagoCuentaComponent } from './modal-metodo-pago-cuenta.component';

describe('ModalMetodoPagoCuentaComponent', () => {
  let component: ModalMetodoPagoCuentaComponent;
  let fixture: ComponentFixture<ModalMetodoPagoCuentaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalMetodoPagoCuentaComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalMetodoPagoCuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
