import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicTextButton } from './basic-text-button';

describe('BasicTextButton', () => {
  let component: BasicTextButton;
  let fixture: ComponentFixture<BasicTextButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicTextButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicTextButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
