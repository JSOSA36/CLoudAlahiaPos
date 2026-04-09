import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListadoempleadosComisionComponent } from './listadoempleadosComision.component';

describe('ListadoempleadosComisionComponent', () => {
  let component: ListadoempleadosComisionComponent;
  let fixture: ComponentFixture<ListadoempleadosComisionComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListadoempleadosComisionComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoempleadosComisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
