import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Point } from './point';

describe('Point', () => {
  let component: Point;
  let fixture: ComponentFixture<Point>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Point]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Point);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
