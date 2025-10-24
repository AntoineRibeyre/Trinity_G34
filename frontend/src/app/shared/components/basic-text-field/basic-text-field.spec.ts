import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicTextField } from './basic-text-field';

describe('BasicTextField', () => {
  let component: BasicTextField;
  let fixture: ComponentFixture<BasicTextField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicTextField]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicTextField);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
