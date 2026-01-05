import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, FormControl } from '@angular/forms';
import { BasicTextField } from './basic-text-field';

describe('BasicTextField', () => {
  let component: BasicTextField;
  let fixture: ComponentFixture<BasicTextField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicTextField, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicTextField);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input properties', () => {
    it('should have default values', () => {
      expect(component.width).toBe('auto');
      expect(component.placeholder).toBe('Entrez votre texte...');
      expect(component.rows).toBe(4);
      expect(component.maxLength).toBeNull();
      expect(component.disabled).toBe(false);
      expect(component.readonly).toBe(false);
      expect(component.showCharCount).toBe(false);
      expect(component.showClearButton).toBe(false);
    });

    it('should accept and store input properties', () => {
      component.width = '300px';
      component.placeholder = 'Test placeholder';
      component.rows = 6;
      component.maxLength = 100;
      component.disabled = true;
      component.readonly = true;
      component.showCharCount = true;
      component.showClearButton = true;

      fixture.detectChanges();

      expect(component.width).toBe('300px');
      expect(component.placeholder).toBe('Test placeholder');
      expect(component.rows).toBe(6);
      expect(component.maxLength).toBe(100);
      expect(component.disabled).toBe(true);
      expect(component.readonly).toBe(true);
      expect(component.showCharCount).toBe(true);
      expect(component.showClearButton).toBe(true);
    });
  });

  describe('ControlValueAccessor implementation', () => {
    it('should implement ControlValueAccessor', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    describe('writeValue', () => {
      it('should set value when provided', () => {
        component.writeValue('test value');
        expect(component.value).toBe('test value');
      });

      it('should set empty string when value is null', () => {
        component.writeValue(null as any);
        expect(component.value).toBe('');
      });

      it('should set empty string when value is undefined', () => {
        component.writeValue(undefined as any);
        expect(component.value).toBe('');
      });

      it('should handle empty string', () => {
        component.writeValue('');
        expect(component.value).toBe('');
      });
    });

    describe('registerOnChange', () => {
      it('should register onChange callback', () => {
        const callback = jasmine.createSpy('onChange');
        component.registerOnChange(callback);

        component.value = 'test';
        component.handleInput();

        expect(callback).toHaveBeenCalledWith('test');
      });

      it('should replace previous onChange callback', () => {
        const callback1 = jasmine.createSpy('onChange1');
        const callback2 = jasmine.createSpy('onChange2');

        component.registerOnChange(callback1);
        component.registerOnChange(callback2);

        component.value = 'test';
        component.handleInput();

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledWith('test');
      });
    });

    describe('registerOnTouched', () => {
      it('should register onTouched callback', () => {
        const callback = jasmine.createSpy('onTouched');
        component.registerOnTouched(callback);

        component.handleBlur();

        expect(callback).toHaveBeenCalled();
      });

      it('should replace previous onTouched callback', () => {
        const callback1 = jasmine.createSpy('onTouched1');
        const callback2 = jasmine.createSpy('onTouched2');

        component.registerOnTouched(callback1);
        component.registerOnTouched(callback2);

        component.handleBlur();

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });

    describe('setDisabledState', () => {
      it('should set disabled state to true', () => {
        component.setDisabledState(true);
        expect(component.disabled).toBe(true);
      });

      it('should set disabled state to false', () => {
        component.disabled = true;
        component.setDisabledState(false);
        expect(component.disabled).toBe(false);
      });
    });
  });

  describe('handleInput', () => {
    it('should call onChange callback with current value', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);
      component.value = 'test input';

      component.handleInput();

      expect(onChangeSpy).toHaveBeenCalledWith('test input');
    });

    it('should emit textChange event', () => {
      spyOn(component.textChange, 'emit');
      component.value = 'test input';

      component.handleInput();

      expect(component.textChange.emit).toHaveBeenCalledWith('test input');
    });

    it('should call both onChange and emit textChange', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);
      spyOn(component.textChange, 'emit');
      component.value = 'test';

      component.handleInput();

      expect(onChangeSpy).toHaveBeenCalled();
      expect(component.textChange.emit).toHaveBeenCalled();
    });
  });

  describe('handleBlur', () => {
    it('should call onTouched callback', () => {
      const onTouchedSpy = jasmine.createSpy('onTouched');
      component.registerOnTouched(onTouchedSpy);

      component.handleBlur();

      expect(onTouchedSpy).toHaveBeenCalled();
    });
  });

  describe('clearText', () => {
    it('should clear the value', () => {
      component.value = 'some text';
      component.clearText();

      expect(component.value).toBe('');
    });

    it('should call handleInput after clearing', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);
      component.value = 'some text';

      component.clearText();

      expect(component.value).toBe('');
      expect(onChangeSpy).toHaveBeenCalledWith('');
    });

    it('should emit textChange event with empty string', () => {
      spyOn(component.textChange, 'emit');
      component.value = 'some text';

      component.clearText();

      expect(component.textChange.emit).toHaveBeenCalledWith('');
    });
  });

  describe('EventEmitter', () => {
    it('should have textChange EventEmitter', () => {
      expect(component.textChange).toBeDefined();
      expect(component.textChange.emit).toBeDefined();
    });

    it('should allow subscribing to textChange events', (done) => {
      component.textChange.subscribe((value) => {
        expect(value).toBe('test');
        done();
      });

      component.value = 'test';
      component.handleInput();
    });
  });
});
