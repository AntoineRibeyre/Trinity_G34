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

  describe('Input properties', () => {
    it('should have default values', () => {
      expect(component.text).toBe('Button');
      expect(component.color).toBe('#007bff');
      expect(component.width).toBe('14.5vw');
      expect(component.disabled).toBe(false);
    });

    it('should accept text input', () => {
      component.text = 'Click Me';
      fixture.detectChanges();

      expect(component.text).toBe('Click Me');
    });

    it('should accept color input', () => {
      component.color = '#ff0000';
      fixture.detectChanges();

      expect(component.color).toBe('#ff0000');
    });

    it('should accept width input', () => {
      component.width = '200px';
      fixture.detectChanges();

      expect(component.width).toBe('200px');
    });

    it('should accept disabled input', () => {
      component.disabled = true;
      fixture.detectChanges();

      expect(component.disabled).toBe(true);
    });
  });

  describe('handleClick', () => {
    it('should emit buttonPressed event when clicked', () => {
      spyOn(component.buttonPressed, 'emit');

      component.handleClick();

      expect(component.buttonPressed.emit).toHaveBeenCalled();
    });

    it('should emit buttonPressed event even when disabled', () => {
      component.disabled = true;
      spyOn(component.buttonPressed, 'emit');

      component.handleClick();

      expect(component.buttonPressed.emit).toHaveBeenCalled();
    });
  });

  describe('EventEmitter', () => {
    it('should have buttonPressed EventEmitter', () => {
      expect(component.buttonPressed).toBeDefined();
      expect(component.buttonPressed.emit).toBeDefined();
    });

    it('should allow subscribing to buttonPressed events', (done) => {
      component.buttonPressed.subscribe(() => {
        done();
      });

      component.handleClick();
    });
  });
});
